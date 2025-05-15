import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ES Module __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT_DIR = path.resolve(__dirname, "..");
const UPLOADS_ROOT_DIR = path.join(BACKEND_ROOT_DIR, "uploads");
const PROJECT_UPLOADS_DIR = path.join(UPLOADS_ROOT_DIR, "projects");

// Ensure all needed models are loaded and destructured
const { Project, User, Member, CollaborationRequest, sequelize } = db;
if (!Project || !User || !Member || !CollaborationRequest || !sequelize) {
  console.error(
    "FATAL: Database models (Project, User, Member, CollaborationRequest, sequelize) not loaded correctly in projectController.js. Check models/index.js."
  );
  // process.exit(1); // Consider for production
}

// --- Helper to ensure directory exists ---
const ensureUploadsDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Directory ${dirPath} not found, attempting to create...`);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Successfully created directory: ${dirPath}`);
      } catch (mkdirError) {
        console.error(`Error creating directory ${dirPath}:`, mkdirError);
        throw new Error(`Failed to create required directory: ${dirPath}`);
      }
    } else {
      console.error(`Error accessing directory ${dirPath}:`, error);
      throw error;
    }
  }
};
ensureUploadsDirExists(PROJECT_UPLOADS_DIR).catch((err) =>
  console.error("Failed to ensure initial project uploads directory:", err)
);

// --- Field Definitions (using MODEL camelCase names) ---
const projectListSelectFields = [
  "id",
  "title",
  "description",
  "status",
  "ownerId",
  "createdAt",
  "updatedAt",
  "requiredCollaborators",
  "imageUrl",
  "category",
  "duration",
  "funding",
  // "skillsNeeded", // Add back if column 'skills_needed' exists and is mapped in ProjectModel
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
  "imageUrl",
  "category",
  "duration",
  "funding",
  "skillsNeeded",
  "progress",
  "views",
  "likes",
  "comments",
];
const userPublicSelectFields = ["id", "username", "profilePictureUrl"];

// --- Controller Functions ---

/**
 * @desc    Get all projects (paginated, searchable, with user membership status if logged in)
 * @route   GET /api/projects
 * @access  Public (Membership status included ONLY if user is logged in via optionalProtect)
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  console.log(
    `getAllProjects - Current User ID (from req.user): ${
      currentUserId || "Guest"
    }`
  );

  try {
    const { status, search, page = 1, limit = 9 } = req.query;
    const where = {};
    if (status && status !== "all" && status !== "archived") {
      where.status = status;
    } else if (status === "archived") {
      where.status = "Archived";
    } else if (status !== "all") {
      // Default: exclude archived if status is not 'all' or 'archived'
      where.status = { [Op.ne]: "Archived" };
    }

    if (search) {
      const likeOperator =
        sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
      where[Op.or] = [
        { title: { [likeOperator]: `%${search}%` } },
        { description: { [likeOperator]: `%${search}%` } },
      ];
    }

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

    const includes = [
      {
        model: User,
        as: "owner",
        attributes: userPublicSelectFields,
        required: false,
      },
    ];

    if (currentUserId) {
      includes.push(
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
        }
      );
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListSelectFields,
      include: includes,
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });

    const processedProjects = projects.map((p) => {
      const projectJson = p.toJSON();
      projectJson.currentUserMembershipStatus = null;

      if (currentUserId) {
        const currentUserMembership = projectJson.memberships?.[0];
        const currentUserPendingRequest =
          projectJson.collaborationRequests?.[0];

        if (
          currentUserMembership &&
          (currentUserMembership.status === "active" ||
            currentUserMembership.status === "approved")
        ) {
          projectJson.currentUserMembershipStatus = "approved";
        } else if (
          currentUserPendingRequest &&
          currentUserPendingRequest.status === "pending"
        ) {
          projectJson.currentUserMembershipStatus = "pending";
        }
      }
      delete projectJson.memberships;
      delete projectJson.collaborationRequests;
      return projectJson;
    });

    res.status(200).json({
      success: true,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
      data: processedProjects,
    });
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving projects.";
    if (!res.headersSent)
      res.status(statusCode).json({ success: false, message });
  }
});

/**
 * @desc    Get projects owned or joined by the logged-in user
 * @route   GET /api/projects/my
 * @access  Private (Requires login)
 */
