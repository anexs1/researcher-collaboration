// backend/controllers/collaborationRequestController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { emitToUser } from "../config/socketSetup.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Destructure models from the db object AFTER it's imported and verified
const { CollaborationRequest, Project, User, Member, sequelize } = db;

// --- Controller to SEND a request ---
export const sendRequest = asyncHandler(async (req, res) => {
  console.log(`\n--- [${new Date().toISOString()}] ENTERING sendRequest ---`);
  const requester = req.user;
  let transaction;

  try {
    // 1. Validate User Auth (ensure req.user and req.user.id exist)
    if (!requester?.id) {
      console.error("sendRequest Error: Missing req.user.id.");
      res.status(401);
      throw new Error("Authentication required.");
    }
    console.log(`Authenticated Requester ID: ${requester.id}`);

    // 2. Validate Input Body
    const { projectId, message } = req.body;
    console.log("Request Body:", {
      projectId,
      message: message || "<No Message>",
    });
    if (!projectId || isNaN(parseInt(projectId, 10))) {
      res.status(400);
      throw new Error("Valid Project ID is required.");
    }
    const parsedProjectId = parseInt(projectId, 10);

    // Start Transaction
    transaction = await sequelize.transaction();
    console.log("Transaction started.");

    // 3. Validate Project, Ownership, Membership, Existing Request
    console.log(`Checking project ${parsedProjectId}...`);
    const project = await Project.findByPk(parsedProjectId, {
      attributes: ["id", "title", "ownerId"],
      transaction,
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    console.log(`Project ${project.id} found. Owner ID: ${project.ownerId}`);

    const recipientId = project.ownerId;
    if (requester.id === recipientId) {
      res.status(400);
      throw new Error("You cannot request to join your own project.");
    }

    console.log(
      `Checking membership for user ${requester.id} in project ${parsedProjectId}...`
    );
    // --- Verify Member Model Access ---
    if (!Member) {
      // Check if Member model was loaded correctly
      console.error(
        "FATAL: Member model is undefined in collaborationRequestController. Check models/index.js and models/Member.js."
      );
      throw new Error(
        "Server configuration error: Member model not available."
      );
    }
    const isAlreadyMember = await Member.findOne({
      // Use model field names (camelCase), Sequelize handles underscored mapping
      where: { userId: requester.id, projectId: parsedProjectId },
      transaction,
    });
    if (isAlreadyMember) {
      res.status(409);
      throw new Error("You are already a member of this project.");
    }
    console.log("User is not currently a member.");

    console.log(
      `Checking for existing PENDING request from user ${requester.id} for project ${parsedProjectId}...`
    );
    const existingPendingRequest = await CollaborationRequest.findOne({
      where: {
        projectId: parsedProjectId,
        requesterId: requester.id,
        status: "pending",
      },
      transaction,
    });
    if (existingPendingRequest) {
      res.status(409);
      throw new Error("You already have a pending request for this project.");
    }
    console.log("No existing pending request found.");

    // 4. Create Collaboration Request
    const requestData = {
      projectId: parsedProjectId,
      requesterId: requester.id,
      requestMessage: message || null, // Use provided message or null
      status: "pending",
    };
    console.log("Creating CollaborationRequest with data:", requestData);
    const newRequest = await CollaborationRequest.create(requestData, {
      transaction,
    });
    console.log(
      `CollaborationRequest created successfully. ID: ${newRequest.id}`
    );

    // 5. Commit Transaction
    await transaction.commit();
    console.log("Transaction committed.");
    transaction = null;

    // 6. Emit Real-Time Notification (AFTER COMMIT)
    try {
      const notificationData = {
        type: "new_request",
        message: `User '${
          requester.username || `ID: ${requester.id}`
        }' requested to join '${project.title}'.`, // Fallback for username
        requestId: newRequest.id,
        projectId: project.id,
        projectTitle: project.title,
        requesterUsername: requester.username || `ID: ${requester.id}`,
        requesterId: requester.id,
        timestamp: new Date().toISOString(),
      };
      console.log(
        `Attempting to emit 'new_collaboration_request' to user ${recipientId}`
      );
      // Ensure emitToUser is correctly imported and configured
      const emitted = emitToUser(
        recipientId,
        "new_collaboration_request",
        notificationData
      );
      if (!emitted) {
        console.log(`Socket Notification: Owner ${recipientId} not connected.`); // TODO: Store notification
      } else {
        console.log(
          `Socket Notification: Successfully emitted to user ${recipientId}.`
        );
      }
    } catch (socketError) {
      console.error("Error emitting socket notification:", socketError);
    }

    // 7. Send Success HTTP Response
    res.status(201).json({
      success: true,
      message: "Collaboration request sent successfully.",
      data: { requestId: newRequest.id },
    });
    console.log(
      `--- [${new Date().toISOString()}] sendRequest finished successfully ---`
    );
  } catch (error) {
    console.error(`--- [${new Date().toISOString()}] ERROR in sendRequest ---`);
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back due to error.");
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    if (error.original)
      console.error(
        "Original DB Error:",
        error.original?.message || error.original
      );
    console.error(
      "Stack Trace:",
      error.stack?.split("\n").slice(0, 7).join("\n")
    );
    console.error("--------------------------------------------------");

    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage = error.message || "Server error sending request.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

// --- Controller to respond to a request (Approve/Reject) ---
export const respondToRequest = asyncHandler(async (req, res) => {
  console.log(
    `\n--- [${new Date().toISOString()}] ENTERING respondToRequest ---`
  );
  const { requestId } = req.params;
  const { status, responseMessage } = req.body;
  const ownerId = req.user?.id;
  let transaction;

  try {
    console.log(
      `Attempting update for request ID ${requestId}. Action: ${status}, By User: ${ownerId}`
    );

    // 1. Validate Input
    if (!ownerId) {
      res.status(401);
      throw new Error("Authentication required.");
    }
    if (!requestId || isNaN(parseInt(requestId))) {
      res.status(400);
      throw new Error("Invalid Request ID.");
    }
    if (!status || !["approved", "rejected"].includes(status.toLowerCase())) {
      res.status(400);
      throw new Error("Invalid status. Must be 'approved' or 'rejected'.");
    }
    const newStatus = status.toLowerCase();
    const parsedRequestId = parseInt(requestId);

    transaction = await sequelize.transaction();
    console.log("Response transaction started.");

    // 2. Find Request & Verify Ownership
    console.log("Finding request and associated project...");
    const request = await CollaborationRequest.findByPk(parsedRequestId, {
      include: [
        {
          model: Project,
          as: "project", // Matches alias in CollaborationRequest model
          attributes: ["id", "title", "ownerId"], // Removed requiredCollaborators unless needed here
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!request) {
      res.status(404);
      throw new Error("Request not found.");
    }
    if (!request.project) {
      res.status(500);
      throw new Error(
        "Internal Error: Project associated with request not found."
      );
    }

    console.log(
      `Request ${parsedRequestId} found for project ${request.projectId}. Current status: ${request.status}. Project Owner: ${request.project.ownerId}`
    );

    // Authorization Check
    if (request.project.ownerId !== ownerId) {
      res.status(403);
      throw new Error("Forbidden: Not authorized to respond.");
    }
    if (request.status !== "pending") {
      res.status(400);
      throw new Error(`Request already ${request.status}.`);
    }
    console.log("Authorization confirmed.");

    // 3. Update Request Status
    const updateData = {
      status: newStatus,
      respondedAt: new Date(),
      responseMessage: responseMessage || null,
    };
    console.log("Updating request with:", updateData);
    request.set(updateData);
    await request.save({ transaction });
    console.log("Request status updated in DB.");

    const projectId = request.projectId;
    const requesterIdToNotify = request.requesterId;
    const projectTitle = request.project.title;

    // 4. Handle Approval Logic (Add Member)
    if (newStatus === "approved") {
      console.log("Status is 'approved'. Handling membership...");
      // --- Verify Member Model Access ---
      if (!Member) {
        console.error(
          "FATAL: Member model is undefined in collaborationRequestController. Check models/index.js and models/Member.js."
        );
        throw new Error(
          "Server configuration error: Member model not available."
        );
      }

      console.log(
        `Checking membership for user ${requesterIdToNotify} in project ${projectId}`
      );
      const existingMember = await Member.findOne({
        where: { userId: requesterIdToNotify, projectId: projectId },
        transaction,
      });

      if (!existingMember) {
        console.log(
          `Creating Member record for user ${requesterIdToNotify}, project ${projectId}`
        );
        const memberData = {
          userId: requesterIdToNotify,
          projectId: projectId,
          role: "member", // Ensure this role exists or is acceptable
          status: "active", // Ensure 'active' is a valid ENUM value in Member model & DB
        };
        console.log("Attempting to create Member with:", memberData);
        await Member.create(memberData, { transaction });
        console.log("Member record created.");
      } else {
        console.log(
          `User ${requesterIdToNotify} is already a member of project ${projectId}. No membership change needed.`
        );
        // Optionally: Update existing member status if needed (e.g., if they were 'invited' before)
        // if (existingMember.status !== 'active') {
        //   await existingMember.update({ status: 'active' }, { transaction });
        //   console.log(`Updated existing member status to active.`);
        // }
      }
    }

    // 5. Commit Transaction
    await transaction.commit();
    console.log("Response transaction committed.");
    transaction = null;

    // 6. Emit Notification to Requester (AFTER COMMIT)
    try {
      const userMakingRequest = await User.findByPk(requesterIdToNotify, {
        attributes: ["username"],
      }); // Fetch username if needed for notification
      const notificationData = {
        type: `request_${newStatus}`,
        message: `Your request to join '${projectTitle}' was ${newStatus}.`,
        projectId: projectId,
        projectTitle: projectTitle,
        status: newStatus,
        responseMessage: responseMessage || null, // Include response message
        timestamp: new Date().toISOString(),
      };
      console.log(
        `Attempting to emit 'request_response' to user ${requesterIdToNotify}`
      );
      const emitted = emitToUser(
        requesterIdToNotify,
        "request_response",
        notificationData
      );
      if (!emitted) {
        console.log(
          `Socket Notification: Requester ${requesterIdToNotify} not connected.`
        ); // TODO: Store notification
      } else {
        console.log(
          `Socket Notification: Successfully emitted to user ${requesterIdToNotify}.`
        );
      }
    } catch (socketError) {
      console.error(
        "Error emitting response socket notification:",
        socketError
      );
    }

    // 7. Send Success HTTP Response
    res
      .status(200)
      .json({ success: true, message: `Request ${newStatus} successfully.` });
    console.log(
      `--- [${new Date().toISOString()}] respondToRequest finished successfully ---`
    );
  } catch (error) {
    console.error(
      `--- [${new Date().toISOString()}] ERROR in respondToRequest for ID: ${
        req.params.requestId
      } ---`
    );
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back.");
      } catch (rbError) {
        console.error("Rollback error:", rbError);
      }
    }
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    if (error.original)
      console.error(
        "Original DB Error:",
        error.original?.message || error.original
      );
    console.error(
      "Stack Trace:",
      error.stack?.split("\n").slice(0, 7).join("\n")
    ); // Log more stack trace if needed
    console.error("----------------------------------------------------------");
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage =
      error.message || "Server error responding to request.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

// --- Get Received Requests (for projects owned by user) ---
export const getReceivedRequests = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getReceivedRequests ---");
  const ownerId = req.user?.id;
  const requestedStatus = req.query.status || "pending"; // Default or allow filtering

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  try {
    const ownedProjects = await Project.findAll({
      where: { ownerId },
      attributes: ["id"],
    });
    const ownedProjectIds = ownedProjects.map((p) => p.id);

    if (ownedProjectIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    console.log(
      `Fetching requests with status '${requestedStatus}' for projects owned by ${ownerId}`
    );

    const requests = await CollaborationRequest.findAll({
      where: {
        projectId: { [Op.in]: ownedProjectIds },
        status: requestedStatus, // Filter by status
      },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "profilePictureUrl"],
        },
        { model: Project, as: "project", attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error(
      `Error fetching received requests for user ${ownerId}:`,
      error
    );
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage =
      error.message || "Server error fetching received requests.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

// --- Get Sent Requests (sent by the user) ---
export const getSentRequests = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getSentRequests ---");
  const requesterId = req.user?.id;
  if (!requesterId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  try {
    console.log(`Fetching requests sent by user ${requesterId}`);
    const requests = await CollaborationRequest.findAll({
      where: { requesterId: requesterId },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "ownerId"],
          include: [
            { model: User, as: "owner", attributes: ["id", "username"] },
          ], // Include project owner
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error(
      `Error fetching sent requests for user ${requesterId}:`,
      error
    );
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage =
      error.message || "Server error fetching sent requests.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

// --- Cancel Request (sent by the user) ---
export const cancelRequest = asyncHandler(async (req, res) => {
  console.log("--- ENTERING cancelRequest ---");
  const { requestId } = req.params;
  const requesterId = req.user?.id;

  if (!requesterId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!requestId || isNaN(parseInt(requestId))) {
    res.status(400);
    throw new Error("Invalid Request ID.");
  }
  const parsedRequestId = parseInt(requestId);

  console.log(
    `User ${requesterId} attempting to cancel request ${parsedRequestId}`
  );

  try {
    const request = await CollaborationRequest.findByPk(parsedRequestId);
    if (!request) {
      res.status(404);
      throw new Error("Request not found.");
    }

    // Authorization
    if (request.requesterId !== requesterId) {
      res.status(403);
      throw new Error("Forbidden: You cannot cancel this request.");
    }
    if (request.status !== "pending") {
      res.status(400);
      throw new Error(
        `Cannot cancel a request that is already ${request.status}.`
      );
    }

    console.log("Authorization confirmed. Deleting request...");
    await request.destroy(); // Use destroy to delete the record
    console.log("Request deleted successfully.");

    // Optional: Notify project owner?

    res
      .status(200)
      .json({ success: true, message: "Request cancelled successfully." });
  } catch (error) {
    console.error(
      `Error cancelling request ${parsedRequestId} for user ${requesterId}:`,
      error
    );
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage = error.message || "Server error cancelling request.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});
