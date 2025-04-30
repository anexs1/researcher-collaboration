// backend/controllers/projectController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";
import fs from "fs/promises"; // Use promises version of fs
import path from "path";
import { fileURLToPath } from "url";

// ES Module __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define uploads directory relative to this controller file
const UPLOADS_DIR = path.resolve(
  __dirname,
  "..",
  "public",
  "uploads",
  "projects"
); // Specific subfolder for project images

// Ensure all needed models are loaded and destructured
const { Project, User, Member, CollaborationRequest, sequelize } = db;

// --- Helper to ensure directory exists ---
const ensureUploadsDirExists = async () => {
  try {
    await fs.access(UPLOADS_DIR);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Uploads directory ${UPLOADS_DIR} not found, creating...`);
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } else {
      // Re-throw other errors
      throw error;
    }
  }
};
// Ensure directory exists on server startup (run once)
ensureUploadsDirExists().catch((err) =>
  console.error("Failed to create initial uploads directory:", err)
);

// --- Field Definitions (using MODEL camelCase names) ---
// Attributes to select for public/list views of projects
const projectListSelectFields = [
  "id",
  "title",
  "description",
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
  "requiredCollaborators",
  "imageUrl", // Use model name (maps to image_url via 'field' option in model)
  "category",
  "duration",
  "funding",
  // Add any other fields needed specifically for list display
];

// Attributes to select for detailed view of a single project
const projectDetailSelectFields = [
  "id",
  "title",
  "description",
  "requiredCollaborators",
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
  "imageUrl",
  "category",
  "duration",
  "funding",
  "skillsNeeded", // Model uses skillsNeeded (maps to skills_needed)
  "progress",
  "views",
  "likes",
  "comments",
  // Add any other fields needed for the detail page
];

// Attributes to select for associated users (publicly viewable info)
const userPublicSelectFields = ["id", "username", "profilePictureUrl"]; // Add email if needed for specific contexts

// --- Controller Functions ---

/**
 * @desc    Get all projects (paginated, searchable, with user membership status)
 * @route   GET /api/projects
 * @access  Private (Requires login)
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  console.log("API: getAllProjects invoked");
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    // --- Build Where Clause ---
    const where = {};
    if (status && status !== "all") {
      where.status = status;
    } else if (status !== "archived") {
      // Default: Don't show archived unless explicitly requested
      where.status = { [Op.ne]: "Archived" };
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    // --- End Build Where Clause ---

    // --- Pagination ---
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    if (
      isNaN(parsedLimit) ||
      isNaN(parsedPage) ||
      parsedLimit <= 0 ||
      parsedPage <= 0
    ) {
      res.status(400);
      throw new Error("Invalid pagination parameters.");
    }
    const offset = (parsedPage - 1) * parsedLimit;
    // --- End Pagination ---

    // Model check
    if (!Project || !Member || !CollaborationRequest || !User) {
      console.error("Database models not loaded correctly in getAllProjects.");
      throw new Error("Server configuration error: DB models not loaded.");
    }

    // --- Database Query ---
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListSelectFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
          required: false,
        },
        {
          model: Member,
          as: "memberships",
          attributes: ["status"],
          where: { userId: currentUserId },
          required: false,
        },
        {
          model: CollaborationRequest,
          as: "collaborationRequests",
          attributes: ["status"],
          where: { requesterId: currentUserId, status: "pending" },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });
    // --- End Database Query ---

    // --- Process Results ---
    const processedProjects = projects.map((p) => {
      const projectJson = p.toJSON();
      const currentUserMembership = projectJson.memberships?.[0];
      const currentUserPendingRequest = projectJson.collaborationRequests?.[0];
      if (currentUserMembership?.status === "active") {
        projectJson.currentUserMembershipStatus = "approved";
      } else if (currentUserPendingRequest?.status === "pending") {
        projectJson.currentUserMembershipStatus = "pending";
      } else {
        projectJson.currentUserMembershipStatus = null;
      }
      delete projectJson.memberships;
      delete projectJson.collaborationRequests;
      return projectJson;
    });
    // --- End Process Results ---

    console.log(
      `Found ${count} projects total, returning page ${parsedPage} (${processedProjects.length} items).`
    );
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      limit: parsedLimit,
      data: processedProjects,
    });
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error retrieving projects.";
    res.status(statusCode).json({ success: false, message });
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
    if (!Project || !User) throw new Error("DB models not loaded.");
    const projects = await Project.findAll({
      where: { ownerId: userId },
      attributes: projectListSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
      order: [["updatedAt", "DESC"]],
    });
    console.log(`Found ${projects.length} projects owned by user ${userId}.`);
    res
      .status(200)
      .json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error(`Error in getMyProjects for User ${userId}:`, error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error retrieving user's projects.";
    res.status(500).json({ success: false, message });
  }
});

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Private (Requires login - assuming details aren't public)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const currentUserId = req.user?.id;
  console.log(
    `API: getProjectById invoked for ID: ${projectIdParam} by User ${
      currentUserId || "Guest"
    }`
  );
  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required to view project details.");
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }
  try {
    if (!Project || !User) throw new Error("DB models not loaded.");
    const project = await Project.findByPk(projectId, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    console.log(`Project ${projectId} found successfully.`);
    res.status(200).json({ success: true, project: project });
  } catch (error) {
    console.error(`Error in getProjectById for ID ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error retrieving project details.";
    res.status(statusCode).json({ success: false, message });
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
  console.log("createProject - req.body:", req.body);
  console.log("createProject - req.file:", req.file);
  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const {
    title,
    description,
    requiredCollaborators,
    status = "Planning",
    category,
    duration,
    funding,
    skillsNeeded,
    progress = 0,
  } = req.body;
  if (!title || title.trim() === "") {
    res.status(400);
    throw new Error("Project title is required.");
  }
  if (!description || description.trim() === "") {
    res.status(400);
    throw new Error("Project description is required.");
  }
  let parsedSkills = [];
  if (skillsNeeded) {
    try {
      parsedSkills =
        typeof skillsNeeded === "string"
          ? JSON.parse(skillsNeeded)
          : skillsNeeded;
      if (!Array.isArray(parsedSkills))
        throw new Error("Skills must be an array.");
    } catch (e) {
      res.status(400);
      throw new Error(
        "Invalid format for 'skillsNeeded'. Expected JSON array."
      );
    }
  }
  const collaborators = requiredCollaborators
    ? parseInt(requiredCollaborators, 10)
    : 1;
  if (isNaN(collaborators) || collaborators < 0) {
    res.status(400);
    throw new Error("Required collaborators must be a non-negative number.");
  }
  const allowedStatuses = Project.getAttributes().status?.values;
  if (allowedStatuses && !allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid project status: ${status}.`);
  }
  let savedImageUrl = null;
  if (req.file) {
    await ensureUploadsDirExists();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeOriginalName = req.file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );
    const filename = `${uniqueSuffix}-${safeOriginalName}`;
    const absoluteFilePath = path.join(UPLOADS_DIR, filename);
    savedImageUrl = `/uploads/projects/${filename}`;
    try {
      const fileData = req.file.buffer
        ? req.file.buffer
        : await fs.readFile(req.file.path);
      await fs.writeFile(absoluteFilePath, fileData);
      console.log(`File successfully saved: ${absoluteFilePath}`);
    } catch (uploadError) {
      console.error("Failed to write uploaded file:", uploadError);
      res.status(500);
      throw new Error("Failed to save uploaded project image.");
    }
  }
  const transaction = await sequelize.transaction();
  try {
    if (!Project || !Member) throw new Error("DB models not loaded.");
    const newProject = await Project.create(
      {
        title: title.trim(),
        description: description.trim(),
        ownerId,
        requiredCollaborators: collaborators,
        status,
        category: category || null,
        duration: duration || null,
        funding: funding || null,
        skillsNeeded: parsedSkills,
        imageUrl: savedImageUrl,
        progress: parseInt(progress, 10) || 0,
        views: 0,
        likes: 0,
        comments: 0,
      },
      { transaction }
    );
    console.log(`Project created in DB, ID: ${newProject.id}`);
    await Member.create(
      {
        userId: ownerId,
        projectId: newProject.id,
        role: "owner",
        status: "active",
      },
      { transaction }
    );
    console.log(
      `Owner (User ID: ${ownerId}) added as member to Project ID: ${newProject.id}`
    );
    await transaction.commit();
    console.log("Project creation transaction committed successfully.");
    const createdProject = await Project.findByPk(newProject.id, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });
    res.status(201).json({ success: true, data: createdProject });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Project creation transaction rolled back.");
    }
    if (savedImageUrl) {
      try {
        const fileToDelete = path.resolve(
          __dirname,
          "..",
          "public",
          savedImageUrl.substring(1)
        );
        await fs.unlink(fileToDelete);
        console.log("Deleted orphaned upload file.");
      } catch (e) {
        console.error("Error deleting orphaned file:", e);
      }
    }
    console.error("Error during project creation process:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error creating project.";
    res.status(statusCode).json({ success: false, message });
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
  console.log("updateProject - req.body:", req.body);
  console.log("updateProject - req.file:", req.file);
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID.");
  }
  const transaction = await sequelize.transaction();
  let newImageUrl = null;
  let oldImageUrl = null;
  try {
    if (!Project) throw new Error("Project model not loaded");
    const project = await Project.findByPk(projectId, { transaction });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Not authorized to update this project.");
    }
    oldImageUrl = project.imageUrl;
    if (req.file) {
      await ensureUploadsDirExists();
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const safeOriginalName = req.file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );
      const filename = `${uniqueSuffix}-${safeOriginalName}`;
      const absoluteFilePath = path.join(UPLOADS_DIR, filename);
      newImageUrl = `/uploads/projects/${filename}`;
      try {
        const fileData = req.file.buffer
          ? req.file.buffer
          : await fs.readFile(req.file.path);
        await fs.writeFile(absoluteFilePath, fileData);
        console.log(`New image file saved: ${absoluteFilePath}`);
      } catch (uploadError) {
        res.status(500);
        throw new Error("Failed to save updated project image.");
      }
    }
    const {
      title,
      description,
      requiredCollaborators,
      status,
      category,
      duration,
      funding,
      skillsNeeded,
      progress,
    } = req.body;
    const updates = {};
    if (title !== undefined) {
      if (title.trim() === "")
        throw new Error("Project title cannot be empty.");
      updates.title = title.trim();
    }
    if (description !== undefined) {
      updates.description = description;
    }
    if (requiredCollaborators !== undefined) {
      const c = parseInt(requiredCollaborators, 10);
      if (isNaN(c) || c < 0)
        throw new Error("Invalid required collaborators number.");
      updates.requiredCollaborators = c;
    }
    if (status !== undefined) {
      const allowedStatuses = Project.getAttributes().status?.values;
      if (allowedStatuses && !allowedStatuses.includes(status)) {
        throw new Error(`Invalid project status: ${status}.`);
      }
      updates.status = status;
    }
    if (category !== undefined) updates.category = category || null;
    if (duration !== undefined) updates.duration = duration || null;
    if (funding !== undefined) updates.funding = funding || null;
    if (skillsNeeded !== undefined) {
      try {
        let ps = [];
        if (skillsNeeded === null || skillsNeeded === "") ps = [];
        else
          ps =
            typeof skillsNeeded === "string"
              ? JSON.parse(skillsNeeded)
              : skillsNeeded;
        if (!Array.isArray(ps)) throw new Error("Skills must be an array.");
        updates.skillsNeeded = ps;
      } catch (e) {
        throw new Error("Invalid format for 'skillsNeeded'.");
      }
    }
    if (newImageUrl !== null) {
      updates.imageUrl = newImageUrl;
    }
    if (progress !== undefined) {
      const p = parseInt(progress, 10);
      if (isNaN(p) || p < 0 || p > 100)
        throw new Error("Progress must be between 0 and 100.");
      updates.progress = p;
    }
    if (Object.keys(updates).length === 0) {
      await transaction.rollback();
      return res.status(200).json({
        success: true,
        message: "No update data provided.",
        project: project,
      });
    }
    console.log("Applying updates to project:", updates);
    await project.update(updates, { transaction });
    await transaction.commit();
    console.log(
      `Project ${projectId} update transaction committed successfully.`
    );
    if (newImageUrl && oldImageUrl && oldImageUrl !== newImageUrl) {
      try {
        const fileToDelete = path.resolve(
          __dirname,
          "..",
          "public",
          oldImageUrl.substring(1)
        );
        await fs.unlink(fileToDelete);
        console.log(`Deleted old image file successfully: ${fileToDelete}`);
      } catch (deleteError) {
        if (deleteError.code !== "ENOENT") {
          console.error(
            "Error deleting old image file after update:",
            deleteError
          );
        } else {
          console.warn(`Old image file not found for deletion: ${oldImageUrl}`);
        }
      }
    }
    const updatedProject = await Project.findByPk(project.id, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });
    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project: updatedProject,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Update transaction rolled back.");
    }
    if (newImageUrl) {
      try {
        const fileToDelete = path.resolve(
          __dirname,
          "..",
          "public",
          newImageUrl.substring(1)
        );
        await fs.unlink(fileToDelete);
        console.log("Deleted newly uploaded file due to transaction error.");
      } catch (e) {
        console.error("Error deleting newly uploaded file after error:", e);
      }
    }
    console.error(`Error updating project ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error updating project.";
    res.status(statusCode).json({ success: false, message });
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
    throw new Error("Invalid Project ID.");
  }
  let imagePathToDelete = null;
  const transaction = await sequelize.transaction();
  try {
    if (!Project) throw new Error("Project model not loaded");
    const project = await Project.findByPk(projectId, {
      transaction,
      attributes: ["id", "ownerId", "imageUrl"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Not authorized to delete this project.");
    }
    imagePathToDelete = project.imageUrl;
    await project.destroy({ transaction });
    await transaction.commit();
    console.log(
      `Project ${projectId} DB record and associated data deleted successfully.`
    );
    if (imagePathToDelete) {
      try {
        const fileToDelete = path.resolve(
          __dirname,
          "..",
          "public",
          imagePathToDelete.substring(1)
        );
        await fs.unlink(fileToDelete);
        console.log(`Deleted associated image file: ${fileToDelete}`);
      } catch (deleteError) {
        if (deleteError.code !== "ENOENT") {
          console.error("Error deleting project image file:", deleteError);
        } else {
          console.log("Image file not found for deletion (ENOENT).");
        }
      }
    }
    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Delete project transaction rolled back.");
    }
    console.error(`Error deleting project ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error deleting project.";
    res.status(statusCode).json({ success: false, message });
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
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID.");
  }
  try {
    if (!Project || !CollaborationRequest || !User)
      throw new Error("DB models not loaded");
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Forbidden: Only the project owner can view requests.");
    }
    const pendingRequests = await CollaborationRequest.findAll({
      where: { projectId: projectId, status: "pending" },
      include: [
        { model: User, as: "requester", attributes: userPublicSelectFields },
      ],
      order: [["createdAt", "DESC"]],
    });
    console.log(
      `Found ${pendingRequests.length} pending requests for project ${projectId}.`
    );
    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      data: pendingRequests,
    });
  } catch (error) {
    console.error(
      `Error in getProjectRequests for Project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error retrieving collaboration requests.";
    res.status(statusCode).json({ success: false, message });
  }
});

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
    throw new Error("Invalid Project ID.");
  }

  try {
    // Model check
    if (!Project || !Member || !User) {
      console.error("DB models not loaded for getProjectMembers");
      throw new Error("Server configuration error: DB models not loaded");
    }

    // Fetch project and owner details
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId", "createdAt"],
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });

    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    const ownerId = project.ownerId;
    const projectOwner = project.owner?.toJSON(); // Get plain owner object

    // --- Authorization Check ---
    const isOwner = ownerId === currentUserId;
    let isMember = false;
    if (!isOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: "active",
        },
        attributes: ["userId"], // Only need to confirm existence
      });
      isMember = !!membership;
    }
    if (!isOwner && !isMember) {
      res.status(403);
      throw new Error(
        "Access Denied: You are not an active member of this project."
      );
    }
    console.log(
      `Auth Passed for getProjectMembers (Owner: ${isOwner}, Member: ${isMember})`
    );
    // --- End Authorization Check ---

    // --- Fetch Active Members ---
    const members = await Member.findAll({
      where: {
        projectId: projectId, // Foreign key referencing Project
        status: "active",
      },
      include: [
        {
          model: User,
          as: "user", // Alias defined in Member model's association
          attributes: userPublicSelectFields, // Select public fields from User
        },
      ],
      // Explicitly list columns from project_members (using model attribute names)
      attributes: ["userId", "role", "status", "joinedAt"],
      // Order clause referencing Member.role explicitly
      order: [
        [
          sequelize.literal(
            "FIELD(`Member`.`role`, 'Owner', 'Admin', 'Member')"
          ),
          "ASC",
        ], // Use literal for FIELD, qualify role
        ["joinedAt", "ASC"], // Secondary sort
      ],
    });
    // --- End Fetch Active Members ---

    // --- Format Member List ---
    let formattedMembers = members
      .map((m) => ({
        userId: m.user?.id,
        username: m.user?.username,
        profilePictureUrl: m.user?.profilePictureUrl,
        role: m.userId === ownerId ? "Owner" : m.role || "Member",
        joinedAt: m.joinedAt,
      }))
      .filter((m) => m.userId); // Filter out entries where user might be missing

    // Ensure owner is listed correctly
    const ownerInList = formattedMembers.find((m) => m.userId === ownerId);
    if (projectOwner && !ownerInList) {
      console.log(
        "Manually adding project owner to member list as they weren't in active members query result."
      );
      formattedMembers.unshift({
        userId: ownerId,
        username: projectOwner.username,
        profilePictureUrl: projectOwner.profilePictureUrl,
        role: "Owner",
        joinedAt: project.createdAt,
      });
    } else if (ownerInList && ownerInList.role !== "Owner") {
      ownerInList.role = "Owner"; // Correct role if found as non-owner
    }

    // Final sort
    formattedMembers.sort((a, b) => {
      if (a.role === "Owner" && b.role !== "Owner") return -1;
      if (b.role === "Owner" && a.role !== "Owner") return 1;
      return (a.username || "").localeCompare(b.username || "");
    });
    // --- End Format Member List ---

    console.log(
      `Returning ${formattedMembers.length} members for project ${projectId}`
    );
    res.status(200).json({ success: true, data: formattedMembers });
  } catch (error) {
    console.error(
      `Error in getProjectMembers for Project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error retrieving project members.";
    res.status(statusCode).json({ success: false, message });
  }
});

/** @desc Admin get all projects (placeholder/stub) */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.warn("API: adminGetAllProjects invoked but not fully implemented.");
  res
    .status(501)
    .json({ success: false, message: "Admin route not implemented yet" });
});
