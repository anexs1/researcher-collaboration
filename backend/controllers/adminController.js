// backend/controllers/adminController.js
import db from "../models/index.js"; // Ensure path is correct and all models are loaded
import { Op, fn, col, literal } from "sequelize"; // Import necessary Sequelize functions
import asyncHandler from "express-async-handler";
import { format } from "date-fns"; // Used for date formatting in reports

// Destructure all necessary models used in this controller
// Ensure 'Setting' model exists and is correctly defined in models/index.js
// NOTE: 'Comment' model references have been removed as per the initial prompt's indication of issues.
const {
  User,
  Publication,
  Project,
  Member, // Although not directly used in these functions, might be needed elsewhere
  Message,
  Setting, // Make sure this model is defined and synced
  sequelize, // The Sequelize instance itself
  // AuditLog, // Uncomment if you implement an AuditLog model
} = db;

// --- Helper Functions ---

// Safely count records, return 0 on error or if model is invalid
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
    // Ensure count is a valid integer, handle potential non-numeric returns gracefully
    return Number.isInteger(count) ? count : 0;
  } catch (error) {
    // Log specific error for easier debugging
    console.error(
      `safeCount Error [${model?.name || "Unknown Model"}]: ${error.message}`,
      { options }
    );
    return 0; // Return 0 on any error during count
  }
}

// Safely find all records, return empty array on error or if model is invalid
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
    // Ensure results are always an array
    return Array.isArray(results) ? results : [];
  } catch (error) {
    // Log specific error for easier debugging
    console.error(
      `safeFindAll Error [${model?.name || "Unknown Model"}]: ${error.message}`,
      { options }
    );
    return []; // Return empty array on error
  }
}

// Reusable list of public fields for user objects (to avoid exposing sensitive data)
const userPublicSelectFields = [
  "id",
  "username",
  "email", // Consider if email should always be public here
  "profilePictureUrl", // Assuming you have this field
  "role",
  "status",
];

// Default settings structure - used if DB record for settings doesn't exist yet
const defaultSettings = {
  siteName: "Research Platform",
  allowPublicSignup: true,
  maintenanceMode: false,
  defaultUserRole: "user", // Default role for new signups (if allowed)
  emailNotifications: true, // Master switch for email notifications
  itemsPerPage: 10, // Default pagination size
  themeColor: "#3b82f6", // Example theme color
  // Add other settings relevant to your application
};

// --- Dashboard Stats Controller ---
/**
 * @desc    Admin: Get dashboard statistics and recent activities
 * @route   GET /api/admin/dashboard/stats
 * @access  Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: getDashboardStats invoked by Admin ${req.user.id}`);
  try {
    // Validate that essential models are loaded
    if (!User || !Publication || !Project || !Message) {
      // Added Message check
      console.error(
        "ADMIN API Error: One or more required models (User, Publication, Project, Message) not available."
      );
      res.status(500);
      throw new Error(
        "Server configuration error: Required data models not loaded."
      );
    }

    // Fetch counts concurrently
    const counts = await Promise.all([
      safeCount(User), // Index 0: Total Users
      safeCount(User, { where: { status: "approved" } }), // Index 1: Active/Approved Users
      safeCount(User, { where: { status: "pending" } }), // Index 2: Pending Users
      safeCount(Publication), // Index 3: Total Publications
      safeCount(Project), // Index 4: Total Projects
      safeCount(Project, { where: { status: "active" } }), // Index 5: Active Projects
      safeCount(User, { where: { role: "admin" } }), // Index 6: Admin Users
      safeCount(Message), // Index 7: Total Messages (Example)
    ]);

    // Fetch recent items concurrently
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
            "ownerId",
          ], // Added ownerId
          include: [
            {
              model: User,
              as: "owner", // Make sure 'owner' alias is defined in Publication model association
              attributes: ["id", "username"], // Fetch minimal owner info
              required: false, // Use left join in case owner is deleted or null
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: 5,
        }),
        safeFindAll(Project, {
          attributes: ["id", "title", "status", "createdAt", "ownerId"],
          include: [
            // Include owner info for recent projects too
            {
              model: User,
              as: "owner", // Make sure 'owner' alias is defined in Project model association
              attributes: ["id", "username"],
              required: false,
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: 5,
        }),
      ]
    );

    // Structure the response data
    const responseData = {
      counts: {
        users: {
          total: counts[0],
          active: counts[1],
          pending: counts[2],
          admins: counts[6],
        },
        publications: {
          total: counts[3],
          // Add more publication stats if needed (e.g., published vs draft)
        },
        projects: {
          total: counts[4],
          active: counts[5],
          // Add more project stats if needed (e.g., completed)
        },
        messages: {
          total: counts[7], // Example message count
        },
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
    // Use status code set by middleware/validation or default to 500
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to retrieve dashboard data.",
    });
  }
});

// --- Admin Publications Controller ---
/**
 * @desc    Admin: Get all publications with pagination and sorting
 * @route   GET /api/admin/publications
 * @access  Private/Admin
 */
