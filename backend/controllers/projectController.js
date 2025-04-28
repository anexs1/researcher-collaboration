// backend/controllers/projectController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Adjust path if necessary
import { Op } from "sequelize";

// Destructure needed models - ensure all are loaded in index.js
const { Project, User, CollaborationRequest, Member, sequelize } = db;

// Define fields using MODEL's camelCase keys for consistency
const projectListSelectFields = [
  "id",
  "title",
  "description",
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
];
const projectDetailSelectFields = [
  "id",
  "title",
  "description",
  "requiredCollaborators",
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
];
const userPublicSelectFields = ["id", "username", "profilePictureUrl"]; // Fields safe to expose

/**
 * @desc    Get all projects (paginated, searchable)
 * @route   GET /api/projects
 * @access  Private (or Public if `protect` removed from route)
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  console.log("API: getAllProjects invoked");
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const where = {};
    // Add filters based on query parameters
    if (status) where.status = status; // Filter by status
    if (search) {
      // Filter by title or description
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Validate and parse pagination parameters
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
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

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListSelectFields,
      include: [
        {
          model: User,
          as: "owner", // Alias from Project.associate
          attributes: userPublicSelectFields, // Select only public fields
          required: false, // Use LEFT JOIN
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true, // Important for correct count with includes
    });

    console.log(
      `Found ${count} projects total, returning page ${parsedPage} (${projects.length} items).`
    );
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: projects,
    });
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({
        success: false,
        message: error.message || "Server error getting projects.",
      });
  }
});

/**
 * @desc    Get projects owned by the logged-in user
 * @route   GET /api/projects/my
 * @access  Private
 */
