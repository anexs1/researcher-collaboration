// backend/controllers/projectController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Ensure models are correctly loaded from db object
// Destructure ALL models used in this file
const { Project, User, CollaborationRequest, Member } = db;

// Define fields using MODEL's camelCase keys
// These arrays help ensure consistency in what's selected
const projectListFields = [
  "id",
  "title",
  "description",
  "status",
  "ownerId", // Model field (Sequelize maps based on Project model's 'underscored')
  "createdAt", // Model field (Sequelize maps based on Project model's 'underscored')
  "updatedAt", // Model field (Sequelize maps based on Project model's 'underscored')
];

const projectDetailFields = [
  "id",
  "title",
  "description",
  "requiredCollaborators",
  "status", // Model fields
  "ownerId",
  "createdAt",
  "updatedAt", // Model fields
];

/**
 * @desc    Get all visible projects with pagination and filtering
 * @route   GET /api/projects
 * @access  Private (can be changed by removing 'protect' middleware on the route)
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getAllProjects ---");
  // Verify models needed for this function are loaded
  if (!Project || !User) {
    console.error(
      "FATAL: Project or User model is undefined in getAllProjects. Check models/index.js."
    );
    // Throwing error here might be better than proceeding
    return res.status(500).json({
      success: false,
      message: "Server configuration error: Models not available.",
    });
  }

  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const where = {};

    // --- Filter Logic ---
    // Apply filters using MODEL field names (camelCase)
    if (status) {
      // Optional: Validate 'status' against Project model's ENUM values if needed
      where.status = status;
    }
    if (search) {
      // Using Op.like for broad compatibility (MySQL, SQLite).
      // Switch to Op.iLike for case-insensitive search IF using PostgreSQL.
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } }, // Model field 'title'
        { description: { [Op.like]: `%${search}%` } }, // Model field 'description'
      ];
    }

    // --- Pagination Logic ---
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    if (
      isNaN(parsedLimit) ||
      parsedLimit <= 0 ||
      isNaN(parsedPage) ||
      parsedPage <= 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters." });
    }
    const offset = (parsedPage - 1) * parsedLimit;

    console.log(
      "Fetching projects with filters:",
      where,
      "Limit:",
      parsedLimit,
      "Offset:",
      offset
    );

    // --- Database Query ---
    // Use Model field names (camelCase) in query options
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListFields, // Select specific fields for list view
      include: [
        {
          model: User, // Specify the User model to join with
          as: "owner", // <<< CRITICAL: Must match alias in Project.associate -> belongsTo(User, { as: 'owner' })
          // Select specific User fields (using User model's field names - assumes underscored:false for User)
          attributes: ["id", "username", "profilePictureUrl"],
          required: false, // Use LEFT JOIN (important if owner might be deleted or null)
        },
      ],
      // Order by Project model's 'createdAt' field (Sequelize handles mapping)
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true, // Recommended for accuracy when using 'include' with limit/offset
    });

    console.log(
      `Found ${count} projects total, returning ${projects.length} for page ${parsedPage}`
    );

    // --- Success Response ---
    res.status(200).json({
      success: true,
      count, // Total count matching filters
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: projects, // Array of project objects for the current page
    });
  } catch (error) {
    // --- Error Handling ---
    console.error("Error fetching projects:", error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    // Provide hints based on common errors
    if (error.message.includes("associated")) {
      console.error("Hint: Check model associations and 'as' aliases.");
    }
    if (
      error.message.includes("column") &&
      error.message.includes("does not exist")
    ) {
      console.error(
        "Hint: Check model 'underscored' setting vs DB column names and attribute lists."
      );
    }

    // Send generic error response
    res.status(500).json({
      success: false,
      message: "Server error while fetching projects",
      // Only include detailed error in development
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Get projects owned by the logged-in user
 * @route   GET /api/projects/my
 * @access  Private
 */
