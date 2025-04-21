// File: backend/controllers/projectController.js

// --- CORRECT IMPORT ---
// Import the fully configured db object from models/index.js
import db from "../models/index.js";
// --- END CORRECT IMPORT ---

import asyncHandler from "express-async-handler";
import { Op, Sequelize } from "sequelize"; // Import Op and Sequelize

// Access models correctly via the db object
const { Project, User } = db; // Ensure 'User' model is exported from db object

// --- GET Projects for Logged-in User (owned OR collaborator - using corrected JSON query logic) ---
const getProjects = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    // Use optional chaining for safety
    res.status(401);
    throw new Error("Not authorized");
  }
  const userId = req.user.id; // This should be the correct ID type (e.g., number or string/UUID)

  try {
    // --- !!! IMPORTANT: JSON QUERYING !!! ---
    // Querying JSON arrays directly with Op.like is unreliable.
    // Use database-specific functions for efficiency and correctness.
    // Choose the appropriate condition based on your database:
    // Example for PostgreSQL (using @> operator - assumes IDs are stored as numbers in JSON):
    // const collaboratorCondition = { collaborators: { [Op.contains]: [userId] } };
    // Example for MySQL >= 5.7 (using JSON_CONTAINS - assumes IDs are stored as numbers):
    // const collaboratorCondition = Sequelize.where(Sequelize.fn('JSON_CONTAINS', Sequelize.col('collaborators'), Sequelize.cast(userId, 'CHAR')), true);
    // --- TEMPORARY/LESS RELIABLE FALLBACK (using Op.like) ---
    const collaboratorCondition = {
      collaborators: {
        // WARNING: THIS IS INEFFICIENT AND MAY NOT WORK CORRECTLY FOR ALL CASES
        [Op.like]: `%${JSON.stringify(userId)}%`,
      },
    };
    // --- END JSON QUERYING NOTE ---

    const projects = await Project.findAll({
      where: {
        [Op.or]: [
          { ownerId: userId },
          collaboratorCondition, // Use the selected condition here
        ],
      },
      order: [["createdAt", "DESC"]],
      include: [
        // Include owner details
        {
          model: User,
          as: "owner", // Matches alias in Project.associate
          // --- CORRECTED ATTRIBUTES ---
          attributes: ["id", "username", "email"], // Request ONLY existing columns
          // --- END CORRECTION ---
        },
      ],
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500);
    throw new Error(`Failed to fetch projects: ${err.message}`);
  }
});

// --- GET Single Project by ID ---
const getProjectById = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    res.status(401);
    throw new Error("Not authorized");
  }
  const { projectId: requestedId } = req.params;
  const userId = req.user.id;

  console.log(
    `Backend: Fetching project with ID: ${requestedId} for user: ${userId}`
  );

  try {
    // --- Re-apply JSON Querying logic/warning ---
    // Temporary Fallback:
    const collaboratorCondition = {
      collaborators: { [Op.like]: `%${JSON.stringify(userId)}%` },
    }; // WARNING: Inefficient/Unreliable
    // --- End JSON Querying ---

    const project = await Project.findOne({
      where: {
        id: requestedId,
        // Optional: Add access control here if needed
        // [Op.or]: [
        //   { ownerId: userId },
        //   collaboratorCondition,
        // ],
      },
      include: [
        {
          model: User,
          as: "owner",
          // --- CORRECTED ATTRIBUTES ---
          attributes: ["id", "username", "email"], // Request ONLY existing columns
          // --- END CORRECTION ---
        },
        // Optional: Include collaborator details if Many-to-Many is set up
      ],
    });

    if (!project) {
      console.log(
        `Backend: Project with ID ${requestedId} not found or access denied for user ${userId}.`
      );
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.log(`Backend: Project ${requestedId} found.`);
    res.status(200).json({ success: true, data: project });
  } catch (err) {
    console.error(`Error fetching project ID ${requestedId}:`, err);
    res.status(500);
    throw new Error(`Failed to fetch project: ${err.message}`);
  }
});

