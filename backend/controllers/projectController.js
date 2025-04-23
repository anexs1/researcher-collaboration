// backend/controllers/projectController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";

const { Project, User } = db; // Import necessary models

// --- Helper: Define fields based on the SIMPLIFIED Model ---
// These MUST match the fields defined in your *current* models/Project.js
const projectListFields = [
  "id",
  "title",
  "description",
  // 'requiredCollaborators', // Maybe not needed for list view?
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
];
const projectDetailFields = [
  "id",
  "title",
  "description",
  "requiredCollaborators", // Include in detail view
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
];

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Requires logged-in user)
 */
export const createProject = asyncHandler(async (req, res) => {
  // --- Log Start and Received Data ---
  console.log("--- CREATE PROJECT Request Received ---");
  try {
    console.log("Raw req.body:", JSON.stringify(req.body, null, 2));
  } catch (e) {
    console.log("Raw req.body (unstringified):", req.body);
  }
  // Note: File upload is removed as imageUrl is not in the simplified model

  // --- Destructure fields that ACTUALLY EXIST in the simplified model ---
  const {
    title,
    description,
    requiredCollaborators, // Use the name matching the simplified model/DB
    status,
    // REMOVED: category, duration, funding, skillsNeeded
  } = req.body;

  // --- Check Authentication ---
  if (!req.user || !req.user.id) {
    console.error("CREATE PROJECT Error: User ID not found on request.");
    res.status(401);
    throw new Error("Authentication error: User information missing.");
  }
  const ownerId = req.user.id;
  console.log(`Owner ID from req.user: ${ownerId}`);

  // --- Basic Validation (Still applies) ---
  console.log(
    `Checking required fields: title='${title}', description='${description}'`
  );
  if (
    !title ||
    !description ||
    title.trim() === "" ||
    description.trim() === ""
  ) {
    console.warn(
      `CREATE PROJECT Validation Failed: Title or Description is missing or empty.`
    );
    res.status(400);
    throw new Error("Title and description are required and cannot be empty.");
  }
  console.log("Title and Description validation passed.");

  // --- Prepare Data (Simplified) ---
  // Parse requiredCollaborators safely
  const numCollaborators = parseInt(requiredCollaborators); // Use the correct variable name
  const validRequiredCollaborators =
    !isNaN(numCollaborators) && numCollaborators >= 0 ? numCollaborators : 1;
  console.log(
    `Parsed requiredCollaborators: Input='${requiredCollaborators}', Using='${validRequiredCollaborators}'`
  );

  // Construct data object using ONLY fields from the simplified model
  const projectData = {
    title: title.trim(),
    description: description.trim(),
    ownerId,
    requiredCollaborators: validRequiredCollaborators, // Use correct field name
    status: status || "Planning", // Keep status if it exists in DB
    // REMOVED: category, duration, funding, skillsNeeded, imageUrl
  };
  console.log(
    "Final projectData object before Project.create:",
    JSON.stringify(projectData, null, 2)
  );

  // --- Database Interaction ---
  try {
    console.log("Attempting Project.create...");
    const project = await Project.create(projectData); // Use the simplified data
    console.log(`Project created successfully with ID: ${project.id}`);

    // Fetch the created project with owner details to return
    const createdProject = await Project.findByPk(project.id, {
      attributes: projectDetailFields, // Use simplified detail fields
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"], // Assuming User model has these
        },
      ],
    });

    if (!createdProject) {
      throw new Error("Could not retrieve created project details.");
    }

    console.log("Returning created project data to client.");
    res.status(201).json({ success: true, data: createdProject });
  } catch (error) {
    console.error("ERROR during Project.create or subsequent findByPk:", error);
    if (error.name === "SequelizeValidationError") {
      const messages = error.errors
        .map((err) => `${err.path}: ${err.message}`)
        .join("; ");
      res.status(400);
      throw new Error(`Validation Error: ${messages}`);
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
      /* ... */
    }
    // Check for specific DB errors if needed
    console.error(
      "Unhandled Project Creation Error:",
      error.name,
      error.message
    );
    res.status(500);
    throw new Error("Server error creating project.");
  }
});

