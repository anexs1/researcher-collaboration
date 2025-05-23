import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Ensure this path is correct
import { Op, literal } from "sequelize";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT_DIR = path.resolve(__dirname, ".."); // Adjust if controller is deeper
const UPLOADS_ROOT_DIR = path.join(BACKEND_ROOT_DIR, "uploads");
const PROJECT_UPLOADS_DIR = path.join(UPLOADS_ROOT_DIR, "projects");

const { Project, User, Member, CollaborationRequest, sequelize } = db;

if (!Project || !User || !Member || !CollaborationRequest || !sequelize) {
  console.error(
    "FATAL: Database models not loaded correctly in projectController.js. Check model imports and database connection."
  );
  // Consider process.exit(1) in production if this is critical
}

const ensureUploadsDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Successfully created directory: ${dirPath}`);
      } catch (mkdirError) {
        console.error(`Error creating directory ${dirPath}:`, mkdirError);
        throw new Error(`Failed to create required directory: ${dirPath}`);
      }
    } else {
      console.error(`Error accessing directory ${dirPath}:`, error);
      throw error; // Re-throw other errors
    }
  }
};

// Ensure the directory exists on server startup
ensureUploadsDirExists(PROJECT_UPLOADS_DIR).catch((err) =>
  console.error(
    "Failed to ensure initial project uploads directory on startup:",
    err
  )
);

// --- Field Definitions with CORRECTED literal subquery for MySQL ---
// Make sure `project_members`, `project_id`, `status` and `${Project.name}` (resolves to `Project` or `Projects` table name) are correct.
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
  [
    literal(
      `(SELECT COUNT(*) FROM \`project_members\` WHERE \`project_members\`.\`project_id\` = \`${Project.name}\`.\`id\` AND \`project_members\`.\`status\` IN ('active', 'approved'))`
    ),
    "currentCollaborators",
  ],
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
  [
    literal(
      `(SELECT COUNT(*) FROM \`project_members\` WHERE \`project_members\`.\`project_id\` = \`${Project.name}\`.\`id\` AND \`project_members\`.\`status\` IN ('active', 'approved'))`
    ),
    "currentCollaborators",
  ],
];
const userPublicSelectFields = ["id", "username", "profilePictureUrl"];

// --- Existing Controller Functions ---
// (Make sure ALL your other controller functions like getAllProjects, getMyProjects, createProject, etc., are present here.
// I am only showing the modified adminGetAllProjects and placeholders for others for brevity.)

