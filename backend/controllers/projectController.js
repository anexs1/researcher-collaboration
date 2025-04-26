import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Import all necessary models used in this controller
const { Project, User, CollaborationRequest } = db;

// Define fields for different views (optional, but good practice)
const projectListFields = [
  "id",
  "title",
  "description",
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
];

const projectDetailFields = [
  "id",
  "title",
  "description",
  "requiredCollaborators",
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
];

/**
 * @desc    Get all visible projects with pagination and filtering
 * @route   GET /api/projects
 * @access  Private (Assumes logged-in users see projects)
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getAllProjects ---");
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } }, // Use iLike for case-insensitive search (PostgreSQL)
        // Use Op.like for MySQL/SQLite case-sensitivity depends on DB collation
        // { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        // { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    console.log(
      "Fetching projects with filters:",
      where,
      "Limit:",
      parsedLimit,
      "Offset:",
      offset
    );

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"], // Ensure profilePictureUrl exists or remove
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true, // Add distinct for accurate count with includes
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
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const ownerId = req.user.id;
    console.log(`Fetching projects owned by user ${ownerId}`);

    const projects = await Project.findAll({
      where: { ownerId: ownerId },
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner", // This should match the alias in Project model
          attributes: ["id", "username", "profilePictureUrl"], // Ensure profilePictureUrl exists or remove
        },
      ],
      order: [["updatedAt", "DESC"]], // Often more useful to see recently updated owned projects
    });

    console.log(`Found ${projects.length} projects for user ${ownerId}`);
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
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
 * @access  Private (Adjust to Public if needed by removing auth)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  console.log(`--- ENTERING getProjectById for ID: ${projectId} ---`);
  try {
    if (isNaN(parseInt(projectId))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Project ID format." });
    }

    const project = await Project.findByPk(projectId, {
      attributes: projectDetailFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
        },
        // Add other includes if needed (e.g., members, tasks)
        // { model: Member, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] }
      ],
    });

    if (!project) {
      console.log(`Project with ID ${projectId} not found.`);
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.log(`Project ${projectId} found successfully.`);
    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching project",
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
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const ownerId = req.user.id;

    // TODO: Handle file upload if 'projectImageFile' was intended for image upload
    // const projectImageFile = req.file;
    // if (projectImageFile) { /* Upload to cloud storage, get URL */ }

    const {
      title,
      description,
      requiredCollaborators,
      status = "Planning",
    } = req.body; // Default status
    console.log(`User ${ownerId} creating project with data:`, req.body);

    // Basic Validation
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

    const newProjectData = {
      title,
      description,
      requiredCollaborators: collaborators,
      status,
      ownerId: ownerId,
      // imageUrl: uploadedImageUrl || null, // Add if handling image upload
    };

    const project = await Project.create(newProjectData);
    console.log(`Project created with ID: ${project.id}`);

    // Fetch the created project with owner details to return
    const createdProject = await Project.findByPk(project.id, {
      attributes: projectDetailFields, // Use detailed fields for response
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: createdProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({
      success: false,
      message: "Server error while creating project",
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

  try {
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    if (isNaN(parseInt(projectId))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Project ID format." });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check ownership
    if (project.ownerId !== userId) {
      console.log(
        `User ${userId} failed authorization to update project ${projectId} owned by ${project.ownerId}`
      );
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }
    console.log(`User ${userId} authorized to update project ${projectId}`);

    // TODO: Handle potential file update
    // const projectImageFile = req.file;
    // if (projectImageFile) { /* Upload, get new URL, maybe delete old */ }

    const { title, description, requiredCollaborators, status } = req.body;
    console.log("Update data received:", req.body);

    // Build updates object dynamically based on provided fields
    const updates = {};
    if (title !== undefined && title !== null && title !== "")
      updates.title = title; // Add validation if needed
    if (description !== undefined && description !== null && description !== "")
      updates.description = description;
    if (requiredCollaborators !== undefined && requiredCollaborators !== null) {
      const collaborators = parseInt(requiredCollaborators);
      if (!isNaN(collaborators) && collaborators >= 0) {
        updates.requiredCollaborators = collaborators;
      } else {
        console.warn(
          `Invalid requiredCollaborators value received: ${requiredCollaborators}`
        );
        // Optionally return a 400 error here
      }
    }
    if (status !== undefined && status !== null && status !== "")
      updates.status = status; // Add ENUM validation if needed
    // if (uploadedImageUrl) updates.imageUrl = uploadedImageUrl;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    console.log("Applying updates:", updates);
    await project.update(updates);
    console.log(`Project ${projectId} updated successfully.`);

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

    res.status(200).json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error(`Error updating project ${projectId}:`, error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating project",
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

  try {
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    if (isNaN(parseInt(projectId))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Project ID format." });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check ownership
    if (project.ownerId !== userId) {
      console.log(
        `User ${userId} failed authorization to delete project ${projectId} owned by ${project.ownerId}`
      );
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }
    console.log(`User ${userId} authorized to delete project ${projectId}`);

    // Consider using a transaction if deleting related data (members, requests, tasks)
    await project.destroy(); // This will cascade delete based on model options (like onDelete: 'CASCADE')
    console.log(`Project ${projectId} deleted successfully.`);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Get join requests for a specific project
 * @route   GET /api/projects/:projectId/requests
 * @access  Private (Owner only)
 */
export const getProjectRequests = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const requestedStatus = req.query.status || "pending"; // Default to pending
  const userId = req.user?.id;

  console.log(
    `--- ENTERING getProjectRequests for project ${projectId}, status ${requestedStatus} by user ${userId} ---`
  );

  // 1. Validate Input & Auth
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!projectId || isNaN(parseInt(projectId))) {
    res.status(400);
    throw new Error("Invalid Project ID.");
  }
  const validStatuses = ["pending", "approved", "rejected"];
  if (!validStatuses.includes(requestedStatus)) {
    res.status(400);
    throw new Error(
      `Invalid status filter. Must be one of: ${validStatuses.join(", ")}`
    );
  }

  // 2. Find the project and verify ownership (Authorization)
  const project = await Project.findByPk(projectId, {
    attributes: ["id", "ownerId", "title"],
  });
  if (!project) {
    res.status(404);
    throw new Error("Project not found.");
  }
  if (project.ownerId !== userId) {
    res.status(403);
    throw new Error(
      "Forbidden: You are not authorized to view requests for this project."
    );
  }
  console.log(`User ${userId} is authorized owner for project ${projectId}`);

  // 3. Fetch the collaboration/join requests
  try {
    const requests = await CollaborationRequest.findAll({
      where: {
        projectId: projectId,
        status: requestedStatus,
      },
      include: [
        {
          model: User,
          as: "requester", // Matches alias in CollaborationRequest model
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`Found ${requests.length} requests matching criteria.`);
    res.status(200).json({
      success: true,
      count: requests.length,
      projectTitle: project.title,
      data: requests,
    });
  } catch (error) {
    console.error(`Error fetching requests for project ${projectId}:`, error);
    const statusCode =
      error.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
    const responseMessage =
      error.message || "Server error while fetching join requests.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: responseMessage });
    }
  }
});

/**
 * @desc    Get all projects (Example Admin endpoint)
 * @route   GET /api/admin/projects
 * @access  Private/Admin (Requires adminOnly middleware)
 */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING adminGetAllProjects ---");
  try {
    // Assuming adminOnly middleware verified the user's role
    const { page = 1, limit = 10, search } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username"], // Maybe don't need picture for admin list
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });

    console.log(`Admin fetched ${count} projects total.`);
    res.status(200).json({
      success: true,
      count: projects.length,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching all projects for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching all projects",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
