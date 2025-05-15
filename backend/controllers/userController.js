import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Ensure User and ActivityLog models are loaded here
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import fs from "fs/promises"; // For file system operations
import path from "path";
import { fileURLToPath } from "url";

// Destructure models - ensure these are correctly exported from your models/index.js
const { User, ActivityLog, sequelize } = db;

// --- ES Module __dirname setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT_DIR = path.resolve(__dirname, ".."); // Adjust if controller is nested deeper
const PROFILE_PIC_UPLOADS_DIR = path.join(
  BACKEND_ROOT_DIR,
  "uploads",
  "profilePictures"
);
// --- End Setup ---

// --- Helper: Define fields to select for different views ---
export const publicProfileFields = [
  // Export if needed elsewhere, or keep local
  "id",
  "username",
  "profilePictureUrl",
  "bio",
  "university",
  "department",
  "companyName",
  "jobTitle",
  "medicalSpecialty",
  "hospitalName",

  "createdAt",
];
const adminUserListFields = [
  "id",
  "username",
  "email",
  "role",
  "status",
  "createdAt",
  "updatedAt",
  "university",
  "department",
  "jobTitle",
];
const adminUserDetailFields = [
  "id",
  "username",
  "email",
  "role",
  "status",
  "university",
  "department",
  "companyName",
  "jobTitle",
  "medicalSpecialty",
  "hospitalName",
  "profilePictureUrl",
  "bio",

  "createdAt",
  "updatedAt",
];
const selectableUserFields = ["id", "username", "email", "profilePictureUrl"]; // Added profile pic