export const getMyProjects = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  try {
    const projectWhereConditions = {
      [Op.or]: [
        { ownerId: userId },
        // This alias 'myMemberships' needs to be defined in the include below
        // and must match an association defined from Project to Member
        // Usually Project.hasMany(Member, { as: 'memberships' })
        // If we use 'memberships' as the alias in include, it should be '$memberships.id$'
        { "$memberships.id$": { [Op.not]: null } },
      ],
      status: { [Op.ne]: "Archived" },
    };

    const { count, rows: projects } = await Project.findAndCountAll({
      where: projectWhereConditions,
      attributes: projectListSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
        {
          model: Member,
          as: "memberships", // This alias must match Project.hasMany(Member, { as: "memberships"})
          where: {
            userId: userId,
            status: { [Op.in]: ["active", "approved"] },
          },
          attributes: ["id"], // Only need to check for existence for the Op.or logic
          required: false, // LEFT JOIN is crucial for the OR to work correctly
        },
      ],
      order: [["updatedAt", "DESC"]],
      distinct: true, // Important with Op.or and includes
    });

    res
      .status(200)
      .json({
        success: true,
        count: count,
        data: projects.map((p) => p.toJSON()),
      });
  } catch (error) {
    console.error(`Error in getMyProjects for User ${userId}:`, error);
    if (error.name && error.name.startsWith("Sequelize")) {
      console.error("Sequelize Error Details:", JSON.stringify(error, null, 2));
    }
    res.status(500).json({
      success: false,
      message: error.message || "Server error retrieving user's projects.",
    });
  }
});

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Public (Basic details are public, membership status added if logged in)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const currentUserId = req.user?.id;

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
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

    const projectJson = project.toJSON();
    projectJson.currentUserMembershipStatus = null;

    if (currentUserId) {
      const memberRecord = await Member.findOne({
        where: { userId: currentUserId, projectId: projectId },
        attributes: ["status"],
      });

      if (
        memberRecord &&
        (memberRecord.status === "active" || memberRecord.status === "approved")
      ) {
        projectJson.currentUserMembershipStatus = "approved";
      } else {
        const requestRecord = await CollaborationRequest.findOne({
          where: {
            requesterId: currentUserId,
            projectId: projectId,
            status: "pending",
          },
          attributes: ["status"],
        });
        if (requestRecord && requestRecord.status === "pending") {
          projectJson.currentUserMembershipStatus = "pending";
        }
      }
    }
    res.status(200).json({ success: true, data: projectJson });
  } catch (error) {
    console.error(`Error in getProjectById for ID ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving project details.";
    if (!res.headersSent)
      res.status(statusCode).json({ success: false, message });
  }
});

/**
 * @desc    Create a new project and add owner as member
 * @route   POST /api/projects
 * @access  Private (Requires Login)
 */
export const createProject = asyncHandler(async (req, res) => {
  const ownerId = req.user?.id;
  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required to create a project.");
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

  if (!title?.trim()) {
    res.status(400);
    throw new Error("Project title is required.");
  }
  if (!description?.trim()) {
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
        "Invalid format for 'skillsNeeded'. Expected JSON array or array string."
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
    throw new Error(
      `Invalid project status: '${status}'. Must be one of: ${allowedStatuses.join(
        ", "
      )}`
    );
  }

  let savedImageUrl = null;
  let absoluteFilePath = null;

  if (req.file) {
    try {
      await ensureUploadsDirExists(PROJECT_UPLOADS_DIR);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const safeOriginalName = path
        .basename(req.file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${uniqueSuffix}-${safeOriginalName}`;
      absoluteFilePath = path.join(PROJECT_UPLOADS_DIR, filename);
      savedImageUrl = `/uploads/projects/${filename}`;
      if (!req.file.buffer) throw new Error("File buffer missing from upload.");
      await fs.writeFile(absoluteFilePath, req.file.buffer);
    } catch (uploadError) {
      console.error("Failed to write uploaded file:", uploadError);
      res.status(500);
      throw new Error("Server error saving project image.");
    }
  }

  const transaction = await sequelize.transaction();
  try {
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

    await Member.create(
      {
        userId: ownerId,
        projectId: newProject.id,
        role: "Owner",
        status: "active",
      },
      { transaction }
    );
    await transaction.commit();

    const createdProject = await Project.findByPk(newProject.id, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });
    res.status(201).json({ success: true, data: createdProject });
  } catch (error) {
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction
        .rollback()
        .catch((rbError) => console.error("Rollback error:", rbError));
    }
    if (absoluteFilePath) {
      try {
        await fs.unlink(absoluteFilePath);
      } catch (e) {
        console.error(
          "Error deleting orphaned upload file after transaction rollback:",
          e
        );
      }
    }
    console.error("Error during project creation process:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error creating project.";
    if (!res.headersSent)
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
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  const transaction = await sequelize.transaction();
  let newImageUrl = null;
  let newAbsoluteFilePath = null;
  let oldImageUrl = null;

  try {
    const project = await Project.findByPk(projectId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!project) {
      await transaction.commit();
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      await transaction.rollback();
      res.status(403);
      throw new Error("Not authorized: You are not the owner.");
    }
    oldImageUrl = project.imageUrl;

    if (req.file) {
      try {
        await ensureUploadsDirExists(PROJECT_UPLOADS_DIR);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const safeOriginalName = path
          .basename(req.file.originalname)
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        const filename = `${uniqueSuffix}-${safeOriginalName}`;
        newAbsoluteFilePath = path.join(PROJECT_UPLOADS_DIR, filename);
        newImageUrl = `/uploads/projects/${filename}`;
        if (!req.file.buffer) throw new Error("File buffer missing.");
        await fs.writeFile(newAbsoluteFilePath, req.file.buffer);
      } catch (uploadError) {
        console.error("Failed to write updated uploaded file:", uploadError);
        res.status(500);
        throw new Error("Server error saving updated project image.");
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
      if (!title.trim()) {
        res.status(400);
        throw new Error("Title cannot be empty.");
      }
      updates.title = title.trim();
    }
    if (description !== undefined)
      updates.description = description.trim() || null;
    if (requiredCollaborators !== undefined) {
      const c = parseInt(requiredCollaborators, 10);
      if (isNaN(c) || c < 0) {
        res.status(400);
        throw new Error("Collaborators must be non-negative.");
      }
      updates.requiredCollaborators = c;
    }
    if (status !== undefined) {
      const allowed = Project.getAttributes().status?.values;
      if (allowed && !allowed.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status: '${status}'.`);
      }
      updates.status = status;
    }
    if (category !== undefined) updates.category = category || null;
    if (duration !== undefined) updates.duration = duration || null;
    if (funding !== undefined) updates.funding = funding || null;
    if (skillsNeeded !== undefined) {
      try {
        let ps =
          skillsNeeded === null ||
          (typeof skillsNeeded === "string" && skillsNeeded.trim() === "")
            ? []
            : typeof skillsNeeded === "string"
            ? JSON.parse(skillsNeeded)
            : skillsNeeded;
        if (!Array.isArray(ps))
          throw new Error("SkillsNeeded must be an array.");
        updates.skillsNeeded = ps;
      } catch (e) {
        res.status(400);
        throw new Error(
          "Invalid 'skillsNeeded' format. Expected JSON array string or empty/null."
        );
      }
    }
    if (progress !== undefined) {
      const p = parseInt(progress, 10);
      if (isNaN(p) || p < 0 || p > 100) {
        res.status(400);
        throw new Error("Progress must be 0-100.");
      }
      updates.progress = p;
    }
    if (newImageUrl !== null) updates.imageUrl = newImageUrl;

    if (Object.keys(updates).length === 0 && !req.file) {
      await transaction.rollback();
      const currentProject = await Project.findByPk(projectId, {
        attributes: projectDetailSelectFields,
        include: [
          { model: User, as: "owner", attributes: userPublicSelectFields },
        ],
      });
      return res
        .status(200)
        .json({
          success: true,
          message: "No changes detected.",
          data: currentProject,
        });
    }

    await project.update(updates, { transaction });
    await transaction.commit();

    if (newImageUrl && oldImageUrl && oldImageUrl !== newImageUrl) {
      try {
        const oldAbsoluteFilePath = path.join(
          UPLOADS_ROOT_DIR,
          oldImageUrl.startsWith("/") ? oldImageUrl.substring(1) : oldImageUrl
        );
        await fs.unlink(oldAbsoluteFilePath);
      } catch (deleteError) {
        if (deleteError.code !== "ENOENT")
          console.error(
            `Error deleting old image (${oldImageUrl}):`,
            deleteError
          );
      }
    }

    const updatedProject = await Project.findByPk(project.id, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });
    res
      .status(200)
      .json({
        success: true,
        message: "Project updated successfully.",
        data: updatedProject,
      });
  } catch (error) {
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction
        .rollback()
        .catch((rbError) => console.error("Rollback error:", rbError));
    }
    if (newAbsoluteFilePath) {
      try {
        await fs.unlink(newAbsoluteFilePath);
      } catch (e) {
        console.error(
          "Error deleting newly uploaded file after transaction error:",
          e
        );
      }
    }
    console.error(`Error updating project ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error updating project.";
    if (!res.headersSent)
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
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  let imagePathToDelete = null;
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findByPk(projectId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
      attributes: ["id", "ownerId", "imageUrl"],
    });
    if (!project) {
      await transaction.commit();
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      await transaction.rollback();
      res.status(403);
      throw new Error("Not authorized: You are not the owner.");
    }
    imagePathToDelete = project.imageUrl;

    await Member.destroy({ where: { projectId: projectId }, transaction });
    await CollaborationRequest.destroy({
      where: { projectId: projectId },
      transaction,
    });
    // Consider Messages related to the project if applicable
    // await Message.destroy({ where: { projectId: projectId }, transaction });

    await project.destroy({ transaction });
    await transaction.commit();

    if (imagePathToDelete) {
      try {
        const absoluteFilePath = path.join(
          UPLOADS_ROOT_DIR,
          imagePathToDelete.startsWith("/")
            ? imagePathToDelete.substring(1)
            : imagePathToDelete
        );
        await fs.unlink(absoluteFilePath);
      } catch (deleteError) {
        if (deleteError.code !== "ENOENT")
          console.error(
            `Error deleting project image (${imagePathToDelete}):`,
            deleteError
          );
      }
    }
    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction
        .rollback()
        .catch((rbError) => console.error("Rollback error:", rbError));
    }
    console.error(`Error deleting project ${projectIdParam}:`, error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      res.status(409);
      throw new Error("Cannot delete project. Related data exists.");
    }
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error deleting project.";
    if (!res.headersSent)
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
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Forbidden: Only owner can view requests.");
    }

    const pendingRequests = await CollaborationRequest.findAll({
      where: { projectId: projectId, status: "pending" },
      include: [
        { model: User, as: "requester", attributes: userPublicSelectFields },
      ],
      order: [["createdAt", "DESC"]],
    });
    res
      .status(200)
      .json({
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
    const message = error.message || "Server error retrieving requests.";
    if (!res.headersSent)
      res.status(statusCode).json({ success: false, message });
  }
});

/**
 * @desc    Get ACTIVE members of a specific project
 * @route   GET /api/projects/:projectId/members
 * @access  Private (Owner or Active Member only)
 */
export const getProjectMembers = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const currentUserId = req.user?.id;
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
    const isOwner = ownerId === currentUserId;
    let isActiveMember = false;
    if (!isOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: { [Op.in]: ["active", "approved"] },
        },
        attributes: ["userId"],
      });
      isActiveMember = !!membership;
    }

    if (!isOwner && !isActiveMember) {
      res.status(403);
      throw new Error("Access Denied: Owner or active member only.");
    }

    const members = await Member.findAll({
      where: {
        projectId: projectId,
        status: { [Op.in]: ["active", "approved"] },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: userPublicSelectFields,
          required: true,
        },
      ],
      attributes: ["userId", "role", "status", "joinedAt"],
      order: [["joinedAt", "ASC"]],
    });

    const projectOwnerInfo = project.owner?.toJSON();
    let formattedMembers = members
      .map((m) => ({
        userId: m.user?.id,
        username: m.user?.username,
        profilePictureUrl: m.user?.profilePictureUrl,
        role: m.userId === ownerId ? "Owner" : m.role || "Member",
        status: m.status,
        joinedAt: m.joinedAt,
      }))
      .filter((m) => m.userId);

    if (projectOwnerInfo) {
      const ownerInListIndex = formattedMembers.findIndex(
        (m) => m.userId === ownerId
      );
      if (ownerInListIndex === -1) {
        formattedMembers.unshift({
          userId: ownerId,
          username: projectOwnerInfo.username,
          profilePictureUrl: projectOwnerInfo.profilePictureUrl,
          role: "Owner",
          joinedAt: project.createdAt,
        });
      } else {
        formattedMembers[ownerInListIndex].role = "Owner";
      }
    }
    formattedMembers.sort((a, b) => {
      if (a.role === "Owner" && b.role !== "Owner") return -1;
      if (b.role === "Owner" && a.role !== "Owner") return 1;
      return (a.username || "").localeCompare(b.username || "");
    });

    res.status(200).json({ success: true, data: formattedMembers });
  } catch (error) {
    console.error(
      `Error in getProjectMembers for Project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving members.";
    if (!res.headersSent)
      res.status(statusCode).json({ success: false, message });
  }
});

// ==================================================================
// === SIMPLIFIED getProjectsByUserId - FOCUS ON OWNED PROJECTS ===
// ==================================================================
/**
 * @desc    Get all projects OWNED BY a specific user
 * @route   GET /api/projects/user/:userId
 * @access  Public (uses optionalProtect in routes to add viewer-specific context if logged in)
 */
export const getProjectsByUserId = asyncHandler(async (req, res) => {
  const targetUserIdParam = req.params.userId;
  const currentLoggedInUserId = req.user?.id; // From optionalProtect

  const targetUserId = parseInt(targetUserIdParam, 10);
  if (isNaN(targetUserId) || targetUserId <= 0) {
    res.status(400);
    throw new Error("Invalid User ID format provided.");
  }

  console.log(
    `API: getProjectsByUserId (Owned by User ${targetUserId}) invoked by ${
      currentLoggedInUserId ? "User " + currentLoggedInUserId : "Guest"
    }`
  );

  try {
    const targetUserExists = await User.findByPk(targetUserId, {
      attributes: ["id", "username"],
    });
    if (!targetUserExists) {
      res.status(404);
      throw new Error(`User with ID ${targetUserId} not found.`);
    }

    const { page = 1, limit = 9, status: projectStatusQuery } = req.query;
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

    const projectWhereConditions = {
      ownerId: targetUserId, // Only projects owned by this user
      status:
        projectStatusQuery === "archived"
          ? "Archived"
          : { [Op.ne]: "Archived" },
    };
    if (
      projectStatusQuery &&
      projectStatusQuery !== "all" &&
      projectStatusQuery !== "archived"
    ) {
      projectWhereConditions.status = projectStatusQuery;
    }

    const includeClauses = [
      { model: User, as: "owner", attributes: userPublicSelectFields },
    ];

    if (currentLoggedInUserId) {
      includeClauses.push(
        {
          model: Member,
          as: "currentUserSpecificMembership",
          attributes: ["status"],
          where: {
            userId:
              currentLoggedInUserId /* projectId will be joined by Sequelize */,
          },
          required: false, // LEFT JOIN
        },
        {
          model: CollaborationRequest,
          as: "currentUserSpecificRequest",
          attributes: ["status"],
          where: {
            requesterId: currentLoggedInUserId,
            status: "pending" /* projectId will be joined */,
          },
          required: false, // LEFT JOIN
        }
      );
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where: projectWhereConditions,
      attributes: projectListSelectFields,
      include: includeClauses,
      order: [["updatedAt", "DESC"]],
      limit: parsedLimit,
      offset: offset,
    });

    const processedProjects = projects.map((p) => {
      const projectJson = p.toJSON();
      projectJson.currentUserMembershipStatus = null; // Default

      if (currentLoggedInUserId) {
        const membership = projectJson.currentUserSpecificMembership;
        const request = projectJson.currentUserSpecificRequest;
        if (
          membership &&
          (membership.status === "active" || membership.status === "approved")
        ) {
          projectJson.currentUserMembershipStatus = "approved";
        } else if (request && request.status === "pending") {
          projectJson.currentUserMembershipStatus = "pending";
        }
      }
      // Clean up to avoid sending too much data to frontend if these are not needed directly
      delete projectJson.currentUserSpecificMembership;
      delete projectJson.currentUserSpecificRequest;
      return projectJson;
    });

    res.status(200).json({
      success: true,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
      data: processedProjects,
    });
  } catch (error) {
    console.error(
      `Error in getProjectsByUserId (Owned Only) for User ${targetUserId}:`,
      error
    );
    if (error.name && error.name.startsWith("Sequelize")) {
      console.error("Sequelize Error Details:", JSON.stringify(error, null, 2));
    }
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving user's projects.";
    if (!res.headersSent)
      res.status(statusCode).json({ success: false, message });
  }
});
// ==================================================================

/** @desc Admin get all projects (placeholder/stub from your original code) */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  // This route would need `protect` and `adminOnly` middleware in `projectRoutes.js`
  console.warn("API: adminGetAllProjects invoked but not fully implemented.");
  res
    .status(501)
    .json({ success: false, message: "Admin route not implemented yet" });
});
