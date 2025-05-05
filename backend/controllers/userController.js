// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Ensure User model is loaded here
import bcrypt from "bcryptjs"; // Needed for password matching/hashing
import { Op } from "sequelize"; // For operators like Op.ne
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Assuming you have an ActivityLog model defined in models/index.js
// If not, you'll need to create it or adjust the getUserActivity function.
const { User, ActivityLog, sequelize } = db; // Destructure models

// --- ES Module __dirname setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT_DIR = path.resolve(__dirname, "..");
const PROFILE_PIC_UPLOADS_DIR = path.join(
  BACKEND_ROOT_DIR,
  "uploads",
  "profilePictures"
);
// --- End Setup ---

// --- Helper: Define fields to select for different views ---
const publicProfileFields = [
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
const selectableUserFields = ["id", "username", "email"];

// --- Helper function to ensure upload directory exists ---
const ensureUploadsDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Directory ${dirPath} not found, creating...`);
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
};
// --- End Helper ---

// --- Public User Route Controller ---
export const getUserPublicProfile = asyncHandler(async (req, res) => {
  // ... (keep existing implementation) ...
  console.log("[getUserPublicProfile] req.params:", req.params);
  const userIdParam = req.params.userId;
  console.log(
    `[getUserPublicProfile] Received ID param: ${userIdParam} (type: ${typeof userIdParam})`
  );

  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId) || userId <= 0) {
    console.error(
      `[getUserPublicProfile] Validation FAILED for param: ${userIdParam}, parsed: ${userId}`
    );
    res.status(400);
    throw new Error("Invalid user ID format provided.");
  }

  try {
    console.log(
      `[getUserPublicProfile] Finding user with parsed ID: ${userId}`
    );
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
  } catch (error) {
    console.error(
      `[getUserPublicProfile] Error fetching user ${userId}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    const message = error.message || "Server error fetching profile.";
    if (!res.headersSent) {
      res.status(statusCode).json({ success: false, message: message });
    }
  }
});

