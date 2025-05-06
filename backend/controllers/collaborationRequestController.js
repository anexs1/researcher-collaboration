// backend/controllers/collaborationRequestController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { emitToUser } from "../config/socketSetup.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Destructure models - Ensure these are defined and associated in models/index.js
const {
  CollaborationRequest,
  Project,
  User,
  Member,
  Notification, // <<<--- ENSURE Notification Model is IMPORTED
  sequelize,
} = db;

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
  const requester = req.user;
  let transaction;
  const { projectId, message } = req.body;
  const parsedProjectId = parseInt(projectId);

  console.log(
    `\n--- [${new Date().toISOString()}] ENTERING sendRequest by User ${
      requester?.id
    } for Project ${projectId} ---`
  );

  try {
    // --- Basic Validations ---
    if (!requester?.id) {
      res.status(401);
      throw new Error("Authentication required.");
    }
    if (!projectId || isNaN(parsedProjectId)) {
      res.status(400);
      throw new Error("Valid Project ID required.");
    }
    // Check if all required models were loaded correctly from index.js
    if (
      !Project ||
      !Member ||
      !CollaborationRequest ||
      !Notification ||
      !User
    ) {
      console.error(
        "!!! CRITICAL: One or more required DB models failed to load !!!",
        {
          Project: !!Project,
          Member: !!Member,
          CollaborationRequest: !!CollaborationRequest,
          Notification: !!Notification,
          User: !!User,
        }
      );
      throw new Error(
        "Internal Server Error: Required database models not loaded."
      );
    }

    transaction = await sequelize.transaction();
    console.log("Send Request: Transaction started.");

    // --- Fetch Project & Validate ---
    const project = await Project.findByPk(parsedProjectId, {
      attributes: ["id", "title", "ownerId"],
      transaction,
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    console.log(
      `Send Request: Project ${project.id} found. Owner ID: ${project.ownerId}`
    );
    const recipientId = project.ownerId;
    if (requester.id === recipientId) {
      res.status(400);
      throw new Error("Cannot request to join own project.");
    }

    // --- Check Membership & Existing Pending Requests ---
    console.log(
      `Send Request: Checking membership/existing request for User ${requester.id} in Project ${parsedProjectId}...`
    );
    const isAlreadyMember = await Member.findOne({
      where: { userId: requester.id, projectId: parsedProjectId },
      transaction,
    });
    if (isAlreadyMember) {
      res.status(409);
      throw new Error("You are already a member of this project.");
    }
    console.log("Send Request: User is not a member.");
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
    console.log("Send Request: No existing pending request found.");

    // --- Create Request ---
    const requestData = {
      projectId: parsedProjectId,
      requesterId: requester.id,
      requestMessage: message || null,
      status: "pending",
    };
    console.log("Send Request: Creating CollaborationRequest:", requestData);
    const newRequest = await CollaborationRequest.create(requestData, {
      transaction,
    });
    console.log(
      `Send Request: CollaborationRequest created successfully. ID: ${newRequest.id}`
    );

    // --- Commit Transaction BEFORE Notification ---
    // Ensures the request exists before we notify about it
    await transaction.commit();
    console.log("Send Request: Transaction committed successfully.");
    transaction = null; // Mark transaction as finished

    // ==================================================================
    // --- START: Create and Emit Persistent Notification for OWNER ---
    // ==================================================================
    try {
      const ownerId = project.ownerId; // Get the owner ID again (safe)

      // 1. Create the Notification in the Database
      const notificationMessage = `User '${
        requester.username || "Unknown"
      }' requested to join your project '${project.title || "Untitled"}'.`;
      console.log(
        `Send Request: Preparing notification for owner ${ownerId}: "${notificationMessage}"`
      );
      const newNotification = await Notification.create({
        userId: ownerId, // Recipient is the project owner
        type: "NEW_COLLAB_JOIN_REQUEST", // Standardized type
        message: notificationMessage,
        data: {
          // Contextual data for linking etc.
          requestId: newRequest.id,
          requesterId: requester.id,
          requesterUsername: requester.username, // Include username if available
          projectId: project.id,
          projectTitle: project.title,
        },
        readStatus: false, // Initially unread
      });
      console.log(
        `Send Request: Notification record created in DB (ID: ${newNotification.id}) for owner ${ownerId}`
      );

      // 2. Emit the real-time event to the owner using the STANDARD event name 'notification'
      const notificationForSocket = newNotification.toJSON(); // Get plain JS object for socket
      console.log(
        `Send Request: Emitting 'notification' event to owner User ${ownerId}`
      );

      const emitted = emitToUser(ownerId, "notification", {
        type: "NEW_COLLAB_JOIN_REQUEST", // Send type again for easy client-side filtering
        notification: notificationForSocket, // Send the full notification object
      });

      if (emitted) {
        console.log(
          `Send Request: Standard 'notification' event emitted successfully via socket to owner user ${ownerId}.`
        );
      } else {
        // This is not an error, just means the user wasn't connected via socket at this exact moment
        console.log(
          `Send Request: Socket Notify Notice: Owner ${ownerId} not currently connected for 'notification' event. Notification saved to DB.`
        );
      }
    } catch (notificationError) {
      // Log notification errors but don't fail the main HTTP response,
      // as the primary action (sending request) succeeded.
      console.error(
        "!!! Send Request: Error occurred during notification creation/emission:",
        notificationError
      );
    }
    // ==================================================================
    // --- END: Create and Emit Persistent Notification for OWNER ---
    // ==================================================================

    // --- Send Success Response for the Request ---
    res.status(201).json({
      success: true,
      message: "Request sent successfully.",
      data: { requestId: newRequest.id }, // Send back the new request ID
    });
    console.log(
      `--- [${new Date().toISOString()}] sendRequest finished successfully ---`
    );
  } catch (error) {
    console.error(`--- [${new Date().toISOString()}] ERROR in sendRequest ---`);
    // --- Rollback Transaction on Error ---
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.log("Send Request: Transaction rolled back due to error.");
      } catch (rbError) {
        console.error(
          "!!! Send Request: Critical Error - Failed to rollback transaction:",
          rbError
        );
      }
    }
    // --- Log Error Details ---
    console.error("Send Request Error Details:", {
      name: error.name,
      message: error.message,
    });
    if (error.original)
      console.error(
        "Send Request DB Error:",
        error.original?.message || error.original
      );

    // --- Send Error Response ---
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error sending collaboration request.",
      });
    }
  }
});

