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
  // Add other relevant fields from User model needed in the modal
];

// --- Controller to SEND a request ---
export const sendRequest = asyncHandler(async (req, res) => {
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
      const notificationData = {
        /* ... notification payload ... */
      };
      console.log(`Emit 'new_collaboration_request' to user ${recipientId}`);
      const emitted = emitToUser(
        recipientId,
        "new_collaboration_request",
        notificationData
      );
      if (!emitted)
        console.log(`Socket Notify Fail: Owner ${recipientId} not connected.`);
      else console.log(`Socket Notify OK: Emitted to user ${recipientId}.`);
    } catch (socketError) {
      console.error("Socket emit error:", socketError);
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Request sent.",
        data: { requestId: newRequest.id },
      });
    console.log(`--- [${new Date().toISOString()}] sendRequest OK ---`);
  } catch (error) {
    console.error(`--- [${new Date().toISOString()}] ERROR in sendRequest ---`);
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back.");
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
      res
        .status(statusCode)
        .json({ success: false, message: error.message || "Server error." });
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
      `Update request ID ${requestId}. Action: ${status}, By User: ${ownerId}`
    );
    if (!ownerId) {
      res.status(401);
      throw new Error("Auth required.");
    }
    if (!requestId || isNaN(parseInt(requestId))) {
      res.status(400);
      throw new Error("Invalid Request ID.");
    }
    if (!status || !["approved", "rejected"].includes(status.toLowerCase())) {
      res.status(400);
      throw new Error("Invalid status.");
    }
    const newStatus = status.toLowerCase();
    const parsedRequestId = parseInt(requestId);

    transaction = await sequelize.transaction();
    console.log("Response transaction started.");

    if (!CollaborationRequest || !Project || !Member || !User)
      throw new Error("DB models not loaded.");

    const request = await CollaborationRequest.findByPk(parsedRequestId, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "ownerId"],
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
      throw new Error("Internal Error: Project missing.");
    }
    console.log(
      `Request ${parsedRequestId} found. Project ${request.projectId}. Status: ${request.status}. Owner: ${request.project.ownerId}`
    );

    if (request.project.ownerId !== ownerId) {
      res.status(403);
      throw new Error("Forbidden: Not owner.");
    }
    if (request.status !== "pending") {
      res.status(400);
      throw new Error(`Request already ${request.status}.`);
    }
    console.log("Authorization confirmed.");

    const updateData = {
      status: newStatus,
      respondedAt: new Date(),
      responseMessage: responseMessage || null,
    };
    console.log("Updating request:", updateData);
    request.set(updateData);
    await request.save({ transaction });
    console.log("Request status updated.");

    const projectId = request.projectId;
    const requesterIdToNotify = request.requesterId;
    const projectTitle = request.project.title;

    if (newStatus === "approved") {
      console.log("Handling membership for approval...");
      const existingMember = await Member.findOne({
        where: { userId: requesterIdToNotify, projectId: projectId },
        transaction,
      });
      if (!existingMember) {
        console.log(
          `Creating Member user ${requesterIdToNotify}, project ${projectId}`
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
      } else {
        console.log(`User ${requesterIdToNotify} already member. No change.`);
      }
    }

    await transaction.commit();
    console.log("Response transaction committed.");
    transaction = null;

    // Emit Notification
    try {
      const notificationData = {
        /* ... notification payload ... */
      };
      console.log(`Emit 'request_response' to user ${requesterIdToNotify}`);
      const emitted = emitToUser(
        requesterIdToNotify,
        "request_response",
        notificationData
      );
      if (!emitted)
        console.log(
          `Socket Notify Fail: Requester ${requesterIdToNotify} not connected.`
        );
      else
        console.log(
          `Socket Notify OK: Emitted to user ${requesterIdToNotify}.`
        );
    } catch (socketError) {
      console.error("Socket emit error:", socketError);
    }

    res.status(200).json({ success: true, message: `Request ${newStatus}.` });
    console.log(
      `--- [${new Date().toISOString()}] respondToRequest finished OK ---`
    );
  } catch (error) {
    console.error(
      `--- [${new Date().toISOString()}] ERROR in respondToRequest ID: ${
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
    console.error("Error Details:", {
      name: error.name,
      message: error.message,
    });
    if (error.original)
      console.error("DB Error:", error.original?.message || error.original);
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (!res.headersSent) {
      res
        .status(statusCode)
        .json({ success: false, message: error.message || "Server error." });
    }
  }
});

// --- Controller to Get Received Requests (Handles filtering) ---
/**
 * @desc    Get Received Requests (for projects owned by user OR filtered by query)
 * @route   GET /api/collaboration-requests
 * @access  Private
 * @query   ?projectId=int - Filter by specific project ID (for RequestsModal)
 * @query   ?status=string - Filter by status ('pending', 'approved', 'rejected')
 */
export const getReceivedRequests = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getReceivedRequests ---");
  const ownerId = req.user?.id;
  const { projectId, status } = req.query;

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  console.log("Query Params received:", { projectId, status });

  try {
    const whereClause = {}; // Base filter

    // Filter by Project ID (verify ownership)
    if (projectId) {
      const parsedProjectId = parseInt(projectId);
      if (isNaN(parsedProjectId)) {
        res.status(400);
        throw new Error("Invalid projectId.");
      }
      if (!Project) throw new Error("Project model not loaded.");
      const project = await Project.findByPk(parsedProjectId, {
        attributes: ["ownerId"],
      });
      if (!project) {
        res.status(404);
        throw new Error("Project not found.");
      }
      if (project.ownerId !== ownerId) {
        res.status(403);
        throw new Error("Forbidden: Not owner.");
      }
      whereClause.projectId = parsedProjectId;
    } else {
      // Get requests for ALL projects owned by user
      if (!Project) throw new Error("Project model not loaded.");
      const ownedProjects = await Project.findAll({
        where: { ownerId },
        attributes: ["id"],
      });
      const ownedProjectIds = ownedProjects.map((p) => p.id);
      if (ownedProjectIds.length === 0)
        return res.status(200).json({ success: true, count: 0, data: [] });
      whereClause.projectId = { [Op.in]: ownedProjectIds };
    }

    // Filter by Status
    const validStatuses = ["pending", "approved", "rejected"];
    if (status) {
      if (!validStatuses.includes(status.toLowerCase())) {
        res.status(400);
        throw new Error(`Invalid status.`);
      }
      whereClause.status = status.toLowerCase();
    }

    console.log(`Fetching requests with where clause:`, whereClause);
    if (!CollaborationRequest || !User || !Project)
      throw new Error("DB models not loaded");

    const requests = await CollaborationRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "requester",
          // Include more details for the modal
          attributes: requesterDetailFields, // <<< USE DETAILED FIELDS
        },
        { model: Project, as: "project", attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`Found ${requests.length} requests.`);
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
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
  }
});

// --- Controller to Get Sent Requests ---
export const getSentRequests = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getSentRequests ---");
  const requesterId = req.user?.id;
  if (!requesterId) {
    res.status(401);
    throw new Error("Auth required.");
  }
  try {
    console.log(`Fetching requests sent by user ${requesterId}`);
    if (!CollaborationRequest || !Project || !User)
      throw new Error("DB models not loaded");
    const requests = await CollaborationRequest.findAll({
      where: { requesterId: requesterId },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "title", "ownerId"],
          include: [
            { model: User, as: "owner", attributes: ["id", "username"] },
          ],
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
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
  }
});

// --- Controller to Cancel Request (by Requester) ---
export const cancelRequest = asyncHandler(async (req, res) => {
  console.log("--- ENTERING cancelRequest ---");
  const { requestId } = req.params;
  const requesterId = req.user?.id;
  if (!requesterId) {
    res.status(401);
    throw new Error("Auth required.");
  }
  if (!requestId || isNaN(parseInt(requestId))) {
    res.status(400);
    throw new Error("Invalid ID.");
  }
  const parsedRequestId = parseInt(requestId);
  console.log(`User ${requesterId} cancelling request ${parsedRequestId}`);
  try {
    if (!CollaborationRequest) throw new Error("DB model not loaded");
    const request = await CollaborationRequest.findByPk(parsedRequestId);
    if (!request) {
      res.status(404);
      throw new Error("Request not found.");
    }
    if (request.requesterId !== requesterId) {
      res.status(403);
      throw new Error("Forbidden.");
    }
    if (request.status !== "pending") {
      res.status(400);
      throw new Error(`Cannot cancel non-pending.`);
    }

    await request.destroy();
    console.log("Request deleted.");
    res.status(200).json({ success: true, message: "Request cancelled." });
  } catch (error) {
    console.error(`Error cancelling request ${parsedRequestId}:`, error);
    const statusCode =
      error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
  }
});
