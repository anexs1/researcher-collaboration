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
const UPLOADS_DIR = path.resolve(__dirname, "..", "uploads", "projects"); // Specific subfolder

const { Project, User, Member, CollaborationRequest, sequelize } = db; // Ensure all models are loaded

// --- Helper to ensure directory exists ---
const ensureUploadsDirExists = async () => {
  try {
    await fs.access(UPLOADS_DIR);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Uploads directory ${UPLOADS_DIR} not found, creating...`);
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } else {
      throw error;
    }
  }
};
// Ensure directory exists on server startup
ensureUploadsDirExists().catch((err) =>
  console.error("Failed to create initial uploads directory:", err)
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
  "imageUrl", // Use model name (mapped to image_url)
  "category",
  "duration",
  "funding", // Add fields needed for list display
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
  "imageUrl", // Model uses imageUrl
  "category",
  "duration",
  "funding",
  "skillsNeeded", // Model uses skillsNeeded
  "progress",
  "views",
  "likes",
  "comments",
];
const userPublicSelectFields = ["id", "username", "profilePictureUrl"];

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
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (!status || status.toLowerCase() !== "archived") {
      where.status = { [Op.ne]: "Archived" };
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
      throw new Error("Invalid pagination.");
    }
    const offset = (parsedPage - 1) * parsedLimit;

    if (!Project || !Member || !CollaborationRequest || !User)
      throw new Error("DB models not loaded.");

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListSelectFields, // Uses model camelCase names
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

    console.log(
      `Found ${count} projects total, returning page ${parsedPage} (${processedProjects.length} items).`
    );
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: processedProjects,
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
    if (!Project || !User) throw new Error("DB models not loaded.");
    const projects = await Project.findAll({
      where: { ownerId: userId },
      attributes: projectListSelectFields, // Uses model camelCase names
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
 * @access  Private (Requires login)
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
    if (!Project || !User) throw new Error("DB models not loaded.");
    const project = await Project.findByPk(projectId, {
      attributes: projectDetailSelectFields, // Uses model camelCase names
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    console.log(`Project ${projectId} found successfully.`);
    res.status(200).json({ success: true, project: project }); // Return under 'project' key
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
  console.log("createProject - req.body:", req.body);
  console.log("createProject - req.file:", req.file);

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  // Destructure ALL expected fields from req.body
  const {
    title,
    description,
    requiredCollaborators,
    status = "Planning",
    category,
    duration,
    funding,
    skillsNeeded,
    progress,
    views,
    likes,
    comments,
  } = req.body;

  // --- VALIDATION ---
  if (
    !title ||
    title.trim() === "" ||
    !description ||
    description.trim() === ""
  ) {
    console.error(
      "Validation Failed: Title or Description missing/empty in req.body."
    );
    res.status(400);
    throw new Error("Title and description are required fields.");
  }
  // --- END VALIDATION ---

  let parsedSkills = [];
  if (skillsNeeded) {
    try {
      parsedSkills = JSON.parse(skillsNeeded);
      if (!Array.isArray(parsedSkills)) throw new Error();
    } catch (e) {
      res.status(400);
      throw new Error("Invalid skillsNeeded format.");
    }
  }
  const collaborators = requiredCollaborators
    ? parseInt(requiredCollaborators, 10)
    : 1;
  if (isNaN(collaborators) || collaborators < 0) {
    res.status(400);
    throw new Error("Collaborators must be valid number.");
  }

  let savedImageUrl = null; // Variable holds value for model's imageUrl field

  if (req.file) {
    await ensureUploadsDirExists();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename =
      uniqueSuffix + "-" + req.file.originalname.replace(/\s+/g, "_");
    const absoluteFilePath = path.join(UPLOADS_DIR, filename);
    savedImageUrl = `/uploads/projects/${filename}`; // Relative path for DB field 'imageUrl' (maps to image_url)
    try {
      await fs.writeFile(absoluteFilePath, req.file.buffer);
      console.log(
        `File saved: ${absoluteFilePath}, DB Value (imageUrl): ${savedImageUrl}`
      );
    } catch (uploadError) {
      res.status(500);
      throw new Error("Failed to save image.");
    }
  }

  const transaction = await sequelize.transaction();
  try {
    if (!Project || !Member) throw new Error("DB models not loaded.");
    const newProject = await Project.create(
      {
        // Use MODEL field names (camelCase)
        title: title.trim(),
        description: description.trim(),
        ownerId,
        requiredCollaborators: collaborators,
        status,
        category: category || null,
        duration: duration || null,
        funding: funding || null,
        skillsNeeded: parsedSkills,
        imageUrl: savedImageUrl, // Maps to image_url via 'field' in model
        progress: progress || 0,
        views: views || 0,
        likes: likes || 0,
        comments: comments || 0,
      },
      { transaction }
    );
    console.log(`Project created ID: ${newProject.id}`);

    await Member.create(
      {
        userId: ownerId,
        projectId: newProject.id,
        role: "owner",
        status: "active",
      },
      { transaction }
    );
    console.log(`Owner added as member.`);

    await transaction.commit();
    console.log("Transaction committed.");

    const createdProject = await Project.findByPk(newProject.id, {
      attributes: projectDetailSelectFields, // Uses model names
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });
    res.status(201).json({ success: true, data: createdProject }); // Use 'data' key
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    }
    if (savedImageUrl) {
      try {
        const fileToDelete = path.resolve(
          __dirname,
          "..",
          savedImageUrl.substring(1)
        );
        await fs.unlink(fileToDelete);
        console.log("Deleted orphaned upload.");
      } catch (e) {
        console.error("Error deleting orphaned file:", e);
      }
    }
    console.error("Error creating project:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
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
    `API: updateProject invoked ID: ${projectIdParam} by User ${userId}`
  );
  console.log("updateProject - req.body:", req.body);
  console.log("updateProject - req.file:", req.file);

  if (!userId) {
    res.status(401);
    throw new Error("Auth required.");
  }
  const projectId = parseInt(projectIdParam);
  if (isNaN(projectId)) {
    res.status(400);
    throw new Error("Invalid ID.");
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
      throw new Error("Not authorized.");
    }

    oldImageUrl = project.imageUrl; // Get current value (which maps to image_url)

    if (req.file) {
      await ensureUploadsDirExists();
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename =
        uniqueSuffix + "-" + req.file.originalname.replace(/\s+/g, "_");
      const absoluteFilePath = path.join(UPLOADS_DIR, filename);
      newImageUrl = `/uploads/projects/${filename}`; // This value will be saved in the model's imageUrl field
      try {
        await fs.writeFile(absoluteFilePath, req.file.buffer);
        console.log(`New file saved: ${absoluteFilePath}`);
      } catch (uploadError) {
        res.status(500);
        throw new Error("Failed to save updated image.");
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
      views,
      likes,
      comments,
    } = req.body;
    const updates = {};
    // Use MODEL field names (camelCase) for keys in 'updates' object
    if (title !== undefined) {
      if (title.trim() === "") throw new Error("Title cannot be empty.");
      updates.title = title.trim();
    }
    if (description !== undefined) updates.description = description;
    if (requiredCollaborators !== undefined) {
      const c = parseInt(requiredCollaborators);
      if (isNaN(c) || c < 0) throw new Error("Invalid collaborators.");
      updates.requiredCollaborators = c;
    }
    if (status !== undefined) {
      const vs = Project.getAttributes().status?.values;
      if (vs && vs.includes(status)) updates.status = status;
      else throw new Error(`Invalid status.`);
    }
    if (category !== undefined) updates.category = category || null;
    if (duration !== undefined) updates.duration = duration || null;
    if (funding !== undefined) updates.funding = funding || null;
    if (skillsNeeded !== undefined) {
      try {
        let ps = [];
        if (typeof skillsNeeded === "string") ps = JSON.parse(skillsNeeded);
        else if (Array.isArray(skillsNeeded)) ps = skillsNeeded;
        else throw new Error();
        updates.skillsNeeded = ps;
      } catch (e) {
        throw new Error("Invalid skillsNeeded format.");
      }
    }
    if (newImageUrl) updates.imageUrl = newImageUrl; // Update model field
    if (progress !== undefined) updates.progress = parseInt(progress) || 0;
    if (views !== undefined) updates.views = parseInt(views) || project.views; // Don't reset if not provided
    if (likes !== undefined) updates.likes = parseInt(likes) || project.likes;
    if (comments !== undefined)
      updates.comments = parseInt(comments) || project.comments;

    if (Object.keys(updates).length === 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: "No fields provided for update." });
    }

    console.log("Applying updates:", updates);
    await project.update(updates, { transaction });
    await transaction.commit();
    console.log(`Project ${projectId} updated successfully.`);

    if (newImageUrl && oldImageUrl) {
      try {
        const fileToDelete = path.resolve(
          __dirname,
          "..",
          oldImageUrl.substring(1)
        );
        await fs.unlink(fileToDelete);
        console.log(`Deleted old image file: ${fileToDelete}`);
      } catch (deleteError) {
        console.error("Error deleting old image:", deleteError);
      }
    }

    const updatedProject = await Project.findByPk(project.id, {
      attributes: projectDetailSelectFields,
      include: [
        /* owner */
      ],
    });
    res.status(200).json({ success: true, project: updatedProject }); // Use 'project' key
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Update rolled back.");
    }
    if (newImageUrl) {
      try {
        const fileToDelete = path.resolve(
          __dirname,
          "..",
          newImageUrl.substring(1)
        );
        await fs.unlink(fileToDelete);
        console.log("Deleted new upload due to error.");
      } catch (e) {
        console.error("Error deleting new file:", e);
      }
    }
    console.error(`Error updating project ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
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
    `API: deleteProject invoked ID: ${projectIdParam} by User ${userId}`
  );
  if (!userId) {
    res.status(401);
    throw new Error("Auth required.");
  }
  const projectId = parseInt(projectIdParam);
  if (isNaN(projectId)) {
    res.status(400);
    throw new Error("Invalid ID.");
  }

  let imagePathToDelete = null; // Use model field name imageUrl
  const transaction = await sequelize.transaction();
  try {
    if (!Project) throw new Error("Project model not loaded");
    const project = await Project.findByPk(projectId, {
      transaction,
      attributes: ["id", "ownerId", "imageUrl"],
    }); // Get imageUrl
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Not authorized.");
    }

    imagePathToDelete = project.imageUrl; // Store path/URL (model field name)

    await project.destroy({ transaction });
    await transaction.commit();
    console.log(`Project ${projectId} DB record deleted.`);

    if (imagePathToDelete) {
      try {
        // Assuming imagePathToDelete stores relative path like /uploads/projects/...
        const fileToDelete = path.resolve(
          __dirname,
          "..",
          imagePathToDelete.substring(1)
        );
        await fs.unlink(fileToDelete);
        console.log(`Deleted associated image file: ${fileToDelete}`);
      } catch (deleteError) {
        // ENOENT (File not found) is okay, might have been deleted manually or never existed
        if (deleteError.code !== "ENOENT") {
          console.error("Error deleting image file:", deleteError);
        } else {
          console.log(
            "Image file not found for deletion (ENOENT), possibly already deleted."
          );
        }
      }
    }
    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Delete transaction rolled back.");
    }
    console.error(`Error deleting project ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
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
    throw new Error("Auth required.");
  }
  const projectId = parseInt(projectIdParam);
  if (isNaN(projectId)) {
    res.status(400);
    throw new Error("Invalid ID.");
  }

  try {
    if (!Project || !CollaborationRequest || !User)
      throw new Error("DB models not loaded");
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId", "title"],
    });
    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    if (project.ownerId !== userId) {
      res.status(403);
      throw new Error("Forbidden.");
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
    // Return requests array under 'data' key
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
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
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
    throw new Error("Auth required.");
  }
  const projectId = parseInt(projectIdParam);
  if (isNaN(projectId)) {
    res.status(400);
    throw new Error("Invalid ID.");
  }

  try {
    if (!Project || !Member || !User) throw new Error("DB models not loaded");
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
    const projectOwner = project.owner?.toJSON();

    const isOwner = ownerId === currentUserId;
    let isMember = false;
    if (!isOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: "active",
        },
      });
      isMember = !!membership;
    }
    if (!isOwner && !isMember) {
      res.status(403);
      throw new Error("Access Denied.");
    }
    console.log(
      `Auth Passed for getProjectMembers (Owner: ${isOwner}, Member: ${isMember})`
    );

    const members = await Member.findAll({
      where: { projectId: projectId, status: "active" },
      include: [
        { model: User, as: "user", attributes: userPublicSelectFields },
      ],
      attributes: ["userId", "role", "status", "joinedAt", "id"],
      order: [["joinedAt", "ASC"]],
    });

    let formattedMembers = members
      .map((m) => ({
        id: m.id,
        userId: m.user?.id,
        username: m.user?.username,
        profilePictureUrl: m.user?.profilePictureUrl,
        role: m.userId === ownerId ? "Owner" : m.role || "Member",
        joinedAt: m.joinedAt,
      }))
      .filter((m) => m.userId);
    if (projectOwner && !formattedMembers.some((m) => m.userId === ownerId)) {
      formattedMembers.unshift({
        id: `owner-${ownerId}`,
        userId: ownerId,
        ...projectOwner,
        role: "Owner",
        joinedAt: project.createdAt,
      });
    } else {
      formattedMembers = formattedMembers.map((m) =>
        m.userId === ownerId ? { ...m, role: "Owner" } : m
      );
    }
    formattedMembers.sort((a, b) => {
      if (a.role === "Owner") return -1;
      if (b.role === "Owner") return 1;
      return (a.username || "").localeCompare(b.username || "");
    });

    console.log(
      `Returning ${formattedMembers.length} members for project ${projectId}`
    );
    res.status(200).json({ success: true, data: formattedMembers }); // Return under 'data' key
  } catch (error) {
    console.error(
      `Error in getProjectMembers for Project ${projectIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res
      .status(statusCode)
      .json({ success: false, message: error.message || "Server error." });
  }
});

/** @desc Admin get all projects (placeholder) */
// Ensure this is exported if imported in any router
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  console.log("API: adminGetAllProjects invoked");
  // Add actual admin logic here (e.g., fetch all projects regardless of status)
  res
    .status(501)
    .json({ success: false, message: "Admin route not implemented yet" });
});
