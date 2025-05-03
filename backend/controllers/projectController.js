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

// --- Define uploads directory relative to this controller's parent directory (backend root) ---
// This should match the path used in server.js express.static('/uploads', ...)
// Assumes controller is in 'controllers' and server.js is in the parent dir.
const BACKEND_ROOT_DIR = path.resolve(__dirname, "..");
const UPLOADS_ROOT_DIR = path.join(BACKEND_ROOT_DIR, "uploads"); // Base uploads dir
const PROJECT_UPLOADS_DIR = path.join(UPLOADS_ROOT_DIR, "projects"); // Specific subfolder

// Ensure all needed models are loaded and destructured
const { Project, User, Member, CollaborationRequest, sequelize } = db;
if (!Project || !User || !Member || !CollaborationRequest || !sequelize) {
  console.error(
    "FATAL: Database models (Project, User, Member, CollaborationRequest, sequelize) not loaded correctly in projectController.js. Check models/index.js."
  );
  // Depending on deployment strategy, might want to process.exit(1) here
}

// --- Helper to ensure directory exists ---
const ensureUploadsDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
    // console.log(`Directory exists: ${dirPath}`); // Optional: verbose logging
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Directory ${dirPath} not found, attempting to create...`);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Successfully created directory: ${dirPath}`);
      } catch (mkdirError) {
        console.error(`Error creating directory ${dirPath}:`, mkdirError);
        throw new Error(`Failed to create required directory: ${dirPath}`); // Re-throw as specific error
      }
    } else {
      console.error(`Error accessing directory ${dirPath}:`, error);
      // Re-throw other errors (like permission errors)
      throw error;
    }
  }
};
// Ensure project uploads directory exists on server startup (run once)
ensureUploadsDirExists(PROJECT_UPLOADS_DIR).catch((err) =>
  console.error("Failed to ensure initial project uploads directory:", err)
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
  "comments", // Assuming these fields exist on your Project model
];

// Attributes to select for associated users (publicly viewable info)
const userPublicSelectFields = ["id", "username", "profilePictureUrl"];

// --- Controller Functions ---

/**
 * @desc    Get all projects (paginated, searchable, with user membership status if logged in)
 * @route   GET /api/projects
 * @access  Public (Membership status included ONLY if user is logged in)
 */
