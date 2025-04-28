// backend/controllers/adminController.js
import db from "../models/index.js"; // Ensure path is correct and all models are loaded
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";

// Destructure all necessary models used in this controller
const {
  User,
  Publication,
  Project,
  Member,
  Message,
  sequelize /*, AuditLog */,
} = db;

// --- Helper Functions ---
async function safeCount(model, options = {}) {
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

// --- Dashboard Stats Controller ---
export const getDashboardStats = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: getDashboardStats invoked by Admin ${req.user.id}`);
  try {
    if (!User || !Publication || !Project) {
      throw new Error("Required models not available");
    }
    // Ensure counts align with the response structure indices
    const counts = await Promise.all([
      safeCount(User), // Index 0: Total users
      safeCount(User, { where: { status: "approved" } }), // Index 1: Approved users
      safeCount(User, { where: { status: "pending" } }), // Index 2: Pending users
      safeCount(Publication), // Index 3: Total publications
      safeCount(Project), // Index 4: Total projects
      safeCount(Project, { where: { status: "active" } }), // Index 5: Active projects
      safeCount(User, { where: { role: "admin" } }), // Index 6: Admin users
    ]);
    const [recentUsers, recentPublications, recentProjects] = await Promise.all(
      [
        safeFindAll(User, {
          attributes: [
            "id",
            "username",
            "email",
            "role",
            "status",
            "createdAt",
          ],
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
        // Add fetch for recent projects if needed by dashboard
        safeFindAll(Project, {
          attributes: ["id", "title", "status", "createdAt", "ownerId"],
          order: [["createdAt", "DESC"]],
          limit: 5,
        }),
      ]
    );
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
        projects: recentProjects,
      }, // Include projects
    };
    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("ADMIN API Error in getDashboardStats:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load dashboard data" });
  }
});

// --- Admin Publications Controller ---
export const getAdminPublications = asyncHandler(async (req, res) => {
  console.log(
    `ADMIN API: getAdminPublications invoked by Admin ${req.user.id}`
  );
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
    console.error("ADMIN API Error fetching publications:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching publications." });
  }
});

// --- *** NEW: Admin Get All Projects Controller *** ---
/**
 * @desc    Admin: Get all projects (paginated, searchable)
 * @route   GET /api/admin/projects
 * @access  Private (Admin Only)
 */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: adminGetAllProjects invoked by Admin ${req.user.id}`);
  try {
    const { status, search, page = 1, limit = 20 } = req.query; // Default limit for admin view
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        // Add search by owner username if needed (requires join)
      ];
    }

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

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: [
        "id",
        "title",
        "status",
        "ownerId",
        "createdAt",
        "updatedAt",
      ], // Select specific fields
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields, // Public owner info
          required: false, // LEFT JOIN
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });

    console.log(
      `ADMIN: Found ${count} projects total, returning page ${parsedPage} (${projects.length} items).`
    );
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: projects, // Send the projects array
    });
  } catch (error) {
    console.error("ADMIN API Error fetching all projects:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching projects." });
  }
});
// --- *** END: Admin Get All Projects Controller *** ---

// --- Admin Message Management Controllers ---

/**
 * @desc    Admin: Get all messages for a specific project chat (paginated)
 * @route   GET /api/admin/messages/project/:projectId
 * @access  Private (Admin Only)
 */
export const adminGetProjectMessages = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminGetProjectMessages for Project ${projectIdParam} by Admin ${adminUserId}`
  );
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "title"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    const { page = 1, limit = 50 } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    if (
      isNaN(parsedLimit) ||
      parsedLimit <= 0 ||
      isNaN(parsedPage) ||
      parsedPage <= 0
    ) {
      res.status(400);
      throw new Error("Invalid pagination.");
    }
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { projectId: projectId },
      include: [
        { model: User, as: "sender", attributes: userPublicSelectFields },
      ],
      order: [["createdAt", "DESC"]], // Newest first for admin typically
      limit: parsedLimit,
      offset,
      distinct: true,
    });

    console.log(
      `ADMIN: Fetched ${messages.length}/${count} messages page ${parsedPage} for project ${projectId}.`
    );
    res.status(200).json({
      success: true,
      projectTitle: project.title,
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      messages: messages,
    });
  } catch (error) {
    console.error(`ADMIN API Error in adminGetProjectMessages:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error fetching messages.",
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
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminDeleteMessage for Msg ${messageIdParam} by Admin ${adminUserId}`
  );
  const messageId = parseInt(messageIdParam, 10);
  if (isNaN(messageId) || messageId <= 0) {
    res.status(400);
    throw new Error("Invalid message ID format.");
  }

  try {
    const message = await Message.findByPk(messageId, {
      attributes: ["id", "projectId", "senderId", "content"],
    });
    if (!message) {
      res.status(404);
      throw new Error("Message not found.");
    }
    const projectId = message.projectId;

    // Optional: Audit Logging
    console.log(
      `AUDIT LOG Placeholder: Admin ${adminUserId} deleting Message ${messageId} (Project ${projectId}, Sender ${message.senderId}).`
    );
    // if (AuditLog) { await AuditLog.create({ ... }); }

    await message.destroy();
    console.log(
      `Message ${messageId} deleted successfully by Admin ${adminUserId}.`
    );

    // Emit real-time update
    const io = req.app.get("socketio");
    if (io) {
      const room = `project-${projectId}`;
      const deletePayload = { messageId: messageId, projectId: projectId };
      console.log(`Emitting 'messageDeleted' to room ${room}:`, deletePayload);
      io.to(room).emit("messageDeleted", deletePayload);
    } else {
      console.warn("Socket.IO instance not found, cannot emit delete.");
    }

    res
      .status(200)
      .json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error(`ADMIN API Error deleting Message ${messageIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error deleting message.",
    });
  }
});

// --- Add other admin controller functions below ---
