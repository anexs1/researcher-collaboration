// backend/controllers/messagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";
import path from "path"; // Needed for constructing URL potentially

const { User, Project, Member, Message } = db;

// --- getProjectChatList function (keep as is) ---
export const getProjectChatList = asyncHandler(async (req, res) => {
  // ... your existing code ...
  const currentUserId = req.user?.id;
  console.log(`API: getProjectChatList invoked by user ${currentUserId}`);
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!Project || !Member) {
    console.error("Server Config Error: Project/Member model not loaded.");
    res.status(500);
    throw new Error("Server config error.");
  }
  try {
    const userMemberships = await Member.findAll({
      where: { userId: currentUserId, status: "active" },
      attributes: ["projectId"],
      raw: true,
    });
    const memberProjectIds = userMemberships.map((m) => m.projectId);
    const ownedProjects = await Project.findAll({
      where: { ownerId: currentUserId },
      attributes: ["id"],
      raw: true,
    });
    const ownedProjectIds = ownedProjects.map((p) => p.id);
    const allRelevantProjectIds = [
      ...new Set([...memberProjectIds, ...ownedProjectIds]),
    ];
    if (allRelevantProjectIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    const projects = await Project.findAll({
      where: { id: { [Op.in]: allRelevantProjectIds } },
      attributes: ["id", "title"],
      order: [["title", "ASC"]],
    });
    const projectChatList = projects.map((project) => ({
      projectId: project.id,
      projectName: project.title,
    }));
    console.log(
      `Returning ${projectChatList.length} project chats for user ${currentUserId}.`
    );
    res.status(200).json({ success: true, data: projectChatList });
  } catch (error) {
    console.error(
      `Error in getProjectChatList for user ${currentUserId}:`,
      error
    );
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "Server error fetching project chat list.";
    res.status(500).json({ success: false, message: message });
  }
});

// --- getProjectChatHistory function (keep as is) ---
export const getProjectChatHistory = asyncHandler(async (req, res) => {
  // ... your existing code ...
  const currentUserId = req.user?.id;
  const projectIdParam = req.params.projectId;
  console.log(
    `API: getProjectChatHistory invoked for project ${projectIdParam} by user ${currentUserId}`
  );
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid project ID format.");
  }
  if (!Message || !Member || !User || !Project) {
    console.error("Server Config Error: Required models not loaded.");
    res.status(500);
    throw new Error("Server config error.");
  }
  try {
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    const isOwner = project.ownerId === currentUserId;
    let isMember = false;
    if (!isOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: "active",
        },
        attributes: ["userId"],
      });
      isMember = !!membership;
    }
    if (!isOwner && !isMember) {
      console.warn(
        `Auth Failed: User ${currentUserId} tried project ${projectId}`
      );
      res.status(403);
      throw new Error("Access Denied.");
    }
    console.log(
      `Auth Passed: User ${currentUserId} for project ${projectId} (Owner: ${isOwner}, Member: ${isMember}).`
    );
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    if (limit <= 0 || offset < 0) {
      res.status(400);
      throw new Error("Invalid pagination.");
    }
    const messages = await Message.findAll({
      where: { projectId: projectId },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
      order: [["createdAt", "ASC"]],
      limit: limit,
      offset: offset,
    });
    console.log(
      `Found ${messages.length} messages for project ${projectId} (limit: ${limit}, offset: ${offset}).`
    );
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error(
      `Error in getProjectChatHistory for project ${projectId}, user ${currentUserId}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error fetching chat history.";
    const responseMessage =
      statusCode === 500 && process.env.NODE_ENV !== "development"
        ? "Server error fetching chat history."
        : message;
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

// --- ** NEW File Upload Controller ** ---

/**
 * @desc    Handle file upload for a project chat
 * @route   POST /api/messaging/upload/project/:projectId
 * @access  Private (User must be active member/owner)
 */
export const uploadProjectFile = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  const projectIdParam = req.params.projectId;

  console.log(
    `API: uploadProjectFile invoked for project ${projectIdParam} by user ${currentUserId}`
  );

  // --- Basic Validations ---
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid project ID format.");
  }

  // --- File Check (Multer puts file info in req.file) ---
  if (!req.file) {
    console.log("Upload Error: No file received in req.file.");
    res.status(400);
    throw new Error("No file uploaded or file rejected by filter.");
  }

  // --- Authorization Check (Same as fetching history) ---
  try {
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    const isOwner = project.ownerId === currentUserId;
    let isMember = false;
    if (!isOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: "active",
        },
        attributes: ["userId"],
      });
      isMember = !!membership;
    }
    if (!isOwner && !isMember) {
      console.warn(
        `Auth Failed: User ${currentUserId} tried to upload to project ${projectId}`
      );
      res.status(403);
      throw new Error("Access Denied: Not authorized for this project chat.");
    }
    console.log(
      `Auth Passed: User ${currentUserId} can upload to project ${projectId}`
    );
  } catch (authError) {
    console.error("Auth check error during upload:", authError);
    res.status(authError.statusCode || 500); // Use specific status if set
    throw new Error(authError.message || "Failed to verify project access.");
  }
  // --- End Authorization Check ---

  // --- Process File ---
  const file = req.file;
  console.log("File received by controller:", {
    filename: file.filename, // The unique name saved by multer
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path, // Full path on server where file is temporarily saved
  });

  // --- Construct File URL ---
  // IMPORTANT: This assumes your 'public/uploads/project_files' directory is served statically
  // by your Express app. Adjust the base URL and path segment as needed.
  // Example: If Express serves 'public' at '/', the URL is '/uploads/project_files/filename'
  // If you upload to S3/Cloud Storage, use the URL returned from that service instead.
  const fileUrl = `/uploads/project_files/${file.filename}`; // ** ADJUST THIS BASED ON YOUR STATIC SERVING **

  // --- Respond to Frontend ---
  // Send back the necessary details for the frontend to then send via socket
  res.status(200).json({
    success: true,
    message: "File uploaded successfully.",
    data: {
      fileUrl: fileUrl,
      fileName: file.originalname, // Send original name back
      mimeType: file.mimetype,
      fileSize: file.size,
    },
  });

  // Note: We don't save the Message record here. The frontend receives the file details,
  // THEN emits a 'sendMessage' socket event with messageType='file' and these details.
  // The socket handler on the backend will save the Message record.
});