export const getAllProjects = asyncHandler(async (req, res) => {
  console.log("API: getAllProjects invoked");
  // Get user ID if logged in, but don't require it
  const currentUserId = req.user?.id; // Will be user ID or undefined
  console.log(`getAllProjects - Current User ID: ${currentUserId || "Guest"}`);

  try {
    const { status, search, page = 1, limit = 9 } = req.query; // Default limit 9

    // --- Build Where Clause ---
    const where = {};
    if (status && status !== "all" && status !== "archived") {
      where.status = status; // Filter by specific status
    } else if (status !== "archived") {
      // Default: Exclude archived unless status=all or status=archived is specified
      where.status = { [Op.ne]: "Archived" };
    } // If status === 'archived', no status filter is applied here (allowing archived)
    if (search) {
      // Case-insensitive search (use Op.iLike for PostgreSQL, Op.like for others)
      const likeOperator =
        sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
      where[Op.or] = [
        { title: { [likeOperator]: `%${search}%` } },
        { description: { [likeOperator]: `%${search}%` } },
        // Optional: search category, skills etc.
        // { category: { [likeOperator]: `%${search}%` } },
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
      throw new Error("Invalid pagination parameters (page/limit).");
    }
    const offset = (parsedPage - 1) * parsedLimit;
    // --- End Pagination ---

    // --- Build Includes for Query ---
    const includes = [
      {
        model: User,
        as: "owner",
        attributes: userPublicSelectFields,
        required: false, // LEFT JOIN
      },
    ];

    // Conditionally add includes that require a logged-in user
    if (currentUserId) {
      console.log(
        `User ${currentUserId} is logged in, including membership/request status in query.`
      );
      includes.push(
        {
          model: Member,
          as: "memberships",
          attributes: ["status"],
          where: { userId: currentUserId },
          required: false, // LEFT JOIN
        },
        {
          model: CollaborationRequest,
          as: "collaborationRequests",
          attributes: ["status"],
          where: { requesterId: currentUserId, status: "pending" },
          required: false, // LEFT JOIN
        }
      );
    } else {
      console.log(
        "User is not logged in, skipping membership/request status includes."
      );
    }
    // --- End Build Includes ---

    // --- Database Query ---
    console.log(
      "Executing Project.findAndCountAll with where:",
      JSON.stringify(where),
      "and includes:",
      includes.map((i) => i.as)
    );
    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      attributes: projectListSelectFields,
      include: includes,
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true, // Important for counts with includes
    });
    // --- End Database Query ---

    // --- Process Results ---
    const processedProjects = projects.map((p) => {
      const projectJson = p.toJSON();
      projectJson.currentUserMembershipStatus = null; // Default for guests

      if (currentUserId) {
        // Determine status based on included data (if user was logged in)
        const currentUserMembership = projectJson.memberships?.[0];
        const currentUserPendingRequest =
          projectJson.collaborationRequests?.[0];

        if (currentUserMembership?.status === "active") {
          projectJson.currentUserMembershipStatus = "approved";
        } else if (currentUserPendingRequest?.status === "pending") {
          projectJson.currentUserMembershipStatus = "pending";
        }
        // If neither, it remains null (user is not member and has no pending request)
      }

      // Clean up raw association data
      delete projectJson.memberships;
      delete projectJson.collaborationRequests;
      return projectJson;
    });
    // --- End Process Results ---

    console.log(
      `Found ${count} projects total matching criteria, returning page ${parsedPage} (${processedProjects.length} items).`
    );
    res.status(200).json({
      success: true,
      pagination: {
        // Add pagination details to response
        totalItems: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
      data: processedProjects, // Send the processed list under 'data' key
    });
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error retrieving projects.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

/**
 * @desc    Get projects owned or joined by the logged-in user
 * @route   GET /api/projects/my
 * @access  Private (Requires login)
 */
export const getMyProjects = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  console.log(`API: getMyProjects invoked by User ${userId}`);
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  try {
    // Find projects where the user is either the owner OR an active member
    const projects = await Project.findAll({
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
          where: { userId: userId, status: "active" },
          attributes: [], // Don't need member attributes here, just using for join/filter
          required: false, // Use LEFT JOIN initially
        },
      ],
      where: {
        [Op.or]: [{ ownerId: userId }, { "$memberships.userId$": userId }], // User is owner OR user is an active member
        status: { [Op.ne]: "Archived" }, // Exclude archived projects by default
      },
      order: [["updatedAt", "DESC"]],
      distinct: true,
    });

    console.log(
      `Found ${projects.length} active projects owned or joined by user ${userId}.`
    );
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
 * @access  Public (Basic details are public, membership status added if logged in)
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const currentUserId = req.user?.id; // Optional user ID
  console.log(
    `API: getProjectById invoked for ID: ${projectIdParam} by User ${
      currentUserId || "Guest"
    }`
  );

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    // Basic includes for public view
    const includes = [
      { model: User, as: "owner", attributes: userPublicSelectFields },
      // Add other *publicly relevant* associations here if needed
    ];

    const project = await Project.findByPk(projectId, {
      attributes: projectDetailSelectFields, // Fields defined for detail view
      include: includes,
    });

    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    console.log(`Project ${projectId} found successfully.`);
    const projectJson = project.toJSON();
    projectJson.currentUserMembershipStatus = null; // Default for guests

    // If user is logged in, check their specific status for *this* project
    if (currentUserId) {
      console.log(
        `Checking membership/request status for user ${currentUserId} on project ${projectId}`
      );
      // Perform a separate, efficient query for the user's status
      const memberStatus = await Member.findOne({
        where: { userId: currentUserId, projectId: projectId },
        attributes: ["status"], // Only need status
      });

      if (memberStatus?.status === "active") {
        projectJson.currentUserMembershipStatus = "approved";
      } else {
        // Only check for pending request if not an active member
        const requestStatus = await CollaborationRequest.findOne({
          where: {
            requesterId: currentUserId,
            projectId: projectId,
            status: "pending",
          },
          attributes: ["status"], // Only need status
        });
        if (requestStatus?.status === "pending") {
          projectJson.currentUserMembershipStatus = "pending";
        }
      }
      console.log(
        `Determined status for user ${currentUserId}: ${projectJson.currentUserMembershipStatus}`
      );
    }

    // --- TODO: Increment view count? ---
    // Consider incrementing a 'views' counter here, maybe debounced or
    // only if the user is different from the last viewer etc.
    // await project.increment('views');

    res.status(200).json({ success: true, data: projectJson }); // Return under 'data' key
  } catch (error) {
    console.error(`Error in getProjectById for ID ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error retrieving project details.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

/**
 * @desc    Create a new project and add owner as member
 * @route   POST /api/projects
 * @access  Private (Requires Login)
 */
export const createProject = asyncHandler(async (req, res) => {
  const ownerId = req.user?.id;
  console.log(`API: createProject invoked by User ${ownerId}`);
  console.log("createProject - req.body:", req.body);
  console.log("createProject - req.file:", req.file?.originalname || "No file"); // Log filename if exists

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required to create a project.");
  }

  // --- Extract and Validate Data ---
  const {
    title,
    description,
    requiredCollaborators,
    status = "Planning", // Default status
    category,
    duration,
    funding,
    skillsNeeded, // Expecting a JSON string or an array
    progress = 0, // Default progress
  } = req.body;

  if (!title || title.trim() === "") {
    res.status(400);
    throw new Error("Project title is required.");
  }
  if (!description || description.trim() === "") {
    res.status(400);
    throw new Error("Project description is required.");
  }

  // Parse skillsNeeded (assuming JSON string from form data)
  let parsedSkills = [];
  if (skillsNeeded) {
    try {
      parsedSkills =
        typeof skillsNeeded === "string"
          ? JSON.parse(skillsNeeded)
          : skillsNeeded;
      if (!Array.isArray(parsedSkills))
        throw new Error("Skills must be provided as an array.");
    } catch (e) {
      console.error(
        "Error parsing skillsNeeded:",
        e.message,
        "Input:",
        skillsNeeded
      );
      res.status(400);
      throw new Error(
        "Invalid format for 'skillsNeeded'. Please provide a valid JSON array string (e.g., '[\"React\", \"Node.js\"]') or ensure it's sent as an array."
      );
    }
  }

  const collaborators = requiredCollaborators
    ? parseInt(requiredCollaborators, 10)
    : 1; // Default to 1 if not provided? Or 0? Decide based on requirements.
  if (isNaN(collaborators) || collaborators < 0) {
    res.status(400);
    throw new Error(
      "Required collaborators must be a valid non-negative number."
    );
  }

  const allowedStatuses = Project.getAttributes().status?.values;
  if (allowedStatuses && !allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error(
      `Invalid project status: '${status}'. Allowed statuses are: ${allowedStatuses.join(
        ", "
      )}.`
    );
  }

  // --- Handle File Upload ---
  let savedImageUrl = null; // DB path (e.g., /uploads/projects/...)
  let absoluteFilePath = null; // Filesystem path for saving/deleting

  if (req.file) {
    try {
      await ensureUploadsDirExists(PROJECT_UPLOADS_DIR); // Ensure target dir exists

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      // Sanitize original name to prevent path traversal or invalid characters
      const safeOriginalName = path
        .basename(req.file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${uniqueSuffix}-${safeOriginalName}`;

      absoluteFilePath = path.join(PROJECT_UPLOADS_DIR, filename);
      savedImageUrl = `/uploads/projects/${filename}`; // URL path saved to DB

      console.log(`Attempting to save uploaded file to: ${absoluteFilePath}`);
      // req.file.buffer should exist with multer.memoryStorage()
      if (!req.file.buffer) {
        throw new Error("File buffer is missing from upload.");
      }
      await fs.writeFile(absoluteFilePath, req.file.buffer);
      console.log(`File successfully saved: ${absoluteFilePath}`);
    } catch (uploadError) {
      console.error("Failed to write uploaded file:", uploadError);
      res.status(500);
      throw new Error("Server error saving uploaded project image.");
    }
  }
  // --- End File Upload Handling ---

  const transaction = await sequelize.transaction();
  try {
    // Create Project record
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
        skillsNeeded: parsedSkills, // Store parsed array
        imageUrl: savedImageUrl, // Store the URL path
        progress: parseInt(progress, 10) || 0,
        views: 0,
        likes: 0,
        comments: 0, // Initialize counts
      },
      { transaction }
    );
    console.log(`Project created in DB, ID: ${newProject.id}`);

    // Automatically add the owner as an active member
    await Member.create(
      {
        userId: ownerId,
        projectId: newProject.id,
        role: "Owner", // Explicitly set role
        status: "active",
      },
      { transaction }
    );
    console.log(
      `Owner (User ID: ${ownerId}) added as member to Project ID: ${newProject.id}`
    );

    await transaction.commit();
    console.log("Project creation transaction committed successfully.");

    // Fetch the newly created project with owner details to return
    const createdProject = await Project.findByPk(newProject.id, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });

    res.status(201).json({ success: true, data: createdProject });
  } catch (error) {
    // Rollback transaction if error occurs
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Project creation transaction rolled back due to error.");
    }
    // If an image was saved but transaction failed, delete the orphaned image
    if (absoluteFilePath) {
      console.log(
        `Transaction failed, attempting to delete orphaned file: ${absoluteFilePath}`
      );
      try {
        await fs.unlink(absoluteFilePath);
        console.log("Successfully deleted orphaned upload file.");
      } catch (e) {
        console.error(
          "Error deleting orphaned upload file after transaction rollback:",
          e
        );
        // Log this error but don't overwrite the original error response
      }
    }

    console.error("Error during project creation process:", error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error creating project.";
    // Avoid sending multiple responses
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
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
  const userId = req.user?.id; // ID of user performing update
  console.log(
    `API: updateProject invoked for ID: ${projectIdParam} by User ${userId}`
  );
  console.log("updateProject - req.body:", req.body);
  console.log("updateProject - req.file:", req.file?.originalname || "No file");

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required to update a project.");
  }

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  const transaction = await sequelize.transaction();
  let newImageUrl = null; // DB path /uploads/...
  let newAbsoluteFilePath = null; // Filesystem path for saving/deleting
  let oldImageUrl = null; // DB path of image being replaced

  try {
    // Find the project and lock it for update
    const project = await Project.findByPk(projectId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    // Authorization: Check if the user owns the project
    if (project.ownerId !== userId) {
      res.status(403); // Forbidden
      throw new Error("Not authorized: You are not the owner of this project.");
    }

    // Store old image URL for potential deletion later
    oldImageUrl = project.imageUrl;

    // --- Handle NEW File Upload ---
    if (req.file) {
      try {
        await ensureUploadsDirExists(PROJECT_UPLOADS_DIR);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const safeOriginalName = path
          .basename(req.file.originalname)
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        const filename = `${uniqueSuffix}-${safeOriginalName}`;

        newAbsoluteFilePath = path.join(PROJECT_UPLOADS_DIR, filename);
        newImageUrl = `/uploads/projects/${filename}`; // URL path for DB

        console.log(
          `Attempting to save updated file to: ${newAbsoluteFilePath}`
        );
        if (!req.file.buffer) throw new Error("File buffer missing.");
        await fs.writeFile(newAbsoluteFilePath, req.file.buffer);
        console.log(
          `New image file successfully saved: ${newAbsoluteFilePath}`
        );
      } catch (uploadError) {
        console.error("Failed to write updated uploaded file:", uploadError);
        res.status(500);
        throw new Error("Server error saving updated project image.");
      }
    }
    // --- End File Upload Handling ---

    // --- Prepare Update Data ---
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
      // Be specific about fields allowed for update
    } = req.body;

    const updates = {}; // Object to hold only the fields being updated

    if (title !== undefined) {
      if (title.trim() === "") {
        res.status(400);
        throw new Error("Project title cannot be empty.");
      }
      updates.title = title.trim();
    }
    if (description !== undefined) {
      updates.description = description; // Allow empty description if desired
    }
    if (requiredCollaborators !== undefined) {
      const c = parseInt(requiredCollaborators, 10);
      if (isNaN(c) || c < 0) {
        res.status(400);
        throw new Error(
          "Required collaborators must be a non-negative number."
        );
      }
      updates.requiredCollaborators = c;
    }
    if (status !== undefined) {
      const allowedStatuses = Project.getAttributes().status?.values;
      if (allowedStatuses && !allowedStatuses.includes(status)) {
        res.status(400);
        throw new Error(`Invalid project status: '${status}'.`);
      }
      updates.status = status;
    }
    if (category !== undefined) updates.category = category || null; // Allow setting to null
    if (duration !== undefined) updates.duration = duration || null;
    if (funding !== undefined) updates.funding = funding || null;
    if (skillsNeeded !== undefined) {
      try {
        let ps = [];
        if (skillsNeeded === null || skillsNeeded === "")
          ps = []; // Allow clearing skills
        else
          ps =
            typeof skillsNeeded === "string"
              ? JSON.parse(skillsNeeded)
              : skillsNeeded;
        if (!Array.isArray(ps)) throw new Error("Skills must be an array.");
        updates.skillsNeeded = ps; // Store parsed array
      } catch (e) {
        res.status(400);
        throw new Error(
          "Invalid format for 'skillsNeeded'. Expected JSON array string or an array."
        );
      }
    }
    if (progress !== undefined) {
      const p = parseInt(progress, 10);
      if (isNaN(p) || p < 0 || p > 100) {
        res.status(400);
        throw new Error("Progress must be a number between 0 and 100.");
      }
      updates.progress = p;
    }
    // If a new image was successfully uploaded, add it to updates
    if (newImageUrl !== null) {
      updates.imageUrl = newImageUrl;
    }
    // --- End Prepare Update Data ---

    // --- Apply Updates ---
    if (Object.keys(updates).length === 0 && !req.file) {
      // If no fields changed and no new file was uploaded
      await transaction.rollback(); // No changes, rollback transaction
      console.log("No update data provided, rolling back.");
      // Return the current project data
      const currentProject = await Project.findByPk(projectId, {
        attributes: projectDetailSelectFields,
        include: [
          { model: User, as: "owner", attributes: userPublicSelectFields },
        ],
      });
      return res.status(200).json({
        success: true,
        message: "No changes detected.",
        data: currentProject,
      });
    }

    console.log(`Applying updates to project ${projectId}:`, updates);
    await project.update(updates, { transaction }); // Apply updates within transaction
    await transaction.commit(); // Commit the transaction
    console.log(
      `Project ${projectId} update transaction committed successfully.`
    );
    // --- End Apply Updates ---

    // --- Delete Old Image (if replaced) ---
    // This happens *after* the transaction commits successfully
    if (newImageUrl && oldImageUrl && oldImageUrl !== newImageUrl) {
      console.log(`Attempting to delete old image file: ${oldImageUrl}`);
      try {
        // Construct absolute path from the URL path saved in DB
        const oldAbsoluteFilePath = path.join(
          UPLOADS_ROOT_DIR,
          oldImageUrl.substring("/uploads/".length)
        ); // Remove '/uploads/' prefix
        await fs.unlink(oldAbsoluteFilePath);
        console.log(
          `Successfully deleted old image file: ${oldAbsoluteFilePath}`
        );
      } catch (deleteError) {
        // Log error but don't fail the request if old image deletion fails
        if (deleteError.code !== "ENOENT") {
          // Ignore "file not found" errors
          console.error(
            `Error deleting old image file (${oldImageUrl}) after update:`,
            deleteError
          );
        } else {
          console.warn(`Old image file not found for deletion: ${oldImageUrl}`);
        }
      }
    }
    // --- End Delete Old Image ---

    // --- Fetch and Return Updated Project ---
    const updatedProject = await Project.findByPk(project.id, {
      attributes: projectDetailSelectFields,
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updatedProject,
    });
  } catch (error) {
    // Rollback transaction on any error
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Update transaction rolled back due to error.");
    }
    // If a *new* image was saved but transaction failed, delete the newly uploaded file
    if (newAbsoluteFilePath) {
      console.log(
        `Transaction failed, attempting to delete newly uploaded file: ${newAbsoluteFilePath}`
      );
      try {
        await fs.unlink(newAbsoluteFilePath);
        console.log("Successfully deleted newly uploaded file after error.");
      } catch (e) {
        console.error(
          "Error deleting newly uploaded file after transaction error:",
          e
        );
      }
    }

    console.error(`Error updating project ${projectIdParam}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error updating project.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private (Owner only)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.id;
  const userId = req.user?.id; // ID of user attempting delete
  console.log(
    `API: deleteProject invoked for ID: ${projectIdParam} by User ${userId}`
  );

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required to delete a project.");
  }

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  let imagePathToDelete = null; // DB path /uploads/...
  const transaction = await sequelize.transaction();

  try {
    // Find the project, lock for deletion
    const project = await Project.findByPk(projectId, {
      transaction,
      lock: transaction.LOCK.UPDATE, // Or LOCK.SHARE depending on needs
      attributes: ["id", "ownerId", "imageUrl"], // Select only needed fields
    });

    if (!project) {
      // No need to rollback if not found
      await transaction.commit(); // Or rollback, doesn't matter much here
      res.status(404);
      throw new Error("Project not found.");
    }

    // Authorization check
    if (project.ownerId !== userId) {
      await transaction.rollback(); // Rollback before throwing forbidden error
      res.status(403);
      throw new Error("Not authorized: You are not the owner of this project.");
    }

    // Store image path for deletion *after* successful DB delete
    imagePathToDelete = project.imageUrl;

    // Delete the project record (associated data like members, requests should cascade delete if configured in models)
    await project.destroy({ transaction });

    // Commit the transaction
    await transaction.commit();
    console.log(
      `Project ${projectId} DB record and associated data deleted successfully.`
    );

    // --- Delete Associated Image File (After DB deletion is confirmed) ---
    if (imagePathToDelete) {
      console.log(
        `Attempting to delete associated image file: ${imagePathToDelete}`
      );
      try {
        // Construct absolute path from the URL path
        const absoluteFilePath = path.join(
          UPLOADS_ROOT_DIR,
          imagePathToDelete.substring("/uploads/".length)
        );
        await fs.unlink(absoluteFilePath);
        console.log(
          `Successfully deleted associated image file: ${absoluteFilePath}`
        );
      } catch (deleteError) {
        if (deleteError.code !== "ENOENT") {
          // Ignore "file not found"
          console.error(
            `Error deleting project image file (${imagePathToDelete}) after project deletion:`,
            deleteError
          );
          // Log this but don't fail the overall response
        } else {
          console.warn(
            `Associated image file not found for deletion: ${imagePathToDelete}`
          );
        }
      }
    }
    // --- End Image File Deletion ---

    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    // Rollback transaction on any error
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Delete project transaction rolled back due to error.");
    }

    console.error(`Error deleting project ${projectIdParam}:`, error);
    // Check for specific DB errors like foreign key constraints if cascade isn't set up
    if (error.name === "SequelizeForeignKeyConstraintError") {
      console.error(
        "Foreign key constraint violation during project deletion.",
        error.parent
      );
      res.status(409); // Conflict
      throw new Error(
        "Cannot delete project. It may have related data (e.g., publications) that needs to be handled first."
      );
    }

    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Server error deleting project.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

/**
 * @desc    Get PENDING collaboration requests for a specific project
 * @route   GET /api/projects/:projectId/requests
 * @access  Private (Owner only)
 */
export const getProjectRequests = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const userId = req.user?.id; // ID of user making the request (should be owner)
  console.log(
    `API: getProjectRequests invoked for project ${projectIdParam} by user ${userId}`
  );

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required to view project requests.");
  }

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    // Fetch project minimal details to verify ownership
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId"], // Only need ownerId for check
    });

    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }

    // Authorization Check: Only the owner can see requests
    if (project.ownerId !== userId) {
      res.status(403); // Forbidden
      throw new Error(
        "Forbidden: Only the project owner can view collaboration requests."
      );
    }

    // Fetch PENDING requests for this project, including requester details
    const pendingRequests = await CollaborationRequest.findAll({
      where: {
        projectId: projectId,
        status: "pending", // Only fetch pending requests
      },
      include: [
        {
          model: User,
          as: "requester", // User who sent the request
          attributes: userPublicSelectFields, // Include public fields of the requester
        },
        // Optional: Include project title again if needed, though we have projectId
        // { model: Project, as: 'project', attributes: ['title'] }
      ],
      order: [["createdAt", "DESC"]], // Show newest pending requests first
    });

    console.log(
      `Found ${pendingRequests.length} pending collaboration requests for project ${projectId}.`
    );
    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      data: pendingRequests, // Return array under 'data' key
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
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

/**
 * @desc    Get ACTIVE members of a specific project
 * @route   GET /api/projects/:projectId/members
 * @access  Private (Owner or Active Member only)
 */
export const getProjectMembers = asyncHandler(async (req, res) => {
  const projectIdParam = req.params.projectId;
  const currentUserId = req.user?.id; // User making the request
  console.log(
    `API: getProjectMembers invoked for Project ${projectIdParam} by User ${currentUserId}`
  );

  if (!currentUserId) {
    res.status(401);
    throw new Error("Authentication required to view project members.");
  }

  const projectId = parseInt(projectIdParam, 10);
  if (isNaN(projectId) || projectId <= 0) {
    res.status(400);
    throw new Error("Invalid Project ID format.");
  }

  try {
    // Fetch project minimal details first to check existence and ownership
    const project = await Project.findByPk(projectId, {
      attributes: ["id", "ownerId", "createdAt"], // Include createdAt for owner's 'joinedAt'
      include: [
        { model: User, as: "owner", attributes: userPublicSelectFields }, // Include owner details for formatting
      ],
    });

    if (!project) {
      res.status(404);
      throw new Error("Project not found.");
    }
    const ownerId = project.ownerId;
    const projectOwnerInfo = project.owner?.toJSON(); // Get plain owner object if exists

    // --- Authorization Check: Allow Owner OR Active Members ---
    const isOwner = ownerId === currentUserId;
    let isActiveMember = false;
    if (!isOwner) {
      const membership = await Member.findOne({
        where: {
          userId: currentUserId,
          projectId: projectId,
          status: "active", // Must be an *active* member
        },
        attributes: ["userId"], // Only need to confirm existence
      });
      isActiveMember = !!membership; // True if membership record found
    }

    if (!isOwner && !isActiveMember) {
      res.status(403); // Forbidden
      throw new Error(
        "Access Denied: You must be the project owner or an active member to view the member list."
      );
    }
    console.log(
      `Authorization Passed for getProjectMembers (Owner: ${isOwner}, Active Member: ${isActiveMember})`
    );
    // --- End Authorization Check ---

    // --- Fetch Active Members (including User details) ---
    const members = await Member.findAll({
      where: {
        projectId: projectId,
        status: "active", // Only fetch active members
      },
      include: [
        {
          model: User,
          as: "user", // Alias defined in Member model's association
          attributes: userPublicSelectFields, // Select public fields from User model
          required: true, // INNER JOIN - only include members where user still exists
        },
      ],
      // Select necessary fields from the Member (project_members) table itself
      attributes: ["userId", "role", "status", "joinedAt"],
      order: [["joinedAt", "ASC"]], // Order by join date initially
    });
    // --- End Fetch Active Members ---

    // --- Format Member List ---
    // Map to a cleaner structure and ensure owner is included correctly
    let formattedMembers = members
      .map((m) => ({
        userId: m.user?.id, // Use optional chaining in case user data is missing
        username: m.user?.username,
        profilePictureUrl: m.user?.profilePictureUrl,
        // Determine role - prioritize Owner if userId matches project ownerId
        role: m.userId === ownerId ? "Owner" : m.role || "Member", // Default to "Member" if role is null
        joinedAt: m.joinedAt,
      }))
      .filter((m) => m.userId); // Filter out any entries where user details might be missing

    // Ensure owner is present and has the correct role, using fetched owner info
    if (projectOwnerInfo) {
      const ownerInListIndex = formattedMembers.findIndex(
        (m) => m.userId === ownerId
      );
      if (ownerInListIndex === -1) {
        console.warn(
          `Owner (ID: ${ownerId}) not found in active members query result. Adding manually.`
        );
        // Add owner if they weren't returned (e.g., if their Member record is missing/inactive)
        formattedMembers.unshift({
          // Add to the beginning
          userId: ownerId,
          username: projectOwnerInfo.username,
          profilePictureUrl: projectOwnerInfo.profilePictureUrl,
          role: "Owner",
          joinedAt: project.createdAt, // Use project creation date as owner's join date
        });
      } else {
        // Ensure the role is set to 'Owner' if they were found
        formattedMembers[ownerInListIndex].role = "Owner";
      }
    } else {
      console.warn(
        `Project owner details (ID: ${ownerId}) could not be fetched.`
      );
    }

    // Final sort: Owner first, then alphabetically by username
    formattedMembers.sort((a, b) => {
      if (a.role === "Owner" && b.role !== "Owner") return -1; // a (Owner) comes first
      if (b.role === "Owner" && a.role !== "Owner") return 1; // b (Owner) comes first
      // For non-owners, sort by username
      return (a.username || "").localeCompare(b.username || "");
    });
    // --- End Format Member List ---

    console.log(
      `Returning ${formattedMembers.length} formatted members for project ${projectId}`
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
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message });
    }
  }
});

/** @desc Admin get all projects (placeholder/stub) */
export const adminGetAllProjects = asyncHandler(async (req, res) => {
  // This route would need `protect` and `adminOnly` middleware in `projectRoutes.js`
  console.warn("API: adminGetAllProjects invoked but not fully implemented.");
  // TODO: Implement admin-specific fetching logic (e.g., different fields, bypass ownership checks)
  res
    .status(501) // Not Implemented
    .json({ success: false, message: "Admin route not implemented yet" });
});
