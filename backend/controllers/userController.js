// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Ensure User model is loaded here
import bcrypt from "bcryptjs"; // Needed for password matching/hashing
import { Op } from "sequelize"; // For operators like Op.ne

const { User } = db; // Destructure User model

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
const selectableUserFields = ["id", "username", "email"]; // Fields for collaborator dropdown

// --- Public User Route Controller ---
/**
 * @desc    Get public profile of a user by ID
 * @route   GET /api/users/public/:userId
 * @access  Public
 */
export const getUserPublicProfile = asyncHandler(async (req, res) => {
  console.log("[getUserPublicProfile] req.params:", req.params);
  const userIdParam = req.params.userId; // Correctly access the param name from the route
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
      attributes: publicProfileFields, // Select only public fields
    });

    if (!user) {
      console.log(`[getUserPublicProfile] User not found for ID: ${userId}`);
      res.status(404); // Not Found
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
/**
 * @desc    Update own user profile (non-sensitive fields)
 * @route   PUT /api/users/profile
 * @access  Private (Requires login via `protect` middleware)
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Assumes `protect` middleware adds user to req
  console.log(`API: updateUserProfile invoked for User ${userId}`);
  if (!User) throw new Error("User model not loaded.");

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

  // Build object with only the fields provided in the request
  const updateData = {};
  if (username !== undefined) updateData.username = username.trim();
  if (university !== undefined) updateData.university = university;
  if (department !== undefined) updateData.department = department;
  if (companyName !== undefined) updateData.companyName = companyName;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
  if (medicalSpecialty !== undefined)
    updateData.medicalSpecialty = medicalSpecialty;
  if (hospitalName !== undefined) updateData.hospitalName = hospitalName;
  if (profilePictureUrl !== undefined)
    updateData.profilePictureUrl = profilePictureUrl;
  if (bio !== undefined) updateData.bio = bio;

  if (Object.keys(updateData).length === 0) {
    res.status(400);
    throw new Error("No valid profile fields provided for update.");
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found for update."); // Should not happen if authenticated
    }

    // Check for username uniqueness if it's being updated
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({
        where: { username: updateData.username },
      });
      if (existingUser) {
        res.status(400);
        throw new Error("Username is already taken.");
      }
    }

    await user.update(updateData);
    console.log(`User ${userId} profile updated successfully.`);

    // Fetch updated user data (excluding sensitive fields like password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] }, // Ensure password is excluded
    });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error(`Error updating profile for User ${userId}:`, error);
    if (error.name === "SequelizeUniqueConstraintError") {
      // This might catch other unique constraints if defined (e.g., email if updated here)
      res.status(400).json({
        success: false,
        message: "A unique field constraint was violated.",
      });
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
          message: error.message || "Server error updating profile.",
        });
      }
    }
  }
});

// ==========================================================
// ========= CORRECTED updateUserEmail Function =============
// ==========================================================
/**
 * @desc    Update own user email (requires current password verification)
 * @route   PUT /api/users/me/email
 * @access  Private (Requires login via `protect` middleware)
 */
export const updateUserEmail = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Assumes `protect` middleware adds user to req

  // --- *** FIX: Destructure 'newEmail' from req.body, matching the frontend *** ---
  const { newEmail, currentPassword } = req.body;
  // --- *** END FIX *** ---

  console.log(
    `API: updateUserEmail invoked for User ${userId} with new email: ${newEmail}`
  );
  if (!User) throw new Error("User model not loaded.");

  // --- *** FIX: Validate 'newEmail' instead of 'email' *** ---
  if (!newEmail || !currentPassword) {
    res.status(400); // Bad Request: Missing required fields
    throw new Error("New email and current password are required.");
  }
  // --- *** END FIX *** ---

  // --- *** FIX: Validate format of 'newEmail' *** ---
  // Basic email format validation (consider a more robust library like validator.js)
  if (!/\S+@\S+\.\S+/.test(newEmail)) {
    res.status(400); // Bad Request: Invalid format
    throw new Error("Invalid email format provided.");
  }
  // --- *** END FIX *** ---

  try {
    // Fetch user including password field for verification
    // Ensure you have a scope 'withPassword' defined in your User model
    // or fetch normally if password field is not excluded by default scopes.
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      res.status(404); // Not Found
      throw new Error("User not found."); // Should not happen if authenticated
    }

    // Verify the provided current password
    // Assumes `matchPassword` method exists on your User model instance
    // (uses bcrypt.compare internally)
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401); // Unauthorized: Incorrect password
      throw new Error("Incorrect current password provided.");
    }

    // --- *** FIX: Check if the new email is the same as the current one *** ---
    if (user.email === newEmail) {
      // It's not an error, but no update is needed.
      return res.status(200).json({
        // OK
        success: true,
        message: "Email is already set to this address. No update performed.",
        data: { email: user.email }, // Return current email
      });
    }
    // --- *** END FIX *** ---

    // Check if the new email address is already taken by *another* user
    // --- *** FIX: Query based on 'newEmail' *** ---
    const existingUserWithEmail = await User.findOne({
      where: {
        email: newEmail, // Check if 'newEmail' exists...
        id: { [Op.ne]: userId }, // ... for a user other than the current one
      },
    });
    // --- *** END FIX *** ---
    if (existingUserWithEmail) {
      res.status(400); // Bad Request: Client provided an email that cannot be used
      throw new Error("Email address is already in use by another account.");
    }

    // If all checks pass, update the email in the database
    // --- *** FIX: Update the 'email' field with the value of 'newEmail' *** ---
    await user.update({
      email: newEmail,
      // status: 'pending_email_verification' // Optional: Uncomment if you implement email verification
    });
    console.log(`User ${userId} email updated successfully to ${newEmail}.`);
    // --- *** END FIX *** ---

    // TODO: If implementing email verification, trigger sending the verification email here.

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Email updated successfully.", // Adjust if verification needed
      data: { email: newEmail }, // Return the newly set email
    });
  } catch (error) {
    console.error(`Error updating email for User ${userId}:`, error);
    // Handle potential database errors during the update itself (e.g., unexpected constraint violation)
    if (error.name === "SequelizeUniqueConstraintError") {
      // This might catch the email uniqueness again if the check above somehow missed it (race condition?)
      res
        .status(400)
        .json({ success: false, message: "Email address already in use." });
    } else if (error.name === "SequelizeValidationError") {
      // Handle validation errors defined in the Sequelize model
      res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(". "),
      });
    } else {
      // Use status code set before throwing (like 400, 401, 404) or default to 500
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      // Ensure we don't try to set headers again if already sent (e.g., in the 'same email' check)
      if (!res.headersSent) {
        res.status(statusCode).json({
          success: false,
          message: error.message || "Server error updating email.",
        });
      } else {
        // Log if headers were already sent (e.g., due to the early return for same email)
        console.error(
          "Headers already sent, could not send error response for:",
          error.message
        );
      }
    }
  }
});
// ==========================================================
// ==========================================================
// ==========================================================

