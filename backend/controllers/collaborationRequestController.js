// backend/controllers/collaborationRequestController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { emitToUser } from "../config/socketSetup.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Destructure models - Ensure these are defined and associated in models/index.js
const { CollaborationRequest, Project, User, Member, sequelize } = db;

// --- Helper: Define fields for user info included in requests ---
const requesterDetailFields = [
  "id",
  "username",
  "profilePictureUrl",
  "email",
  "university",
  "department",
  "jobTitle",
  "bio",
];

// --- Controller to SEND a request ---
export const sendRequest = asyncHandler(async (req, res) => {
  // ... (keep existing sendRequest code as is) ...
  console.log(`\n--- [${new Date().toISOString()}] ENTERING sendRequest ---`);
  const requester = req.user;
  let transaction;

  try {
    if (!requester?.id) {
      res.status(401);
      throw new Error("Authentication required.");
    }
    console.log(`Auth Requester ID: ${requester.id}`);
    const { projectId, message } = req.body;
    console.log("Request Body:", {
      projectId,
      message: message || "<No Message>",
    });
    if (!projectId || isNaN(parseInt(projectId, 10))) {
      res.status(400);
      throw new Error("Valid Project ID required.");
    }
    const parsedProjectId = parseInt(projectId, 10);

    transaction = await sequelize.transaction();
    console.log("Transaction started.");

    if (!Project || !Member || !CollaborationRequest)
      throw new Error("DB models not loaded.");

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
      throw new Error("Cannot request to join own project.");
    }

    console.log(
      `Checking membership user ${requester.id} in project ${parsedProjectId}...`
    );
    const isAlreadyMember = await Member.findOne({
      where: { userId: requester.id, projectId: parsedProjectId },
      transaction,
    });
    if (isAlreadyMember) {
      res.status(409);
      throw new Error("You are already a member.");
    }
    console.log("User is not a member.");

    console.log(`Checking existing PENDING request...`);
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
      throw new Error("Pending request already exists.");
    }
    console.log("No existing pending request.");

    const requestData = {
      projectId: parsedProjectId,
      requesterId: requester.id,
      requestMessage: message || null,
      status: "pending",
    };
    console.log("Creating Request:", requestData);
    const newRequest = await CollaborationRequest.create(requestData, {
      transaction,
    });
    console.log(`Request created ID: ${newRequest.id}`);

    await transaction.commit();
    console.log("Transaction committed.");
    transaction = null;

    // Emit Notification
    try {
      const notificationPayload = {
        type: "NEW_COLLABORATION_REQUEST",
        message: `User ${requester.username} requested to join project "${project.title}".`,
        requestId: newRequest.id,
        projectId: project.id,
        projectTitle: project.title,
        requesterUsername: requester.username,
        requesterId: requester.id,
        timestamp: new Date().toISOString(),
      };
      console.log(
        `Emit 'new_collaboration_request' to owner user ${recipientId}`
      );
      const emitted = emitToUser(
        recipientId,
        "new_collaboration_request",
        notificationPayload
      );
      if (!emitted)
        console.log(`Socket Notify Fail: Owner ${recipientId} not connected.`);
      else console.log(`Socket Notify OK: Emitted to user ${recipientId}.`);
    } catch (socketError) {
      console.error("Socket emit error after sending request:", socketError);
    }

    res.status(201).json({
      success: true,
      message: "Request sent successfully.",
      data: { requestId: newRequest.id },
    });
    console.log(`--- [${new Date().toISOString()}] sendRequest OK ---`);
  } catch (error) {
    console.error(`--- [${new Date().toISOString()}] ERROR in sendRequest ---`);
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back due to error.");
      } catch (rbError) {
        console.error("Rollback error:", rbError);
      }
    }
    console.error("Error Details:", {
      name: error.name,
      message: error.message,
    });
    if (error.original)
      console.error("DB Error:", error.original?.message || error.original);
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error sending request.",
      });
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
  const ownerId = req.user?.id; // ID of the user performing the action (should be the project owner)
  let transaction;

  try {
    console.log(
      `Processing response for request ID ${requestId}. Action: ${status}, By User (Owner): ${ownerId}`
    );

    // --- Input Validation ---
    if (!ownerId) {
      res.status(401); // Unauthorized
      throw new Error("Authentication required.");
    }
    if (!requestId || isNaN(parseInt(requestId))) {
      res.status(400); // Bad Request
      throw new Error("Invalid Request ID format.");
    }
    if (!status || !["approved", "rejected"].includes(status.toLowerCase())) {
      res.status(400); // Bad Request
      throw new Error(
        "Invalid status provided. Must be 'approved' or 'rejected'."
      );
    }
    const newStatus = status.toLowerCase();
    const parsedRequestId = parseInt(requestId);

    // --- Start Transaction ---
    transaction = await sequelize.transaction();
    console.log("Response transaction started.");

    // --- Check Model Loading ---
    if (!CollaborationRequest || !Project || !Member || !User)
      throw new Error("Required database models are not loaded correctly.");

    // --- Find the Request and Associated Project (Lock for Update) ---
    // Include project details needed for authorization and update
    const request = await CollaborationRequest.findByPk(parsedRequestId, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "ownerId", "requiredCollaborators"], // Include requiredCollaborators
        },
        {
          model: User, // Include requester info for notifications
          as: "requester",
          attributes: ["id", "username"],
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE, // Lock the request row during the transaction
    });

    // --- Request Validation ---
    if (!request) {
      res.status(404); // Not Found
      throw new Error("Collaboration request not found.");
    }
    if (!request.project) {
      // This indicates a data integrity issue
      console.error(
        `!!! Data integrity error: Request ${request.id} has no associated project.`
      );
      res.status(500); // Internal Server Error
      throw new Error(
        "Internal Error: Project associated with the request is missing."
      );
    }
    console.log(
      `Request ${parsedRequestId} found. Project ID: ${request.projectId}, Current Status: ${request.status}. Project Owner: ${request.project.ownerId}`
    );

    // --- Authorization Check ---
    if (request.project.ownerId !== ownerId) {
      res.status(403); // Forbidden
      throw new Error(
        "Forbidden: You are not the owner of the project associated with this request."
      );
    }
    console.log("Authorization confirmed: User is the project owner.");

    // --- Check if Request is Already Responded To ---
    if (request.status !== "pending") {
      res.status(400); // Bad Request
      throw new Error(`This request has already been ${request.status}.`);
    }

    // --- Update Request Status ---
    const updateData = {
      status: newStatus,
      respondedAt: new Date(),
      responseMessage: responseMessage || null, // Store the owner's response message if provided
    };
    console.log("Updating collaboration request status to:", newStatus);
    request.set(updateData);
    await request.save({ transaction }); // Save changes to the request within the transaction
    console.log("Collaboration request status updated successfully.");

    // --- Perform Actions Based on Approval/Rejection ---
    const projectId = request.projectId;
    const requesterId = request.requesterId;
    const requesterUsername = request.requester?.username || "User"; // Fallback username
    const projectTitle = request.project.title;

    if (newStatus === "approved") {
      console.log(`Processing approval actions for request ${request.id}...`);

      // 1. Add user to Project Members (if not already somehow a member)
      console.log(
        `Checking/Adding membership for user ${requesterId} in project ${projectId}`
      );
      const [member, created] = await Member.findOrCreate({
        where: { userId: requesterId, projectId: projectId },
        defaults: {
          userId: requesterId,
          projectId: projectId,
          role: "member", // Or another default role
          status: "active",
        },
        transaction,
      });

      if (created) {
        console.log(
          `Member record created for user ${requesterId} in project ${projectId}.`
        );
      } else {
        console.log(
          `User ${requesterId} was already a member (or record existed) in project ${projectId}. Ensuring status/role if needed.`
        );
        // Optionally update role/status if they might have been inactive before
        if (member.status !== "active") {
          await member.update({ status: "active" }, { transaction });
          console.log(`Updated existing member status to active.`);
        }
      }

      // ================================================================
      // --- !!! ADDED LOGIC TO DECREMENT COLLABORATOR COUNT !!! ---
      // ================================================================
      console.log(
        `Fetching project ${projectId} again to update collaborator count.`
      );
      // Fetch the project again *within the transaction* to ensure consistency
      const projectToUpdate = await Project.findByPk(projectId, {
        transaction,
        lock: transaction.LOCK.UPDATE, // Lock project row for update
      });

      if (!projectToUpdate) {
        // Should not happen if request.project existed, but check anyway
        console.error(
          `!!! Failed to refetch project ${projectId} for count update.`
        );
        throw new Error(
          `Internal Error: Project ${projectId} disappeared during transaction.`
        );
      }

      console.log(
        `Current requiredCollaborators count for project ${projectId}: ${projectToUpdate.requiredCollaborators}`
      );
      if (projectToUpdate.requiredCollaborators > 0) {
        const newCount = projectToUpdate.requiredCollaborators - 1;
        console.log(
          `---> Decrementing requiredCollaborators count to: ${newCount}`
        );
        await projectToUpdate.update(
          { requiredCollaborators: newCount },
          { transaction }
        );
        console.log(
          `---> Project ${projectId} requiredCollaborators updated successfully.`
        );
      } else {
        console.log(
          `---> requiredCollaborators count is already 0 or less. No decrement needed.`
        );
      }
      // ================================================================
      // --- END ADDED LOGIC ---
      // ================================================================
    } else {
      // newStatus === "rejected"
      console.log(`Processing rejection actions for request ${request.id}.`);
      // No changes needed to Project or Member tables for rejection.
    }

    // --- Commit Transaction ---
    await transaction.commit();
    console.log("Response transaction committed successfully.");
    transaction = null; // Indicate transaction is finished

    // --- Emit Notification to Requester ---
    try {
      const notificationPayload = {
        type: "COLLABORATION_REQUEST_RESPONSE",
        message: `Your request to join project "${projectTitle}" has been ${newStatus}.`,
        responseMessage: responseMessage || null, // Include owner's message if any
        requestId: request.id,
        projectId: projectId,
        projectTitle: projectTitle,
        status: newStatus,
        timestamp: new Date().toISOString(),
      };
      console.log(
        `Attempting to emit 'request_response' notification to requester user ${requesterId}`
      );
      const emitted = emitToUser(
        requesterId,
        "request_response", // Event name for the client to listen to
        notificationPayload
      );
      if (!emitted) {
        console.log(
          `Socket Notification Warning: Requester user ${requesterId} is not currently connected.`
        );
      } else {
        console.log(
          `Socket Notification Sent: Emitted 'request_response' successfully to user ${requesterId}.`
        );
      }
    } catch (socketError) {
      // Log socket errors but don't fail the entire HTTP request
      console.error(
        "Socket emit error after responding to request:",
        socketError
      );
    }

    // --- Send Success Response ---
    res
      .status(200)
      .json({ success: true, message: `Request successfully ${newStatus}.` });
    console.log(
      `--- [${new Date().toISOString()}] respondToRequest finished successfully for Request ID ${requestId} ---`
    );
  } catch (error) {
    console.error(
      `--- [${new Date().toISOString()}] ERROR in respondToRequest for Request ID: ${
        req.params.requestId
      } ---`
    );
    // --- Rollback Transaction on Error ---
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back due to error.");
      } catch (rbError) {
        console.error(
          "!!! Critical Error: Failed to rollback transaction:",
          rbError
        );
      }
    }
    // --- Log Error Details ---
    console.error("Error Details:", {
      name: error.name,
      message: error.message,
      // stack: error.stack // Uncomment for full stack trace during debugging
    });
    if (error.original) {
      // Log underlying database error if available
      console.error(
        "Database Error:",
        error.original?.message || error.original
      );
    }
    // --- Send Error Response ---
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500); // Use specific status code if set, otherwise default
    if (!res.headersSent) {
      // Avoid trying to send headers twice
      res.status(statusCode).json({
        success: false,
        message:
          error.message || "Server error processing the request response.",
      });
    }
  }
});