// --- Helper function to ensure upload directory exists ---
const ensureUploadsDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Directory ${dirPath} not found, creating...`);
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error; // Re-throw other errors
    }
  }
};
// --- End Helper ---

// === PUBLIC USER ROUTE CONTROLLERS ===

/**
 * @desc    Get public profile of a user
 * @route   GET /api/users/public/:userId
 * @access  Public
 */
export const getUserPublicProfile = asyncHandler(async (req, res) => {
  console.log("[getUserPublicProfile] req.params:", req.params);
  const userIdParam = req.params.userId;

  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId) || userId <= 0) {
    console.error(
      `[getUserPublicProfile] Validation FAILED for param: ${userIdParam}, parsed: ${userId}`
    );
    res.status(400);
    throw new Error("Invalid user ID format provided.");
  }

  if (!User) throw new Error("User model not loaded correctly.");

  const user = await User.findByPk(userId, {
    attributes: publicProfileFields,
  });

  if (!user) {
    console.log(`[getUserPublicProfile] User not found for ID: ${userId}`);
    res.status(404);
    throw new Error("User not found.");
  }

  console.log(`[getUserPublicProfile] User found: ${user.username}`);
  res.status(200).json({ success: true, data: user });
});

/**
 * @desc    Get a list of discoverable users (for explore page)
 * @route   GET /api/users/discoverable
 * @access  Public (or protected, depending on your needs)
 */
export const getDiscoverableUsers = asyncHandler(async (req, res) => {
  console.log("API: getDiscoverableUsers invoked");
  if (!User) {
    console.error("getDiscoverableUsers: User model not loaded.");
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12; // Default limit for explore page
  const offset = (page - 1) * limit;

  if (page <= 0 || limit <= 0) {
    res.status(400);
    throw new Error("Invalid pagination parameters (page/limit).");
  }

  try {
    const { count, rows: users } = await User.findAndCountAll({
      where: {
        status: "approved", // Only show approved/active users
        // Add any other criteria for "discoverable" users if needed
      },
      attributes: publicProfileFields, // Use the public fields
      order: [["username", "ASC"]], // Or any other preferred order
      limit: limit,
      offset: offset,
    });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching discoverable users:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user list.",
    });
  }
});

// === PROTECTED USER 'ME' ROUTE CONTROLLERS ===

/**
 * @desc    Update user's own profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From 'protect' middleware
  console.log(`API: updateUserProfile invoked for User ${userId}`);
  console.log("updateUserProfile - Received req.body:", req.body);
  console.log(
    "updateUserProfile - Received req.file:",
    req.file?.originalname || "No file uploaded"
  );

  if (!User || !sequelize) {
    throw new Error("User model or Sequelize instance not loaded.");
  }

  const updateData = {};
  const allowedFields = [
    "bio",
    "university",
    "department",
    "companyName",
    "jobTitle",
    "medicalSpecialty",
    "hospitalName",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] =
        (typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field]) || null;
    }
  });

  // Handle skillsNeeded (JSON array string)
  if (req.body.skillsNeeded !== undefined) {
    try {
      updateData.skillsNeeded =
        req.body.skillsNeeded && req.body.skillsNeeded.trim() !== ""
          ? JSON.parse(req.body.skillsNeeded)
          : []; // Default to empty array if null/empty
      if (!Array.isArray(updateData.skillsNeeded))
        throw new Error("Skills must be an array.");
    } catch (e) {
      console.error(
        "Error parsing skillsNeeded JSON:",
        e.message,
        "Input:",
        req.body.skillsNeeded
      );
      res.status(400);
      throw new Error(
        "Invalid format for 'skillsNeeded'. Expected a valid JSON array string."
      );
    }
  }

  // Handle socialLinks (JSON object string)
  if (req.body.socialLinksJson !== undefined) {
    try {
      updateData.socialLinks =
        req.body.socialLinksJson && req.body.socialLinksJson.trim() !== ""
          ? JSON.parse(req.body.socialLinksJson)
          : {}; // Default to empty object
      if (
        typeof updateData.socialLinks !== "object" ||
        Array.isArray(updateData.socialLinks)
      ) {
        throw new Error("Social links must be an object.");
      }
    } catch (e) {
      console.error(
        "Error parsing socialLinks JSON:",
        e.message,
        "Input:",
        req.body.socialLinksJson
      );
      res.status(400);
      throw new Error(
        "Invalid format for 'socialLinksJson'. Expected a valid JSON object string."
      );
    }
  }

  let newImageUrl = null;
  let oldImageUrl = null;
  let tempFilePathForRollback = null; // Store path of newly uploaded file for potential rollback

  if (req.file) {
    console.log(
      "Processing uploaded profile picture file:",
      req.file.originalname
    );
    try {
      await ensureUploadsDirExists(PROFILE_PIC_UPLOADS_DIR);

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const safeOriginalName = path
        .basename(req.file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${uniqueSuffix}-${safeOriginalName}`;

      tempFilePathForRollback = path.join(PROFILE_PIC_UPLOADS_DIR, filename);
      // Relative URL to store in DB
      newImageUrl = `/uploads/profilePictures/${filename}`;

      if (!req.file.buffer)
        throw new Error(
          "File buffer is missing from upload (using memory storage)."
        );

      await fs.writeFile(tempFilePathForRollback, req.file.buffer); // Write buffer to disk
      console.log(
        `New profile picture saved to filesystem: ${tempFilePathForRollback}`
      );
      updateData.profilePictureUrl = newImageUrl;
    } catch (uploadError) {
      console.error("Failed to write uploaded profile picture:", uploadError);
      res.status(500);
      throw new Error("Server error saving uploaded profile picture.");
    }
  }

  if (Object.keys(updateData).length === 0) {
    console.log("No valid fields found in updateData to apply.");
    // If only a file was uploaded but other fields are empty, this might be intended
    if (req.file) {
      // Allow update if only profile picture changed
    } else {
      res.status(400);
      throw new Error("No valid profile fields provided for update.");
    }
  }

  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      res.status(404);
      throw new Error("User not found for update.");
    }

    if (updateData.profilePictureUrl) {
      // If a new picture is being set
      oldImageUrl = user.profilePictureUrl; // Get the old one for deletion later
    }

    console.log(`Applying final updates to user ${userId}:`, updateData);
    await user.update(updateData, { transaction });
    await transaction.commit();
    console.log(
      `User ${userId} profile update transaction committed successfully.`
    );

    // Delete old profile picture if a new one was successfully uploaded and DB updated
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      console.log(`Attempting to delete old profile picture: ${oldImageUrl}`);
      try {
        // Construct full path from relative URL
        const oldAbsoluteFilePath = path.join(
          BACKEND_ROOT_DIR,
          oldImageUrl.startsWith("/") ? oldImageUrl.substring(1) : oldImageUrl
        );
        await fs.unlink(oldAbsoluteFilePath);
        console.log(
          `Successfully deleted old profile picture: ${oldAbsoluteFilePath}`
        );
      } catch (deleteError) {
        if (deleteError.code !== "ENOENT") {
          // Don't log error if file just didn't exist
          console.error(
            `Error deleting old profile picture file (${oldImageUrl}):`,
            deleteError
          );
        } else {
          console.warn(
            `Old profile picture file not found for deletion: ${oldImageUrl}`
          );
        }
      }
    }

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] }, // Exclude password from response
    });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      // Check if transaction exists and not finished
      await transaction.rollback();
      console.log("Update transaction rolled back due to error.");
    }
    // If a new file was uploaded but transaction failed, delete the new file
    if (tempFilePathForRollback) {
      console.log(
        `Transaction failed, attempting to delete newly saved file: ${tempFilePathForRollback}`
      );
      try {
        await fs.unlink(tempFilePathForRollback);
        console.log("Successfully deleted new profile picture after error.");
      } catch (e) {
        console.error(
          "Error deleting new profile picture after transaction error:",
          e
        );
      }
    }

    console.error(
      `Error during profile update database operation for User ${userId}:`,
      error
    );
    // Handle specific Sequelize errors
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({
        success: false,
        message: "Update failed. A unique value constraint was violated.",
      });
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(". "),
      });
    } else {
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      const message = error.message || "Server error updating profile.";
      if (!res.headersSent) {
        // Check if headers already sent
        res.status(statusCode).json({ success: false, message });
      }
    }
  }
});

