// backend/controllers/adminController.js
import db from "../models/index.js"; // Ensure path is correct and all models are loaded
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";

// Destructure all necessary models used in this controller
// *** ADD 'Setting' Model if using database approach ***
const {
  User,
  Publication,
  Project,
  Member,
  Message,
  Setting,
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
const userPublicSelectFields = ["id", "username", "profilePictureUrl"];

// Default settings structure - used if DB record doesn't exist yet
const defaultSettings = {
  siteName: "Research Platform",
  allowPublicSignup: true,
  maintenanceMode: false,
  defaultUserRole: "user",
  emailNotifications: true,
  itemsPerPage: 10,
  themeColor: "#3b82f6",
};

// --- Dashboard Stats Controller ---
export const getDashboardStats = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: getDashboardStats invoked by Admin ${req.user.id}`);
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
      },
    };
    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("ADMIN API Error in getDashboardStats:", error);
    res.status(500).json({ success: false, message: "Failed dashboard data" });
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
    throw new Error("Invalid sortBy.");
  }
  if (!["asc", "desc"].includes(sortOrder.toLowerCase())) {
    res.status(400);
    throw new Error("Invalid sortOrder.");
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

// --- Admin Projects Controller ---
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: adminGetAllProjects invoked by Admin ${req.user.id}`);
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
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
      throw new Error("Invalid pagination.");
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
      ],
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });
    console.log(
      `ADMIN: Found ${count} projects total, returning page ${parsedPage} (${projects.length}).`
    );
    res
      .status(200)
      .json({
        success: true,
        count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        data: projects,
      });
  } catch (error) {
    console.error("ADMIN API Error fetching all projects:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching projects." });
  }
});

// --- Admin Message Controllers ---
export const adminGetProjectMessages = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminGetProjectMessages for Project ${projectIdParam} by Admin ${adminUserId}`
  );
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID.");
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
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });
    console.log(
      `ADMIN: Fetched ${messages.length}/${count} messages page ${parsedPage} for project ${projectId}.`
    );
    res
      .status(200)
      .json({
        success: true,
        projectTitle: project.title,
        count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        messages: messages,
      });
  } catch (error) {
    console.error(`ADMIN API Error adminGetProjectMessages:`, error);
    const sc = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(sc)
      .json({ success: false, message: error.message || "Server error." });
  }
});
export const adminDeleteMessage = asyncHandler(async (req, res) => {
  const messageIdParam = req.params.messageId;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminDeleteMessage for Msg ${messageIdParam} by Admin ${adminUserId}`
  );
  const messageId = parseInt(messageIdParam, 10);
  if (isNaN(messageId) || messageId <= 0) {
    res.status(400);
    throw new Error("Invalid message ID.");
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
    console.log(
      `AUDIT Placeholder: Admin ${adminUserId} deleting Msg ${messageId} (Project ${projectId})`
    );
    // if (AuditLog) { await AuditLog.create({ ... }); }
    await message.destroy();
    console.log(`Message ${messageId} deleted by Admin ${adminUserId}.`);
    const io = req.app.get("socketio");
    if (io) {
      const room = `project-${projectId}`;
      const payload = { messageId: messageId, projectId: projectId };
      console.log(`Emitting 'messageDeleted' to room ${room}:`, payload);
      io.to(room).emit("messageDeleted", payload);
    } else {
      console.warn("Socket.IO not found, cannot emit delete.");
    }
    res.status(200).json({ success: true, message: "Message deleted." });
  } catch (error) {
    console.error(`ADMIN API Error deleting Msg ${messageIdParam}:`, error);
    const sc = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(sc)
      .json({ success: false, message: error.message || "Server error." });
  }
});

// --- *** NEW: Admin Settings Controllers *** ---

/**
 * @desc    Admin: Get current application settings
 * @route   GET /api/admin/settings
 * @access  Private (Admin Only)
 */