export const getMyProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getMyProjects ---");
  // Verify models are loaded
  if (!Project || !User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: Models not loaded.",
    });
  }

  try {
    // Ensure user is authenticated
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const ownerId = req.user.id;
    console.log(`Fetching projects owned by user ${ownerId}`);

    // Use Model field names (camelCase)
    const projects = await Project.findAll({
      where: { ownerId: ownerId }, // Project model field 'ownerId'
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner", // Must match Project.belongsTo alias
          attributes: ["id", "username", "profilePictureUrl"], // User model fields
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]], // Project model field 'updatedAt'
    });

    console.log(`Found ${projects.length} projects for user ${ownerId}`);
    res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    res.status(500).json({
      success: false,
      message: "Server error while fetching your projects",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Private (can be public by removing 'protect' middleware)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  console.log(`--- ENTERING getProjectById for ID: ${projectId} ---`);
  // Verify models
  if (!Project || !User || !Member) {
    return res.status(500).json({
      success: false,
      message: "Server config error: Models not loaded.",
    });
  }

  try {
    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Project ID format." });
    }

    // Use Model field names (camelCase)
    const project = await Project.findByPk(parsedProjectId, {
      attributes: projectDetailFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
          required: false,
        },
        // Example: Include members (adjust alias and attributes as needed)
        // {
        //    model: User,
        //    as: 'members', // Alias from Project.belongsToMany(User, { as: 'members' })
        //    attributes: ['id', 'username', 'profilePictureUrl'],
        //    through: { attributes: ['role', 'status'] } // Include attributes from the Member join table
        // }
      ],
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    console.log(`Project ${parsedProjectId} found successfully.`);
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    res.status(500).json({
      success: false,
      message: "Server error fetching project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Create a new project and add owner as member
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = asyncHandler(async (req, res) => {
  console.log("--- ENTERING createProject ---");
  // Verify models
  if (!Project || !User || !Member) {
    return res.status(500).json({
      success: false,
      message: "Server config error: Models not loaded.",
    });
  }

  let transaction; // Define transaction variable
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const ownerId = req.user.id;

    const {
      title,
      description,
      requiredCollaborators,
      status = "Planning",
    } = req.body;
    console.log(`User ${ownerId} creating project with data:`, req.body);

    // --- Input Validation ---
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }
    const collaborators = parseInt(requiredCollaborators) || 1; // Default to 1 if not provided/invalid
    if (isNaN(collaborators) || collaborators < 0) {
      return res.status(400).json({
        success: false,
        message: "Required collaborators must be a non-negative number.",
      });
    }
    // Optional: Validate status against ENUM values if desired

    // --- Database Operations within Transaction ---
    transaction = await db.sequelize.transaction(); // Start transaction using imported sequelize instance

    // 1. Create Project record (Use Model field names - camelCase)
    const newProjectData = {
      title,
      description,
      requiredCollaborators: collaborators,
      status,
      ownerId,
    };
    const project = await Project.create(newProjectData, { transaction });
    console.log(`Project created with ID: ${project.id}`);

    // 2. Add Owner as Member (Use Model field names - camelCase)
    console.log(
      `Adding owner ${ownerId} as active member to project ${project.id}`
    );
    await Member.create(
      {
        userId: ownerId,
        projectId: project.id,
        role: "owner", // Assign 'owner' role
        status: "active",
        // joinedAt will be set by model default
      },
      { transaction }
    );
    console.log("Owner added as member.");

    // 3. Commit Transaction
    await transaction.commit();
    console.log("Project creation transaction committed.");
    transaction = null; // Clear transaction variable

    // --- Fetch and Return Created Project (AFTER COMMIT) ---
    const createdProject = await Project.findByPk(project.id, {
      attributes: projectDetailFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
    });

    res.status(201).json({ success: true, data: createdProject });
  } catch (error) {
    // --- Error Handling ---
    // Rollback transaction if it exists and hasn't finished
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back due to error.");
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }
    console.error("Error creating project:", error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({ success: false, message: messages });
    }
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    res.status(500).json({
      success: false,
      message: "Server error creating project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private (Owner only)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user?.id;
  console.log(
    `--- ENTERING updateProject for ID: ${projectId} by user ${userId} ---`
  );
  if (!Project || !User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: Models not loaded.",
    });
  }

  try {
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Project ID format." });
    }

    // Fetch project first to check ownership
    const project = await Project.findByPk(parsedProjectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    if (project.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    const { title, description, requiredCollaborators, status } = req.body;
    console.log("Update data received:", req.body);

    // Use Model field names (camelCase) for updates object
    const updates = {};
    if (title !== undefined) updates.title = title; // Add length/empty validation?
    if (description !== undefined) updates.description = description; // Add empty validation?
    if (requiredCollaborators !== undefined) {
      const collaborators = parseInt(requiredCollaborators);
      // Only update if it's a valid non-negative number
      if (!isNaN(collaborators) && collaborators >= 0) {
        updates.requiredCollaborators = collaborators;
      }
    }
    if (status !== undefined) {
      // Optional: Validate status against ENUM values
      const validStatuses = Project.getAttributes().status.values; // Get ENUM values from model
      if (validStatuses.includes(status)) {
        updates.status = status;
      } else {
        console.warn(`Invalid status value received for update: ${status}`);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    console.log("Applying updates:", updates);
    await project.update(updates); // Use instance update method
    console.log(`Project ${parsedProjectId} updated successfully.`);

    // Fetch the updated project with includes to return
    const updatedProject = await Project.findByPk(project.id, {
      attributes: projectDetailFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
    });

    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({ success: false, message: messages });
    }
    if (error.original) {
      console.error("Original Error:", error.original);
    }
    res.status(500).json({
      success: false,
      message: "Server error updating project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private (Owner only)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user?.id;
  console.log(
    `--- ENTERING deleteProject for ID: ${projectId} by user ${userId} ---`
  );
  if (!Project) {
    return res.status(500).json({
      success: false,
      message: "Server config error: Project model not loaded.",
    });
  }

  try {
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Project ID format." });
    }

    // Fetch project to check ownership before deleting
    const project = await Project.findByPk(parsedProjectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    if (project.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    // destroy() will trigger hooks and potentially CASCADE deletes based on model associations
    await project.destroy();
    console.log(`Project ${parsedProjectId} deleted successfully.`);
    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    if (error.original) {
      console.error("Original Error:", error.original);
    }
    res.status(500).json({
      success: false,
      message: "Server error deleting project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Get PENDING join requests AND ACTIVE members for a specific project
 * @route   GET /api/projects/:projectId/requests
 * @access  Private (Owner only)
 */
export const getProjectRequests = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user?.id;
  console.log(
    `--- ENTERING getProjectRequests (incl. members) for project ${projectId} by user ${userId} ---`
  );
  // Verify models needed for this function are loaded
  if (!Project || !User || !CollaborationRequest || !Member) {
    console.error(
      "FATAL: Required models not loaded for getProjectRequests. Check models/index.js."
    );
    return res.status(500).json({
      success: false,
      message: "Server config error: Models not loaded.",
    });
  }

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  const parsedProjectId = parseInt(projectId);
  if (isNaN(parsedProjectId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Project ID." });
  }

  // Check project existence and ownership
  const project = await Project.findByPk(parsedProjectId, {
    attributes: ["id", "ownerId", "title"],
  });
  if (!project) {
    return res
      .status(404)
      .json({ success: false, message: "Project not found." });
  }
  if (project.ownerId !== userId) {
    return res
      .status(403)
      .json({ success: false, message: "Forbidden: Not authorized." });
  }

  try {
    // Fetch pending requests and active members in parallel
    const [pendingRequests, activeMembers] = await Promise.all([
      CollaborationRequest.findAll({
        where: { projectId: parsedProjectId, status: "pending" },
        include: [
          {
            model: User,
            as: "requester",
            attributes: ["id", "username", "profilePictureUrl"],
          },
        ], // Use model fields/alias
        order: [["createdAt", "DESC"]], // Use model field
      }),
      Member.findAll({
        where: { projectId: parsedProjectId, status: "active" },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "profilePictureUrl"],
          },
        ], // Use model fields/alias
        order: [["createdAt", "ASC"]], // Use model field (maps to created_at)
      }),
    ]);

    console.log(
      `Found ${pendingRequests.length} pending requests and ${activeMembers.length} active members for project ${parsedProjectId}.`
    );
    res.status(200).json({
      success: true,
      projectTitle: project.title,
      data: { pendingRequests, approvedMembers: activeMembers },
    });
  } catch (error) {
    console.error(
      `Error fetching requests/members for project ${projectId}:`,
      error
    );
    if (error.message.includes("associated")) {
      console.error("Hint: Check model associations and 'as' aliases.");
    }
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    res.status(500).json({
      success: false,
      message: "Server error fetching requests and members.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Get all projects (Admin only - Example Placeholder)
 * @route   GET /api/admin/projects (mount separately)
 * @access  Private/Admin
 */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING adminGetAllProjects ---");
  // Add implementation here, similar to getAllProjects
  // Ensure route is protected by adminOnly middleware
  res.status(501).json({ message: "Admin route not fully implemented" });
});