// --- CREATE Project ---
const createProject = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    res.status(401);
    throw new Error("Not authorized");
  }
  const userId = req.user.id;
  const { title, description, status, collaborators, members, tags, dueDate } =
    req.body;

  if (!title?.trim() || !description?.trim()) {
    res.status(400);
    throw new Error("Title and description are required");
  }

  try {
    const safeCollaborators = Array.isArray(collaborators)
      ? collaborators.map(String)
      : [];
    const safeTags = Array.isArray(tags) ? tags : [];
    const safeMembers = Array.isArray(members) ? members : []; // You'll handle invitations separately

    const newProject = await Project.create({
      title: title.trim(),
      description: description.trim(),
      status: status || "Planning",
      collaborators: safeCollaborators,
      tags: safeTags,
      dueDate: dueDate || null,
      ownerId: userId,
      // Note: 'members' isn't saved directly here unless it's a Project model column
    });

    // Fetch the created project with owner details
    const projectWithOwner = await Project.findByPk(newProject.id, {
      include: [
        {
          model: User,
          as: "owner",
          // --- CORRECTED ATTRIBUTES ---
          attributes: ["id", "username", "email"], // Request ONLY existing columns
          // --- END CORRECTION ---
        },
      ],
    });

    if (!projectWithOwner) {
      console.error(
        `Failed to fetch project ${newProject.id} immediately after creation.`
      );
      return res.status(201).json({
        success: true,
        message: "Project created, but failed to fetch owner details.",
        data: newProject,
      });
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: projectWithOwner,
    });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500);
    throw new Error(`Failed to create project: ${err.message}`);
  }
});

// --- UPDATE Project ---
const updateProject = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    res.status(401);
    throw new Error("Not authorized");
  }
  const { projectId: id } = req.params;
  const userId = req.user.id;
  const updates = req.body;

  try {
    const project = await Project.findOne({
      where: { id, ownerId: userId }, // Only allow owner to update (adjust if needed)
    });

    if (!project) {
      res.status(404);
      throw new Error("Project not found or user not authorized to update");
    }

    const allowedUpdates = [
      "title",
      "description",
      "status",
      "collaborators",
      "tags",
      "dueDate",
      "members",
    ];
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === "title" || key === "description") {
          project[key] =
            typeof updates[key] === "string"
              ? updates[key].trim()
              : updates[key];
        } else if (
          key === "collaborators" ||
          key === "tags" ||
          key === "members"
        ) {
          project[key] = Array.isArray(updates[key])
            ? updates[key]
            : project[key];
        } else if (key === "dueDate") {
          project[key] = updates[key] || null;
        } else {
          project[key] = updates[key];
        }
      }
    });

    const updatedProject = await project.save();

    // Fetch the updated project with owner details
    const projectWithOwner = await Project.findByPk(updatedProject.id, {
      include: [
        {
          model: User,
          as: "owner",
          // --- CORRECTED ATTRIBUTES ---
          attributes: ["id", "username", "email"], // Request ONLY existing columns
          // --- END CORRECTION ---
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: projectWithOwner || updatedProject,
    });
  } catch (err) {
    console.error(`Error updating project ID ${id}:`, err);
    res.status(
      err.message.includes("not found") ||
        err.message.includes("not authorized")
        ? 404
        : 500
    );
    throw new Error(`Failed to update project: ${err.message}`);
  }
});

// --- DELETE Project ---
const deleteProject = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    res.status(401);
    throw new Error("Not authorized");
  }
  const { projectId: id } = req.params;
  const userId = req.user.id;

  try {
    const project = await Project.findOne({ where: { id, ownerId: userId } });
    if (!project) {
      res.status(404);
      throw new Error("Project not found or user not authorized to delete");
    }
    await project.destroy();
    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: { id: id },
    });
  } catch (err) {
    console.error(`Error deleting project ID ${id}:`, err);
    res.status(
      err.message.includes("not found") ||
        err.message.includes("not authorized")
        ? 404
        : 500
    );
    throw new Error(`Failed to delete project: ${err.message}`);
  }
});

// Export the controller methods object
export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