// --- Controller to Get Received Requests ---
export const getReceivedRequests = asyncHandler(async (req, res) => {
  // ... (keep existing getReceivedRequests code as is) ...
  console.log("--- ENTERING getReceivedRequests ---");
  const ownerId = req.user?.id;
  const { projectId, status } = req.query;

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  console.log("Query Params received for Get Received Requests:", {
    projectId,
    status,
  });

  try {
    const whereClause = {}; // Base filter for CollaborationRequest

    // Determine the projects to filter by: specific one or all owned
    if (projectId) {
      const parsedProjectId = parseInt(projectId);
      if (isNaN(parsedProjectId)) {
        res.status(400);
        throw new Error("Invalid projectId query parameter.");
      }
      // Verify ownership of the specific project
      if (!Project) throw new Error("Project model not loaded.");
      const project = await Project.findByPk(parsedProjectId, {
        attributes: ["ownerId"],
      });
      if (!project) {
        res.status(404);
        throw new Error("Project specified by projectId not found.");
      }
      if (project.ownerId !== ownerId) {
        res.status(403); // Forbidden
        throw new Error(
          "Forbidden: You do not own the project specified by projectId."
        );
      }
      whereClause.projectId = parsedProjectId; // Filter requests for this specific project
    } else {
      // No specific project ID provided, find requests for ALL projects owned by the user
      if (!Project) throw new Error("Project model not loaded.");
      const ownedProjects = await Project.findAll({
        where: { ownerId },
        attributes: ["id"], // Only need the IDs
      });
      const ownedProjectIds = ownedProjects.map((p) => p.id);

      // If the user owns no projects, they have no received requests
      if (ownedProjectIds.length === 0) {
        console.log(`User ${ownerId} owns no projects. Returning empty list.`);
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      // Filter requests where projectId is one of the owned project IDs
      whereClause.projectId = { [Op.in]: ownedProjectIds };
    }

    // Filter by Status if provided
    const validStatuses = ["pending", "approved", "rejected"];
    if (status) {
      const lowerCaseStatus = status.toLowerCase();
      if (!validStatuses.includes(lowerCaseStatus)) {
        res.status(400);
        throw new Error(
          `Invalid status filter. Must be one of: ${validStatuses.join(", ")}.`
        );
      }
      whereClause.status = lowerCaseStatus;
    }

    console.log(
      `Fetching received collaboration requests with where clause:`,
      JSON.stringify(whereClause)
    );
    if (!CollaborationRequest || !User || !Project)
      throw new Error("Required database models not loaded for includes.");

    // Fetch the requests with associated data
    const requests = await CollaborationRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "requester", // User who sent the request
          attributes: requesterDetailFields, // Use the defined fields
        },
        {
          model: Project,
          as: "project", // The project the request is for
          attributes: ["id", "title"], // Include project ID and title
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest requests first
    });

    console.log(
      `Found ${requests.length} received requests matching criteria.`
    );
    // Return requests array under 'data' key
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error(
      `Error fetching received requests for user ${ownerId}:`,
      error
    );
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error fetching received requests.",
      });
    }
  }
});