export const getMyProjects = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  console.log(`API: getMyProjects invoked by User ${userId}`);

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  try {
    const projects = await Project.findAll({
      where: { ownerId: userId },
      attributes: projectListSelectFields,
      include: [
        {
          // Include owner details even though it's the current user
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    console.log(`Found ${projects.length} projects owned by user ${userId}.`);
    res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error(`Error in getMyProjects for User ${userId}:`, error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Server error getting user's projects.",
      });
  }
});

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Private (or Public if `protect` removed)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  console.log(`API: getProjectById invoked for ID: ${projectIdParam}`);

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    const project = await Project.findByPk(projectId, {
      attributes: projectDetailSelectFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
        },
      ],
    });

    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    console.log(`Project ${projectId} found successfully.`);
    res.status(200).json({ success: true, project: project }); // Changed 'data' key to 'project' for clarity maybe?
  } catch (error) {
    console.error(`Error in getProjectById for ID ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({
        success: false,
        message: error.message || "Server error getting project details.",
      });
  }
});

/**
 * @desc    Create a new project and add owner as member
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = asyncHandler(async (req, res) => {
  const ownerId = req.user?.id;
  console.log(`API: createProject invoked by User ${ownerId}`);

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  // Extract and validate required fields from request body
  const {
    title,
    description,
    requiredCollaborators,
    status = "Planning",
  } = req.body;
  if (!title || !description) {
    res.status(400);
    throw new Error("Title and description are required fields.");
  }
  const collaborators = requiredCollaborators
    ? parseInt(requiredCollaborators, 10)
    : 1; // Default or parse
  if (isNaN(collaborators) || collaborators < 0) {
    res.status(400);
    throw new Error("Number of collaborators must be a non-negative number.");
  }

  // Use a transaction to ensure atomicity (project creation + owner membership)
  const transaction = await sequelize.transaction();
  try {
    // Create the project
    const newProject = await Project.create(
      {
        title,
        description,
        requiredCollaborators: collaborators,
        status,
        ownerId,
      },
      { transaction }
    );
    console.log(`Project created with ID: ${newProject.id}`);

    // Add the owner as an active member with the 'owner' role
    await Member.create(
      {
        userId: ownerId,
        projectId: newProject.id,
        role: "owner", // Assign specific role
        status: "active", // Owner is active immediately
      },
      { transaction }
    );
    console.log(
      `Owner ${ownerId} added as active 'owner' member to project ${newProject.id}`
    );

    // Commit the transaction if both operations succeed
    await transaction.commit();
    console.log("Transaction committed successfully.");

    // Fetch the newly created project with owner details to return
    const createdProject = await Project.findByPk(newProject.id, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });

    res.status(201).json({ success: true, data: createdProject });
  } catch (error) {
    // Rollback transaction if any step failed
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction.rollback();
      console.log("Transaction rolled back due to error.");
    }
    console.error("Error creating project:", error);
    if (error.name === "SequelizeValidationError") {
      // Handle validation errors specifically
      const messages = error.errors.map((err) => err.message).join(". ");
      res.status(400).json({ success: false, message: messages });
    } else {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Server error creating project.",
        });
    }
  }
});

/**
 * @desc    Update an existing project
 * @route   PUT /api/projects/:id
 * @access  Private (Owner only)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const userId = req.user?.id;
  console.log(
    `API: updateProject invoked for ID: ${projectIdParam} by User ${userId}`
  );

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    const project = await Project.findByPk(projectId);
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    // Authorization: Only owner can update
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Not authorized to update this project.");
    }

    // Extract valid fields to update from request body
    const { title, description, requiredCollaborators, status } = req.body;
    const updates = {};
    if (title !== undefined && title.trim() !== "")
      updates.title = title.trim();
    if (description !== undefined) updates.description = description; // Allow empty description
    if (requiredCollaborators !== undefined) {
      const c = parseInt(requiredCollaborators);
      if (!isNaN(c) && c >= 0) updates.requiredCollaborators = c;
      else {
        res.status(400);
        throw new Error("Invalid required collaborators value.");
      }
    }
    if (status !== undefined) {
      const validStatuses = Project.getAttributes().status.values; // Get valid ENUM values
      if (validStatuses && validStatuses.includes(status))
        updates.status = status;
      else {
        res.status(400);
        throw new Error(
          `Invalid status value. Must be one of: ${validStatuses.join(", ")}`
        );
      }
    }

    // Check if there's anything valid to update
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "No valid fields provided for update.",
        });
    }

    // Perform the update
    await project.update(updates);
    console.log(`Project ${projectId} updated successfully.`);

    // Return the updated project data
    const updatedProject = await Project.findByPk(project.id, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    console.error(`Error updating project ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({
        success: false,
        message: error.message || "Server error updating project.",
      });
  }
});

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private (Owner only)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const userId = req.user?.id;
  console.log(
    `API: deleteProject invoked for ID: ${projectIdParam} by User ${userId}`
  );

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    const project = await Project.findByPk(projectId);
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    // Authorization: Only owner can delete
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Not authorized to delete this project.");
    }

    // Delete the project (associated data like Members, Messages should cascade if defined in models)
    await project.destroy();
    console.log(
      `Project ${projectId} deleted successfully by owner ${userId}.`
    );
    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error(`Error deleting project ${projectIdParam}:`, error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Server error deleting project.",
      });
  }
});

/**
 * @desc    Get PENDING collaboration requests for a specific project
 * @route   GET /api/projects/:projectId/requests
 * @access  Private (Owner only)
 */
