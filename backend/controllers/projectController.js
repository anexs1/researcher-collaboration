// backend/controllers/projectController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Ensure models are correctly loaded from db object
const { Project, User, CollaborationRequest, Member } = db; // Include all needed models

// Define fields using MODEL's camelCase keys
const projectListFields = [
  "id",
  "title",
  "description",
  "status",
  "ownerId", // Model field (maps to owner_id in DB via Project's underscored:true)
  "createdAt", // Model field (maps to created_at in DB via Project's underscored:true)
  "updatedAt", // Model field (maps to updated_at in DB via Project's underscored:true)
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
 * @access  Private
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getAllProjects ---");
  // Verify models are loaded (add this check if unsure)
  if (!Project || !User) {
    console.error(
      "FATAL: Project or User model is undefined in getAllProjects. Check models/index.js."
    );
    throw new Error(
      "Server configuration error: Required models not available."
    );
  }

  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const where = {};

    // Apply filters using MODEL field names (camelCase)
    if (status) {
      // Optional: Add validation for status value if needed
      where.status = status;
    }
    if (search) {
      // Using Op.like for broader DB compatibility (MySQL, SQLite)
      // Use Op.iLike if using PostgreSQL and case-insensitivity is desired
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } }, // Model field 'title'
        { description: { [Op.like]: `%${search}%` } }, // Model field 'description'
      ];
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    // Validate pagination parameters
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

    console.log(
      "Fetching projects with filters:",
      where,
      "Limit:",
      parsedLimit,
      "Offset:",
      offset
    );

    // Use Model field names (camelCase) in query options
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListFields, // Uses MODEL fields
      include: [
        {
          model: User, // The associated User model
          as: "owner", // <<< CRITICAL: MUST match alias in Project.associate -> belongsTo(User)
          // Use User model's field names (camelCase, as User model has underscored:false)
          attributes: ["id", "username", "profilePictureUrl"],
          required: false, // Use left join; find projects even if owner user somehow doesn't exist
        },
      ],
      // Use Project model's field name (camelCase); Sequelize maps to created_at via underscored:true
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true, // Important for count accuracy with includes
    });

    console.log(`Found ${count} projects total, returning ${projects.length}`);
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    // Provide more specific error info if possible
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    if (
      error.message.includes("relation") ||
      error.message.includes("associated")
    ) {
      console.error("Hint: Check model associations and 'as' aliases.");
    }
    if (
      error.message.includes("column") &&
      error.message.includes("does not exist")
    ) {
      console.error(
        "Hint: Check model 'underscored' setting vs DB column names and attributes list."
      );
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching projects",
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
  if (!Project || !User) {
    throw new Error("Server config error: Models not loaded.");
  } // Verify models
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const ownerId = req.user.id;
    console.log(`Fetching projects owned by user ${ownerId}`);

    // Use Model field names (camelCase)
    const projects = await Project.findAll({
      where: { ownerId: ownerId }, // Project model field
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner", // Must match Project.belongsTo alias
          attributes: ["id", "username", "profilePictureUrl"], // User model fields
          required: false, // Left join
        },
      ],
      order: [["updatedAt", "DESC"]], // Project model field
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
 * @access  Private
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  console.log(`--- ENTERING getProjectById for ID: ${projectId} ---`);
  if (!Project || !User) {
    throw new Error("Server config error: Models not loaded.");
  } // Verify models
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
        // Example: Include members using the many-to-many alias
        // {
        //    model: User,
        //    as: 'members', // <<< Alias from Project.belongsToMany(User, { as: 'members' })
        //    attributes: ['id', 'username', 'profilePictureUrl'],
        //    through: { attributes: [] } // Exclude join table attributes unless needed
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
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = asyncHandler(async (req, res) => {
  console.log("--- ENTERING createProject ---");
  if (!Project || !User) {
    throw new Error("Server config error: Models not loaded.");
  } // Verify models
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

    if (!title || !description) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Title and description are required",
        });
    }
    const collaborators = parseInt(requiredCollaborators) || 1;
    if (isNaN(collaborators) || collaborators < 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Required collaborators must be a non-negative number.",
        });
    }

    // Use Model field names (camelCase) for creation data
    const newProjectData = {
      title,
      description,
      requiredCollaborators: collaborators,
      status,
      ownerId,
    };

    const project = await Project.create(newProjectData);
    console.log(`Project created with ID: ${project.id}`);

    // Fetch the created project with owner details to return
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
    console.error("Error creating project:", error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({ success: false, message: messages });
    }
    if (error.original) {
      console.error("Original Error:", error.original);
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
    throw new Error("Server config error: Models not loaded.");
  } // Verify models

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

    const project = await Project.findByPk(parsedProjectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    if (project.ownerId !== userId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this project",
        });
    }

    const { title, description, requiredCollaborators, status } = req.body;
    console.log("Update data received:", req.body);

    // Use Model field names (camelCase) for updates object
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (requiredCollaborators !== undefined) {
      const collaborators = parseInt(requiredCollaborators);
      if (!isNaN(collaborators) && collaborators >= 0) {
        updates.requiredCollaborators = collaborators;
      }
    }
    if (status !== undefined) updates.status = status; // Add ENUM validation?

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "No valid fields provided for update.",
        });
    }

    console.log("Applying updates:", updates);
    await project.update(updates);
    console.log(`Project ${parsedProjectId} updated successfully.`);

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
    throw new Error("Server config error: Project model not loaded.");
  } // Verify model

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

    const project = await Project.findByPk(parsedProjectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    if (project.ownerId !== userId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this project",
        });
    }

    await project.destroy(); // Cascade should handle related data based on model options
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
 * @desc    Get join requests and active members for a specific project
 * @route   GET /api/projects/:projectId/requests
 * @access  Private (Owner only)
 */
export const getProjectRequests = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user?.id;
  console.log(
    `--- ENTERING getProjectRequests (incl. members) for project ${projectId} by user ${userId} ---`
  );
  // Verify models
  if (!Project || !User || !CollaborationRequest || !Member) {
    throw new Error(
      "Server config error: Required models not loaded for getProjectRequests."
    );
  }

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const parsedProjectId = parseInt(projectId);
  if (isNaN(parsedProjectId)) {
    res.status(400);
    throw new Error("Invalid Project ID.");
  }

  const project = await Project.findByPk(parsedProjectId, {
    attributes: ["id", "ownerId", "title"],
  });
  if (!project) {
    res.status(404);
    throw new Error("Project not found.");
  }
  if (project.ownerId !== userId) {
    res.status(403);
    throw new Error("Forbidden: Not authorized.");
  }

  try {
    const [pendingRequests, activeMembers] = await Promise.all([
      CollaborationRequest.findAll({
        where: { projectId: parsedProjectId, status: "pending" },
        include: [
          {
            model: User,
            as: "requester",
            attributes: ["id", "username", "profilePictureUrl"],
          },
        ],
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
        ],
        order: [["createdAt", "ASC"]], // Use model field
      }),
    ]);

    console.log(
      `Found ${pendingRequests.length} pending requests and ${activeMembers.length} active members.`
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
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage =
      error.message || "Server error while fetching requests and members.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

/**
 * @desc    Get all projects (Admin only - Example)
 * @route   GET /api/admin/projects (or similar)
 * @access  Private/Admin
 */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  // Example: Requires adminOnly middleware on the route
  console.log("--- ENTERING adminGetAllProjects ---");
  // ... Implementation similar to getAllProjects ...
  // You might fetch different attributes or add more filters
  res.status(501).json({ message: "Admin route not fully implemented" }); // Placeholder
});
