// backend/controllers/adminController.js
import db from "../models/index.js"; // Ensure path is correct and all models are loaded
import { Op, fn, col, literal } from "sequelize"; // Import necessary Sequelize functions
import asyncHandler from "express-async-handler";
import { format } from "date-fns"; // <<< IMPORTED date-fns format function

// Destructure all necessary models used in this controller
// Ensure 'Setting' is defined in models/index.js
// REMOVED 'Comment' assuming it's not currently used or the table doesn't exist
const {
  User,
  Publication,
  Project,
  Member,
  Message,
  Setting,
  sequelize /*, AuditLog */, // Comment model removed from destructuring
} = db;

// --- Helper Functions ---
// Safely count records, return 0 on error or if model is invalid
async function safeCount(model, options = {}) {
  // Added check if model itself is defined before trying to count
  if (!model || typeof model.count !== "function") {
    console.warn(
      `safeCount: Model invalid or missing 'count' method. Model: ${
        model?.name || "undefined"
      }`
    );
    return 0;
  }
  try {
    const count = await model.count(options);
    return Number.isInteger(count) ? count : 0;
  } catch (error) {
    // Log specific model name if available
    console.error(`Count Error [${model?.name || "?"}]:`, error.message); // Log only message for brevity maybe
    return 0;
  }
}
// Safely find all records, return empty array on error or if model is invalid
async function safeFindAll(model, options = {}) {
  // Added check if model itself is defined
  if (!model || typeof model.findAll !== "function") {
    console.warn(
      `safeFindAll: Model invalid or missing 'findAll' method. Model: ${
        model?.name || "undefined"
      }`
    );
    return [];
  }
  try {
    const results = await model.findAll(options);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error(`FindAll Error [${model?.name || "?"}]:`, error.message);
    return [];
  }
}
// Reusable list of public fields for user objects
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
      throw new Error("Required models not available");
    }
    // Removed Comment count from Promise.all
    const counts = await Promise.all([
      safeCount(User), // Index 0
      safeCount(User, { where: { status: "approved" } }), // Index 1
      safeCount(User, { where: { status: "pending" } }), // Index 2
      safeCount(Publication), // Index 3
      safeCount(Project), // Index 4
      safeCount(Project, { where: { status: "active" } }), // Index 5
      safeCount(User, { where: { role: "admin" } }), // Index 6
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
      `ADMIN: Found ${count} projects, returning page ${parsedPage}.`
    );
    res.status(200).json({
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
    res.status(200).json({
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
      console.log(`Emitting 'messageDeleted' to room ${room}`);
      io.to(room).emit("messageDeleted", payload);
    } else {
      console.warn("Socket.IO not found.");
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

// --- Admin Settings Controllers ---
export const getAdminSettings = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id;
  console.log(`ADMIN API: getAdminSettings by Admin ${adminUserId}`);
  if (!Setting) {
    throw new Error("Server config error: Settings model unavailable.");
  } // Ensure Setting model is loaded
  try {
    let settingsRecord = await Setting.findOne({ where: { id: 1 } }); // Assuming ID 1
    let settingsData = settingsRecord ? settingsRecord.toJSON() : {};
    const dataToSend = { ...defaultSettings, ...settingsData }; // Merge defaults with DB data
    console.log("ADMIN: Returning settings.");
    res.status(200).json(dataToSend);
  } catch (error) {
    console.error(`ADMIN API Error getAdminSettings:`, error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error." });
  }
});
export const updateAdminSettings = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id;
  const updatedSettings = req.body;
  console.log(`ADMIN API: updateAdminSettings by Admin ${adminUserId}`);
  if (!Setting) {
    throw new Error("Server config error: Settings model unavailable.");
  }
  // Basic Validation
  const validatedUpdates = {};
  const allowedKeys = Object.keys(defaultSettings);
  for (const key of allowedKeys) {
    if (updatedSettings.hasOwnProperty(key)) {
      const value = updatedSettings[key];
      /* Add type/value checks */ validatedUpdates[key] = value;
    }
  }
  if (Object.keys(validatedUpdates).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No valid fields." });
  }
  try {
    const [settingsRecord, created] = await Setting.findOrCreate({
      where: { id: 1 },
      defaults: { ...defaultSettings, ...validatedUpdates, id: 1 },
    });
    if (!created) {
      await settingsRecord.update(validatedUpdates);
    }
    console.log(`AUDIT Placeholder: Admin ${adminUserId} updated settings.`);
    const latestSettings = await Setting.findByPk(1);
    const dataToSend = latestSettings
      ? { ...defaultSettings, ...latestSettings.toJSON() }
      : { ...defaultSettings };
    res
      .status(200)
      .json({ success: true, message: "Settings updated.", data: dataToSend });
  } catch (error) {
    console.error(`ADMIN API Error updateAdminSettings:`, error);
    if (error.name === "SequelizeValidationError") {
      const msgs = error.errors.map((e) => e.message).join(". ");
      res.status(400).json({ success: false, message: msgs });
    } else {
      const sc = res.statusCode >= 400 ? res.statusCode : 500;
      res
        .status(sc)
        .json({ success: false, message: error.message || "Server error." });
    }
  }
});

// --- *** Report Controller Functions *** ---

/**
 * @desc    Admin: Get Summary Report Stats
 * @route   GET /api/admin/reports/summary
 */
export const getReportSummary = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: getReportSummary invoked by Admin ${req.user.id}`);
  try {
    // Removed Comment count, ensure safeCount checks model validity
    const [userCount, projectCount, pubCount] = await Promise.all([
      safeCount(User),
      safeCount(Project),
      safeCount(Publication),
    ]);
    res.status(200).json({
      success: true,
      data: {
        users: userCount,
        projects: projectCount,
        publications: pubCount,
      },
    });
  } catch (error) {
    console.error(`ADMIN API Error in getReportSummary:`, error);
    res.status(500).json({
      success: false,
      message: "Server error fetching summary report.",
    });
  }
});

/**
 * @desc    Admin: Get User Growth data
 * @route   GET /api/admin/reports/user-growth
 */
export const getReportUserGrowth = asyncHandler(async (req, res) => {
  let { startDate, endDate } = req.query;
  console.log(`ADMIN API: getReportUserGrowth invoked by Admin ${req.user.id}`);
  let dateEnd = endDate ? new Date(endDate) : new Date();
  let dateStart = startDate
    ? new Date(startDate)
    : new Date(new Date().setMonth(dateEnd.getMonth() - 1));
  dateEnd.setHours(23, 59, 59, 999); // Include full end day
  if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
    res.status(400);
    throw new Error("Invalid date format.");
  }

  try {
    // Ensure User model is valid before querying
    if (!User || typeof User.findAll !== "function") {
      throw new Error("User model is not available for user growth report.");
    }

    // Group users by creation date (using DATE function - adjust for specific SQL dialect if needed)
    const results = await User.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"], // Group by day
        [fn("COUNT", col("id")), "count"],
      ],
      where: { createdAt: { [Op.between]: [dateStart, dateEnd] } },
      group: ["date"],
      order: [["date", "ASC"]],
      raw: true,
    });

    // Format for Recharts - Use imported 'format'
    const formattedData = results.map((row) => {
      try {
        // Add try-catch around date parsing for robustness
        return {
          name: format(new Date(row.date), "MMM d"), // Format as 'Apr 28'
          Users: parseInt(row.count, 10) || 0, // Ensure count is a number
        };
      } catch (dateFormatError) {
        console.error(`Date formatting error for row:`, row, dateFormatError);
        return { name: "Invalid Date", Users: parseInt(row.count, 10) || 0 }; // Handle potential invalid date from DB
      }
    });

    console.log(`ADMIN: Found ${formattedData.length} user growth points.`);
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error(`ADMIN API Error in getReportUserGrowth:`, error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user growth report.",
    });
  }
});

/**
 * @desc    Admin: Get Content Overview counts
 * @route   GET /api/admin/reports/content-overview
 */
export const getReportContentOverview = asyncHandler(async (req, res) => {
  let { startDate, endDate } = req.query;
  console.log(
    `ADMIN API: getReportContentOverview invoked by Admin ${req.user.id}`
  );
  const whereClause = {};
  if (startDate && endDate) {
    try {
      let dS = new Date(startDate),
        dE = new Date(endDate);
      dE.setHours(23, 59, 59, 999);
      if (!isNaN(dS.getTime()) && !isNaN(dE.getTime()))
        whereClause.createdAt = { [Op.between]: [dS, dE] };
    } catch (e) {
      console.warn("Ignoring invalid date range for content overview.");
    }
  }

  try {
    // Removed Comment count
    const [projectCount, pubCount] = await Promise.all([
      safeCount(Project, { where: whereClause }),
      safeCount(Publication, { where: whereClause }),
      // safeCount(Comment, { where: whereClause }) // Keep commented out
    ]);

    // Format for Recharts
    const formattedData = [
      { name: "Projects", value: projectCount },
      { name: "Publications", value: pubCount },
      // { name: 'Comments', value: commentCount }, // Keep commented out
    ];

    console.log(`ADMIN: Content overview counts:`, formattedData);
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error(`ADMIN API Error in getReportContentOverview:`, error);
    res.status(500).json({
      success: false,
      message: "Server error fetching content overview report.",
    });
  }
});
// --- *** END Report Controller Functions *** ---

// --- Add other admin controller functions below ---