/**
 * @desc    Update user's own email
 * @route   PUT /api/users/me/email
 * @access  Private
 */
export const updateUserEmail = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { newEmail, currentPassword } = req.body;

  console.log(
    `API: updateUserEmail invoked for User ${userId} with new email: ${newEmail}`
  );
  if (!User) throw new Error("User model not loaded.");

  if (!newEmail || !currentPassword) {
    res.status(400);
    throw new Error("New email and current password are required.");
  }
  if (!/\S+@\S+\.\S+/.test(newEmail)) {
    // Basic email format validation
    res.status(400);
    throw new Error("Invalid email format provided.");
  }

  const user = await User.scope("withPassword").findByPk(userId); // Scope to include password
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const isMatch = await user.matchPassword(currentPassword); // Assumes matchPassword method on User model
  if (!isMatch) {
    res.status(401);
    throw new Error("Incorrect current password provided.");
  }

  if (user.email === newEmail) {
    return res.status(200).json({
      success: true,
      message: "Email is already set to this address. No update performed.",
      data: { email: user.email },
    });
  }

  // Check if new email is already in use by another user
  const existingUserWithEmail = await User.findOne({
    where: {
      email: newEmail,
      id: { [Op.ne]: userId }, // Exclude current user
    },
  });
  if (existingUserWithEmail) {
    res.status(400);
    throw new Error("Email address is already in use by another account.");
  }

  await user.update({ email: newEmail });
  console.log(`User ${userId} email updated successfully to ${newEmail}.`);

  res.status(200).json({
    success: true,
    message: "Email updated successfully.",
    data: { email: newEmail },
  });
});

/**
 * @desc    Update user's own password
 * @route   PUT /api/users/me/password
 * @access  Private
 */