/**
 * @desc    Get projects owned by the logged-in user
 * @route   GET /api/projects/my
 * @access  Private
 */
export const getMyProjects = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    throw new Error("Authentication required.");
  }
  const ownerId = req.user.id;
  console.log(`Fetching projects for owner ID: ${ownerId}`);
  try {
    const projects = await Project.findAll({
      where: { ownerId: ownerId },
      attributes: projectListFields, // Use simplified list fields
      order: [["updatedAt", "DESC"]],
    });
    res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    /* Error handling */
  }
});

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Public (or Private)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  if (!projectId || isNaN(parseInt(projectId))) {
    /* ID validation */ return;
  }
  console.log(`Fetching project details for ID: ${projectId}`);
  try {
    const project = await Project.findByPk(projectId, {
      attributes: projectDetailFields, // Use simplified detail fields
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username", "profilePictureUrl"],
        },
      ],
      // No members include for now
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    /* Error handling */
  }
});

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private (Owner only)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;
  if (!projectId || isNaN(parseInt(projectId))) {
    /* ID validation */ return;
  }

  const project = await Project.findByPk(projectId);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  if (project.ownerId !== userId) {
    res.status(403);
    throw new Error("User not authorized to update");
  }

  // --- Prepare updates using ONLY fields from simplified model ---
  const {
    title,
    description,
    requiredCollaborators,
    status,
    // REMOVED: category, duration, funding, skillsNeeded
  } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (
    status !== undefined &&
    ["Planning", "Active", "Completed", "On Hold"].includes(status)
  )
    updates.status = status;

  if (requiredCollaborators !== undefined) {
    const numCollaborators = parseInt(requiredCollaborators);
    if (!isNaN(numCollaborators) && numCollaborators >= 0) {
      updates.requiredCollaborators = numCollaborators;
    } else {
      console.warn(
        `Invalid requiredCollaborators value: ${requiredCollaborators}`
      );
    }
  }

  // --- File upload removed as imageUrl is not in model ---
  // --- skillsNeeded parsing removed ---

  console.log("Applying updates to project:", JSON.stringify(updates, null, 2));

  try {
    if (Object.keys(updates).length > 0) {
      Object.assign(project, updates);
      await project.save();
    } else {
      console.log(`No fields to update for project ${projectId}.`);
    }

    const updatedProject = await Project.findByPk(projectId, {
      attributes: projectDetailFields, // Use simplified fields
      include: [{ model: User, as: "owner", attributes: ["id", "username"] }],
    });
    res.status(200).json({
      success: true,
      message: "Project updated",
      data: updatedProject,
    });
  } catch (error) {
    /* Handle save/validation error */
  }
});

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private (Owner only)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;
  if (!projectId || isNaN(parseInt(projectId))) {
    /* ID validation */ return;
  }

  const project = await Project.findByPk(projectId);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  if (project.ownerId !== userId) {
    res.status(403);
    throw new Error("User not authorized to delete");
  }

  try {
    const projectTitle = project.title;
    // --- Image deletion removed ---
    await project.destroy();
    console.log(
      `User ${userId} deleted project "${projectTitle}" (ID: ${projectId})`
    );
    res
      .status(200)
      .json({ success: true, message: `Project "${projectTitle}" deleted.` });
  } catch (error) {
    /* Handle deletion error */
  }
});

// --- Admin Project Routes ---

/**
 * @desc    Get ALL projects (Admin only)
 * @route   GET /api/admin/projects (or adjusted route)
 * @access  Private/Admin
 */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log(`Admin ${req.user.id} fetching all projects.`);
  try {
    const projects = await Project.findAll({
      attributes: projectListFields, // Use simplified fields
      order: [["createdAt", "DESC"]],
      include: [{ model: User, as: "owner", attributes: ["id", "username"] }],
    });
    res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    /* Handle error */
  }
});