export const getAdminPublications = asyncHandler(async (req, res) => {
  console.log(
    `ADMIN API: getAdminPublications invoked by Admin ${req.user.id}`,
    req.query
  );
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15; // Default limit 15
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder || "desc";
  const offset = (page - 1) * limit;

  // Validate sorting parameters
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
    throw new Error(
      `Invalid sortBy parameter. Allowed values: ${allowedSortBy.join(", ")}`
    );
  }
  if (!["asc", "desc"].includes(sortOrder.toLowerCase())) {
    res.status(400);
    throw new Error(`Invalid sortOrder parameter. Must be 'asc' or 'desc'.`);
  }

  // Ensure models are available
  if (!Publication || !User) {
    console.error(
      "ADMIN API Error: Publication or User model not available for getAdminPublications."
    );
    res.status(500);
    throw new Error(
      "Server configuration error: Required data models not loaded."
    );
  }

  try {
    const { count, rows } = await Publication.findAndCountAll({
      attributes: [
        // Select specific attributes needed
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
      limit: limit,
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          // Include owner details
          model: User,
          as: "owner", // Ensure this alias matches your model association
          attributes: ["id", "username", "email"], // Select necessary owner fields
          required: false, // Left join
        },
      ],
      distinct: true, // Needed for accurate count with includes
    });

    // Prepare pagination info
    const paginationData = {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit: limit,
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
/**
 * @desc    Admin: Get all projects with filtering and pagination
 * @route   GET /api/admin/projects
 * @access  Private/Admin
 */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log(
    `ADMIN API: adminGetAllProjects invoked by Admin ${req.user.id}`,
    req.query
  );
  try {
    const { status, search, page = 1, limit = 20 } = req.query; // Default page 1, limit 20

    // Input validation
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
      // Add max limit
      res.status(400);
      throw new Error(
        "Invalid 'limit' parameter. Must be a positive integer (max 100)."
      );
    }
    if (isNaN(parsedPage) || parsedPage <= 0) {
      res.status(400);
      throw new Error("Invalid 'page' parameter. Must be a positive integer.");
    }
    const offset = (parsedPage - 1) * parsedLimit;

    // Build WHERE clause for filtering
    const where = {};
    if (status) {
      // Optional: Validate status against allowed values if needed
      const validStatuses = [
        "active",
        "planning",
        "completed",
        "on_hold",
        "archived",
      ]; // Example statuses
      if (validStatuses.includes(status)) {
        where.status = status;
      } else {
        console.warn(`ADMIN API: Invalid status filter ignored: ${status}`);
      }
    }
    if (search) {
      // Basic search across title and description
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search (PostgreSQL/SQLite)
        { description: { [Op.iLike]: `%${search}%` } },
        // Use Op.like for case-sensitive (MySQL default) if needed:
        // { title: { [Op.like]: `%${search}%` } },
        // { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Ensure models are available
    if (!Project || !User) {
      console.error(
        "ADMIN API Error: Project or User model not available for adminGetAllProjects."
      );
      res.status(500);
      throw new Error(
        "Server configuration error: Required data models not loaded."
      );
    }

    // Fetch projects with count for pagination
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: [
        // Select necessary fields
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
          as: "owner", // Ensure alias matches association
          attributes: userPublicSelectFields, // Use predefined public fields
          required: false, // Left join
        },
      ],
      order: [["createdAt", "DESC"]], // Default sorting
      limit: parsedLimit,
      offset,
      distinct: true, // Important for count with includes
    });

    console.log(
      `ADMIN: Found ${count} projects, returning page ${parsedPage}.`
    );
    res.status(200).json({
      success: true,
      count, // Total matching items
      pagination: {
        // Send pagination details
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
        totalItems: count,
      },
      data: projects, // Send the actual project data
    });
  } catch (error) {
    console.error("ADMIN API Error fetching all projects:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error fetching projects.",
    });
  }
});

