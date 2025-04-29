// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import bcrypt from "bcryptjs"; // Needed for password update
import { Op } from "sequelize";

const { User } = db; // Destructure User model (ensure it's loaded in models/index.js)

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
 * @access  Public (or Private based on route middleware)
 */
export const getUserPublicProfile = asyncHandler(async (req, res) => {
  // --- Logging Input ---
  console.log("[getUserPublicProfile] req.params:", req.params);
  // --- *** Access using ':userId' from the route definition *** ---
  const userIdParam = req.params.userId;
  // ---------------------------------------------------------------
  console.log(
    `[getUserPublicProfile] Received ID param: ${userIdParam} (type: ${typeof userIdParam})`
  );

  // --- Validation ---
  const userId = parseInt(userIdParam, 10);
  console.log(`[getUserPublicProfile] Parsed userId: ${userId}`);
  console.log(`[getUserPublicProfile] isNaN(userId): ${isNaN(userId)}`);
  console.log(`[getUserPublicProfile] userId <= 0: ${userId <= 0}`);

  if (isNaN(userId) || userId <= 0) {
    console.error(
      `[getUserPublicProfile] Validation FAILED for param: ${userIdParam}, parsed: ${userId}`
    );
    res.status(400); // Set Bad Request status
    throw new Error("Invalid user ID format provided."); // Throw error
  }
  // --- End Validation ---

  try {
    console.log(
      `[getUserPublicProfile] Finding user with parsed ID: ${userId}`
    );
    if (!User) throw new Error("User model not loaded correctly."); // Sanity check

    const user = await User.findByPk(userId, {
      attributes: publicProfileFields, // Select only public fields
    });

    if (!user) {
      console.log(`[getUserPublicProfile] User not found for ID: ${userId}`);
      res.status(404); // Set Not Found status
      throw new Error("User not found."); // Throw error
    }

    console.log(`[getUserPublicProfile] User found: ${user.username}`);
    res.status(200).json({ success: true, data: user }); // Send success response
  } catch (error) {
    // Catch errors from findByPk or manually thrown errors (400, 404)
    console.error(
      `[getUserPublicProfile] Error fetching user ${userId}:`,
      error
    );
    const statusCode = res.statusCode >= 400 ? res.statusCode : 500; // Use existing status or default to 500
    const message = error.message || "Server error fetching profile."; // Use specific error message
    if (!res.headersSent) {
      // Avoid sending headers twice if error was thrown before DB call
      res.status(statusCode).json({ success: false, message: message });
    }
  }
});

// --- Protected User 'Me' Route Controllers ---
/**
 * @desc    Update own user profile (non-sensitive fields)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
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
  const updateData = {};
  // Add fields to updateData only if they are present in the request body
  if (username !== undefined) updateData.username = username.trim();
  if (university !== undefined) updateData.university = university;
  if (department !== undefined) updateData.department = department;
  if (companyName !== undefined) updateData.companyName = companyName;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
  if (medicalSpecialty !== undefined)
    updateData.medicalSpecialty = medicalSpecialty;
  if (hospitalName !== undefined) updateData.hospitalName = hospitalName;
  if (profilePictureUrl !== undefined)
    updateData.profilePictureUrl = profilePictureUrl; // Add validation if needed
  if (bio !== undefined) updateData.bio = bio;

  if (Object.keys(updateData).length === 0) {
    res.status(400);
    throw new Error("No valid profile fields provided for update.");
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404);
      throw new Error("User not found for update.");
    } // Should not happen if authenticated

    await user.update(updateData);
    console.log(`User ${userId} profile updated successfully.`);

    // Fetch updated user data excluding password
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
        .json({ success: false, message: "Username or email already taken." });
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message).join(". "),
      });
    } else {
      const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error updating profile.",
      });
    }
  }
});

/**
 * @desc    Update own user email (might require re-verification)
 * @route   PUT /api/users/me/email
 * @access  Private
 */
