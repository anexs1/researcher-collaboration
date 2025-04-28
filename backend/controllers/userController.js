// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import bcrypt from "bcryptjs"; // Needed for password update
import { Op } from "sequelize";

const { User } = db; // Destructure User model

// --- Helper: Define fields to select for different views ---
// Fields safe for public viewing (e.g., GET /api/users/public/:id)
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
  // Add other fields you want public
];

// Fields for Admin LIST view (more info than public, less than detail)
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

// Fields for Admin DETAIL view (most fields, still excluding password)
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

// --- Public User Route Controller ---
/**
 * @desc    Get public profile of a user by ID
 * @route   GET /api/users/public/:id
 * @access  Public (or Private if needed)
 */
export const getUserPublicProfile = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id;
  console.log(`API: getUserPublicProfile invoked for ID: ${userIdParam}`);

  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId) || userId <= 0) {
    res.status(400);
    throw new Error("Invalid user ID format.");
  }

  try {
    // Use the defined public fields, default scope excludes password anyway
    const user = await User.findByPk(userId, {
      attributes: publicProfileFields,
    });

    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }
    // Only return approved users publicly? Add check if needed:
    // if (user.status !== 'approved') { res.status(404); throw new Error("User not found."); }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(
      `Error fetching public profile for User ${userIdParam}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Server error fetching profile.",
    });
  }
});

// --- Protected User 'Me' Route Controllers ---

/**
 * @desc    Update own user profile (non-sensitive fields)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Get ID from authenticated user (protect middleware)
  console.log(`API: updateUserProfile invoked for User ${userId}`);

  // Extract allowed fields from body
  const {
    username,
    university,
    department,
    companyName,
    jobTitle,
    medicalSpecialty,
    hospitalName,
    profilePictureUrl,
    bio,
  } = req.body;
  const updateData = {};

  // Add validation if needed for each field
  if (username !== undefined) updateData.username = username.trim();
  if (university !== undefined) updateData.university = university;
  if (department !== undefined) updateData.department = department;
  if (companyName !== undefined) updateData.companyName = companyName;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
  if (medicalSpecialty !== undefined)
    updateData.medicalSpecialty = medicalSpecialty;
  if (hospitalName !== undefined) updateData.hospitalName = hospitalName;
  if (profilePictureUrl !== undefined)
    updateData.profilePictureUrl = profilePictureUrl; // Add URL validation?
  if (bio !== undefined) updateData.bio = bio;

  if (Object.keys(updateData).length === 0) {
    res.status(400);
    throw new Error("No valid profile fields provided for update.");
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    } // Should not happen if authenticated

    await user.update(updateData);
    console.log(`User ${userId} profile updated.`);

    // Return only safe fields
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error(`Error updating profile for User ${userId}:`, error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res
        .status(400)
        .json({ success: false, message: "Username or email already taken." }); // Example for unique constraints
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(". "),
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || "Server error updating profile.",
      });
    }
  }
});

/**
 * @desc    Update own user email (might require re-verification)
 * @route   PUT /api/users/email
 * @access  Private
 */
export const updateUserEmail = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { email, currentPassword } = req.body;
  console.log(`API: updateUserEmail invoked for User ${userId}`);

  if (!email || !currentPassword) {
    res.status(400);
    throw new Error("New email and current password are required.");
  }

  try {
    // Fetch user including password field for comparison
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error("Incorrect current password.");
    }

    if (user.email === email) {
      return res.status(200).json({
        success: true,
        message: "Email is already set to this address.",
      });
    }

    // Update email and potentially set status to 'pending' if verification is needed
    // This logic depends on your verification flow
    await user.update({
      email: email /*, status: 'pending_email_verification' */,
    });
    console.log(`User ${userId} email updated to ${email}.`);

    // TODO: Trigger email verification flow if applicable

    res
      .status(200)
      .json({ success: true, message: "Email update request received." }); // Adjust message if verification needed
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
      const sc = res.statusCode >= 400 ? res.statusCode : 500;
      res.status(sc).json({
        success: false,
        message: error.message || "Server error updating email.",
      });
    }
  }
});

/**
 * @desc    Update own user password
 * @route   PUT /api/users/password
 * @access  Private
 */
export const updateUserPassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  console.log(`API: updateUserPassword invoked for User ${userId}`);

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current and new passwords are required.");
  }
  // Add password complexity checks if needed
  if (newPassword.length < 6) {
    // Example minimum length
    res.status(400);
    throw new Error("New password must be at least 6 characters long.");
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
      throw new Error("Incorrect current password.");
    }

    // Sequelize hook 'beforeSave' will automatically hash the new password
    user.password = newPassword;
    await user.save(); // This triggers the hook
    console.log(`User ${userId} password updated successfully.`);

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error(`Error updating password for User ${userId}:`, error);
    const sc = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(sc).json({
      success: false,
      message: error.message || "Server error updating password.",
    });
  }
});

// --- Admin User Route Controllers ---

/**
 * @desc    Get all users (Admin only) with pagination and filtering
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const adminGetAllUsers = asyncHandler(async (req, res) => {
  console.log(`ADMIN API: adminGetAllUsers invoked by Admin ${req.user.id}`);
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  try {
    const { page = 1, limit = 15, search, role, status } = req.query;
    const where = {}; // Start with empty filter
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
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

    console.log("Admin Get All Users - Query Options:", {
      where,
      limit: parsedLimit,
      offset,
    });

    const { count, rows: users } = await User.findAndCountAll({
      where: where,
      attributes: adminUserListFields, // Use fields defined for admin list view
      order: [["createdAt", "DESC"]], // Order by creation date, newest first
      limit: parsedLimit,
      offset: offset,
      distinct: true, // Important for correct count with potential joins (though none here yet)
    });

    console.log(
      `ADMIN: Found ${count} users total matching criteria, returning page ${parsedPage}.`
    );

    // --- CORRECTED Response Structure to match Frontend ---
    const responsePayload = {
      success: true,
      data: {
        // Wrap users and pagination inside 'data' object
        users: users,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / parsedLimit),
          currentPage: parsedPage,
          limit: parsedLimit, // Include limit for context
        },
      },
    };
    console.log("--- Sending Response Payload (Admin Users) ---");
    // console.log(JSON.stringify(responsePayload, null, 2)); // Log exact structure if needed
    console.log("-------------------------------------------");
    res.status(200).json(responsePayload);
    // -------------------------------------------------------
  } catch (error) {
    console.error("ADMIN API Error fetching all users:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching users." });
  }
});

/**
 * @desc    Get pending users (Admin only)
 * @route   GET /api/admin/pending-users
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

  try {
    const pendingUsers = await User.findAll({
      where: { status: "pending" },
      attributes: adminUserListFields, // Use admin list fields, or specific ones for review
      order: [["createdAt", "ASC"]], // Show oldest pending first
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

/**
 * @desc    Get a single user's details by ID (Admin only)
 * @route   GET /api/admin/users/:id
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

  try {
    const userId = parseInt(userIdParam, 10);
    if (isNaN(userId) || userId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID." });
    }

    const user = await User.findByPk(userId, {
      attributes: adminUserDetailFields,
    }); // Use detailed fields

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user }); // Send user data directly under 'data'
  } catch (error) {
    console.error(`Admin Error fetching user ${userIdParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user details." });
  }
});