// --- Protected User 'Me' Route Controllers ---
export const updateUserProfile = asyncHandler(async (req, res) => {
  // ... (keep existing, corrected implementation from previous step) ...
  const userId = req.user.id;
  console.log(`API: updateUserProfile invoked for User ${userId}`);
  console.log("updateUserProfile - Received req.body:", req.body);
  console.log(
    "updateUserProfile - Received req.file:",
    req.file?.originalname || "No file uploaded"
  );

  if (!User) throw new Error("User model not loaded.");
  if (!sequelize) throw new Error("Sequelize instance not available from db.");

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

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] === "string") {
        updateData[field] = req.body[field].trim() || null;
      } else {
        updateData[field] = req.body[field];
      }
    }
  }

  if (req.body.skillsNeeded !== undefined) {
    try {
      let skills = [];
      if (req.body.skillsNeeded !== null && req.body.skillsNeeded !== "") {
        skills = JSON.parse(req.body.skillsNeeded);
      }
      if (!Array.isArray(skills)) throw new Error("Skills must be an array.");
      updateData.skillsNeeded = skills;
      console.log("Parsed skillsNeeded:", skills);
    } catch (e) {
      console.error(
        "Error parsing skillsNeeded JSON:",
        e.message,
        "Input:",
        req.body.skillsNeeded
      );
      res.status(400);
      throw new Error(
        "Invalid format for 'skillsNeeded'. Expected a valid JSON array string (e.g., '[\"React\"]') or empty string/null."
      );
    }
  }

  if (req.body.socialLinksJson !== undefined) {
    try {
      let links = {};
      if (
        req.body.socialLinksJson !== null &&
        req.body.socialLinksJson !== ""
      ) {
        links = JSON.parse(req.body.socialLinksJson);
      }
      if (typeof links !== "object" || Array.isArray(links))
        throw new Error("Social links must be an object.");
      updateData.socialLinks = links;
      console.log("Parsed socialLinks:", links);
    } catch (e) {
      console.error(
        "Error parsing socialLinks JSON:",
        e.message,
        "Input:",
        req.body.socialLinksJson
      );
      res.status(400);
      throw new Error(
        "Invalid format for 'socialLinksJson'. Expected a valid JSON object string (e.g., '{\"linkedin\":\"url\"}') or empty string/null."
      );
    }
  }

  let newImageUrl = null;
  let oldImageUrl = null;
  let absoluteFilePath = null;

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

      absoluteFilePath = path.join(PROFILE_PIC_UPLOADS_DIR, filename);
      newImageUrl = `/uploads/profilePictures/${filename}`;

      if (!req.file.buffer)
        throw new Error(
          "File buffer is missing from upload (using memory storage)."
        );

      await fs.writeFile(absoluteFilePath, req.file.buffer);
      console.log(
        `New profile picture saved to filesystem: ${absoluteFilePath}`
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
    res.status(400);
    throw new Error("No valid profile fields provided for update.");
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
      oldImageUrl = user.profilePictureUrl;
    }

    console.log(`Applying final updates to user ${userId}:`, updateData);
    await user.update(updateData, { transaction });

    await transaction.commit();
    console.log(
      `User ${userId} profile update transaction committed successfully.`
    );

    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      console.log(`Attempting to delete old profile picture: ${oldImageUrl}`);
      try {
        const oldAbsoluteFilePath = path.join(
          BACKEND_ROOT_DIR,
          "uploads",
          oldImageUrl.substring("/uploads/".length)
        );
        await fs.unlink(oldAbsoluteFilePath);
        console.log(
          `Successfully deleted old profile picture: ${oldAbsoluteFilePath}`
        );
      } catch (deleteError) {
        if (deleteError.code !== "ENOENT") {
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
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
      console.log("Update transaction rolled back due to error.");
    }
    if (absoluteFilePath) {
      console.log(
        `Transaction failed, attempting to delete newly saved file: ${absoluteFilePath}`
      );
      try {
        await fs.unlink(absoluteFilePath);
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
        res.status(statusCode).json({ success: false, message });
      }
    }
  }
});

export const updateUserEmail = asyncHandler(async (req, res) => {
  // ... (keep existing implementation) ...
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
    res.status(400);
    throw new Error("Invalid email format provided.");
  }

  try {
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

    if (user.email === newEmail) {
      return res.status(200).json({
        success: true,
        message: "Email is already set to this address. No update performed.",
        data: { email: user.email },
      });
    }

    const existingUserWithEmail = await User.findOne({
      where: {
        email: newEmail,
        id: { [Op.ne]: userId },
      },
    });
    if (existingUserWithEmail) {
      res.status(400);
      throw new Error("Email address is already in use by another account.");
    }

    await user.update({
      email: newEmail,
    });
    console.log(`User ${userId} email updated successfully to ${newEmail}.`);

    res.status(200).json({
      success: true,
      message: "Email updated successfully.",
      data: { email: newEmail },
    });
  } catch (error) {
    console.error(`Error updating email for User ${userId}:`, error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res
        .status(400)
        .json({ success: false, message: "Email address already in use." });
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(". "),
      });
    } else {
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      if (!res.headersSent) {
        res.status(statusCode).json({
          success: false,
          message: error.message || "Server error updating email.",
        });
      } else {
        console.error(
          "Headers already sent, could not send error response for:",
          error.message
        );
      }
    }
  }
});

export const updateUserPassword = asyncHandler(async (req, res) => {
  // ... (keep existing implementation) ...
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  console.log(`API: updateUserPassword invoked for User ${userId}`);
  if (!User) throw new Error("User model not loaded.");

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required.");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters long.");
  }
  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error("New password cannot be the same as the current password.");
  }

  try {
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

    user.password = newPassword;
    await user.save();
    console.log(`User ${userId} password updated successfully.`);

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(`Error updating password for User ${userId}:`, error);
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error updating password.",
      });
    }
  }
});