/**
 * @desc    Update own user password
 * @route   PUT /api/users/me/password
 * @access  Private (Requires login via `protect` middleware)
 */
export const updateUserPassword = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Assumes `protect` middleware adds user to req
  const { currentPassword, newPassword } = req.body;

  console.log(`API: updateUserPassword invoked for User ${userId}`);
  if (!User) throw new Error("User model not loaded.");

  // Basic validation
  if (!currentPassword || !newPassword) {
    res.status(400); // Bad Request
    throw new Error("Current password and new password are required.");
  }
  // Add password complexity/length checks as needed
  if (newPassword.length < 6) {
    // Example: Minimum length
    res.status(400); // Bad Request
    throw new Error("New password must be at least 6 characters long.");
  }
  if (currentPassword === newPassword) {
    res.status(400); // Bad Request
    throw new Error("New password cannot be the same as the current password.");
  }

  try {
    // Fetch user including password field for verification
    const user = await User.scope("withPassword").findByPk(userId);
    if (!user) {
      res.status(404); // Not Found
      throw new Error("User not found.");
    }

    // Verify the provided current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401); // Unauthorized: Incorrect password
      throw new Error("Incorrect current password provided.");
    }

    // If password matches, update the password.
    // The 'beforeSave' or 'beforeUpdate' hook in your User model should handle hashing.
    user.password = newPassword;
    await user.save(); // This triggers the hook and saves the hashed password

    console.log(`User ${userId} password updated successfully.`);

    res.status(200).json({
      // OK
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(`Error updating password for User ${userId}:`, error);
    // Use status code set before throwing (like 400, 401, 404) or default to 500
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error updating password.",
      });
    }
  }
});

