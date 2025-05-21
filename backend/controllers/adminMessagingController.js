// backend/controllers/adminMessagingController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path to your Sequelize models (e.g., ../../models if controller is deeper)
import { getIo } from "../config/socketSetup.js"; // Adjust path to your socketSetup.js

const { User, Message, Project } = db; // Ensure these models are correctly imported and defined in your db object

// Helper function to create consistent room names for Socket.IO
const getRoomNameForProject = (projectId) =>
  projectId ? `project-${projectId}` : null;

/**
 * @desc    Admin: Get messages for a specific project
 * @route   GET /api/admin-messages/project/:projectId  (as defined in adminMessageRoutes.js)
 * @access  Private (Admin - route is protected by 'protect' and 'isAdmin' middleware)
 */
export const adminGetProjectMessages = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  const { page = 1, limit = 50 } = req.query; // Default pagination values

  // Admin role is assumed to have been verified by the 'isAdmin' middleware
  // The 'protect' middleware ensures req.user is populated

  if (!projectId) {
    res.status(400); // Bad Request
    throw new Error("Project ID parameter is required.");
  }

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  if (
    isNaN(parsedPage) ||
    isNaN(parsedLimit) ||
    parsedLimit <= 0 ||
    parsedPage <= 0
  ) {
    res.status(400); // Bad Request
    throw new Error(
      "Invalid pagination parameters (page/limit must be positive numbers)."
    );
  }
  const offset = (parsedPage - 1) * parsedLimit; // Calculate offset for Sequelize

  try {
    // Optional: Check if the project actually exists
    const projectExists = await Project.findByPk(projectId, {
      attributes: ["id"],
    });
    if (!projectExists) {
      res.status(404); // Not Found
      throw new Error("Project not found.");
    }

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { projectId: projectId },
      include: [
        {
          model: User,
          as: "sender", // This 'as' alias MUST match your Message model's association to User
          attributes: ["id", "username", "profilePictureUrl"], // Select specific user fields
          required: false, // Use `false` for a LEFT JOIN to keep messages even if the sender user account was deleted
        },
      ],
      order: [["createdAt", "ASC"]], // Chat history is typically viewed oldest messages first
      limit: parsedLimit,
      offset: offset,
      distinct: true, // Recommended when using 'include' with 'limit' to ensure correct count
    });

    // Format messages to ensure a consistent sender object, especially if a sender user was deleted
    const formattedMessages = messages.map((msgInstance) => {
      const msg = msgInstance.toJSON(); // Get a plain JavaScript object from the Sequelize instance
      if (!msg.sender && msg.senderId) {
        // If sender association didn't load (e.g., user deleted) but senderId exists
        msg.sender = {
          id: msg.senderId,
          username: `User ${msg.senderId}`,
          profilePictureUrl: null,
        };
      } else if (!msg.sender && !msg.senderId) {
        // If no senderId at all (shouldn't happen for valid messages)
        msg.sender = {
          id: null,
          username: `System or Unknown`,
          profilePictureUrl: null,
        };
      }
      return msg;
    });

    res.status(200).json({
      success: true,
      messages: formattedMessages, // The frontend AdminProjectChatViewer expects an array under 'messages'
      currentPage: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      count: count,
    });
  } catch (error) {
    console.error(
      `ADMIN_MSG_CTRL: Error fetching messages for project ${projectId} by admin:`,
      error
    );
    // Use the error's status if it's a client error (4xx), otherwise default to 500
    const statusCode =
      error.status && error.status < 500
        ? error.status
        : res.statusCode >= 400
        ? res.statusCode
        : 500;
    // Avoid sending detailed internal error messages in production for 500-level errors
    const message =
      process.env.NODE_ENV === "development" || statusCode < 500
        ? error.message
        : "Server error: Could not fetch project messages.";
    if (!res.headersSent)
      res.status(statusCode).json({ success: false, message });
  }
});

/**
 * @desc    Admin: Delete a message
 * @route   DELETE /api/admin-messages/:messageId (as defined in adminMessageRoutes.js)
 * @access  Private (Admin - route is protected by 'protect' and 'isAdmin' middleware)
 */
export const adminDeleteMessage = asyncHandler(async (req, res) => {
  const messageId = req.params.messageId;
  const adminUser = req.user; // Populated by 'protect' middleware

  // The 'isAdmin' middleware should have already verified the user's role.
  // The 'protect' middleware ensures req.user is populated.
  if (!adminUser || !adminUser.id) {
    // This check is largely redundant if 'protect' & 'isAdmin' are correctly implemented and used on the route
    res.status(401); // Unauthorized
    throw new Error(
      "Not authorized or admin user information missing from request token."
    );
  }
  console.log(
    `ADMIN_MSG_CTRL: Admin ${adminUser.id} (Role: ${
      adminUser.role || "N/A"
    }) attempting to delete message ID: ${messageId}`
  );

  const message = await Message.findByPk(messageId);

  if (!message) {
    res.status(404); // Not Found
    throw new Error(`Message with ID ${messageId} not found.`);
  }

  const projectId = message.projectId; // Crucial: Get projectId BEFORE destroying the message instance

  await message.destroy(); // This performs the actual deletion from the database

  console.log(
    `ADMIN_MSG_CTRL: Message ${messageId} (belonging to Project ID: ${projectId}) successfully deleted by Admin ${adminUser.id}.`
  );

  // Emit a WebSocket event to notify all connected clients in that project's room
  const io = getIo(); // Retrieve the initialized Socket.IO instance from your socketSetup.js
  if (io && projectId) {
    const roomName = getRoomNameForProject(projectId); // Use helper for consistent room naming
    if (roomName) {
      io.to(roomName).emit("messageDeleted", {
        // Event name must match frontend listener
        messageId: messageId, // The ID of the message that was deleted
        projectId: projectId, // The project this message belonged to (for client-side filtering)
        deletedBy: adminUser.id, // Optional: ID of the admin who performed the deletion
      });
      console.log(
        `ADMIN_MSG_CTRL: Emitted 'messageDeleted' event to Socket.IO room '${roomName}' for message ID ${messageId}`
      );
    } else {
      // This should ideally not happen if projectId is valid
      console.warn(
        `ADMIN_MSG_CTRL: Could not determine room name for project ID ${projectId}. Socket event 'messageDeleted' not sent.`
      );
    }
  } else {
    // Log warnings if socket emission cannot proceed
    if (!io)
      console.warn(
        "ADMIN_MSG_CTRL: Socket.io instance is not available. 'messageDeleted' event not sent."
      );
    if (!projectId)
      console.warn(
        `ADMIN_MSG_CTRL: ProjectId not available from deleted message (ID: ${messageId}). 'messageDeleted' event not sent.`
      );
  }

  // Respond to the HTTP request with success
  // HTTP 204 No Content is also conventional for successful DELETE operations that don't return a body.
  // However, a 200 with a success message is also common and can be helpful for clients.
  res
    .status(200)
    .json({ success: true, message: "Message deleted successfully by admin." });
});