export const getSelectableUsers = asyncHandler(async (req, res) => {
  // ... (keep existing implementation) ...
  const requestingUserId = req.user.id;
  console.log(`API: getSelectableUsers invoked by User ${requestingUserId}`);
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  try {
    const users = await User.findAll({
      where: {
        status: "approved", // Ensure only active/approved users are selectable
        id: { [Op.ne]: requestingUserId }, // Exclude self
      },
      attributes: selectableUserFields,
      order: [["username", "ASC"]],
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(
      `Error fetching selectable users for User ${requestingUserId}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Server error fetching user list.",
    });
  }
});

// ======================================================
// === ADDED CONTROLLER FUNCTION FOR USER ACTIVITY ====
// ======================================================
/**
 * @desc    Get activity log for a specific user (paginated)
 * @route   GET /api/users/:userId/activity
 * @access  Private (Logged-in user can only access their own activity)
 */
export const getUserActivity = asyncHandler(async (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  const requestingUserId = req.user.id; // From 'protect' middleware

  console.log(
    `API: getUserActivity invoked for Target User ${targetUserId} by Requesting User ${requestingUserId}`
  );

  // --- Validation and Authorization ---
  if (isNaN(targetUserId) || targetUserId <= 0) {
    res.status(400);
    throw new Error("Invalid target user ID format provided.");
  }

  // ** IMPORTANT: Ensure users can only fetch their OWN activity log **
  if (targetUserId !== requestingUserId) {
    // Allow admins to fetch anyone's? Add role check if needed: && req.user.role !== 'admin'
    console.warn(
      `Forbidden attempt: User ${requestingUserId} tried to access activity for User ${targetUserId}`
    );
    res.status(403); // Forbidden
    throw new Error("Forbidden: You can only access your own activity log.");
  }

  // --- Pagination Parameters ---
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15; // Match frontend default
  const offset = (page - 1) * limit;

  if (page <= 0 || limit <= 0) {
    res.status(400);
    throw new Error("Invalid pagination parameters (page/limit).");
  }

  // --- Database Interaction ---
  if (!ActivityLog) {
    console.error("ActivityLog model is not available from db import!");
    // --- TEMPORARY MOCK RESPONSE (If ActivityLog Model Doesn't Exist Yet) ---
    console.warn("ActivityLog model missing! Returning MOCK activity data.");
    const mockTotalItems = 35; // Example total
    const mockItems = Array.from(
      { length: Math.min(limit, mockTotalItems - offset) },
      (_, i) => ({
        id: `mock_${targetUserId}_${offset + i}`,
        userId: targetUserId,
        type: i % 3 === 0 ? "PROJECT_CREATED" : "REQUEST_SENT",
        description: `Mock action ${offset + i + 1} performed by user.`,
        details: { info: `Mock details for item ${offset + i + 1}` },
        timestamp: new Date(Date.now() - (offset + i) * 3600000).toISOString(), // Example timestamps
      })
    ).filter((item, idx) => idx + offset < mockTotalItems); // Ensure we don't exceed total

    res.status(200).json({
      items: mockItems,
      currentPage: page,
      totalPages: Math.ceil(mockTotalItems / limit),
      totalItems: mockTotalItems,
    });
    return; // Stop execution if using mock data
    // --- END MOCK RESPONSE ---
    // throw new Error("ActivityLog model is not configured."); // Use this line instead of mock when model exists
  }

  try {
    // --- Replace with your actual ActivityLog query ---
    console.log(
      `Fetching activity log for User ${targetUserId}, Page: ${page}, Limit: ${limit}`
    );
    const { count, rows } = await ActivityLog.findAndCountAll({
      where: { userId: targetUserId }, // Filter by the user ID
      limit: limit,
      offset: offset,
      order: [["timestamp", "DESC"]], // Show newest first (adjust field name if needed)
      // Add any other attributes or includes needed for the activity items
    });
    // --- End Actual Query ---

    const totalPages = Math.ceil(count / limit);

    console.log(`Found ${count} activity items for user ${targetUserId}.`);

    // Send the response in the format expected by the frontend
    res.status(200).json({
      items: rows,
      currentPage: page,
      totalPages: totalPages,
      totalItems: count,
    });
  } catch (error) {
    console.error(
      `Error fetching activity log for User ${targetUserId}:`,
      error
    );
    res.status(500); // Internal Server Error
    throw new Error("Server error fetching activity log.");
  }
});
// ======================================================
// === END ADDED CONTROLLER FUNCTION ====================
// ======================================================

// --- Admin User Route Controllers ---
// Keep all existing admin controllers below this line...
export const adminGetAllUsers = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  console.log(`ADMIN API: adminGetAllUsers invoked by Admin ${req.user.id}`);
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  try {
    const { page = 1, limit = 15, search, role, status } = req.query;
    const where = {};
    if (search) {
      const likeOperator =
        sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
      where[Op.or] = [
        { username: { [likeOperator]: `%${search}%` } },
        { email: { [likeOperator]: `%${search}%` } },
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
        .json({ success: false, message: "Invalid pagination params." });
    }
    const offset = (parsedPage - 1) * parsedLimit;
    console.log("Admin Get All Users - Query:", {
      where,
      limit: parsedLimit,
      offset,
    });
    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: adminUserListFields,
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });
    console.log(`ADMIN: Found ${count} users, returning page ${parsedPage}.`);
    const responsePayload = {
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
    };
    res.status(200).json(responsePayload);
  } catch (error) {
    console.error("ADMIN API Error fetching all users:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching users." });
  }
});
export const adminGetPendingUsers = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  console.log(
    `ADMIN API: adminGetPendingUsers invoked by Admin ${req.user.id}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  try {
    const pendingUsers = await User.findAll({
      where: { status: "pending" },
      attributes: adminUserListFields,
      order: [["createdAt", "ASC"]],
    });
    res
      .status(200)
      .json({ success: true, count: pendingUsers.length, data: pendingUsers });
  } catch (error) {
    console.error("Admin Error fetching pending users:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching pending users.",
    });
  }
});
export const adminGetUserById = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
  const userIdParam = req.params.id;
  console.log(
    `ADMIN API: adminGetUserById for User ID: ${userIdParam} by Admin ${req.user.id}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  try {
    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId) || userId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID." });
    }
    const user = await User.findByPk(userId, {
      attributes: adminUserDetailFields,
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(`Admin Error fetching user ${userIdParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user details." });
  }
});
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
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
  const validStatuses = User.getAttributes().status?.values;
  if (!status || !validStatuses || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status.` });
  }
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userId === adminUserId) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot change own status." });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.status === status) {
      return res.status(200).json({
        success: true,
        message: `Status already '${status}'.`,
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
      message: `Status updated to ${status}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error(
      `Admin Error updating status for user ${userIdParam}:`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Server error updating status." });
  }
});
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
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
  const validRoles = User.getAttributes().role?.values;
  if (!role || !validRoles || !validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `Invalid role.` });
  }
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userId === adminUserId) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot change own role." });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.role === role) {
      return res.status(200).json({
        success: true,
        message: `Role already '${role}'.`,
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
      message: `Role updated to ${role}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error(`Admin Error updating role for user ${userIdParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating role." });
  }
});
export const adminDeleteUser = asyncHandler(async (req, res) => {
  /* ... Keep implementation ... */
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
  if (isNaN(userIdToDelete)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }
  if (userIdToDelete === adminUserId) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot delete own account." });
  }
  try {
    const user = await User.findByPk(userIdToDelete);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    // --- Consider Cascading Deletes or Preventing Deletion if User Owns Data ---
    // This basic implementation just deletes the user record.
    // You might need more complex logic depending on your database relationships.
    await user.destroy();
    console.log(
      `Admin ${adminUserId} deleted user ${userIdToDelete} (${user.username}).`
    );
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error(`Admin Error deleting user ${userIdToDeleteParam}:`, error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete user. They may have associated records (e.g., projects, posts) that need to be handled first.",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error deleting user." });
  }
});
