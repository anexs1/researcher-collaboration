// backend/controllers/adminController.js
import db from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";
import asyncHandler from "express-async-handler";
import { format } from "date-fns"; // Used for date formatting in reports

const {
  User,
  Publication,
  Project,
  Member, // Included as it was in your original, though not directly used in these specific functions
  Message,
  Setting,
  sequelize, // The Sequelize instance
  // AuditLog, // Uncomment if you implement an AuditLog model
} = db;

// --- Helper Functions ---
async function safeCount(model, options = {}) {
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
    console.error(
      `safeCount Error [${model?.name || "Unknown Model"}]: ${error.message}`,
      { options }
    );
    return 0;
  }
}

async function safeFindAll(model, options = {}) {
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
    console.error(
      `safeFindAll Error [${model?.name || "Unknown Model"}]: ${error.message}`,
      { options }
    );
    return [];
  }
}

const userPublicSelectFields = [
  "id",
  "username",
  "email",
  "profilePictureUrl",
  "role",
  "status",
];

const defaultSettings = {
  siteName: "Research Platform",
  allowPublicSignup: true,
  maintenanceMode: false,
  defaultUserRole: "user",
  emailNotifications: true,
  itemsPerPage: 10,
  themeColor: "#3b82f6",
};

// --- Common attributes for Admin Publication lists ---
const ADMIN_PUBLICATION_ATTRIBUTES = [
  "id",
  "title",
  "summary",
  "author",
  "ownerId",
  "document_link",
  "tags",
  "area",
  "publicationDate",
  "journal",
  "doi",
  "thumbnail",
  "views",
  "citations",
  "createdAt",
  "updatedAt",
  "language",
  "version",
  "isPeerReviewed",
  "license",
  "lastReviewedAt",
  "rating",
  "downloadCount",
];