// --- Controller to respond to a request (Approve/Reject) ---
export const respondToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status, responseMessage } = req.body;
  const ownerId = req.user?.id; // ID of the user performing the action (should be the project owner)
  let transaction;
  const parsedRequestId = parseInt(requestId);
  const newStatus = status?.toLowerCase();

  console.log(
    `\n--- [${new Date().toISOString()}] ENTERING respondToRequest for Request ${requestId} by Owner ${ownerId} ---`
  );

  try {
    // --- Validations ---
    if (!ownerId) {
      res.status(401);
      throw new Error("Authentication required.");
    }
    if (!requestId || isNaN(parsedRequestId)) {
      res.status(400);
      throw new Error("Invalid Request ID format.");
    }
    if (!newStatus || !["approved", "rejected"].includes(newStatus)) {
      res.status(400);
      throw new Error(
        "Invalid status provided. Must be 'approved' or 'rejected'."
      );
    }
    // Check model loading
    if (
      !CollaborationRequest ||
      !Project ||
      !Member ||
      !User ||
      !Notification
    ) {
      console.error(
        "!!! CRITICAL: One or more required DB models failed to load in respondToRequest !!!"
      );
      throw new Error(
        "Internal Server Error: Required database models not loaded."
      );
    }

    transaction = await sequelize.transaction();
    console.log("Respond Request: Transaction started.");

    // --- Find Request & Project, Validate Ownership & Status ---
    // Lock the request row during the transaction to prevent race conditions
    console.log(
      `Respond Request: Fetching Request ID ${parsedRequestId} with Project and Requester info...`
    );
    const request = await CollaborationRequest.findByPk(parsedRequestId, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "ownerId", "requiredCollaborators"],
        }, // Need ownerId for auth, requiredCollaborators for update
        { model: User, as: "requester", attributes: ["id", "username"] }, // Need requesterId for notification
      ],
      transaction,
      lock: transaction.LOCK.UPDATE, // Use pessimistic lock
    });

    // --- Request Validation Checks ---
    if (!request) {
      res.status(404);
      throw new Error("Collaboration request not found.");
    }
    if (!request.project) {
      res.status(500);
      throw new Error(
        "Internal Error: Project associated with the request is missing."
      );
    } // Data integrity issue
    console.log(
      `Respond Request: Request found. Project: ${request.project.title} (ID: ${request.projectId}), Current Status: ${request.status}, Requester: ${request.requester?.username} (ID: ${request.requesterId})`
    );

    // --- Authorization Check: Is the logged-in user the project owner? ---
    if (request.project.ownerId !== ownerId) {
      res.status(403);
      throw new Error(
        "Forbidden: You are not the owner of the project associated with this request."
      );
    }
    console.log("Respond Request: Authorization check passed (User is owner).");

    // --- Status Check: Can this request be responded to? ---
    if (request.status !== "pending") {
      res.status(400);
      throw new Error(
        `This request has already been responded to (Status: ${request.status}).`
      );
    }
    console.log(
      `Respond Request: Request status is 'pending', proceeding with action: ${newStatus}`
    );

    // --- Update Request Status in DB ---
    const updateData = {
      status: newStatus,
      respondedAt: new Date(),
      responseMessage: responseMessage || null,
    };
    console.log("Respond Request: Updating CollaborationRequest status...");
    request.set(updateData);
    await request.save({ transaction });
    console.log(
      `Respond Request: CollaborationRequest ${request.id} status updated to ${newStatus} successfully.`
    );

    // --- Handle Approval Logic (Add Member, Decrement Count) ---
    if (newStatus === "approved") {
      console.log(
        `Respond Request: Processing approval actions for user ${request.requesterId}...`
      );
      // 1. Add user to Project Members (or ensure they are active)
      const [member, created] = await Member.findOrCreate({
        where: { userId: request.requesterId, projectId: request.projectId },
        defaults: {
          userId: request.requesterId,
          projectId: request.projectId,
          role: "member",
          status: "active",
        },
        transaction,
      });
      if (created) {
        console.log(
          `Respond Request: Member record created for user ${request.requesterId} in project ${request.projectId}.`
        );
      } else if (member.status !== "active") {
        await member.update({ status: "active" }, { transaction });
        console.log(
          `Respond Request: Existing member record for user ${request.requesterId} status updated to active.`
        );
      } else {
        console.log(
          `Respond Request: User ${request.requesterId} already exists as an active member.`
        );
      }

      // 2. Decrement requiredCollaborators count if > 0
      // Refetch project within transaction for consistency
      const projectToUpdate = await Project.findByPk(request.projectId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (projectToUpdate && projectToUpdate.requiredCollaborators > 0) {
        const newCount = projectToUpdate.requiredCollaborators - 1;
        console.log(
          `Respond Request: Decrementing requiredCollaborators for project ${request.projectId} from ${projectToUpdate.requiredCollaborators} to ${newCount}.`
        );
        await projectToUpdate.update(
          { requiredCollaborators: newCount },
          { transaction }
        );
        console.log(
          `Respond Request: Project requiredCollaborators updated successfully.`
        );
      } else {
        console.log(
          `Respond Request: requiredCollaborators for project ${request.projectId} is ${projectToUpdate?.requiredCollaborators}. No decrement needed.`
        );
      }
    } else {
      // newStatus === "rejected"
      console.log(
        `Respond Request: Processing rejection actions for request ${request.id}. (No DB changes needed apart from request status).`
      );
    }

    // --- Commit Transaction BEFORE Notification ---
    await transaction.commit();
    console.log("Respond Request: Transaction committed successfully.");
    transaction = null; // Mark transaction as finished

    // ==================================================================
    // --- START: Create and Emit Notification TO REQUESTER ---
    // ==================================================================
    try {
      const requesterId = request.requesterId; // Get the original requester's ID
      const projectTitle = request.project.title;

      // 1. Create Notification for the Requester
      const notificationMessage = `Your request to join project "${
        projectTitle || "Untitled"
      }" was ${newStatus}. ${
        responseMessage ? `Message from owner: ${responseMessage}` : ""
      }`.trim();
      console.log(
        `Respond Request: Preparing notification for requester ${requesterId}: "${notificationMessage}"`
      );

      const newNotification = await Notification.create({
        userId: requesterId, // Recipient is the requester
        type: "COLLAB_REQUEST_RESPONSE", // Standardized type
        message: notificationMessage,
        data: {
          // Contextual data
          requestId: request.id,
          projectId: request.projectId,
          projectTitle: projectTitle,
          status: newStatus, // Include the outcome status
          responseMessage: responseMessage || null, // Include owner's message if any
        },
        readStatus: false, // Initially unread
      });
      console.log(
        `Respond Request: Notification record created in DB (ID: ${newNotification.id}) for requester ${requesterId}`
      );

      // 2. Emit the real-time event to the requester using the STANDARD event name 'notification'
      const notificationForSocket = newNotification.toJSON();
      console.log(
        `Respond Request: Emitting 'notification' event to requester User ${requesterId}`
      );

      const emitted = emitToUser(requesterId, "notification", {
        type: "COLLAB_REQUEST_RESPONSE", // Include type for frontend filtering
        notification: notificationForSocket, // Send the full notification object
      });

      if (emitted) {
        console.log(
          `Respond Request: Standard 'notification' event emitted successfully via socket to requester user ${requesterId}.`
        );
      } else {
        console.log(
          `Respond Request: Socket Notify Notice: Requester ${requesterId} not currently connected for 'notification' event. Notification saved to DB.`
        );
      }
    } catch (notificationError) {
      // Log notification errors but don't fail the main HTTP response
      console.error(
        "!!! Respond Request: Error occurred during notification creation/emission for requester:",
        notificationError
      );
    }
    // ==================================================================
    // --- END: Create and Emit Notification TO REQUESTER ---
    // ==================================================================

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
        console.log("Respond Request: Transaction rolled back due to error.");
      } catch (rbError) {
        console.error(
          "!!! Respond Request: Critical Error - Failed to rollback transaction:",
          rbError
        );
      }
    }
    // --- Log Error Details ---
    console.error("Respond Request Error Details:", {
      name: error.name,
      message: error.message,
    });
    if (error.original)
      console.error(
        "Respond Request DB Error:",
        error.original?.message || error.original
      );

    // --- Send Error Response ---
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message:
          error.message || "Server error processing the request response.",
      });
    }
  }
});

