// backend/controllers/adminController.js
import db from "../models/index.js"; // Ensure path is correct and all models are loaded
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";

// Destructure all necessary models
const {
  User,
  Publication,
  Project,
  Member,
  Message,
  sequelize /*, AuditLog */,
} = db;

// --- Helper Functions (Keep as is) ---
async function safeCount(model, options = {}) {
  /* ... */
  try {
    if (!model?.count) return 0;
    const count = await model.count(options);
    return Number.isInteger(count) ? count : 0;
  } catch (error) {
    console.error(`Count Error ${model?.name || "?"}:`, error);
    return 0;
  }
}
async function safeFindAll(model, options = {}) {
  /* ... */
  try {
    if (!model?.findAll) return [];
    const results = await model.findAll(options);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error(`FindAll Error ${model?.name || "?"}:`, error);
    return [];
  }
}
const userPublicSelectFields = ["id", "username", "profilePictureUrl"]; // Reusable public fields

// --- Dashboard Stats Controller (Keep as is) ---
export const getDashboardStats = asyncHandler(async (req, res) => {
  /* ... */
  try {
    if (!User || !Publication || !Project) {
      throw new Error("Models not available");
    }
    const counts = await Promise.all([
      safeCount(User),
      safeCount(User, { where: { status: "approved" } }),
      safeCount(User, { where: { status: "pending" } }),
      safeCount(Publication),
      safeCount(Project),
      safeCount(Project, { where: { status: "active" } }),
      safeCount(User, { where: { role: "admin" } }),
    ]);
    const [recentUsers, recentPublications] = await Promise.all([
      safeFindAll(User, {
        attributes: ["id", "username", "email", "role", "status", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
      safeFindAll(Publication, {
        attributes: [
          "id",
          "title",
          "author",
          "collaborationStatus",
          "createdAt",
        ],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "username"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);
    const responseData = {
      counts: {
        users: {
          total: counts[0],
          active: counts[1],
          pending: counts[2],
          admins: counts[6],
        },
        publications: { total: counts[3] },
        projects: { total: counts[4], active: counts[5] },
      },
      recentActivities: {
        users: recentUsers,
        publications: recentPublications,
      },
    };
    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Failed dashboard data" });
  }
});

// --- Admin Publications Controller (Keep as is) ---
export const getAdminPublications = asyncHandler(async (req, res) => {
  /* ... */
  const page = parseInt(req.query.page, 10) || 1,
    limit = parseInt(req.query.limit, 10) || 15,
    sortBy = req.query.sortBy || "createdAt",
    sortOrder = req.query.sortOrder || "desc",
    offset = (page - 1) * limit;
  const allowedSortBy = [
    "id",
    "title",
    "author",
    "ownerId",
    "area",
    "publicationDate",
    "collaborationStatus",
    "createdAt",
    "updatedAt",
  ];
  if (!allowedSortBy.includes(sortBy)) {
    res.status(400);
    throw new Error(`Invalid sortBy.`);
  }
  if (!["asc", "desc"].includes(sortOrder.toLowerCase())) {
    res.status(400);
    throw new Error(`Invalid sortOrder.`);
  }
  if (!Publication || !User) {
    throw new Error("Models not available.");
  }
  try {
    const { count, rows } = await Publication.findAndCountAll({
      attributes: [
        "id",
        "title",
        "summary",
        "author",
        "ownerId",
        "document_link",
        "tags",
        "area",
        "publicationDate",
        "collaborationStatus",
        "createdAt",
        "updatedAt",
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        { model: User, as: "owner", attributes: ["id", "username", "email"] },
      ],
      distinct: true,
    });
    const paginationData = {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
    };
    res
      .status(200)
      .json({ success: true, data: rows, pagination: paginationData });
  } catch (error) {
    console.error("Admin Pub fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching publications." });
  }
});

// --- *** NEW: Admin Message Management Controllers *** ---

/**
 * @desc    Admin: Get all messages for a specific project chat (paginated)
 * @route   GET /api/admin/messages/project/:projectId
 * @access  Private (Admin Only)
 */
export const adminGetProjectMessages = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const adminUserId = req.user.id; // Admin performing the action

  console.log(
    `ADMIN API: adminGetProjectMessages invoked for Project ${projectIdParam} by Admin ${adminUserId}`
  );

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    // 1. Verify Project Exists (Optional but good practice)
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "title"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    // 2. Fetch messages (Admin bypasses membership check)
    const { page = 1, limit = 50 } = req.query; // Add pagination
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    if (
      isNaN(parsedLimit) ||
      parsedLimit <= 0 ||
      isNaN(parsedPage) ||
      parsedPage <= 0
    ) {
      res.status(400);
      throw new Error("Invalid pagination parameters.");
    }
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { projectId: projectId }, // Filter by project
      include: [
        {
          // Include sender details
          model: User,
          as: "sender", // Use alias defined in Message.associate
          attributes: userPublicSelectFields, // Use public fields
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest first for admin view usually
      limit: parsedLimit,
      offset,
      distinct: true, // Needed for accurate count with includes
    });

    console.log(
      `Admin ${adminUserId} fetched ${messages.length} messages (page ${parsedPage}) for project ${projectId}. Total: ${count}`
    );
    res.status(200).json({
      success: true,
      projectTitle: project.title, // Provide context
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      messages: messages, // Send the messages array
    });
  } catch (error) {
    console.error(
      `ADMIN API Error in adminGetProjectMessages for Project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error fetching project messages.",
    });
  }
});

/**
 * @desc    Admin: Delete a specific message by its ID
 * @route   DELETE /api/admin/messages/:messageId
 * @access  Private (Admin Only)
 */
export const adminDeleteMessage = asyncHandler(async (req, res) => {
  const messageIdParam = req.params.messageId;
  const adminUserId = req.user.id; // Admin performing the action

  console.log(
    `ADMIN API: adminDeleteMessage invoked for Message ID ${messageIdParam} by Admin ${adminUserId}`
  );

  const messageId = parseInt(messageIdParam, 10);
  if (isNaN(messageId) || messageId <= 0) {
    res.status(400);
    throw new Error("Invalid message ID format.");
  }

  try {
    // 1. Find the message
    const message = await Message.findByPk(messageId, {
      attributes: ["id", "projectId", "senderId", "content"], // Get info needed before deleting
    });
    if (!message) {
      res.status(404);
      throw new Error("Message not found.");
    }

    const projectId = message.projectId; // Store projectId for socket emit

    // 2. Optional (Recommended): Audit Logging
    console.log(
      `AUDIT LOG Placeholder: Admin ${adminUserId} deleting Message ${messageId} (Project ${projectId}, Sender ${message.senderId}).`
    );
    /*
        if (AuditLog) { // Check if AuditLog model exists/is configured
            await AuditLog.create({
                adminUserId: adminUserId,
                actionType: 'DELETE_MESSAGE',
                targetType: 'Message',
                targetId: messageId,
                details: { projectId, senderId: message.senderId, contentSnippet: message.content.substring(0, 100) },
                timestamp: new Date()
            });
        }
        */

    // 3. Delete the message from the database
    await message.destroy();
    console.log(
      `Message ${messageId} deleted successfully by Admin ${adminUserId}.`
    );

    // 4. Emit a real-time event for UI updates
    const io = req.app.get("socketio"); // Access Socket.IO instance (ensure it's set in server.js)
    if (io) {
      const room = `project-${projectId}`;
      const deletePayload = { messageId: messageId, projectId: projectId };
      console.log(`Emitting 'messageDeleted' to room ${room}:`, deletePayload);
      io.to(room).emit("messageDeleted", deletePayload); // Notify clients in that project room
    } else {
      console.warn(
        "Socket.IO instance ('socketio') not found on app object. Cannot emit real-time delete update."
      );
    }

    // 5. Respond to the Admin request
    res
      .status(200)
      .json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error(
      `ADMIN API Error in adminDeleteMessage for Message ${messageIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error deleting message.",
    });
  }
});

// --- *** END: Admin Message Management Controllers *** ---

// --- Add other admin controller functions here if needed ---
// e.g., adminGetAllProjects, adminDeleteProject, adminUpdatePublicationStatus, etc.