export const getProjectRequests = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const userId = req.user?.id;
  console.log(
    `API: getProjectRequests invoked for project ${projectIdParam} by user ${userId}`
  );

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId)) {
    res.status(400);
    throw new Error("Invalid Project ID.");
  }

  try {
    // Find project and verify ownership
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId", "title"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Forbidden: Only the project owner can view requests.");
    }

    // Find pending requests, including requester details
    const pendingRequests = await CollaborationRequest.findAll({
      where: { projectId: projectId, status: "pending" }, // Filter by project and status
      include: [
        {
          model: User,
          as: "requester", // Alias from CollaborationRequest.associate
          attributes: userPublicSelectFields,
        },
      ],
      order: [["createdAt", "DESC"]], // Show newest requests first
    });

    console.log(
      `Found ${pendingRequests.length} pending requests for project ${projectId}.`
    );
    res.status(200).json({
      success: true,
      projectTitle: project.title, // Include project title for context
      requests: pendingRequests, // Changed key name for clarity
    });
  } catch (error) {
    console.error(
      `Error in getProjectRequests for Project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({
        success: false,
        message: error.message || "Server error fetching requests.",
      });
  }
});

// --- *** NEW CONTROLLER FUNCTION *** ---
/**
 * @desc    Get ACTIVE members of a specific project
 * @route   GET /api/projects/:projectId/members
 * @access  Private (Owner or Member only)
 */
export const getProjectMembers = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const currentUserId = req.user?.id;
  console.log(
    `API: getProjectMembers invoked for Project ${projectIdParam} by User ${currentUserId}`
  );

  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    // 1. Find Project and Owner (verifies project exists)
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"], // Need ownerId for checks
      include: [
        {
          // Include owner details directly
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
        },
      ],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    const ownerId = project.ownerId;
    const projectOwner = project.owner?.toJSON(); // Get plain owner object

    // 2. Authorization Check: User must be owner or an active member
    const isOwner = ownerId === currentUserId;
    let isMember = false;
    if (!isOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: "active",
        },
        attributes: ["userId"],
      });
      isMember = !!membership;
    }
    if (!isOwner && !isMember) {
      res.status(403);
      throw new Error("Access Denied: Not authorized to view members.");
    }
    console.log(
      `Auth Passed for getProjectMembers (Owner: ${isOwner}, Member: ${isMember})`
    );

    // 3. Fetch Active Members including their User details
    const members = await Member.findAll({
      where: { projectId: projectId, status: "active" },
      include: [
        { model: User, as: "user", attributes: userPublicSelectFields },
      ],
      attributes: ["userId", "role", "status", "joinedAt"], // Select Member fields
      order: [["joinedAt", "ASC"]], // Order by when they joined
    });

    // 4. Format response: Combine owner/members, assign roles, sort
    let formattedMembers = members
      .map((member) => ({
        id: member.user?.id,
        username: member.user?.username,
        profilePictureUrl: member.user?.profilePictureUrl,
        role: member.userId === ownerId ? "Owner" : member.role || "Member", // Assign Owner role, fallback
        joinedAt: member.joinedAt,
      }))
      .filter((member) => member.id); // Filter out potential null users

    // Ensure owner is in the list with the correct role
    if (
      projectOwner &&
      !formattedMembers.some((m) => m.id === projectOwner.id)
    ) {
      formattedMembers.unshift({
        ...projectOwner,
        role: "Owner",
        joinedAt: project.createdAt,
      }); // Add owner if missing
    } else {
      formattedMembers = formattedMembers.map((m) =>
        m.id === projectOwner?.id ? { ...m, role: "Owner" } : m
      ); // Correct role if present
    }

    // Sort: Owner first, then alphabetically by username
    formattedMembers.sort((a, b) => {
      if (a.role === "Owner" && b.role !== "Owner") return -1;
      if (a.role !== "Owner" && b.role === "Owner") return 1;
      return (a.username || "").localeCompare(b.username || "");
    });

    console.log(
      `Returning ${formattedMembers.length} members for project ${projectId}`
    );
    res.status(200).json({
      success: true,
      members: formattedMembers, // Send the formatted list
      // Optional: Send owner separately if frontend prefers, but list includes them
      // owner: projectOwner
    });
  } catch (error) {
    console.error(
      `Error in getProjectMembers for Project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({
        success: false,
        message: error.message || "Server error fetching project members.",
      });
  }
});
// --- *** END OF NEW CONTROLLER FUNCTION *** ---

/** @desc Admin get all projects (placeholder) */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log("API: adminGetAllProjects invoked");
  // Add actual admin logic here (e.g., fetch all projects regardless of status)
  res
    .status(501)
    .json({ success: false, message: "Admin route not implemented" });
});
