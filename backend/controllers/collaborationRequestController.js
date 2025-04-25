// backend/controllers/collaborationRequestController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path
import { emitToUser } from "../config/socketSetup.js"; // Adjust path, ensure this setup works
import { Op } from "sequelize"; // Import Op if needed for queries

// Ensure all required models are imported and available in db
const { CollaborationRequest, Project, User, Member, sequelize } = db;

// --- Controller to SEND a request ---
export const sendRequest = asyncHandler(async (req, res) => {
  console.log(`\n--- [${new Date().toISOString()}] ENTERING sendRequest ---`);
  const requester = req.user; // User object from 'protect' middleware
  let transaction; // Define transaction variable outside try

  try {
    // 1. Validate User Auth
    if (!requester?.id) {
      console.error(
        "sendRequest Error: Missing req.user.id - Authentication failed or middleware issue."
      );
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

    // 3. Validate Project and Ownership/Membership
    console.log(`Checking project ${parsedProjectId}...`);
    const project = await Project.findByPk(parsedProjectId, {
      attributes: ["id", "title", "ownerId"], // Only fetch necessary fields
      transaction,
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    console.log(`Project ${project.id} found. Owner ID: ${project.ownerId}`);

    const recipientId = project.ownerId; // Owner who will receive the request/notification
    if (requester.id === recipientId) {
      res.status(400);
      throw new Error("You cannot request to join your own project.");
    }

    console.log(
      `Checking membership for user ${requester.id} in project ${parsedProjectId}...`
    );
    // Ensure Member model and associations are correct
    const isAlreadyMember = await Member.findOne({
      where: { userId: requester.id, projectId: parsedProjectId },
      transaction,
    }); // Adjusted field names assuming 'Member' model uses userId/projectId
    if (isAlreadyMember) {
      res.status(409);
      throw new Error("You are already a member of this project.");
    } // 409 Conflict
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
    } // 409 Conflict
    console.log("No existing pending request found.");

    // 4. Create Collaboration Request
    const requestData = {
      projectId: parsedProjectId,
      requesterId: requester.id,
      requestMessage: message || null,
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
    transaction = null; // Clear transaction variable after commit

    // 6. Emit Real-Time Notification (AFTER COMMIT)
    try {
      const notificationData = {
        type: "new_request",
        message: `User '${requester.username}' requested to join '${project.title}'.`,
        requestId: newRequest.id,
        projectId: project.id,
        projectTitle: project.title,
        requesterUsername: requester.username,
        requesterId: requester.id,
        timestamp: new Date().toISOString(),
      };
      console.log(
        `Attempting to emit 'new_collaboration_request' to user ${recipientId}`
      );
      const emitted = emitToUser(
        recipientId,
        "new_collaboration_request",
        notificationData
      );
      if (!emitted) {
        console.log(
          `Socket Notification: Owner ${recipientId} not connected.`
        ); /* TODO: Store notification in DB */
      } else {
        console.log(
          `Socket Notification: Successfully emitted to user ${recipientId}.`
        );
      }
    } catch (socketError) {
      console.error("Error emitting socket notification:", socketError); // Log socket errors but don't fail the HTTP response
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
    // Rollback transaction if it exists and hasn't finished
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
    // Log original DB error if available
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

    // Determine status code (use error's status code if set, otherwise 500)
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage = error.message || "Server error sending request.";

    // Send error response only if headers haven't been sent already
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
  const { status, responseMessage } = req.body; // Added responseMessage
  const ownerId = req.user?.id; // User performing the action (should be owner)
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

    transaction = await sequelize.transaction();
    console.log("Response transaction started.");

    // 2. Find Request & Verify Ownership
    console.log("Finding request and associated project...");
    const request = await CollaborationRequest.findByPk(requestId, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "ownerId", "requiredCollaborators"],
        },
      ], // Include project details
      transaction,
      lock: transaction.LOCK.UPDATE, // Lock row during transaction
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
    } // Data integrity issue
    console.log(
      `Request ${requestId} found for project ${request.projectId}. Current status: ${request.status}. Project Owner: ${request.project.ownerId}`
    );

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
    request.set(updateData); // Update instance fields
    await request.save({ transaction }); // Save changes
    console.log("Request status updated in DB.");

    const projectId = request.projectId;
    const requesterIdToNotify = request.requesterId;
    const projectTitle = request.project.title;

    // 4. Handle Approval Logic (Add Member, Update Project)
    if (newStatus === "approved") {
      console.log("Status is 'approved'. Handling membership...");
      // Ensure Member model is correctly defined and associated
      const existingMember = await Member.findOne({
        where: { userId: requesterIdToNotify, projectId: projectId },
        transaction,
      });
      if (!existingMember) {
        console.log(
          `Creating Member record for user ${requesterIdToNotify}, project ${projectId}`
        );
        await Member.create(
          {
            userId: requesterIdToNotify,
            projectId: projectId,
            role: "member",
            status: "active",
          },
          { transaction }
        );
        console.log("Member record created.");
        // Optional: Update project's requiredCollaborators count if needed
        // const projectToUpdate = await Project.findByPk(projectId, { transaction, lock: transaction.LOCK.UPDATE });
        // if (projectToUpdate && projectToUpdate.requiredCollaborators > 0) {
        //     projectToUpdate.requiredCollaborators -= 1;
        //     // Optionally change project status if count reaches 0
        //     await projectToUpdate.save({ transaction });
        //     console.log(`Project ${projectId} collaborator count updated.`);
        // }
      } else {
        console.log(
          `User ${requesterIdToNotify} is already a member of project ${projectId}. No membership change needed.`
        );
      }
    }

    // 5. Commit Transaction
    await transaction.commit();
    console.log("Response transaction committed.");
    transaction = null;

    // 6. Emit Notification to Requester (AFTER COMMIT)
    try {
      const notificationData = {
        type: `request_${newStatus}`,
        message: `Your request to join '${projectTitle}' was ${newStatus}.`,
        projectId: projectId,
        projectTitle: projectTitle,
        status: newStatus,
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
        ); /* TODO: Store notification */
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
    );
    console.error("----------------------------------------------------------");
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error responding to request.",
      });
    }
  }
});

