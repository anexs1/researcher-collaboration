// backend/controllers/messagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";
import fs from "fs"; // For file system operations like unlinking on error
import path from "path";
import { getIo } from "../socketManager.js";
const { User, Project, Member, Message } = db;

// --- Helper: Check if user is member of a project (for non-admin functions) ---
const isUserMemberOfProject = async (userId, projectId) => {
  if (!userId || !projectId || !Project || !Member) {
    console.error(
      "[isUserMemberOfProject] Missing userId, projectId, or DB models."
    );
    return false;
  }
  try {
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"],
    });
    if (!project) return false;
    if (project.ownerId === userId) return true;

    const membership = await Member.findOne({
      where: {
        userId: userId,
        projectId: projectId,
        status: "active",
      },
      attributes: ["userId"],
    });
    return !!membership;
  } catch (error) {
    console.error(
      `[isUserMemberOfProject] Error checking membership for user ${userId} in project ${projectId}:`,
      error
    );
    return false;
  }
};

// --- Helper: Get Socket.IO room name for a project ---
const getRoomName = (projectId) => (projectId ? `project-${projectId}` : null);

// --- getProjectChatList function (Your existing logic) ---
export const getProjectChatList = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  // Ensure all necessary models are available
  if (!Project || !Member || !Message || !User) {
    console.error(
      "[MessagingController] Server Config Error: Project, Member, Message, or User model not loaded for getProjectChatList."
    );
    res.status(500);
    throw new Error("Server configuration error regarding database models.");
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

    const projectsWithDetails = await Project.findAll({
      where: { id: { [Op.in]: allRelevantProjectIds } },
      attributes: ["id", "title"],
      order: [["title", "ASC"]],
    });

    const projectChatList = await Promise.all(
      projectsWithDetails.map(async (project) => {
        const lastMessage = await Message.findOne({
          where: { projectId: project.id },
          order: [["createdAt", "DESC"]],
          attributes: [
            "content",
            "createdAt",
            "messageType",
            "fileName",
            "senderId",
          ],
          include: [{ model: User, as: "sender", attributes: ["username"] }], // Ensure alias 'sender' is correct
        });

        let lastMessageSnippet = "No messages yet...";
        let lastMessageSenderUsername = null;
        if (lastMessage) {
          lastMessageSenderUsername =
            lastMessage.sender?.username || `User ${lastMessage.senderId}`;
          if (lastMessage.messageType === "file") {
            lastMessageSnippet = `File: ${
              lastMessage.fileName || "attachment"
            }`;
          } else {
            lastMessageSnippet = lastMessage.content || ""; // Handle null content
          }
          if (lastMessage.senderId === currentUserId) {
            lastMessageSnippet = `You: ${lastMessageSnippet}`;
          } else if (lastMessage.sender) {
            // Only prepend if sender info exists
            lastMessageSnippet = `${lastMessageSenderUsername}: ${lastMessageSnippet}`;
          }
        }

        // TODO: Implement actual unread count logic. This is a placeholder.
        const unreadCount = 0;

        return {
          projectId: project.id,
          projectName: project.title,
          lastMessageSnippet:
            lastMessageSnippet.substring(0, 50) +
            (lastMessageSnippet.length > 50 ? "..." : ""),
          lastMessageAt: lastMessage ? lastMessage.createdAt : null,
          lastMessageSenderUsername: lastMessage
            ? lastMessageSenderUsername
            : null,
          unreadCount: unreadCount,
        };
      })
    );
    // Sort by lastMessageAt descending, projects with no messages last
    projectChatList.sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt)
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return (a.projectName || "").localeCompare(b.projectName || ""); // Fallback sort by name
    });

    res.status(200).json({ success: true, data: projectChatList });
  } catch (error) {
    console.error(
      `[MessagingController] Error in getProjectChatList for user ${currentUserId}:`,
      error
    );
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "Server error fetching project chat list.";
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: message });
    }
  }
});