export const getAllProjects = asyncHandler(async (req, res) => {
  const currentUserId = req.user?.id;
  try {
    const { status, search, page = 1, limit = 9 } = req.query;
    const where = {};
    if (status && status !== "all" && status !== "archived") {
      const allowedDbStatuses = Project.getAttributes().status?.values || [];
      const canonicalQueryStatus = allowedDbStatuses.find(
        (s) => s.toLowerCase() === status.toLowerCase()
      );
      if (canonicalQueryStatus) {
        where.status = canonicalQueryStatus;
      } else if (status !== "all") {
        console.warn(
          `getAllProjects: Invalid status query parameter received: ${status}`
        );
      }
    } else if (status === "archived") {
      where.status = "Archived"; // Make sure "Archived" is a defined status
    } else if (status !== "all") {
      where.status = { [Op.ne]: "Archived" };
    }

    if (search) {
      const likeOperator = Op.like;
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters." });
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
      projectJson.currentCollaborators =
        parseInt(projectJson.currentCollaborators, 10) || 0;
      if (projectJson.status) {
        const allowedDbStatuses = Project.getAttributes().status?.values || [];
        const canonicalStatus = allowedDbStatuses.find(
          (s) => s.toLowerCase() === projectJson.status.toLowerCase()
        );
        projectJson.status = canonicalStatus || projectJson.status;
      }

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
    const statusCode =
      res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving projects.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const getMyProjects = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  try {
    const projectWhereConditions = {
      [Op.or]: [{ ownerId: userId }, { "$memberships.user_id$": userId }],
      status: { [Op.ne]: "Archived" },
    };
    const { count, rows: projects } = await Project.findAndCountAll({
      where: projectWhereConditions,
      attributes: projectListSelectFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
          required: false,
        }, // Added required:false for robustness
        {
          model: Member,
          as: "memberships",
          where: { status: { [Op.in]: ["active", "approved"] } },
          attributes: [], // No attributes needed from Member for this specific purpose
          required: false, // Important: use 'false' for LEFT JOIN behavior when checking membership
        },
      ],
      order: [["updatedAt", "DESC"]],
      distinct: true,
    });
    const processedProjects = projects.map((p) => {
      const projectJson = p.toJSON();
      projectJson.currentCollaborators =
        parseInt(projectJson.currentCollaborators, 10) || 0;
      if (projectJson.status) {
        const allowedDbStatuses = Project.getAttributes().status?.values || [];
        const canonicalStatus = allowedDbStatuses.find(
          (s) => s.toLowerCase() === projectJson.status.toLowerCase()
        );
        projectJson.status = canonicalStatus || projectJson.status;
      }
      return projectJson;
    });
    res
      .status(200)
      .json({ success: true, count: count, data: processedProjects });
  } catch (error) {
    console.error(`Error in getMyProjects for User ${userId}:`, error);
    const statusCode =
      res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving user's projects.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const getProjectById = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const currentUserId = req.user?.id;
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Project ID format." });
  }

  try {
    const project = await Project.findByPk(projectId, {
      attributes: projectDetailSelectFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
          required: false,
        },
      ],
    });
    if (!project) {
      res.status(404); // Set status before throwing for the catch block
      throw new Error("Project not found.");
    }

    const projectJson = project.toJSON();
    projectJson.currentCollaborators =
      parseInt(projectJson.currentCollaborators, 10) || 0;

    if (projectJson.status) {
      const allowedDbStatuses = Project.getAttributes().status?.values || [];
      const canonicalStatus = allowedDbStatuses.find(
        (s) => s.toLowerCase() === projectJson.status.toLowerCase()
      );
      projectJson.status = canonicalStatus || projectJson.status;
    }

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
    console.error(`[getProjectById] Error for ID ${projectIdParam}:`, error);
    const statusCode =
      res.statusCode !== 200 && res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving project details.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const createProject = asyncHandler(async (req, res) => {
  const ownerId = req.user?.id;
  if (!ownerId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required to create a project.",
    });
  }
  const {
    title,
    description,
    requiredCollaborators,
    status = "Planning", // Default status
    category,
    duration,
    funding,
    skillsNeeded,
    progress = 0,
  } = req.body;

  if (!title?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Project title is required." });
  }
  if (!description?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Project description is required." });
  }
  let parsedSkills = [];
  if (skillsNeeded) {
    try {
      parsedSkills =
        typeof skillsNeeded === "string"
          ? JSON.parse(skillsNeeded)
          : skillsNeeded;
      if (!Array.isArray(parsedSkills)) {
        throw new Error("Skills must be an array.");
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid format for 'skillsNeeded'. Expected JSON array or array of strings.",
      });
    }
  }
  const collaborators = requiredCollaborators
    ? parseInt(requiredCollaborators, 10)
    : 0;
  if (isNaN(collaborators) || collaborators < 0) {
    return res.status(400).json({
      success: false,
      message: "Required collaborators must be a non-negative number.",
    });
  }

  let canonicalCreateStatus = "Planning";
  const allowedDbStatusesCreate = Project.getAttributes().status?.values || [];
  if (status) {
    const foundStatus = allowedDbStatusesCreate.find(
      (s) => s.toLowerCase() === status.toLowerCase()
    );
    if (foundStatus) {
      canonicalCreateStatus = foundStatus;
    } else {
      return res.status(400).json({
        success: false,
        message: `Invalid project status: '${status}'. Must be one of: ${allowedDbStatusesCreate.join(
          ", "
        )}`,
      });
    }
  }

  let savedImageUrl = null;
  let absoluteFilePath = null;
  if (req.file) {
    try {
      await ensureUploadsDirExists(PROJECT_UPLOADS_DIR);
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const safeOriginalName = path
        .basename(req.file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, "_"); // Sanitize filename
      const filename = `${uniqueSuffix}-${safeOriginalName}`;
      absoluteFilePath = path.join(PROJECT_UPLOADS_DIR, filename);
      savedImageUrl = `/uploads/projects/${filename}`; // URL path for frontend
      if (!req.file.buffer) {
        console.error("File buffer missing from upload in createProject");
        throw new Error("File buffer missing from upload.");
      }
      await fs.writeFile(absoluteFilePath, req.file.buffer);
    } catch (uploadError) {
      console.error(
        "Failed to write uploaded file in createProject:",
        uploadError
      );
      // Don't return res here, let the main catch block handle it after potential rollback
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
        status: canonicalCreateStatus,
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
        status: "active", // Owner is active by default
      },
      { transaction }
    );
    await transaction.commit();

    // Fetch the created project again to include associations for the response
    const createdProject = await Project.findByPk(newProject.id, {
      attributes: projectDetailSelectFields, // Use detailed fields for the response
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
          required: false,
        },
      ],
    });
    if (!createdProject) {
      // Should not happen if create was successful
      console.error(
        "Failed to retrieve project immediately after creation, ID:",
        newProject.id
      );
      throw new Error("Project created but could not be retrieved.");
    }

    const projectJson = createdProject.toJSON();
    projectJson.currentCollaborators =
      parseInt(projectJson.currentCollaborators, 10) || 0; // Comes from literal subquery
    if (projectJson.status) {
      const canonicalRespStatus = allowedDbStatusesCreate.find(
        // Use same allowed statuses
        (s) => s.toLowerCase() === projectJson.status.toLowerCase()
      );
      projectJson.status = canonicalRespStatus || projectJson.status;
    }
    res.status(201).json({ success: true, data: projectJson });
  } catch (error) {
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction
        .rollback()
        .catch((rbError) =>
          console.error("Rollback error in createProject:", rbError)
        );
    }
    // If image was saved but transaction failed, delete the orphaned image
    if (absoluteFilePath) {
      try {
        await fs.unlink(absoluteFilePath);
        console.log(
          "Deleted orphaned upload file after transaction rollback:",
          absoluteFilePath
        );
      } catch (e) {
        console.error(
          "Error deleting orphaned upload file in createProject:",
          e
        );
      }
    }
    console.error("Error during project creation process:", error);
    const statusCode =
      res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500; // Use already set status if available
    const message = error.message || "Server error creating project.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const updateProject = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const userId = req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Project ID format." });
  }

  const transaction = await sequelize.transaction();
  let newImageUrl = null;
  let newAbsoluteFilePath = null;
  let oldImageUrl = null;

  try {
    const project = await Project.findByPk(projectId, {
      transaction,
      lock: transaction.LOCK.UPDATE, // Lock the row for update
    });

    if (!project) {
      await transaction.commit(); // or rollback() if preferred when not found before lock
      res.status(404);
      throw new Error("Project not found.");
    }

    if (project.ownerId !== userId) {
      await transaction.rollback(); // Not authorized
      return res.status(403).json({
        success: false,
        message: "Not authorized: You are not the owner.",
      });
    }

    oldImageUrl = project.imageUrl; // Store old image path for potential deletion

    // Handle file upload if present
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
        if (!req.file.buffer)
          throw new Error("File buffer missing from update.");
        await fs.writeFile(newAbsoluteFilePath, req.file.buffer);
      } catch (uploadError) {
        console.error("Failed to write updated uploaded file:", uploadError);
        throw new Error("Server error saving updated project image."); // Will be caught by main catch
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
      if (!title.trim())
        return res
          .status(400)
          .json({ success: false, message: "Title cannot be empty." });
      updates.title = title.trim();
    }
    if (description !== undefined)
      updates.description = description.trim() || null;
    if (requiredCollaborators !== undefined) {
      const c = parseInt(requiredCollaborators, 10);
      if (isNaN(c) || c < 0)
        return res.status(400).json({
          success: false,
          message: "Collaborators must be non-negative.",
        });
      updates.requiredCollaborators = c;
    }
    if (
      status !== undefined &&
      status !== null &&
      typeof status === "string" &&
      status.trim() !== ""
    ) {
      const allowedDbStatuses = Project.getAttributes().status?.values || [];
      const canonicalStatus = allowedDbStatuses.find(
        (s) => s.toLowerCase() === status.toLowerCase()
      );
      if (!canonicalStatus)
        return res.status(400).json({
          success: false,
          message: `Invalid status: '${status}'. Must be one of: ${allowedDbStatuses.join(
            ", "
          )}`,
        });
      updates.status = canonicalStatus;
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
        return res.status(400).json({
          success: false,
          message:
            "Invalid 'skillsNeeded' format. Expected JSON array string or empty/null.",
        });
      }
    }
    if (progress !== undefined) {
      const p = parseInt(progress, 10);
      if (isNaN(p) || p < 0 || p > 100)
        return res
          .status(400)
          .json({ success: false, message: "Progress must be 0-100." });
      updates.progress = p;
    }
    if (newImageUrl !== null) updates.imageUrl = newImageUrl; // If new image uploaded, update path

    // If no actual updates and no new file, respond with no changes
    if (Object.keys(updates).length === 0 && !req.file) {
      await transaction.rollback(); // Rollback if no updates and no file
      const currentProject = await Project.findByPk(projectId, {
        // Fetch fresh data
        attributes: projectDetailSelectFields,
        include: [
          {
            model: User,
            as: "owner",
            attributes: userPublicSelectFields,
            required: false,
          },
        ],
      });
      // This should ideally not happen if findByPk above worked
      if (!currentProject)
        return res.status(404).json({
          success: false,
          message: "Project not found after attempting no-change update.",
        });

      const projectJson = currentProject.toJSON();
      projectJson.currentCollaborators =
        parseInt(projectJson.currentCollaborators, 10) || 0;
      if (projectJson.status) {
        const allowed = Project.getAttributes().status?.values || [];
        const canon = allowed.find(
          (s) => s.toLowerCase() === projectJson.status.toLowerCase()
        );
        projectJson.status = canon || projectJson.status;
      }
      return res.status(200).json({
        success: true,
        message: "No changes detected.",
        data: projectJson,
      });
    }

    await project.update(updates, { transaction });
    await transaction.commit();

    // If update was successful and a new image was uploaded, delete the old one
    if (newImageUrl && oldImageUrl && oldImageUrl !== newImageUrl) {
      try {
        const oldAbsoluteFilePath = path.join(
          UPLOADS_ROOT_DIR,
          oldImageUrl.startsWith("/") ? oldImageUrl.substring(1) : oldImageUrl
        );
        await fs.unlink(oldAbsoluteFilePath);
        console.log(
          "Successfully deleted old project image:",
          oldAbsoluteFilePath
        );
      } catch (deleteError) {
        if (deleteError.code !== "ENOENT")
          console.error(
            `Error deleting old image (${oldImageUrl}):`,
            deleteError
          );
      }
    }

    const updatedProject = await Project.findByPk(project.id, {
      // Fetch again to get latest data with associations
      attributes: projectDetailSelectFields,
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
          required: false,
        },
      ],
    });
    if (!updatedProject) {
      // Should not happen
      console.error(
        "Failed to retrieve project immediately after update, ID:",
        project.id
      );
      throw new Error("Project updated but could not be retrieved.");
    }
    const projectJson = updatedProject.toJSON();
    projectJson.currentCollaborators =
      parseInt(projectJson.currentCollaborators, 10) || 0;
    if (projectJson.status) {
      const allowed = Project.getAttributes().status?.values || [];
      const canon = allowed.find(
        (s) => s.toLowerCase() === projectJson.status.toLowerCase()
      );
      projectJson.status = canon || projectJson.status;
    }
    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: projectJson,
    });
  } catch (error) {
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction
        .rollback()
        .catch((rbError) =>
          console.error("Rollback error in updateProject:", rbError)
        );
    }
    // If a new image was uploaded but transaction failed, delete the new (orphaned) image
    if (newAbsoluteFilePath) {
      try {
        await fs.unlink(newAbsoluteFilePath);
        console.log(
          "Deleted newly uploaded file after transaction error in updateProject:",
          newAbsoluteFilePath
        );
      } catch (e) {
        console.error(
          "Error deleting newly uploaded file after transaction error in updateProject:",
          e
        );
      }
    }
    console.error(`Error updating project ${projectIdParam}:`, error); // Log actual error
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error updating project.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const deleteProject = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const userId = req.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Project ID format." });
  }

  let imagePathToDelete = null;
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findByPk(projectId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
      attributes: ["id", "ownerId", "imageUrl"], // Only fetch necessary attributes
    });

    if (!project) {
      await transaction.commit(); // or rollback()
      res.status(404);
      throw new Error("Project not found.");
    }

    if (project.ownerId !== userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Not authorized: You are not the owner.",
      });
    }

    imagePathToDelete = project.imageUrl;

    // Delete related records first (order might matter depending on constraints)
    await Member.destroy({ where: { projectId: projectId }, transaction });
    await CollaborationRequest.destroy({
      where: { projectId: projectId },
      transaction,
    });
    // Add other related data deletions here if necessary (e.g., messages, tasks)

    await project.destroy({ transaction }); // Delete the project itself
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
        console.log("Successfully deleted project image:", absoluteFilePath);
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
        .catch((rbError) =>
          console.error("Rollback error in deleteProject:", rbError)
        );
    }
    console.error(`Error deleting project ${projectIdParam}:`, error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete project. Related data exists that must be removed first.",
      });
    }
    const statusCode =
      res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500;
    const message = error.message || "Server error deleting project.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const getProjectRequests = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const userId = req.user?.id; // User making the request
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Project ID format." });
  }

  try {
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"], // Only need ownerId to check permission
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }
    if (project.ownerId !== userId) {
      // Only owner can see requests for their project
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: Only the project owner can view collaboration requests.",
      });
    }

    const pendingRequests = await CollaborationRequest.findAll({
      where: { projectId: projectId, status: "pending" },
      include: [
        {
          model: User,
          as: "requester",
          attributes: userPublicSelectFields,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      data: pendingRequests.map((r) => r.toJSON()), // Ensure toJSON() is called if needed for clean output
    });
  } catch (error) {
    console.error(
      `Error in getProjectRequests for Project ${projectIdParam}:`,
      error
    );
    const statusCode =
      res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500;
    const message =
      error.message || "Server error retrieving collaboration requests.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const getProjectMembers = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const currentUserId = req.user?.id; // User making the request
  if (!currentUserId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }
  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Project ID format." });
  }

  try {
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId", "createdAt"],
      include: [
        {
          model: User,
          as: "owner",
          attributes: userPublicSelectFields,
          required: false,
        },
      ],
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const projectOwnerId = project.ownerId;
    const isCurrentUserOwner = projectOwnerId === currentUserId;
    let isCurrentUserActiveMember = false;

    if (!isCurrentUserOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: { [Op.in]: ["active", "approved"] },
        },
        attributes: ["userId"], // Only need to check existence
      });
      isCurrentUserActiveMember = !!membership;
    }

    // Allow owner or active members to view the member list
    if (!isCurrentUserOwner && !isCurrentUserActiveMember) {
      return res.status(403).json({
        success: false,
        message:
          "Access Denied: Only the project owner or an active member can view the member list.",
      });
    }

    const members = await Member.findAll({
      where: {
        projectId: projectId,
        status: { [Op.in]: ["active", "approved"] },
      },
      include: [
        {
          model: User,
          as: "user", // Ensure this alias matches your Member model association
          attributes: userPublicSelectFields,
          required: true, // Ensures only members with valid users are returned
        },
      ],
      attributes: ["userId", "role", "status", "joinedAt"],
      order: [["joinedAt", "ASC"]], // Or by username: [[{ model: User, as: 'user' }, 'username', 'ASC']]
    });

    const projectOwnerInfo = project.owner?.toJSON(); // Get owner info if available
    let formattedMembers = members
      .map((m) => ({
        userId: m.user?.id, // Prefer user.id from include
        username: m.user?.username,
        profilePictureUrl: m.user?.profilePictureUrl,
        role: m.userId === projectOwnerId ? "Owner" : m.role || "Member", // Ensure owner is marked as Owner
        status: m.status,
        joinedAt: m.joinedAt,
      }))
      .filter((m) => m.userId); // Filter out any potential null user records

    // Ensure owner is in the list and correctly marked
    if (projectOwnerInfo) {
      const ownerInListIndex = formattedMembers.findIndex(
        (m) => m.userId === projectOwnerId
      );
      if (ownerInListIndex === -1) {
        // If owner not found (e.g. not in Member table explicitly)
        formattedMembers.unshift({
          userId: projectOwnerId,
          username: projectOwnerInfo.username,
          profilePictureUrl: projectOwnerInfo.profilePictureUrl,
          role: "Owner",
          status: "active", // Assuming owner is always active
          joinedAt: project.createdAt, // Owner "joined" when project was created
        });
      } else {
        // If owner was already in the list via Member table, ensure role is 'Owner'
        formattedMembers[ownerInListIndex].role = "Owner";
      }
    }

    // Sort: Owner first, then by username
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
    const statusCode =
      res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving project members.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const getProjectsByUserId = asyncHandler(async (req, res) => {
  const targetUserIdParam = req.params.userId;
  const currentLoggedInUserId = req.user?.id;
  const targetUserId = parseInt(targetUserIdParam, 10);

  if (isNaN(targetUserId) || targetUserId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID format provided." });
  }

  try {
    const targetUserExists = await User.findByPk(targetUserId, {
      attributes: ["id", "username"], // Only check existence
    });
    if (!targetUserExists) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${targetUserId} not found.`,
      });
    }

    const {
      page = 1,
      limit = 9,
      status: projectStatusQuery,
      search,
    } = req.query;

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);

    if (
      isNaN(parsedLimit) ||
      isNaN(parsedPage) ||
      parsedLimit <= 0 ||
      parsedPage <= 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters." });
    }

    const offset = (parsedPage - 1) * parsedLimit;

    const projectWhereConditions = { ownerId: targetUserId };

    // Status filtering logic
    if (projectStatusQuery === "archived") {
      projectWhereConditions.status = "Archived";
    } else if (
      projectStatusQuery &&
      projectStatusQuery.toLowerCase() !== "all"
    ) {
      const allowedDbStatuses = Project.getAttributes().status?.values || [];
      const canonicalQueryStatus = allowedDbStatuses.find(
        (s) => s.toLowerCase() === projectStatusQuery.toLowerCase()
      );
      if (canonicalQueryStatus) {
        projectWhereConditions.status = canonicalQueryStatus;
      } else {
        console.warn(
          `getProjectsByUserId: Invalid status query '${projectStatusQuery}'. Ignoring filter.`
        );
      }
    } else if (
      projectStatusQuery &&
      projectStatusQuery.toLowerCase() !== "all"
    ) {
      // Default to not archived if not 'all' or specific
      projectWhereConditions.status = { [Op.ne]: "Archived" };
    }

    if (search && search.trim() !== "") {
      const likeOperator = Op.like; // For MySQL, this is usually case-insensitive based on collation
      projectWhereConditions[Op.or] = [
        { title: { [likeOperator]: `%${search.trim()}%` } },
        // If you want to search description too:
        // { description: { [likeOperator]: `%${search.trim()}%` } },
      ];
    }

    const includeClauses = [
      {
        model: User,
        as: "owner",
        attributes: userPublicSelectFields,
        required: true,
      }, // Owner must exist
    ];

    // If a user is logged in, check their membership/request status for these projects
    if (currentLoggedInUserId) {
      includeClauses.push(
        {
          model: Member,
          as: "currentUserSpecificMembership", // Use a distinct alias
          attributes: ["status"],
          where: { userId: currentLoggedInUserId },
          required: false, // LEFT JOIN
        },
        {
          model: CollaborationRequest,
          as: "currentUserSpecificRequest", // Distinct alias
          attributes: ["status"],
          where: { requesterId: currentLoggedInUserId, status: "pending" },
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
      distinct: true,
    });

    const processedProjects = projects.map((p) => {
      const projectJson = p.toJSON();
      projectJson.currentCollaborators =
        parseInt(projectJson.currentCollaborators, 10) || 0;
      if (projectJson.status) {
        const allowed = Project.getAttributes().status?.values || [];
        const canon = allowed.find(
          (s) => s.toLowerCase() === projectJson.status.toLowerCase()
        );
        projectJson.status = canon || projectJson.status;
      }

      projectJson.currentUserMembershipStatus = null;
      if (currentLoggedInUserId) {
        const membership = projectJson.currentUserSpecificMembership; // Access by alias
        const request = projectJson.currentUserSpecificRequest; // Access by alias

        if (
          membership &&
          (membership.status === "active" || membership.status === "approved")
        ) {
          projectJson.currentUserMembershipStatus = "approved";
        } else if (request && request.status === "pending") {
          projectJson.currentUserMembershipStatus = "pending";
        }
      }
      // Clean up temporary include data from the final JSON
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
      `Error in getProjectsByUserId for User ${targetUserIdParam}:`,
      error
    );
    const statusCode =
      res.statusCode >= 400 && res.statusCode < 500 ? res.statusCode : 500;
    const message = error.message || "Server error retrieving user's projects.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

export const adminGetAllProjects = asyncHandler(async (req, res) => {
  // This function remains unchanged.
  console.warn("API: adminGetAllProjects invoked but not fully implemented.");
  res
    .status(501)
    .json({ success: false, message: "Admin route not implemented yet" });
});