// --- Dashboard Stats Controller ---
export const getDashboardStats = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: getDashboardStats invoked by Admin ${req.user.id}`);
  try {
    if (!User || !Publication || !Project || !Message) {
      console.error(
        "ADMIN API Error: One or more required models (User, Publication, Project, Message) not available."
      );
      res.status(500);
      throw new Error(
        "Server configuration error: Required data models not loaded."
      );
    }

    const counts = await Promise.all([
      safeCount(User),
      safeCount(User, { where: { status: "approved" } }),
      safeCount(User, { where: { status: "pending" } }),
      safeCount(Publication),
      safeCount(Project),
      safeCount(Project, { where: { status: "active" } }),
      safeCount(User, { where: { role: "admin" } }),
      safeCount(Message),
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
            "createdAt",
            "ownerId",
            "isPeerReviewed",
            "rating",
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
        messages: { total: counts[7] },
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
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({
        success: false,
        message: error.message || "Failed to retrieve dashboard data.",
      });
  }
});

// --- Admin Publications Controller ---
export const getAdminPublications = asyncHandler(async (req, res) => {
  console.log(
    `ADMIN API: getAdminPublications invoked by Admin ${req.user.id}`,
    req.query
  );
  const {
    page = 1,
    limit = 15,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
    isPeerReviewed,
    language,
  } = req.query;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const allowedSortBy = [
    "id",
    "title",
    "author",
    "ownerId",
    "area",
    "publicationDate",
    "createdAt",
    "updatedAt",
    "views",
    "citations",
    "language",
    "version",
    "isPeerReviewed",
    "license",
    "lastReviewedAt",
    "rating",
    "downloadCount",
    "owner.username",
  ];

  if (!allowedSortBy.includes(sortBy)) {
    res.status(400);
    throw new Error(`Invalid sortBy. Allowed: ${allowedSortBy.join(", ")}`);
  }
  if (!["asc", "desc"].includes(sortOrder.toLowerCase())) {
    res.status(400);
    throw new Error("Invalid sortOrder.");
  }
  if (isNaN(parsedPage) || parsedPage <= 0) {
    res.status(400);
    throw new Error("Invalid page.");
  }
  if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
    res.status(400);
    throw new Error("Invalid limit (1-100).");
  }

  if (!Publication || !User) {
    console.error("ADMIN API Error: Publication or User model not available.");
    res.status(500);
    throw new Error("Server configuration error.");
  }

  const whereClause = {};
  if (search) {
    const searchPattern = `%${search}%`;
    const iLikeOp = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
    whereClause[Op.or] = [
      { title: { [iLikeOp]: searchPattern } },
      { author: { [iLikeOp]: searchPattern } },
      { summary: { [iLikeOp]: searchPattern } },
      { "$owner.username$": { [iLikeOp]: searchPattern } },
      { language: { [iLikeOp]: searchPattern } },
      { area: { [iLikeOp]: searchPattern } },
    ];
  }
  if (isPeerReviewed === "true" || isPeerReviewed === "false") {
    whereClause.isPeerReviewed = isPeerReviewed === "true";
  }
  if (language) {
    whereClause.language = { [Op.like]: `%${language}%` };
  }

  let order = [];
  if (sortBy.startsWith("owner.")) {
    const associatedField = sortBy.split(".")[1];
    order.push([
      { model: User, as: "owner" },
      associatedField,
      sortOrder.toUpperCase(),
    ]);
  } else {
    order.push([sortBy, sortOrder.toUpperCase()]);
  }

  try {
    const { count, rows } = await Publication.findAndCountAll({
      attributes: ADMIN_PUBLICATION_ATTRIBUTES,
      where: whereClause,
      limit: parsedLimit,
      offset: offset,
      order: order,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
          required: false,
        },
      ],
      distinct: true,
      subQuery: sortBy.startsWith("owner.") ? false : undefined,
    });

    const paginationData = {
      totalItems: count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      limit: parsedLimit,
    };
    res
      .status(200)
      .json({
        success: true,
        data: { publications: rows, pagination: paginationData },
      });
  } catch (error) {
    console.error("ADMIN API Error fetching publications:", error);
    if (error.message && error.message.includes("Unknown column")) {
      const specificColumnMatch = error.message.match(/'Publication\.([^']+)'/);
      const problematicColumn = specificColumnMatch
        ? specificColumnMatch[1]
        : "an unspecified field";
      console.error(
        `HINT: "Unknown column '${problematicColumn}'". Check model, migrations, restart server.`
      );
      res
        .status(500)
        .json({
          success: false,
          message: `Server config error: Problem with field '${problematicColumn}'.`,
        });
    } else {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Server error fetching publications.",
        });
    }
  }
});

export const deleteAdminPublication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: deleteAdminPublication for Pub ID ${id} by Admin ${adminUserId}`
  );
  const publicationId = parseInt(id, 10);
  if (isNaN(publicationId) || publicationId <= 0) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }
  if (!Publication) {
    console.error("ADMIN API Error: Publication model not available.");
    res.status(500);
    throw new Error("Server configuration error.");
  }
  const publication = await Publication.findByPk(publicationId);
  if (!publication) {
    res.status(404);
    throw new Error("Publication not found.");
  }
  await publication.destroy();
  console.log(
    `Publication ${publicationId} (Title: ${publication.title}) deleted by Admin ${adminUserId}.`
  );
  res
    .status(200)
    .json({ success: true, message: "Publication deleted successfully." });
});

