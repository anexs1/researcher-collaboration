import db from "../models/index.js";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize"; // ADD THIS

const { Project, User } = db;

// --- GET Projects for Logged-in User (owned OR collaborated) ---
const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const projects = await Project.findAll({
      where: {
        [Op.or]: [
          { ownerId: userId },
          db.Sequelize.literal(
            `JSON_CONTAINS(collaborators, CAST('${userId}' AS JSON), '$')`
          ),
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (err) {
    console.error("Error fetching projects:", err); // Log the error for debugging
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch projects" });
  }
});

// --- GET Single Project by ID ---
const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await Project.findOne({
      where: {
        id,
        [Op.or]: [
          { ownerId: userId },
          db.Sequelize.literal(
            `JSON_CONTAINS(collaborators, CAST('${userId}' AS JSON), '$')`
          ),
        ],
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
      return;
    }

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    console.error("Error fetching project by ID:", err); // Log the error for debugging
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch project" });
  }
});

// --- CREATE Project ---
const createProject = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { title, description, status, collaborators, tags, dueDate } = req.body;

  if (!title || !description) {
    res
      .status(400)
      .json({ success: false, message: "Title and description are required" });
    return;
  }

  try {
    const newProject = await Project.create({
      title: title.trim(),
      description: description.trim(),
      status: status || "Planning",
      collaborators: Array.isArray(collaborators) ? collaborators : [],
      tags: Array.isArray(tags) ? tags : [],
      dueDate: dueDate || null,
      ownerId: userId,
    });

    res.status(201).json({ success: true, data: newProject });
  } catch (err) {
    console.error("Error creating project:", err); // Log the error for debugging
    res
      .status(500)
      .json({ success: false, message: "Failed to create project" });
  }
});

// --- UPDATE Project ---
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, description, status, collaborators, tags, dueDate } = req.body;

  try {
    const project = await Project.findOne({
      where: { id, ownerId: userId },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found or user not authorized",
      });
      return;
    }

    project.title = title?.trim() || project.title;
    project.description = description?.trim() || project.description;
    project.status = status || project.status;
    if (collaborators !== undefined) {
      project.collaborators = Array.isArray(collaborators) ? collaborators : [];
    }
    if (tags !== undefined) {
      project.tags = Array.isArray(tags) ? tags : [];
    }
    if (dueDate !== undefined) {
      project.dueDate = dueDate || null;
    }

    const updatedProject = await project.save();

    res.status(200).json({ success: true, data: updatedProject });
  } catch (err) {
    console.error("Error updating project:", err); // Log the error for debugging
    res
      .status(500)
      .json({ success: false, message: "Failed to update project" });
  }
});

// --- DELETE Project ---
const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await Project.findOne({
      where: { id, ownerId: userId },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found or user not authorized",
      });
      return;
    }

    await project.destroy();

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting project:", err); // Log the error for debugging
    res
      .status(500)
      .json({ success: false, message: "Failed to delete project" });
  }
});

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