// --- Admin Message Controllers ---
/**
 * @desc    Admin: Get messages for a specific project with pagination
 * @route   GET /api/admin/messages/project/:projectId
 * @access  Private/Admin
 */
export const adminGetProjectMessages = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminGetProjectMessages for Project ${projectIdParam} by Admin ${adminUserId}`,
    req.query
  );

  // Validate Project ID
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID provided.");
  }

  // Validate Pagination
  const { page = 1, limit = 50 } = req.query; // Default page 1, limit 50
  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);
  if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 200) {
    // Max limit 200 for messages
    res.status(400);
    throw new Error(
      "Invalid 'limit' parameter. Must be a positive integer (max 200)."
    );
  }
  if (isNaN(parsedPage) || parsedPage <= 0) {
    res.status(400);
    throw new Error("Invalid 'page' parameter. Must be a positive integer.");
  }
  const offset = (parsedPage - 1) * parsedLimit;

  try {
    // Ensure models are available
    if (!Project || !Message || !User) {
      console.error(
        "ADMIN API Error: Project, Message or User model not available for adminGetProjectMessages."
      );
      res.status(500);
      throw new Error(
        "Server configuration error: Required data models not loaded."
      );
    }

    // Check if project exists first
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "title"], // Only need ID and title
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    // Fetch messages for the project
    const { count, rows: messages } = await Message.findAndCountAll({
      where: { projectId: projectId },
      include: [
        {
          model: User,
          as: "sender", // Ensure alias matches Message model association
          attributes: userPublicSelectFields, // Get public sender info
          required: false, // Left join in case sender deleted
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest messages first
      limit: parsedLimit,
      offset,
      distinct: true,
    });

    console.log(
      `ADMIN: Fetched ${messages.length}/${count} messages page ${parsedPage} for project ${projectId}.`
    );
    res.status(200).json({
      success: true,
      projectTitle: project.title, // Include project title for context
      count, // Total message count for the project
      pagination: {
        // Pagination details
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
        totalItems: count,
      },
      messages: messages, // The array of messages for the current page
    });
  } catch (error) {
    console.error(
      `ADMIN API Error adminGetProjectMessages for project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error retrieving project messages.",
    });
  }
});

/**
 * @desc    Admin: Delete a specific message
 * @route   DELETE /api/admin/messages/:messageId
 * @access  Private/Admin
 */