// --- Admin Projects Controller ---
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log(
    `ADMIN API: adminGetAllProjects invoked by Admin ${req.user.id}`,
    req.query
  );
  const {
    page = 1,
    limit = 15,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
    status: statusFilter,
  } = req.query;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const allowedProjectSortBy = [
    "id",
    "title",
    "status",
    "createdAt",
    "updatedAt",
    "owner.username",
  ];
  if (!allowedProjectSortBy.includes(sortBy)) {
    res.status(400);
    throw new Error(
      `Invalid sortBy for projects. Allowed: ${allowedProjectSortBy.join(", ")}`
    );
  }
  if (!["asc", "desc"].includes(sortOrder.toLowerCase())) {
    res.status(400);
    throw new Error("Invalid sortOrder.");
  }
  if (isNaN(parsedPage) || parsedPage <= 0) {
    res.status(400);
    throw new Error("Invalid page.");
  }
  if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
    res.status(400);
    throw new Error("Invalid limit (1-100).");
  }

  if (!Project || !User) {
    console.error(
      "ADMIN API Error: Project or User model not available for adminGetAllProjects."
    );
    res.status(500);
    throw new Error(
      "Server configuration error: Required data models not loaded."
    );
  }

  const whereClause = {};
  if (statusFilter) {
    const validStatuses = [
      "active",
      "planning",
      "completed",
      "on_hold",
      "archived",
    ];
    if (validStatuses.includes(statusFilter)) {
      whereClause.status = statusFilter;
    } else {
      console.warn(
        `ADMIN API: Invalid status filter for projects ignored: ${statusFilter}`
      );
    }
  }
  if (search) {
    const searchPattern = `%${search}%`;
    const iLikeOp = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
    whereClause[Op.or] = [
      { title: { [iLikeOp]: searchPattern } },
      { description: { [iLikeOp]: searchPattern } },
      { "$owner.username$": { [iLikeOp]: searchPattern } },
    ];
  }

  let order = [];
  if (sortBy.startsWith("owner.")) {
    const associatedField = sortBy.split(".")[1];
    order.push([
      { model: User, as: "owner" },
      associatedField,
      sortOrder.toUpperCase(),
    ]);
  } else {
    order.push([sortBy, sortOrder.toUpperCase()]);
  }

  try {
    const { count, rows } = await Project.findAndCountAll({
      // Renamed projects to rows for consistency
      where: whereClause,
      attributes: [
        "id",
        "title",
        "status",
        "ownerId",
        "createdAt",
        "updatedAt",
        "description",
      ],
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "email"],
          required: false,
        },
      ],
      order: order,
      limit: parsedLimit,
      offset,
      distinct: true,
      subQuery: sortBy.startsWith("owner.") ? false : undefined,
    });

    const paginationData = {
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      limit: parsedLimit,
      totalItems: count,
    };

    res.status(200).json({
      success: true,
      data: { projects: rows, pagination: paginationData }, // Using 'rows' here which holds the projects
    });
  } catch (error) {
    console.error("ADMIN API Error fetching all projects:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({
        success: false,
        message: error.message || "Server error fetching projects.",
      });
  }
});