export const getAdminSettings = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id;
  console.log(`ADMIN API: getAdminSettings invoked by Admin ${adminUserId}`);

  // Ensure the Setting model is loaded
  if (!Setting) {
    console.error(
      "ADMIN Settings Error: Setting model not found. Ensure it's defined and loaded via db index."
    );
    throw new Error("Server configuration error: Settings model unavailable.");
  }

  try {
    // Attempt to find the settings record (assuming only one row, e.g., with id=1 or a specific key)
    // Adjust 'where' clause if you have multiple setting groups
    let settingsRecord = await Setting.findOne({ where: { id: 1 } }); // Example: Find by primary key 1

    let settingsData;

    if (!settingsRecord) {
      console.warn(
        "ADMIN Settings: No settings record found in DB, creating/returning defaults."
      );
      // Option 1: Create default settings if they don't exist
      // settingsRecord = await Setting.create({ ...defaultSettings, id: 1 }); // Ensure ID is set if using findByPk(1) later
      // settingsData = settingsRecord.toJSON();

      // Option 2: Just return defaults without creating in DB yet
      settingsData = { ...defaultSettings }; // Return a copy
    } else {
      settingsData = settingsRecord.toJSON(); // Convert Sequelize instance to plain object
    }

    // Ensure all default keys are present in the response, even if null in DB
    const dataToSend = { ...defaultSettings, ...settingsData };

    console.log("ADMIN: Returning current settings.");
    // Return the combined settings data
    res.status(200).json(dataToSend); // Send the settings object directly
  } catch (error) {
    console.error(`ADMIN API Error in getAdminSettings:`, error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Server error fetching settings.",
      });
  }
});

/**
 * @desc    Admin: Update application settings
 * @route   PUT /api/admin/settings
 * @access  Private (Admin Only)
 */
export const updateAdminSettings = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id;
  const updatedSettings = req.body; // Get settings fields to update from request body

  console.log(
    `ADMIN API: updateAdminSettings invoked by Admin ${adminUserId} with data:`,
    updatedSettings
  );

  if (!Setting) {
    throw new Error("Server configuration error: Settings model unavailable.");
  }

  // --- Input Validation (Example - Expand as needed) ---
  const validatedUpdates = {};
  const allowedKeys = Object.keys(defaultSettings); // Use keys from default object

  for (const key of allowedKeys) {
    if (updatedSettings.hasOwnProperty(key)) {
      // Check if key was sent in request
      const value = updatedSettings[key];
      // Basic type checks based on default settings structure
      if (
        key === "itemsPerPage" &&
        (typeof value !== "number" || !Number.isInteger(value) || value < 1)
      ) {
        res.status(400);
        throw new Error(
          `Invalid value for ${key}. Must be a positive integer.`
        );
      }
      if (
        typeof defaultSettings[key] === "boolean" &&
        typeof value !== "boolean"
      ) {
        res.status(400);
        throw new Error(`Invalid value for ${key}. Must be true or false.`);
      }
      if (
        typeof defaultSettings[key] === "string" &&
        typeof value !== "string"
      ) {
        res.status(400);
        throw new Error(`Invalid value for ${key}. Must be a string.`);
      }
      // Add more specific validation (e.g., themeColor format, defaultUserRole options)
      validatedUpdates[key] = value;
    }
  }

  if (Object.keys(validatedUpdates).length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "No valid settings fields provided for update.",
      });
  }
  // --- End Validation ---

  try {
    // Find or Create the settings record (using findOrCreate is robust)
    const [settingsRecord, created] = await Setting.findOrCreate({
      where: { id: 1 }, // Assuming single settings row with id 1
      defaults: { ...defaultSettings, ...validatedUpdates, id: 1 }, // Provide defaults if creating
    });

    if (!created) {
      // If record existed, update it with the validated fields
      await settingsRecord.update(validatedUpdates);
    }

    // --- Optional: Audit Logging ---
    console.log(
      `AUDIT LOG Placeholder: Admin ${adminUserId} updated settings:`,
      validatedUpdates
    );
    // if(AuditLog) { await AuditLog.create({ adminUserId, actionType: 'UPDATE_SETTINGS', details: validatedUpdates }); }

    console.log("ADMIN: Settings updated successfully in DB.");

    // Fetch the latest settings to return the complete, updated object
    const latestSettings = await Setting.findByPk(1); // Fetch the updated record
    const dataToSend = latestSettings
      ? { ...defaultSettings, ...latestSettings.toJSON() }
      : { ...defaultSettings };

    res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      data: dataToSend, // Return the full updated settings object
    });
  } catch (error) {
    console.error(`ADMIN API Error in updateAdminSettings:`, error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message).join(". ");
      res.status(400).json({ success: false, message: messages });
    } else {
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      res
        .status(statusCode)
        .json({
          success: false,
          message: error.message || "Server error updating settings.",
        });
    }
  }
});
// --- *** END: Admin Settings Controllers *** ---

// --- Add other admin controller functions below ---