export const updateUserPassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  console.log(`API: updateUserPassword invoked for User ${userId}`);
  if (!User) throw new Error("User model not loaded.");

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required.");
  }
  if (newPassword.length < 6) {
    // Example password policy
    res.status(400);
    throw new Error("New password must be at least 6 characters long.");
  }
  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error("New password cannot be the same as the current password.");
  }

  const user = await User.scope("withPassword").findByPk(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Incorrect current password provided.");
  }

  user.password = newPassword; // This will be hashed by a Sequelize hook if set up
  await user.save(); // Triggers hooks
  console.log(`User ${userId} password updated successfully.`);

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});

/**
 * @desc    Get list of users for selection (e.g., in forms)
 * @route   GET /api/users/selectable
 * @access  Private (adjust if needed)
 */
export const getSelectableUsers = asyncHandler(async (req, res) => {
  const requestingUserId = req.user.id; // Assuming 'protect' middleware adds req.user
  console.log(`API: getSelectableUsers invoked by User ${requestingUserId}`);
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  const users = await User.findAll({
    where: {
      status: "approved", // Only active/approved users
      id: { [Op.ne]: requestingUserId }, // Exclude self
    },
    attributes: selectableUserFields,
    order: [["username", "ASC"]],
  });

  res.status(200).json({ success: true, data: users });
});

/**
 * @desc    Get activity log for a specific user (paginated)
 * @route   GET /api/users/:userId/activity
 * @access  Private (Logged-in user can only access their own, or admin can access any)
 */
export const getUserActivity = asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role; // Assuming role is on req.user

  console.log(
    `API: getUserActivity invoked for Target User ${targetUserId} by Requesting User ${requestingUserId} (Role: ${requestingUserRole})`
  );

  if (isNaN(targetUserId) || targetUserId <= 0) {
    res.status(400);
    throw new Error("Invalid target user ID format provided.");
  }

  // Authorization: User can access their own, or admin can access any.
  if (targetUserId !== requestingUserId && requestingUserRole !== "admin") {
    console.warn(
      `Forbidden attempt: User ${requestingUserId} tried to access activity for User ${targetUserId}`
    );
    res.status(403);
    throw new Error(
      "Forbidden: You can only access your own activity log or you must be an admin."
    );
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;

  if (page <= 0 || limit <= 0) {
    res.status(400);
    throw new Error("Invalid pagination parameters (page/limit).");
  }

  if (!ActivityLog) {
    console.error("ActivityLog model is not available from db import!");
    // Provide a fallback or throw error if model not ready
    res.status(500);
    throw new Error("ActivityLog model is not configured or available.");
  }

  const { count, rows } = await ActivityLog.findAndCountAll({
    where: { userId: targetUserId },
    limit: limit,
    offset: offset,
    order: [["timestamp", "DESC"]], // Adjust 'timestamp' if your field is named differently
  });

  res.status(200).json({
    items: rows,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
  });
});

// === ADMIN USER ROUTE CONTROLLERS ===
// (Assuming these are protected by an 'admin' middleware in routes)

/**
 * @desc    ADMIN: Get all users with pagination and filtering
 * @route   GET /api/users/admin/all
 * @access  Private/Admin
 */
export const adminGetAllUsers = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: adminGetAllUsers invoked by Admin ${req.user.id}`);
  if (!User || !sequelize) {
    return res
      .status(500)
      .json({ success: false, message: "User model or Sequelize not loaded." });
  }

  const { page = 1, limit = 15, search, role, status } = req.query;
  const where = {};

  if (search) {
    const likeOperator =
      sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
    where[Op.or] = [
      { username: { [likeOperator]: `%${search}%` } },
      { email: { [likeOperator]: `%${search}%` } },
      // Add other searchable fields if needed
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

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

  const { count, rows: users } = await User.findAndCountAll({
    where,
    attributes: adminUserListFields,
    order: [["createdAt", "DESC"]],
    limit: parsedLimit,
    offset,
    distinct: true, // Important for counts with joins if you add them
  });

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    },
  });
});

/**
 * @desc    ADMIN: Get users with 'pending' status
 * @route   GET /api/users/admin/pending
 * @access  Private/Admin
 */
export const adminGetPendingUsers = asyncHandler(async (req, res) => {
  console.log(
    `ADMIN API: adminGetPendingUsers invoked by Admin ${req.user.id}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  const pendingUsers = await User.findAll({
    where: { status: "pending" },
    attributes: adminUserListFields,
    order: [["createdAt", "ASC"]],
  });
  res
    .status(200)
    .json({ success: true, count: pendingUsers.length, data: pendingUsers });
});

