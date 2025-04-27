// backend/controllers/projectController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";

// Destructure needed models
const { Project, User, CollaborationRequest, Member, sequelize } = db; // Added sequelize for transaction

// Define fields using MODEL's camelCase keys
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

/** @desc Get all projects ... */
export const getAllProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getAllProjects ---");
  if (!Project || !User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: Models not loaded.",
    });
  }
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const where = {};
    if (status) where.status = status; // Model field
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } }, // Model field
        { description: { [Op.like]: `%${search}%` } }, // Model field
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

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListFields, // Model fields
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
          required: false, // User model fields
        },
      ],
      order: [["createdAt", "DESC"]], // Project model field
      limit: parsedLimit,
      offset,
      distinct: true,
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
    /* ... error handling ... */
  }
});

/** @desc Get projects owned by the logged-in user ... */
export const getMyProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING getMyProjects ---");
  if (!Project || !User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: Models not loaded.",
    });
  }
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const ownerId = req.user.id;
    console.log(`Fetching projects owned by user ${ownerId}`);

    const projects = await Project.findAll({
      where: { ownerId: ownerId }, // Model field
      attributes: projectListFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]], // Model field
    });

    console.log(`Found ${projects.length} projects for user ${ownerId}`);
    res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    /* ... error handling ... */
  }
});

/** @desc Get a single project by ID ... */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  console.log(`--- ENTERING getProjectById for ID: ${projectId} ---`);
  if (!Project || !User) {
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

    const project = await Project.findByPk(parsedProjectId, {
      attributes: projectDetailFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
          required: false,
        },
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
    /* ... error handling ... */
  }
});

/** @desc Create a new project and add owner as member ... */
export const createProject = asyncHandler(async (req, res) => {
  console.log("--- ENTERING createProject ---");
  if (!Project || !User || !Member) {
    return res.status(500).json({
      success: false,
      message: "Server config error: Models not loaded.",
    });
  }
  let transaction;
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
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }
    const collaborators = parseInt(requiredCollaborators) || 1;
    if (isNaN(collaborators) || collaborators < 0) {
      return res.status(400).json({
        success: false,
        message: "Collaborators must be non-negative.",
      });
    }

    transaction = await sequelize.transaction(); // Use sequelize from db object

    // Use Model field names (camelCase)
    const newProjectData = {
      title,
      description,
      requiredCollaborators: collaborators,
      status,
      ownerId,
    };
    const project = await Project.create(newProjectData, { transaction });
    console.log(`Project created with ID: ${project.id}`);

    console.log(`Adding owner ${ownerId} as member to project ${project.id}`);
    await Member.create(
      {
        userId: ownerId,
        projectId: project.id,
        role: "owner",
        status: "active",
      },
      { transaction }
    );
    console.log("Owner added as member.");

    await transaction.commit();
    transaction = null;

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
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back.");
      } catch (rbError) {
        console.error("Rollback error:", rbError);
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

/** @desc Update a project ... */
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
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (requiredCollaborators !== undefined) {
      const c = parseInt(requiredCollaborators);
      if (!isNaN(c) && c >= 0) updates.requiredCollaborators = c;
    }
    if (status !== undefined) {
      const valid = Project.getAttributes().status.values;
      if (valid.includes(status)) updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid fields provided." });
    }

    await project.update(updates);
    console.log(`Project ${parsedProjectId} updated.`);

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
    /* ... error handling ... */
  }
});

/** @desc Delete a project ... */
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
        .json({ success: false, message: "Invalid Project ID." });
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
        .json({ success: false, message: "Not authorized to delete." });
    }

    await project.destroy(); // Cascade deletes defined in model associations
    console.log(`Project ${parsedProjectId} deleted.`);
    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    /* ... error handling ... */
  }
});

/** @desc Get join requests and active members for a specific project ... */
export const getProjectRequests = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user?.id;
  console.log(
    `--- ENTERING getProjectRequests (incl. members) for project ${projectId} by user ${userId} ---`
  );
  if (!Project || !User || !CollaborationRequest || !Member) {
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
        order: [["createdAt", "DESC"]], // Model field
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
        order: [["createdAt", "ASC"]], // Model field
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
    /* ... error handling ... */
  }
});

/** @desc Admin get all projects (placeholder) ... */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log("--- ENTERING adminGetAllProjects ---");
  res.status(501).json({ message: "Admin route not fully implemented" });
});

// Remember to export any other functions used by your routes