export const adminDeleteMessage = asyncHandler(async (req, res) => {
  const messageIdParam = req.params.messageId;
  const adminUserId = req.user.id;
  console.log(
    `ADMIN API: adminDeleteMessage for Msg ${messageIdParam} by Admin ${adminUserId}`
  );

  // Validate Message ID
  const messageId = parseInt(messageIdParam, 10);
  if (isNaN(messageId) || messageId <= 0) {
    res.status(400);
    throw new Error("Invalid message ID provided.");
  }

  try {
    // Ensure Message model is available
    if (!Message) {
      console.error(
        "ADMIN API Error: Message model not available for adminDeleteMessage."
      );
      res.status(500);
      throw new Error(
        "Server configuration error: Required data models not loaded."
      );
    }

    // Find the message to be deleted
    const message = await Message.findByPk(messageId, {
      attributes: ["id", "projectId", "senderId", "content"], // Get info for logging/events
    });

    if (!message) {
      res.status(404);
      throw new Error("Message not found.");
    }

    const projectId = message.projectId; // Store project ID for potential socket event

    // --- Deletion ---
    await message.destroy();
    // --- Deletion End ---

    console.log(
      `Message ${messageId} (Project ${projectId}) deleted by Admin ${adminUserId}.`
    );

    // --- Audit Log (Optional) ---
    // if (AuditLog) {
    //   try {
    //     await AuditLog.create({
    //       userId: adminUserId, // The admin performing the action
    //       action: 'delete_message',
    //       targetType: 'message',
    //       targetId: messageId,
    //       details: `Deleted message in project ${projectId}. Sender was ${message.senderId}. Content snippet: ${message.content.substring(0, 50)}...`,
    //       ipAddress: req.ip // Capture IP if needed
    //     });
    //   } catch (auditLogError) {
    //     console.error("Failed to create audit log for message deletion:", auditLogError);
    //   }
    // }
    // --- Audit Log End ---

    // --- Socket.IO Event (Optional) ---
    // If you have real-time updates for project messages
    const io = req.app.get("socketio"); // Get socket.io instance from app
    if (io && projectId) {
      const room = `project-${projectId}`;
      const payload = { messageId: messageId, projectId: projectId }; // Data to send
      console.log(`Emitting 'messageDeleted' event to room ${room}`);
      io.to(room).emit("messageDeleted", payload); // Emit event to project room
    } else if (projectId) {
      console.warn(
        "Socket.IO instance not found, cannot emit 'messageDeleted' event."
      );
    }
    // --- Socket.IO Event End ---

    res
      .status(200)
      .json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error(`ADMIN API Error deleting message ${messageIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error deleting message.",
    });
  }
});

// --- Admin Settings Controllers ---
/**
 * @desc    Admin: Get application settings
 * @route   GET /api/admin/settings
 * @access  Private/Admin
 */
export const getAdminSettings = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id;
  console.log(`ADMIN API: getAdminSettings invoked by Admin ${adminUserId}`);

  // Ensure Setting model is available
  if (!Setting) {
    console.error(
      "ADMIN API Error: Setting model not available for getAdminSettings."
    );
    res.status(500);
    throw new Error("Server configuration error: Settings model unavailable.");
  }

  try {
    // Attempt to find the settings record (assuming only one, typically ID 1)
    let settingsRecord = await Setting.findOne({ where: { id: 1 } }); // Or find based on a unique key if not ID 1

    let currentSettingsData = settingsRecord ? settingsRecord.toJSON() : {};

    // Merge database settings with defaults to ensure all keys exist
    const dataToSend = { ...defaultSettings, ...currentSettingsData };

    console.log("ADMIN: Returning current application settings.");
    res.status(200).json({ success: true, data: dataToSend }); // Wrap in success/data structure
  } catch (error) {
    console.error(`ADMIN API Error getting admin settings:`, error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving application settings.",
    });
  }
});

/**
 * @desc    Admin: Update application settings
 * @route   PUT /api/admin/settings
 * @access  Private/Admin
 */
export const updateAdminSettings = asyncHandler(async (req, res) => {
  const adminUserId = req.user.id;
  const updatedSettingsData = req.body;
  console.log(
    `ADMIN API: updateAdminSettings invoked by Admin ${adminUserId}`,
    updatedSettingsData
  );

  // Ensure Setting model is available
  if (!Setting) {
    console.error(
      "ADMIN API Error: Setting model not available for updateAdminSettings."
    );
    res.status(500);
    throw new Error("Server configuration error: Settings model unavailable.");
  }

  // --- Validation and Sanitization ---
  const validatedUpdates = {};
  const allowedKeys = Object.keys(defaultSettings); // Only allow updating keys defined in defaults

  for (const key of allowedKeys) {
    if (updatedSettingsData.hasOwnProperty(key)) {
      let value = updatedSettingsData[key];

      // Basic Type Validation/Coercion (Example) - Expand as needed
      switch (typeof defaultSettings[key]) {
        case "boolean":
          // Allow true, false, 'true', 'false', 1, 0
          if (value === "true" || value === 1 || value === true)
            validatedUpdates[key] = true;
          else if (value === "false" || value === 0 || value === false)
            validatedUpdates[key] = false;
          else {
            res.status(400);
            throw new Error(`Invalid boolean value for setting '${key}'.`);
          }
          break;
        case "number":
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            validatedUpdates[key] = numValue;
            // Add range checks if necessary (e.g., itemsPerPage > 0)
            if (key === "itemsPerPage" && numValue <= 0) {
              res.status(400);
              throw new Error(
                `Setting 'itemsPerPage' must be a positive number.`
              );
            }
          } else {
            res.status(400);
            throw new Error(`Invalid number value for setting '${key}'.`);
          }
          break;
        case "string":
          // Basic sanitization: trim whitespace
          validatedUpdates[key] = String(value).trim();
          // Add more validation if needed (e.g., themeColor format, defaultUserRole allowed values)
          if (
            key === "themeColor" &&
            !/^#([0-9A-F]{3}){1,2}$/i.test(validatedUpdates[key])
          ) {
            res.status(400);
            throw new Error(`Invalid hex color format for 'themeColor'.`);
          }
          if (
            key === "defaultUserRole" &&
            !["user", "admin", "moderator"].includes(validatedUpdates[key])
          ) {
            // Use your actual roles
            res.status(400);
            throw new Error(`Invalid value for 'defaultUserRole'.`);
          }
          break;
        default:
          // Handle other types or ignore unknown types if necessary
          validatedUpdates[key] = value;
      }
    }
  }

  // Check if any valid fields were actually provided
  if (Object.keys(validatedUpdates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid settings fields provided for update.",
    });
  }
  // --- Validation End ---

  try {
    // Find or Create the settings record (ID 1 is common practice)
    const [settingsRecord, created] = await Setting.findOrCreate({
      where: { id: 1 }, // Or your unique key
      defaults: { ...defaultSettings, ...validatedUpdates, id: 1 }, // Use validated updates for creation default
    });

    // If the record existed, update it with the validated data
    if (!created) {
      await settingsRecord.update(validatedUpdates);
    }

    console.log(
      `AUDIT Placeholder: Admin ${adminUserId} updated application settings.`
    );
    // TODO: Add Audit Log entry here

    // Fetch the latest settings again to return the confirmed state
    const latestSettings = await Setting.findByPk(1); // Fetch the updated record
    const dataToSend = latestSettings
      ? { ...defaultSettings, ...latestSettings.toJSON() }
      : { ...defaultSettings }; // Merge again

    res.status(200).json({
      success: true,
      message: "Application settings updated successfully.",
      data: dataToSend, // Return the complete, updated settings object
    });
  } catch (error) {
    console.error(`ADMIN API Error updating admin settings:`, error);
    if (error.name === "SequelizeValidationError") {
      // Handle specific validation errors from Sequelize model definition
      const messages = error.errors.map((e) => e.message).join(". ");
      res
        .status(400)
        .json({ success: false, message: `Validation Error: ${messages}` });
    } else {
      // Use status code set by validation or default to 500
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error updating application settings.",
      });
    }
  }
});

// --- Report Controller Functions ---

/**
 * @desc    Admin: Get Summary Report Stats (Users, Projects, Publications)
 * @route   GET /api/admin/reports/summary
 * @access  Private/Admin
 */
export const getReportSummary = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: getReportSummary invoked by Admin ${req.user.id}`);
  try {
    // Fetch counts concurrently using the safe helper
    const [userCount, projectCount, pubCount] = await Promise.all([
      safeCount(User),
      safeCount(Project),
      safeCount(Publication),
      // safeCount(Comment) // Keep removed/commented out if Comment model is problematic
    ]);

    // Structure data clearly
    const summaryData = {
      users: { label: "Total Users", value: userCount },
      projects: { label: "Total Projects", value: projectCount },
      publications: { label: "Total Publications", value: pubCount },
      // comments: { label: "Total Comments", value: commentCount }, // Keep removed/commented
    };

    res.status(200).json({ success: true, data: summaryData });
  } catch (error) {
    console.error(`ADMIN API Error in getReportSummary:`, error);
    res.status(500).json({
      success: false,
      message: "Server error fetching summary report.",
    });
  }
});

/**
 * @desc    Admin: Get User Growth data for charting
 * @route   GET /api/admin/reports/user-growth
 * @access  Private/Admin
 */
export const getReportUserGrowth = asyncHandler(async (req, res) => {
  const { startDate, endDate, granularity = "day" } = req.query; // Add granularity (day, month, year)
  console.log(
    `ADMIN API: getReportUserGrowth invoked by Admin ${req.user.id}`,
    req.query
  );

  // --- Date Range Handling ---
  let dateEnd = endDate ? new Date(endDate) : new Date();
  let dateStart = startDate
    ? new Date(startDate)
    : new Date(new Date().setMonth(dateEnd.getMonth() - 1)); // Default 1 month back

  // Ensure end date includes the full day
  dateEnd.setHours(23, 59, 59, 999);
  // Ensure start date starts at the beginning of the day
  dateStart.setHours(0, 0, 0, 0);

  if (isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())) {
    res.status(400);
    throw new Error("Invalid date format provided for startDate or endDate.");
  }
  if (dateStart >= dateEnd) {
    res.status(400);
    throw new Error("Start date must be before end date.");
  }
  // --- Date Range End ---

  // --- Granularity and Date Formatting ---
  let dateFormat; // Format for the 'name' property in response (e.g., 'YYYY-MM-DD', 'YYYY-MM')
  let dateTruncFunction; // SQL function to group by (e.g., DATE, YEAR/MONTH)

  // Determine SQL function and output format based on granularity and database dialect
  const dialect = sequelize.getDialect(); // Get the dialect ('postgres', 'mysql', 'sqlite', etc.)

  switch (granularity.toLowerCase()) {
    case "month":
      dateFormat = "yyyy-MM"; // e.g., 2023-11
      if (dialect === "postgres") {
        dateTruncFunction = literal(`DATE_TRUNC('month', "createdAt")`);
      } else if (dialect === "mysql") {
        dateTruncFunction = literal(`DATE_FORMAT(createdAt, '%Y-%m-01')`); // Group by first day of month
      } else {
        // Default/SQLite - might need adjustment for pure month grouping
        dateTruncFunction = literal(`strftime('%Y-%m', createdAt)`); // Groups by YYYY-MM string
      }
      break;
    case "year":
      dateFormat = "yyyy"; // e.g., 2023
      if (dialect === "postgres") {
        dateTruncFunction = literal(`DATE_TRUNC('year', "createdAt")`);
      } else if (dialect === "mysql") {
        dateTruncFunction = literal(`YEAR(createdAt)`);
      } else {
        // Default/SQLite
        dateTruncFunction = literal(`strftime('%Y', createdAt)`);
      }
      break;
    case "day":
    default: // Default to daily granularity
      dateFormat = "yyyy-MM-dd"; // e.g., 2023-11-28
      if (dialect === "postgres" || dialect === "mysql") {
        dateTruncFunction = fn("DATE", col("createdAt")); // Standard SQL DATE function
      } else {
        // Default/SQLite
        dateTruncFunction = literal(`DATE(createdAt)`); // SQLite DATE function
      }
      break;
  }
  // --- Granularity End ---

  try {
    if (!User || typeof User.findAll !== "function") {
      console.error(
        "ADMIN API Error: User model not available for getReportUserGrowth."
      );
      res.status(500);
      throw new Error("Server configuration error: User model unavailable.");
    }

    // Query to group users by creation date based on granularity
    const results = await User.findAll({
      attributes: [
        [dateTruncFunction, "date_group"], // Use the determined SQL function
        [fn("COUNT", col("id")), "count"], // Count users per group
      ],
      where: {
        createdAt: {
          [Op.between]: [dateStart, dateEnd], // Filter by date range
        },
      },
      group: ["date_group"], // Group by the result of the date function
      order: [[literal("date_group"), "ASC"]], // Order chronologically
      raw: true, // Get plain JSON results
    });

    // Format data for charting libraries (like Recharts)
    const formattedData = results
      .map((row) => {
        try {
          // Ensure date_group is valid before formatting
          const dateValue = row.date_group ? new Date(row.date_group) : null;
          if (!dateValue || isNaN(dateValue.getTime())) {
            console.warn("Skipping row with invalid date_group:", row);
            return null; // Skip rows with invalid dates
          }
          // Use date-fns for consistent formatting
          return {
            name: format(dateValue, dateFormat), // Format date based on granularity
            Users: parseInt(row.count, 10) || 0, // Ensure count is a number
          };
        } catch (dateFormatError) {
          // Catch potential errors during date formatting
          console.error(`Date formatting error for row:`, row, dateFormatError);
          return { name: "Invalid Date", Users: parseInt(row.count, 10) || 0 };
        }
      })
      .filter(Boolean); // Remove any null entries from invalid dates

    console.log(
      `ADMIN: Found ${formattedData.length} user growth data points (Granularity: ${granularity}).`
    );
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error(`ADMIN API Error in getReportUserGrowth:`, error);
    // Provide more specific error message if possible
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error fetching user growth data.",
    });
  }
});