// --- Controller to Get Sent Requests ---
export const getSentRequests = asyncHandler(async (req, res) => {
  // ... (keep existing getSentRequests code as is) ...
  console.log("--- ENTERING getSentRequests ---");
  const requesterId = req.user?.id;
  if (!requesterId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  try {
    console.log(`Fetching requests sent by user ${requesterId}`);
    if (!CollaborationRequest || !Project || !User)
      throw new Error("Required DB models not loaded for includes.");

    const requests = await CollaborationRequest.findAll({
      where: { requesterId: requesterId }, // Filter by the logged-in user's ID
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "ownerId", "status"], // Include project details
          include: [
            {
              model: User,
              as: "owner", // Include the project owner's basic info
              attributes: ["id", "username", "profilePictureUrl"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest requests first
    });

    console.log(
      `Found ${requests.length} requests sent by user ${requesterId}.`
    );
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error(
      `Error fetching sent requests for user ${requesterId}:`,
      error
    );
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error fetching sent requests.",
      });
    }
  }
});

// --- Controller to Cancel Request (by Requester) ---
export const cancelRequest = asyncHandler(async (req, res) => {
  // ... (keep existing cancelRequest code as is) ...
  console.log("--- ENTERING cancelRequest ---");
  const { requestId } = req.params;
  const requesterId = req.user?.id; // ID of the user attempting to cancel

  // --- Input Validation & Auth ---
  if (!requesterId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!requestId || isNaN(parseInt(requestId))) {
    res.status(400);
    throw new Error("Invalid Request ID format.");
  }
  const parsedRequestId = parseInt(requestId);
  console.log(
    `User ${requesterId} attempting to cancel request ${parsedRequestId}`
  );

  try {
    if (!CollaborationRequest)
      throw new Error("CollaborationRequest DB model not loaded");

    // --- Find the Request ---
    const request = await CollaborationRequest.findByPk(parsedRequestId);
    if (!request) {
      res.status(404); // Not Found
      throw new Error("Request not found.");
    }

    // --- Authorization Check ---
    if (request.requesterId !== requesterId) {
      res.status(403); // Forbidden
      throw new Error("Forbidden: You can only cancel your own requests.");
    }

    // --- Status Check ---
    // Only allow cancellation if the request is still pending
    if (request.status !== "pending") {
      res.status(400); // Bad Request
      throw new Error(
        `Cannot cancel request because it has already been ${request.status}.`
      );
    }

    // --- Delete the Request ---
    await request.destroy(); // Permanently delete the request record
    console.log(
      `Request ${parsedRequestId} deleted successfully by user ${requesterId}.`
    );

    // --- Send Success Response ---
    res.status(200).json({
      success: true,
      message: "Your collaboration request has been successfully cancelled.",
    });
  } catch (error) {
    console.error(
      `Error cancelling request ${parsedRequestId} by user ${requesterId}:`,
      error
    );
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error cancelling the request.",
      });
    }
  }
});