/**
 * @desc    ADMIN: Get a specific user by ID
 * @route   GET /api/users/admin/:id
 * @access  Private/Admin
 */
export const adminGetUserById = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id;
  console.log(
    `ADMIN API: adminGetUserById for User ID: ${userIdParam} by Admin ${req.user.id}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId) || userId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  const user = await User.findByPk(userId, {
    attributes: adminUserDetailFields, // Use more detailed fields for admin view
  });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  res.status(200).json({ success: true, data: user });
});

/**
 * @desc    ADMIN: Update a user's status
 * @route   PUT /api/users/admin/:id/status
 * @access  Private/Admin
 */
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id;
  const { status } = req.body;
  const adminUserId = req.user.id;

  console.log(
    `ADMIN API: adminUpdateUserStatus for User ${userIdParam} to status '${status}' by Admin ${adminUserId}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  const validStatuses = User.getAttributes().status?.values; // Get valid enum values
  if (!status || !validStatuses || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId) || userId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userId === adminUserId) {
    return res.status(400).json({
      success: false,
      message: "Admins cannot change their own status via this route.",
    });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  if (user.status === status) {
    return res.status(200).json({
      success: true,
      message: `User status is already '${status}'.`,
      data: user,
    });
  }

  user.status = status;
  await user.save();

  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
  res.status(200).json({
    success: true,
    message: `User status updated to '${status}'.`,
    data: updatedUser,
  });
});

/**
 * @desc    ADMIN: Update a user's role
 * @route   PUT /api/users/admin/:id/role
 * @access  Private/Admin
 */
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id;
  const { role } = req.body;
  const adminUserId = req.user.id;

  console.log(
    `ADMIN API: adminUpdateUserRole for User ${userIdParam} to role '${role}' by Admin ${adminUserId}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  const validRoles = User.getAttributes().role?.values; // Get valid enum values
  if (!role || !validRoles || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    });
  }

  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId) || userId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userId === adminUserId) {
    return res.status(400).json({
      success: false,
      message: "Admins cannot change their own role via this route.",
    });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  if (user.role === role) {
    return res.status(200).json({
      success: true,
      message: `User role is already '${role}'.`,
      data: user,
    });
  }

  user.role = role;
  await user.save();

  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
  res.status(200).json({
    success: true,
    message: `User role updated to '${role}'.`,
    data: updatedUser,
  });
});

/**
 * @desc    ADMIN: Delete a user
 * @route   DELETE /api/users/admin/:id
 * @access  Private/Admin
 */
export const adminDeleteUser = asyncHandler(async (req, res) => {
  const userIdToDeleteParam = req.params.id;
  const adminUserId = req.user.id;

  console.log(
    `ADMIN API: adminDeleteUser for User ${userIdToDeleteParam} by Admin ${adminUserId}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  const userIdToDelete = parseInt(userIdToDeleteParam, 10);
  if (isNaN(userIdToDelete) || userIdToDelete <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userIdToDelete === adminUserId) {
    return res.status(400).json({
      success: false,
      message: "Admins cannot delete their own account via this route.",
    });
  }

  const user = await User.findByPk(userIdToDelete);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Add logic here for what happens to user's content (e.g., projects, posts)
  // For now, just deleting the user. Consider foreign key constraints.
  await user.destroy();
  console.log(
    `Admin ${adminUserId} deleted user ${userIdToDelete} (${user.username}).`
  );
  res
    .status(200)
    .json({ success: true, message: "User deleted successfully." });
});