export const deleteAdminProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: deleteAdminProject for Project ID ${id} by Admin ${adminUserId}`
  );
  const projectId = parseInt(id, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID.");
  }
  if (!Project) {
    console.error("ADMIN API Error: Project model not available.");
    res.status(500);
    throw new Error("Server configuration error.");
  }
  const project = await Project.findByPk(projectId);
  if (!project) {
    res.status(404);
    throw new Error("Project not found.");
  }
  await project.destroy();
  console.log(
    `Project ${projectId} (Title: ${project.title}) deleted by Admin ${adminUserId}.`
  );
  res
    .status(200)
    .json({ success: true, message: "Project deleted successfully." });
});

// --- Admin Message Controllers ---
export const adminGetProjectMessages = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminGetProjectMessages for Project ${projectIdParam} by Admin ${adminUserId}`,
    req.query
  );
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID.");
  }
  const { page = 1, limit = 50 } = req.query;
  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);
  if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 200) {
    res.status(400);
    throw new Error("Invalid 'limit'.");
  }
  if (isNaN(parsedPage) || parsedPage <= 0) {
    res.status(400);
    throw new Error("Invalid 'page'.");
  }
  const offset = (parsedPage - 1) * parsedLimit;
  try {
    if (!Project || !Message || !User) {
      console.error("ADMIN API Error: Models not available.");
      res.status(500);
      throw new Error("Server configuration error.");
    }
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "title"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    const { count, rows: messages } = await Message.findAndCountAll({
      where: { projectId: projectId },
      include: [
        {
          model: User,
          as: "sender",
          attributes: userPublicSelectFields,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });
    res
      .status(200)
      .json({
        success: true,
        projectTitle: project.title,
        count,
        pagination: {
          totalPages: Math.ceil(count / parsedLimit),
          currentPage: parsedPage,
          limit: parsedLimit,
          totalItems: count,
        },
        messages: messages,
      });
  } catch (error) {
    console.error(
      `ADMIN API Error adminGetProjectMessages for project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
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
    if (!Message) {
      console.error("ADMIN API Error: Message model not available.");
      res.status(500);
      throw new Error("Server configuration error.");
    }
    const message = await Message.findByPk(messageId, {
      attributes: ["id", "projectId", "senderId", "content"],
    });
    if (!message) {
      res.status(404);
      throw new Error("Message not found.");
    }
    const projectId = message.projectId;
    await message.destroy();
    console.log(
      `Message ${messageId} (Project ${projectId}) deleted by Admin ${adminUserId}.`
    );
    const io = req.app.get("socketio");
    if (io && projectId) {
      const room = `project-${projectId}`;
      io.to(room).emit("messageDeleted", {
        messageId: messageId,
        projectId: projectId,
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error(`ADMIN API Error deleting message ${messageIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
  }
});

// --- Admin Settings Controllers ---
export const getAdminSettings = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: getAdminSettings invoked by Admin ${req.user.id}`);
  if (!Setting) {
    console.error("ADMIN API Error: Setting model not available.");
    res.status(500);
    throw new Error("Server configuration error.");
  }
  try {
    let settingsRecord = await Setting.findOne({ where: { id: 1 } }); // Assuming settings are stored with id 1
    const currentSettingsData = settingsRecord ? settingsRecord.toJSON() : {};
    const dataToSend = { ...defaultSettings, ...currentSettingsData };
    res.status(200).json({ success: true, data: dataToSend });
  } catch (error) {
    console.error(`ADMIN API Error getting admin settings:`, error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id;
  const updatedSettingsData = req.body;
  console.log(
    `ADMIN API: updateAdminSettings invoked by Admin ${adminUserId}`,
    updatedSettingsData
  );
  if (!Setting) {
    console.error("ADMIN API Error: Setting model not available.");
    res.status(500);
    throw new Error("Server configuration error.");
  }
  const validatedUpdates = {};
  const allowedKeys = Object.keys(defaultSettings);
  for (const key of allowedKeys) {
    if (updatedSettingsData.hasOwnProperty(key)) {
      let value = updatedSettingsData[key];
      switch (typeof defaultSettings[key]) {
        case "boolean":
          if (value === "true" || value === 1 || value === true)
            validatedUpdates[key] = true;
          else if (value === "false" || value === 0 || value === false)
            validatedUpdates[key] = false;
          else {
            res.status(400);
            throw new Error(`Invalid boolean for '${key}'.`);
          }
          break;
        case "number":
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            validatedUpdates[key] = numValue;
            if (key === "itemsPerPage" && numValue <= 0) {
              res.status(400);
              throw new Error(`'itemsPerPage' must be positive.`);
            }
          } else {
            res.status(400);
            throw new Error(`Invalid number for '${key}'.`);
          }
          break;
        case "string":
          validatedUpdates[key] = String(value).trim();
          if (
            key === "themeColor" &&
            !/^#([0-9A-F]{3}){1,2}$/i.test(validatedUpdates[key])
          ) {
            res.status(400);
            throw new Error(`Invalid hex color for 'themeColor'.`);
          }
          if (
            key === "defaultUserRole" &&
            !["user", "admin", "moderator"].includes(validatedUpdates[key])
          ) {
            res.status(400);
            throw new Error(`Invalid 'defaultUserRole'.`);
          }
          break;
        default:
          validatedUpdates[key] = value;
      }
    }
  }
  if (Object.keys(validatedUpdates).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No valid settings fields." });
  }
  try {
    const [settingsRecord, created] = await Setting.findOrCreate({
      where: { id: 1 },
      defaults: { ...defaultSettings, ...validatedUpdates, id: 1 },
    });
    if (!created) {
      await settingsRecord.update(validatedUpdates);
    }
    const latestSettings = await Setting.findByPk(1);
    const dataToSend = latestSettings
      ? { ...defaultSettings, ...latestSettings.toJSON() }
      : { ...defaultSettings };
    res
      .status(200)
      .json({ success: true, message: "Settings updated.", data: dataToSend });
  } catch (error) {
    console.error(`ADMIN API Error updating admin settings:`, error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((e) => e.message).join(". ");
      res
        .status(400)
        .json({ success: false, message: `Validation Error: ${messages}` });
    } else {
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      res
        .status(statusCode)
        .json({ success: false, message: error.message || "Server error." });
    }
  }
});

// --- Report Controller Functions ---
export const getReportSummary = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: getReportSummary invoked by Admin ${req.user.id}`);
  try {
    const [userCount, projectCount, pubCount] = await Promise.all([
      safeCount(User),
      safeCount(Project),
      safeCount(Publication),
    ]);
    const summaryData = {
      users: { label: "Total Users", value: userCount },
      projects: { label: "Total Projects", value: projectCount },
      publications: { label: "Total Publications", value: pubCount },
    };
    res.status(200).json({ success: true, data: summaryData });
  } catch (error) {
    console.error(`ADMIN API Error in getReportSummary:`, error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export const getReportUserGrowth = asyncHandler(async (req, res) => {
  const { startDate, endDate, granularity = "day" } = req.query;
  console.log(
    `ADMIN API: getReportUserGrowth invoked by Admin ${req.user.id}`,
    req.query
  );
  let dateEnd = endDate ? new Date(endDate) : new Date();
  let dateStart = startDate
    ? new Date(startDate)
    : new Date(new Date().setMonth(dateEnd.getMonth() - 1));
  dateEnd.setHours(23, 59, 59, 999);
  dateStart.setHours(0, 0, 0, 0);
  if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
    res.status(400);
    throw new Error("Invalid date format.");
  }
  if (dateStart >= dateEnd) {
    res.status(400);
    throw new Error("Start date must be before end date.");
  }
  let dateFormat;
  let dateTruncFunction;
  const dialect = sequelize.getDialect();
  switch (granularity.toLowerCase()) {
    case "month":
      dateFormat = "yyyy-MM";
      if (dialect === "postgres")
        dateTruncFunction = literal(`DATE_TRUNC('month', "createdAt")`);
      else if (dialect === "mysql")
        dateTruncFunction = literal(`DATE_FORMAT(createdAt, '%Y-%m-01')`);
      else dateTruncFunction = literal(`strftime('%Y-%m', createdAt)`);
      break;
    case "year":
      dateFormat = "yyyy";
      if (dialect === "postgres")
        dateTruncFunction = literal(`DATE_TRUNC('year', "createdAt")`);
      else if (dialect === "mysql")
        dateTruncFunction = literal(`YEAR(createdAt)`);
      else dateTruncFunction = literal(`strftime('%Y', createdAt)`);
      break;
    default:
      dateFormat = "yyyy-MM-dd";
      if (dialect === "postgres" || dialect === "mysql")
        dateTruncFunction = fn("DATE", col("createdAt"));
      else dateTruncFunction = literal(`DATE(createdAt)`);
      break;
  }
  try {
    if (!User || typeof User.findAll !== "function") {
      console.error("ADMIN API Error: User model not available.");
      res.status(500);
      throw new Error("Server configuration error.");
    }
    const results = await User.findAll({
      attributes: [
        [dateTruncFunction, "date_group"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { createdAt: { [Op.between]: [dateStart, dateEnd] } },
      group: ["date_group"],
      order: [[literal("date_group"), "ASC"]],
      raw: true,
    });
    const formattedData = results
      .map((row) => {
        try {
          const dateValue = row.date_group ? new Date(row.date_group) : null;
          if (!dateValue || isNaN(dateValue.getTime())) {
            console.warn("Skipping invalid date_group:", row);
            return null;
          }
          return {
            name: format(dateValue, dateFormat),
            Users: parseInt(row.count, 10) || 0,
          };
        } catch (e) {
          console.error(`Date format error:`, row, e);
          return { name: "Invalid Date", Users: parseInt(row.count, 10) || 0 };
        }
      })
      .filter(Boolean);
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error(`ADMIN API Error in getReportUserGrowth:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
  }
});

export const getReportContentOverview = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  console.log(
    `ADMIN API: getReportContentOverview invoked by Admin ${req.user.id}`,
    req.query
  );
  const whereClause = {};
  if (startDate && endDate) {
    try {
      let dS = new Date(startDate);
      let dE = new Date(endDate);
      if (!isNaN(dS.getTime()) && !isNaN(dE.getTime()) && dS < dE) {
        dE.setHours(23, 59, 59, 999);
        dS.setHours(0, 0, 0, 0);
        whereClause.createdAt = { [Op.between]: [dS, dE] };
      } else {
        console.warn("Invalid date range for content overview.");
      }
    } catch (e) {
      console.warn("Error parsing date range for content overview:", e.message);
    }
  }
  try {
    const [projectCount, pubCount] = await Promise.all([
      safeCount(Project, { where: whereClause }),
      safeCount(Publication, { where: whereClause }),
    ]);
    const formattedData = [
      { name: "Projects", value: projectCount },
      { name: "Publications", value: pubCount },
    ];
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error(`ADMIN API Error in getReportContentOverview:`, error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});
