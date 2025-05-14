// backend/controllers/messagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";
import fs from "fs"; // For file system operations like unlinking on error
import path from "path"; // Often useful, though not strictly for fileUrl here

const { User, Project, Member, Message } = db;

// --- Helper: Check if user is member of a project ---
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

// --- getProjectChatList function (Using your existing logic) ---
export const getProjectChatList = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!Project || !Member) {
    console.error(
      "[MessagingController] Server Config Error: Project/Member model not loaded for getProjectChatList."
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
          include: [{ model: User, as: "sender", attributes: ["username"] }],
        });

        let lastMessageSnippet = "No messages yet...";
        if (lastMessage) {
          if (lastMessage.messageType === "file") {
            lastMessageSnippet = `File: ${
              lastMessage.fileName || "attachment"
            }`;
          } else {
            lastMessageSnippet = lastMessage.content;
          }
          if (lastMessage.senderId !== currentUserId && lastMessage.sender) {
            lastMessageSnippet = `${lastMessage.sender.username}: ${lastMessageSnippet}`;
          } else if (lastMessage.senderId === currentUserId) {
            lastMessageSnippet = `You: ${lastMessageSnippet}`;
          }
        }

        // TODO: Implement actual unread count logic. This is a placeholder.
        const unreadCount = 0;

        return {
          projectId: project.id,
          projectName: project.title,
          lastMessageSnippet:
            lastMessageSnippet.substring(0, 50) +
            (lastMessageSnippet.length > 50 ? "..." : ""), // Truncate snippet
          lastMessageAt: lastMessage ? lastMessage.createdAt : null,
          unreadCount: unreadCount,
        };
      })
    );

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

// --- getProjectChatHistory function (Using your existing logic) ---
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

    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (limit <= 0 || offset < 0) {
      res.status(400);
      throw new Error("Invalid pagination parameters (limit/offset).");
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
    res.status(200).json({ success: true, data: messages });
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

// --- File Upload Controller ---
export const uploadProjectFile = asyncHandler(async (req, res, next) => {
  // Added next for cleaner error passing
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
    const fileUrl = `/uploads/project_files/${file.filename}`;

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
    // Catch errors from isUserMemberOfProject or other async operations
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
    // Pass error to the global error handler
    next(Object.assign(error, { status: error.status || 500 }));
  }
});
