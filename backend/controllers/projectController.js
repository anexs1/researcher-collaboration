import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";

const { Project, User } = db;

// Define fields for different views
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
 * @desc    Get all visible projects
 * @route   GET /api/projects
 * @access  Private
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
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
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const projects = await Project.findAll({
      where: { ownerId: req.user.id },
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

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
 * @access  Public
 */
export const getProjectById = asyncHandler(async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      attributes: projectDetailFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
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
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { title, description, requiredCollaborators, status } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const project = await Project.create({
      title,
      description,
      requiredCollaborators: parseInt(requiredCollaborators) || 1,
      status: status || "Planning",
      ownerId: req.user.id,
    });

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

    res.status(201).json({
      success: true,
      data: createdProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message).join(", ");
      return res.status(400).json({
        success: false,
        message: messages,
      });
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
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check ownership
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    const { title, description, requiredCollaborators, status } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (requiredCollaborators !== undefined) {
      updates.requiredCollaborators = parseInt(requiredCollaborators);
    }
    if (status !== undefined) updates.status = status;

    await project.update(updates);

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
    console.error("Error updating project:", error);
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
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check ownership
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    await project.destroy();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @desc    Get all projects (Admin only)
 * @route   GET /api/admin/projects
 * @access  Private/Admin
 */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  try {
    const projects = await Project.findAll({
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching all projects:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching all projects",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