// --- Controller to Get Received Requests ---
// No changes needed in this version for notification logic
export const getReceivedRequests = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getReceivedRequests ---");
  const ownerId = req.user?.id;
  const { projectId, status } = req.query; // Filter options

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  console.log("Get Received Requests: Query Params:", { projectId, status });

  try {
    const whereClause = {};
    const projectWhereClause = { ownerId: ownerId }; // Base filter: projects owned by the user

    // If a specific projectId is provided, filter by that AND ensure ownership
    if (projectId) {
      const parsedProjectId = parseInt(projectId);
      if (isNaN(parsedProjectId)) {
        res.status(400);
        throw new Error("Invalid projectId query parameter.");
      }
      // Check ownership implicitly by adding it to the project filter
      projectWhereClause.id = parsedProjectId;
      whereClause.projectId = parsedProjectId; // Also filter CollaborationRequest directly
      console.log(
        `Get Received Requests: Filtering for specific owned project ID: ${parsedProjectId}`
      );
    }

    // Find IDs of projects owned (or the specific one if provided)
    if (!Project) throw new Error("Project model not loaded.");
    const ownedProjects = await Project.findAll({
      where: projectWhereClause,
      attributes: ["id"],
    });
    const ownedProjectIds = ownedProjects.map((p) => p.id);

    if (ownedProjectIds.length === 0) {
      console.log(
        `Get Received Requests: User ${ownerId} owns no relevant projects. Returning empty list.`
      );
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    // Ensure the filter uses the confirmed owned project IDs
    whereClause.projectId = { [Op.in]: ownedProjectIds };

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
      console.log(
        `Get Received Requests: Filtering by status: ${lowerCaseStatus}`
      );
    } else {
      console.log("Get Received Requests: No status filter applied.");
    }

    console.log(
      `Get Received Requests: Final where clause for CollaborationRequest:`,
      JSON.stringify(whereClause)
    );
    if (!CollaborationRequest || !User || !Project)
      throw new Error("Required database models not loaded for includes.");

    // Fetch the requests
    const requests = await CollaborationRequest.findAll({
      where: whereClause,
      include: [
        { model: User, as: "requester", attributes: requesterDetailFields }, // Include detailed requester info
        { model: Project, as: "project", attributes: ["id", "title"] }, // Include basic project info
      ],
      order: [["createdAt", "DESC"]], // Show newest first
    });

    console.log(
      `Get Received Requests: Found ${requests.length} requests matching criteria.`
    );
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error(
      `Get Received Requests: Error fetching requests for user ${ownerId}:`,
      error
    );
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res
        .status(statusCode)
        .json({
          success: false,
          message: error.message || "Server error fetching received requests.",
        });
    }
  }
});