// --- getProjectChatHistory function (Your existing logic, with pagination and sender fallback) ---
export const getProjectChatHistory = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  const projectIdParam = req.params.projectId;
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid project ID format.");
  }
  if (!Message || !User || !Project) {
    console.error(
      "[MessagingController] Server Config Error: Required models (Message, User, Project) not loaded for getProjectChatHistory."
    );
    res.status(500);
    throw new Error("Server configuration error regarding database models.");
  }
  try {
    const authorized = await isUserMemberOfProject(currentUserId, projectId);
    if (!authorized) {
      res.status(403);
      throw new Error(
        "Access Denied: You are not authorized to view this project chat."
      );
    }

    const { page = 1, limit = 50 } = req.query; // Use page for more standard pagination
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (
      isNaN(parsedPage) ||
      isNaN(parsedLimit) ||
      parsedLimit <= 0 ||
      parsedPage <= 0
    ) {
      res.status(400);
      throw new Error("Invalid pagination parameters.");
    }
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { projectId: projectId },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "profilePictureUrl"],
          required: false, // Keep false in case sender user was deleted
        },
      ],
      order: [["createdAt", "ASC"]], // Chat history usually ASC
      limit: parsedLimit,
      offset: offset,
      distinct: true,
    });

    const formattedMessages = messages.map((msgInstance) => {
      const msg = msgInstance.toJSON();
      if (!msg.sender) {
        // Handle case where sender might be null (e.g., user deleted)
        msg.sender = {
          id: msg.senderId,
          username: `User ${msg.senderId || "Unknown"}`,
          profilePictureUrl: null,
        };
      }
      return msg;
    });

    res.status(200).json({
      success: true,
      messages: formattedMessages, // Frontend expects 'messages' for chat history
      currentPage: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      count: count,
    });
  } catch (error) {
    console.error(
      `[MessagingController] Error in getProjectChatHistory for project ${projectId}, user ${currentUserId}:`,
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

// --- File Upload Controller (Your existing logic) ---
export const uploadProjectFile = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user?.id;
  const projectIdParam = req.params.projectId;

  if (!currentUserId) {
    return next(
      Object.assign(new Error("Authentication required."), { status: 401 })
    );
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error(
          "[MessagingController] Failed to delete orphaned upload (invalid projectID):",
          e
        );
      }
    }
    return next(
      Object.assign(new Error("Invalid project ID format."), { status: 400 })
    );
  }

  if (!req.file) {
    return next(
      Object.assign(new Error("No file uploaded or file rejected by filter."), {
        status: 400,
      })
    );
  }

  try {
    const authorized = await isUserMemberOfProject(currentUserId, projectId);
    if (!authorized) {
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error(
            "[MessagingController] Failed to delete unauthorized upload:",
            e
          );
        }
      }
      return next(
        Object.assign(
          new Error(
            "Access Denied: Not authorized to upload to this project chat."
          ),
          { status: 403 }
        )
      );
    }

    const file = req.file;
    const fileUrl = `/uploads/project_files/${file.filename}`; // Ensure this path is served statically

    console.log(
      `[MessagingController] File processed: ${file.originalname}, Saved as: ${file.filename}, URL: ${fileUrl} for project ${projectId}`
    );

    res.status(200).json({
      success: true,
      message: "File processed successfully. Ready for message.",
      data: {
        fileUrl: fileUrl,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });
  } catch (error) {
    console.error(
      "[MessagingController] Error during uploadProjectFile processing:",
      error
    );
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error(
          "[MessagingController] Failed to delete orphaned upload during error handling:",
          e
        );
      }
    }
    next(Object.assign(error, { status: error.status || 500 }));
  }
});

// --- ADMIN-SPECIFIC MESSAGING FUNCTIONS ---

/**
 * @desc    Admin: Get messages for a specific project
 * @route   GET /api/admin-messages/project/:projectId (This route needs to be defined in your admin routes)
 * @access  Private (Admin)
 */