/**
 * @desc    Update a user's status (e.g., approve/reject/suspend) (Admin only)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id;
  const { status } = req.body;
  console.log(
    `ADMIN API: adminUpdateUserStatus for User ${userIdParam} to status '${status}' by Admin ${req.user.id}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  const validStatuses = User.getAttributes().status?.values; // Get ENUM values safely
  if (!status || !validStatuses || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${
        validStatuses?.join(", ") ?? "N/A"
      }`,
    });
  }
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
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
        message: `User status already '${status}'.`,
        data: user,
      });
    }

    user.status = status;
    await user.save();
    console.log(`Admin updated status for user ${userId} to ${status}`);
    // TODO: Implement sending notification email to user about status change

    // Fetch updated user data to return (excluding password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: `User status updated to ${status}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error(
      `Admin Error updating status for user ${userIdParam}:`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Server error updating user status." });
  }
});

/**
 * @desc    Update a user's role (Admin only)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Admin
 */
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id;
  const { role } = req.body;
  console.log(
    `ADMIN API: adminUpdateUserRole for User ${userIdParam} to role '${role}' by Admin ${req.user.id}`
  );
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  const validRoles = User.getAttributes().role?.values; // Get ENUM values safely
  if (!role || !validRoles || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${
        validRoles?.join(", ") ?? "N/A"
      }`,
    });
  }
  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
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
        message: `User role is already '${role}'.`,
        data: user,
      });
    }

    // Prevent changing own role? Or last admin's role? Add checks if needed.
    // if (userId === req.user.id) { return res.status(400).json({ success: false, message: "Cannot change own role." }); }

    user.role = role;
    await user.save();
    console.log(`Admin updated role for user ${userId} to ${role}`);

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error(`Admin Error updating role for user ${userIdParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating user role." });
  }
});

/**
 * @desc    Delete a user (Admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const adminDeleteUser = asyncHandler(async (req, res) => {
  const userIdToDeleteParam = req.params.id;
  const adminUserId = req.user.id; // Admin performing action
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

  // Prevent admin from deleting themselves
  if (userIdToDelete === adminUserId) {
    return res.status(400).json({
      success: false,
      message: "Administrators cannot delete their own account.",
    });
  }

  try {
    const user = await User.findByPk(userIdToDelete);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Perform the deletion
    await user.destroy(); // This triggers model hooks and potential CASCADE operations
    console.log(
      `Admin ${adminUserId} deleted user ${userIdToDelete} (${user.username}).`
    );
    // TODO: Audit Log?

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error(`Admin Error deleting user ${userIdToDeleteParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error deleting user." });
  }
});