// --- Implementations for getReceivedRequests, getSentRequests, cancelRequest ---
// These need to be fully implemented based on your application logic

export const getReceivedRequests = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getReceivedRequests ---");
  const ownerId = req.user?.id;
  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  // Find projects owned by the user
  const ownedProjects = await Project.findAll({
    where: { ownerId },
    attributes: ["id"],
  });
  const ownedProjectIds = ownedProjects.map((p) => p.id);

  if (ownedProjectIds.length === 0) {
    return res.status(200).json({ success: true, count: 0, data: [] }); // No projects owned, no requests received
  }

  // Find PENDING requests for those projects
  const requests = await CollaborationRequest.findAll({
    where: {
      projectId: { [Op.in]: ownedProjectIds },
      status: "pending",
    },
    include: [
      {
        model: User,
        as: "requester",
        attributes: ["id", "username", "profilePictureUrl"],
      },
      { model: Project, as: "project", attributes: ["id", "title"] }, // Include project title
    ],
    order: [["createdAt", "DESC"]],
  });

  res
    .status(200)
    .json({ success: true, count: requests.length, data: requests });
});

export const getSentRequests = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getSentRequests ---");
  const requesterId = req.user?.id;
  if (!requesterId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  // Find requests SENT by the user
  const requests = await CollaborationRequest.findAll({
    where: { requesterId: requesterId },
    include: [
      // Include project details for context
      {
        model: Project,
        as: "project",
        attributes: ["id", "title", "ownerId"],
        include: [{ model: User, as: "owner", attributes: ["id", "username"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  res
    .status(200)
    .json({ success: true, count: requests.length, data: requests });
});

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

  console.log(`User ${requesterId} attempting to cancel request ${requestId}`);
  const request = await CollaborationRequest.findByPk(requestId);

  if (!request) {
    res.status(404);
    throw new Error("Request not found.");
  }

  // Authorization: Only the user who sent the request can cancel it, and only if pending
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
  await request.destroy(); // Delete the request row
  console.log("Request deleted successfully.");

  // Optional: Notify project owner that request was withdrawn?

  res
    .status(200)
    .json({ success: true, message: "Request cancelled successfully." });
});