export const adminGetProjectMessages = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  const { page = 1, limit = 50 } = req.query;
  // Admin role is assumed to be checked by `isAdmin` middleware

  if (!projectId) {
    res.status(400);
    throw new Error("Project ID is required.");
  }

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  if (
    isNaN(parsedPage) ||
    isNaN(parsedLimit) ||
    parsedLimit <= 0 ||
    parsedPage <= 0
  ) {
    res.status(400);
    throw new Error("Invalid pagination parameters.");
  }

  try {
    const { count, rows: messages } = await Message.findAndCountAll({
      where: { projectId: projectId },
      include: [
        {
          model: User,
          as: "sender", // This 'as' alias must match your Message model association
          attributes: ["id", "username", "profilePictureUrl"],
          required: false, // false to keep messages even if sender user is deleted
        },
      ],
      order: [["createdAt", "ASC"]],
      limit: parsedLimit,
      offset: offset,
      distinct: true,
    });

    const formattedMessages = messages.map((msgInstance) => {
      const msg = msgInstance.toJSON();
      if (!msg.sender) {
        // Handle case where sender might be null
        msg.sender = {
          id: msg.senderId,
          username: `User ${msg.senderId || "Unknown"}`,
          profilePictureUrl: null,
        };
      }
      return msg;
    });

    res.status(200).json({
      success: true,
      messages: formattedMessages, // Frontend AdminProjectChatViewer expects 'messages'
      currentPage: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      count: count,
    });
  } catch (error) {
    console.error(
      `ADMIN MSG CTRL: Error fetching messages for project ${projectId}:`,
      error
    );
    res.status(500);
    throw new Error(
      process.env.NODE_ENV === "development"
        ? error.message
        : "Server error: Could not fetch project messages."
    );
  }
});

/**
 * @desc    Admin: Delete a message
 * @route   DELETE /api/admin-messages/:messageId (This route needs to be defined in your admin routes)
 * @access  Private (Admin)
 */
export const adminDeleteMessage = asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;
  const adminUser = req.user; // From 'protect' and 'isAdmin' middleware

  // Admin role is assumed to be checked by `isAdmin` middleware.
  // `protect` ensures req.user exists.
  if (!adminUser || !adminUser.id) {
    res.status(401);
    throw new Error("Not authorized or user information missing.");
  }
  console.log(
    `ADMIN MSG CTRL: Admin ${adminUser.id} (Role: ${adminUser.role}) attempting to delete message ${messageId}`
  );

  const message = await Message.findByPk(messageId);

  if (!message) {
    res.status(404);
    throw new Error("Message not found.");
  }

  const projectId = message.projectId; // Get projectId BEFORE destroying the message

  await message.destroy(); // Deletes the message from the database

  console.log(
    `ADMIN MSG CTRL: Message ${messageId} (Project ID: ${projectId}) deleted by Admin ${adminUser.id}.`
  );

  const io = getIo(); // Get the shared io instance from socketManager.js
  if (io && projectId) {
    const roomName = getRoomName(projectId);
    if (roomName) {
      io.to(roomName).emit("messageDeleted", {
        messageId: messageId,
        projectId: projectId,
        deletedBy: adminUser.id,
      });
      console.log(
        `ADMIN MSG CTRL: Emitted 'messageDeleted' to room ${roomName} for message ${messageId}`
      );
    } else {
      console.warn(
        `ADMIN MSG CTRL: Could not determine room name for project ID ${projectId}. Socket event not sent.`
      );
    }
  } else {
    if (!io) console.warn("ADMIN MSG CTRL: Socket.io instance not available.");
    if (!projectId)
      console.warn("ADMIN MSG CTRL: ProjectId not available from message.");
    console.warn("ADMIN MSG CTRL: Cannot emit 'messageDeleted'.");
  }

  res
    .status(200)
    .json({ success: true, message: "Message deleted successfully by admin." });
});
