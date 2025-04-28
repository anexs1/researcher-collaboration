// backend/controllers/messagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Assuming index.js exports all models in 'db'
import { Op } from "sequelize";

// Destructure models for easier access
const { User, Project, Member, Message } = db; // Add any other needed models like CollaborationRequest if used

/**
 * @desc    Get list of projects the user is an active member/owner of (for chat list)
 * @route   GET /api/messaging/projects
 * @access  Private
 */
export const getProjectChatList = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id; // Assumes 'protect' middleware adds user to req

  console.log(`API: getProjectChatList invoked by user ${currentUserId}`);

  if (!currentUserId) {
    res.status(401); // Unauthorized
    throw new Error("Authentication required.");
  }
  if (!Project || !Member) {
    console.error(
      "Server Configuration Error: Project or Member model not loaded."
    );
    res.status(500);
    throw new Error(
      "Server configuration error: Required models not available."
    );
  }

  try {
    // Find all project IDs where the user is an ACTIVE member
    const userMemberships = await Member.findAll({
      where: {
        userId: currentUserId,
        status: "active", // Only include projects where the user is an active member
      },
      attributes: ["projectId"], // Select only the project ID
      raw: true, // Return plain data objects
    });
    const memberProjectIds = userMemberships.map((m) => m.projectId);
    console.log(
      `User ${currentUserId} is member of project IDs:`,
      memberProjectIds
    );

    // Find all project IDs owned by the user
    const ownedProjects = await Project.findAll({
      where: { ownerId: currentUserId },
      attributes: ["id"],
      raw: true,
    });
    const ownedProjectIds = ownedProjects.map((p) => p.id);
    console.log(`User ${currentUserId} owns project IDs:`, ownedProjectIds);

    // Combine owned and member project IDs, ensuring uniqueness
    const allRelevantProjectIds = [
      ...new Set([...memberProjectIds, ...ownedProjectIds]),
    ];

    if (allRelevantProjectIds.length === 0) {
      console.log(
        `User ${currentUserId} has no relevant projects for chat list.`
      );
      return res.status(200).json({ success: true, data: [] }); // Return empty list
    }

    // Fetch details (id, title) for these projects
    const projects = await Project.findAll({
      where: {
        id: { [Op.in]: allRelevantProjectIds },
      },
      attributes: ["id", "title"], // Only fetch necessary fields for the list
      order: [["title", "ASC"]], // Order projects alphabetically by title
    });

    // Format the data for the frontend response
    const projectChatList = projects.map((project) => ({
      projectId: project.id,
      projectName: project.title,
      // Placeholder for future enhancement:
      // lastMessage: null, // Could fetch last message snippet later
      // unreadCount: 0,    // Could calculate unread count later
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
    // Avoid sending detailed error messages in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "Server error fetching project chat list.";
    res.status(500).json({ success: false, message: message });
  }
});

/**
 * @desc    Get chat history for a specific project
 * @route   GET /api/messaging/history/project/:projectId
 * @access  Private (User must be an active member or owner of the project)
 */
export const getProjectChatHistory = asyncHandler(async (req, res) => {
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
    console.error(
      "Server Configuration Error: Required models not loaded for chat history."
    );
    res.status(500);
    throw new Error("Server configuration error.");
  }

  try {
    // --- Authorization Check ---
    // 1. Check if the project exists and find its owner
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"],
    });
    if (!project) {
      res.status(404); // Not Found
      throw new Error("Project not found.");
    }

    // 2. Check if the current user is the owner
    const isOwner = project.ownerId === currentUserId;

    // 3. If not the owner, check if they are an active member
    let isMember = false;
    if (!isOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: "active", // Crucial: only active members can access chat
        },
        attributes: ["userId"], // Only need to know if it exists
      });
      isMember = !!membership; // True if a membership record was found
    }

    // 4. If neither owner nor active member, deny access
    if (!isOwner && !isMember) {
      console.warn(
        `Authorization Failed: User ${currentUserId} attempted to access chat for project ${projectId} without permission.`
      );
      res.status(403); // Forbidden
      throw new Error(
        "Access Denied: You are not authorized to view this project's chat."
      );
    }
    console.log(
      `Authorization Passed: User ${currentUserId} is authorized for project ${projectId} chat (Owner: ${isOwner}, Member: ${isMember}).`
    );
    // --- End Authorization Check ---

    // Pagination parameters
    const limit = parseInt(req.query.limit, 10) || 50; // Default to 50 messages per page
    const offset = parseInt(req.query.offset, 10) || 0; // Default to the first page
    if (limit <= 0 || offset < 0) {
      res.status(400);
      throw new Error("Invalid pagination parameters (limit/offset).");
    }

    // Fetch messages for the specified project
    const messages = await Message.findAll({
      where: {
        projectId: projectId, // Filter messages by the project ID
      },
      include: [
        {
          model: User,
          as: "sender", // Use the alias defined in Message.associate
          attributes: ["id", "username", "profilePictureUrl"], // Fetch necessary sender details
        },
        // Do NOT include the Project details here unless specifically needed
        // { model: Project, as: 'project', attributes: ['id', 'title'] } // Usually not needed
      ],
      order: [["createdAt", "ASC"]], // Fetch messages in chronological order (oldest first)
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
    // Handle specific errors like 403, 404 passed up via throw
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500; // Use status code set by throw if available
    const message = error.message || "Server error fetching chat history.";
    // Avoid sending detailed internal errors in production
    const responseMessage =
      statusCode === 500 && process.env.NODE_ENV !== "development"
        ? "Server error fetching chat history."
        : message;

    // Ensure response is only sent once
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});