export const updateUserEmail = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { email, currentPassword } = req.body;
  console.log(`API: updateUserEmail invoked for User ${userId}`);
  if (!User) throw new Error("User model not loaded.");

  if (!email || !currentPassword) {
    res.status(400);
    throw new Error("New email and current password are required.");
  }
  // Add basic email format validation if needed
  if (!/\S+@\S+\.\S+/.test(email)) {
    res.status(400);
    throw new Error("Invalid email format.");
  }

  try {
    const user = await User.scope("withPassword").findByPk(userId); // Scope needed to fetch password
    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    const isMatch = await user.matchPassword(currentPassword); // Assumes matchPassword method exists on User model
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

    // Check if new email is already taken by another user
    const existingUserWithEmail = await User.findOne({
      where: { email: email },
    });
    if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
      res.status(400);
      throw new Error("Email address already in use by another account.");
    }

    // Update email (and potentially status if verification is needed)
    await user.update({
      email: email /*, status: 'pending_email_verification' */,
    });
    console.log(`User ${userId} email updated to ${email}.`);

    // TODO: Trigger email verification logic if required by your application flow

    res
      .status(200)
      .json({ success: true, message: "Email update request processed." }); // Adjust message based on verification flow
  } catch (error) {
    console.error(`Error updating email for User ${userId}:`, error);
    // Catch potential unique constraint error during update itself (though checked above)
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
    throw new Error("Current and new passwords are required.");
  }
  // Add password complexity checks here if desired (e.g., length, characters)
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters.");
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
      throw new Error("Incorrect current password.");
    }

    // Assigning to password field triggers 'beforeSave' hook in model to hash it
    user.password = newPassword;
    await user.save(); // Triggers hook and saves
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

/**
 * @desc    Get users suitable for selection (e.g., collaborators)
 * @route   GET /api/users/selectable
 * @access  Private (Logged-in users)
 */
export const getSelectableUsers = asyncHandler(async (req, res) => {
  console.log(`API: getSelectableUsers invoked by User ${req.user.id}`);
  if (!User) {
    return res
      .status(500)
      .json({ success: false, message: "User model not loaded." });
  }
  try {
    const users = await User.findAll({
      where: {
        status: "approved", // Only find active/approved users
        id: { [Op.ne]: req.user.id }, // Exclude the user making the request
      },
      attributes: selectableUserFields, // Select only id, username, email
      order: [["username", "ASC"]],
    });
    res.status(200).json({ success: true, data: users }); // Return array under 'data'
  } catch (error) {
    console.error(
      `Error fetching selectable users for User ${req.user.id}:`,
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user list." });
  }
});

// --- Admin User Route Controllers ---
// These functions are assumed to be called by routes protected by adminOnly middleware

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
    const where = {};
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

/**
 * @desc    Get a single user's details by ID (Admin only)
 * @route   GET /api/admin/users/:id (Example route)
 * @access  Private/Admin
 */
export const adminGetUserById = asyncHandler(async (req, res) => {
  const userIdParam = req.params.id; // Assumes parameter is :id
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
    res.status(200).json({ success: true, data: user }); // Return under 'data'
  } catch (error) {
    console.error(`Admin Error fetching user ${userIdParam}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user details." });
  }
});

/**
 * @desc    Update a user's status (e.g., approve/reject/suspend) (Admin only)
 * @route   PATCH /api/admin/users/:id/status (Example route)
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
    console.log(
      `ADMIN: Preparing to save user ${user.id} with status ${status}`
    );
    await user.save();
    console.log(
      `ADMIN: Successfully saved user ${user.id} with status ${status}`
    );
    // TODO: Notify user of status change?
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

/**
 * @desc    Update a user's role (Admin only)
 * @route   PATCH /api/admin/users/:id/role (Example route)
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
    // Add check: Prevent admin from changing own role? Prevent demoting last admin?
    if (userId === req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot change own role." });
    }
    user.role = role;
    await user.save();
    console.log(`Admin updated role for user ${userId} to ${role}`);
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

/**
 * @desc    Delete a user (Admin only)
 * @route   DELETE /api/admin/users/:id (Example route)
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
    // TODO: Add logic here to handle user's associated data before deletion if necessary
    // (e.g., reassign projects, delete messages, etc. based on your application rules)
    await user.destroy(); // Triggers hooks/CASCADE if set up
    console.log(
      `Admin ${adminUserId} deleted user ${userIdToDelete} (${user.username}).`
    );
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

// No need for a final export {} block when using export const for each function