/**
 * @desc    Admin: Get Content Overview counts (Projects, Publications) possibly filtered by date
 * @route   GET /api/admin/reports/content-overview
 * @access  Private/Admin
 */
export const getReportContentOverview = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  console.log(
    `ADMIN API: getReportContentOverview invoked by Admin ${req.user.id}`,
    req.query
  );

  // Build date range filter if start and end dates are provided and valid
  const whereClause = {};
  if (startDate && endDate) {
    try {
      let dS = new Date(startDate);
      let dE = new Date(endDate);
      // Ensure dates are valid and start is before end
      if (!isNaN(dS.getTime()) && !isNaN(dE.getTime()) && dS < dE) {
        dE.setHours(23, 59, 59, 999); // Include full end day
        dS.setHours(0, 0, 0, 0); // Start at beginning of day
        whereClause.createdAt = { [Op.between]: [dS, dE] };
        console.log(
          "Applying date filter to content overview:",
          whereClause.createdAt
        );
      } else {
        console.warn(
          "Invalid or out-of-order date range provided for content overview, ignoring filter."
        );
      }
    } catch (e) {
      console.warn(
        "Error parsing date range for content overview, ignoring filter:",
        e.message
      );
    }
  }

  try {
    // Fetch counts concurrently using the safe helper and date filter
    const [projectCount, pubCount] = await Promise.all([
      safeCount(Project, { where: whereClause }),
      safeCount(Publication, { where: whereClause }),
      // safeCount(Comment, { where: whereClause }) // Keep removed/commented
    ]);

    // Format data suitable for pie charts or simple displays
    const formattedData = [
      { name: "Projects", value: projectCount },
      { name: "Publications", value: pubCount },
      // { name: 'Comments', value: commentCount }, // Keep removed/commented
    ];

    console.log(
      `ADMIN: Content overview counts (filtered: ${
        whereClause.createdAt ? "Yes" : "No"
      }):`,
      formattedData
    );
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error(`ADMIN API Error in getReportContentOverview:`, error);
    res.status(500).json({
      success: false,
      message: "Server error fetching content overview report.",
    });
  }
});
// --- END Report Controller Functions ---

// --- Add other admin-specific controller functions below if needed ---
// Example: Function to trigger a site backup, clear cache, etc.