// --- Controller to Get Sent Requests ---
// No changes needed in this version for notification logic
export const getSentRequests = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getSentRequests ---");
  const requesterId = req.user?.id;
  if (!requesterId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  try {
    console.log(
      `Get Sent Requests: Fetching requests sent by user ${requesterId}`
    );
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
            // Nested include for project owner
            {
              model: User,
              as: "owner",
              attributes: ["id", "username", "profilePictureUrl"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest requests first
    });

    console.log(
      `Get Sent Requests: Found ${requests.length} requests sent by user ${requesterId}.`
    );
    res
      .status(200)
      .json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error(
      `Get Sent Requests: Error fetching sent requests for user ${requesterId}:`,
      error
    );
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res
        .status(statusCode)
        .json({
          success: false,
          message: error.message || "Server error fetching sent requests.",
        });
    }
  }
});

// --- Controller to Cancel Request (by Requester) ---
// No changes needed in this version for notification logic
export const cancelRequest = asyncHandler(async (req, res) => {
  console.log("--- ENTERING cancelRequest ---");
  const { requestId } = req.params;
  const requesterId = req.user?.id; // ID of the user attempting to cancel
  const parsedRequestId = parseInt(requestId);

  // --- Input Validation & Auth ---
  if (!requesterId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!requestId || isNaN(parsedRequestId)) {
    res.status(400);
    throw new Error("Invalid Request ID format.");
  }
  console.log(
    `Cancel Request: User ${requesterId} attempting to cancel request ${parsedRequestId}`
  );

  try {
    if (!CollaborationRequest)
      throw new Error("CollaborationRequest DB model not loaded");

    // --- Find the Request ---
    const request = await CollaborationRequest.findByPk(parsedRequestId);
    if (!request) {
      res.status(404);
      throw new Error("Request not found.");
    }

    // --- Authorization Check ---
    if (request.requesterId !== requesterId) {
      res.status(403);
      throw new Error("Forbidden: You can only cancel your own requests.");
    }

    // --- Status Check ---
    if (request.status !== "pending") {
      res.status(400);
      throw new Error(
        `Cannot cancel request because it has already been ${request.status}.`
      );
    }

    // --- Delete the Request ---
    await request.destroy(); // Permanently delete the request record
    console.log(
      `Cancel Request: Request ${parsedRequestId} deleted successfully by user ${requesterId}.`
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Your collaboration request has been successfully cancelled.",
      });
  } catch (error) {
    console.error(
      `Cancel Request: Error cancelling request ${parsedRequestId} by user ${requesterId}:`,
      error
    );
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res
        .status(statusCode)
        .json({
          success: false,
          message: error.message || "Server error cancelling the request.",
        });
    }
  }
});