/**
 * @desc    Get users suitable for selection (e.g., collaborators dropdown)
 * @route   GET /api/users/selectable
 * @access  Private (Logged-in users via `protect` middleware)
 */
export const getSelectableUsers = asyncHandler(async (req, res) => {
  const requestingUserId = req.user.id; // ID of the user making the request
  console.log(`API: getSelectableUsers invoked by User ${requestingUserId}`);
  if (!User) {
    // This is a server configuration issue
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  try {
    // Find users who are active/approved and are not the user making the request
    const users = await User.findAll({
      where: {
        status: "approved", // Example: Only find active users
        id: { [Op.ne]: requestingUserId }, // Exclude the current user
      },
      attributes: selectableUserFields, // Select only id, username, email
      order: [["username", "ASC"]], // Order alphabetically by username
    });

    // Return the list of users
    res.status(200).json({ success: true, data: users }); // Return array under 'data' key
  } catch (error) {
    console.error(
      `Error fetching selectable users for User ${requestingUserId}:`,
      error
    );
    res.status(500).json({
      // Internal Server Error
      success: false,
      message: "Server error fetching user list.",
    });
  }
});

// --- Admin User Route Controllers ---
// These functions should be called by routes protected by admin-specific middleware

/**
 * @desc    Get all users (Admin only) with pagination and filtering
 * @route   GET /api/admin/users (Example route)
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
    const where = {};
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } }, // Use iLike for case-insensitive search (PostgreSQL)
        { email: { [Op.iLike]: `%${search}%` } }, // Use 'like' for MySQL/SQLite
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

    console.log("Admin Get All Users - Query:", {
      where,
      limit: parsedLimit,
      offset,
    });

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: adminUserListFields, // Use fields defined for admin list view
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true, // Important for counts with joins/complex where clauses
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

/**
 * @desc    Get pending users (Admin only)
 * @route   GET /api/admin/pending-users (Example route)
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
      attributes: adminUserListFields, // Reuse list fields or define specific ones
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
 * @route   GET /api/admin/users/:id (Example route)
 * @access  Private/Admin
 */
export const adminGetUserById = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id; // Assumes parameter name is :id in the route
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
        .json({ success: false, message: "Invalid User ID provided." });
    }

    const user = await User.findByPk(userId, {
      attributes: adminUserDetailFields, // Use detailed fields for admin view
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user }); // Return user details under 'data' key
  } catch (error) {
    console.error(`Admin Error fetching user ${userIdParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user details." });
  }
});

/**
 * @desc    Update a user's status (e.g., approve/reject/suspend) (Admin only)
 * @route   PATCH /api/admin/users/:id/status (Example route using PATCH)
 * @access  Private/Admin
 */
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id;
  const { status } = req.body; // Expecting { "status": "approved" } or similar
  const adminUserId = req.user.id;

  console.log(
    `ADMIN API: adminUpdateUserStatus for User ${userIdParam} to status '${status}' by Admin ${adminUserId}`
  );

  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  // Validate the provided status against allowed values in the model definition
  const validStatuses = User.getAttributes().status?.values; // ['pending', 'approved', 'rejected', 'suspended'] etc.
  if (!status || !validStatuses || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid or missing status provided. Must be one of: ${validStatuses?.join(
        ", "
      )}`,
    });
  }

  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId) || userId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID provided." });
  }

  // Optional: Prevent admin from changing their own status?
  if (userId === adminUserId) {
    return res.status(400).json({
      success: false,
      message: "Administrators cannot change their own status.",
    });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Optional: Check if status is already set to the target value
    if (user.status === status) {
      return res.status(200).json({
        success: true,
        message: `User status is already '${status}'. No update performed.`,
        data: user, // Return current user data
      });
    }

    // Update the user's status
    user.status = status;
    await user.save(); // Save the changes

    console.log(
      `ADMIN: Successfully updated user ${userId} status to ${status}`
    );

    // TODO: Implement notification logic if needed (e.g., email the user about status change)

    // Fetch updated user data to return (excluding password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      success: true,
      message: `User status successfully updated to ${status}.`,
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
 * @route   PATCH /api/admin/users/:id/role (Example route using PATCH)
 * @access  Private/Admin
 */
export const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id;
  const { role } = req.body; // Expecting { "role": "admin" } or "user" etc.
  const adminUserId = req.user.id;

  console.log(
    `ADMIN API: adminUpdateUserRole for User ${userIdParam} to role '${role}' by Admin ${adminUserId}`
  );

  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }

  // Validate the provided role against allowed values in the model definition
  const validRoles = User.getAttributes().role?.values; // e.g., ['user', 'admin', 'moderator']
  if (!role || !validRoles || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid or missing role provided. Must be one of: ${validRoles?.join(
        ", "
      )}`,
    });
  }

  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId) || userId <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID provided." });
  }

  // Prevent admin from changing their own role via this endpoint
  if (userId === adminUserId) {
    return res.status(400).json({
      success: false,
      message:
        "Administrators cannot change their own role using this function.",
    });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Optional: Check if role is already set
    if (user.role === role) {
      return res.status(200).json({
        success: true,
        message: `User role is already '${role}'. No update performed.`,
        data: user,
      });
    }

    // Optional: Add checks to prevent demoting the last admin, depending on application logic

    // Update the user's role
    user.role = role;
    await user.save(); // Save changes

    console.log(`ADMIN: Successfully updated user ${userId} role to ${role}`);

    // Fetch updated user data (excluding password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}.`,
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
 * @route   DELETE /api/admin/users/:id (Example route)
 * @access  Private/Admin
 */
export const adminDeleteUser = asyncHandler(async (req, res) => {
  const userIdToDeleteParam = req.params.id;
  const adminUserId = req.user.id; // ID of the admin performing the action

  console.log(
    `ADMIN API: adminDeleteUser request for User ${userIdToDeleteParam} by Admin ${adminUserId}`
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
      .json({ success: false, message: "Invalid User ID provided." });
  }

  // Critical check: Prevent admin from deleting their own account
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

    // --- IMPORTANT ---
    // Add logic here BEFORE destroying the user if you need to handle their associated data:
    // - Reassign ownership of projects/documents?
    // - Anonymize posts/comments?
    // - Delete related records (if CASCADE delete is not set up or not desired)?
    // Example: await Project.update({ ownerId: null }, { where: { ownerId: userIdToDelete } });
    console.log(
      `ADMIN: Preparing to delete user ${userIdToDelete} (${user.username}). Performing pre-delete actions if any...`
    );
    // --- END IMPORTANT ---

    await user.destroy(); // This will permanently delete the user record. Triggers model hooks/CASCADE deletes if configured.

    console.log(
      `Admin ${adminUserId} successfully deleted user ${userIdToDelete} (${user.username}).`
    );

    res.status(200).json({
      // OK or 204 No Content could also be used
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error(`Admin Error deleting user ${userIdToDeleteParam}:`, error);
    // Check if the error is related to foreign key constraints (if deletion was blocked)
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

// No need for a final export {} block when using 'export const' for each function.
