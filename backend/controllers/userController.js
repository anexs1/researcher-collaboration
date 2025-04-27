// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize"; // Import Op for admin search if needed

const { User } = db;

// --- Helper: Fields Safe for Public/Admin Views ---
const publicUserFields = [
  /* ... as defined before ... */
];
// Define fields specifically for Admin view (might include more than public)
const adminUserListFields = [
  "id",
  "username",
  "email",
  "role",
  "status",
  "createdAt",
  "updatedAt",
  // Add other relevant fields for admin list view
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
  // Avoid sending password even to admin unless absolutely necessary and handled securely
];

// --- Public User Route Controller ---
/** @desc Get public profile of a user by ID ... */
export const getUserPublicProfile = asyncHandler(async (req, res) => {
  /* ... code from previous full version ... */
});

// --- Protected User 'Me' Route Controllers ---
/** @desc Update own user profile ... */
export const updateUserProfile = asyncHandler(async (req, res) => {
  /* ... code from previous full version ... */
});
/** @desc Update own user email ... */
export const updateUserEmail = asyncHandler(async (req, res) => {
  /* ... code from previous full version ... */
});
/** @desc Update own user password ... */
export const updateUserPassword = asyncHandler(async (req, res) => {
  /* ... code from previous full version ... */
});

// --- !!! ADDED/UNCOMMENTED ADMIN CONTROLLERS !!! ---

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const adminGetAllUsers = asyncHandler(async (req, res) => {
  console.log("--- ENTERING adminGetAllUsers ---");
  if (!User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: User model not loaded.",
    });
  }
  try {
    // Optional: Add pagination and filtering for admin view
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
        .json({ success: false, message: "Invalid pagination parameters." });
    }
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: adminUserListFields, // Use admin-specific fields
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
      distinct: true,
    });

    console.log(`Admin fetched ${count} users total.`);
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      data: users,
    });
  } catch (error) {
    console.error("Admin Error fetching all users:", error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
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
  console.log("--- ENTERING adminGetPendingUsers ---");
  if (!User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: User model not loaded.",
    });
  }
  try {
    const pendingUsers = await User.findAll({
      where: { status: "pending" },
      attributes: adminUserListFields, // Or specific fields for pending review
      order: [["createdAt", "ASC"]], // Show oldest pending first
    });
    res
      .status(200)
      .json({ success: true, count: pendingUsers.length, data: pendingUsers });
  } catch (error) {
    console.error("Admin Error fetching pending users:", error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
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
  const userId = req.params.id;
  console.log(`--- ENTERING adminGetUserById for User ID: ${userId} ---`);
  if (!User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: User model not loaded.",
    });
  }
  try {
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID." });
    }

    // Use admin detail fields, still excluding password via defaultScope implicitly
    const user = await User.findByPk(parsedUserId, {
      attributes: adminUserDetailFields,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(`Admin Error fetching user ${userId}:`, error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user." });
  }
});

/**
 * @desc    Update a user's status (e.g., approve/reject/suspend) (Admin only)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private/Admin
 */
export const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body; // Expecting { "status": "approved" } etc.
  console.log(
    `--- ENTERING adminUpdateUserStatus for User ID: ${userId} to status: ${status} ---`
  );
  if (!User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: User model not loaded.",
    });
  }

  // Validate input status
  const validStatuses = User.getAttributes().status.values; // Get ENUM values
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }
  const parsedUserId = parseInt(userId);
  if (isNaN(parsedUserId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }

  try {
    const user = await User.findByPk(parsedUserId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.status === status) {
      return res.status(200).json({
        success: true,
        message: `User status is already '${status}'.`,
        data: user,
      });
    } // No change needed

    user.status = status;
    await user.save();
    console.log(`Admin updated status for user ${userId} to ${status}`);
    // TODO: Send notification email to user?

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}.`,
      data: user,
    });
  } catch (error) {
    console.error(`Admin Error updating status for user ${userId}:`, error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
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
  const userId = req.params.id;
  const { role } = req.body; // Expecting { "role": "admin" } etc.
  console.log(
    `--- ENTERING adminUpdateUserRole for User ID: ${userId} to role: ${role} ---`
  );
  if (!User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: User model not loaded.",
    });
  }

  // Validate input role
  const validRoles = User.getAttributes().role.values; // Get ENUM values
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    });
  }
  const parsedUserId = parseInt(userId);
  if (isNaN(parsedUserId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }

  try {
    const user = await User.findByPk(parsedUserId);
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

    user.role = role;
    await user.save();
    console.log(`Admin updated role for user ${userId} to ${role}`);

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: user,
    });
  } catch (error) {
    console.error(`Admin Error updating role for user ${userId}:`, error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
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
  const userIdToDelete = req.params.id;
  const adminUserId = req.user.id; // Admin performing the action
  console.log(
    `--- ENTERING adminDeleteUser for User ID: ${userIdToDelete} by Admin: ${adminUserId} ---`
  );
  if (!User) {
    return res.status(500).json({
      success: false,
      message: "Server config error: User model not loaded.",
    });
  }

  const parsedUserIdToDelete = parseInt(userIdToDelete);
  if (isNaN(parsedUserIdToDelete)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID." });
  }

  // Prevent admin from deleting themselves
  if (parsedUserIdToDelete === adminUserId) {
    return res.status(400).json({
      success: false,
      message: "Admin cannot delete their own account.",
    });
  }

  try {
    const user = await User.findByPk(parsedUserIdToDelete);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    await user.destroy(); // Triggers hooks and potential CASCADE deletes
    console.log(`Admin ${adminUserId} deleted user ${userIdToDelete}`);

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error(`Admin Error deleting user ${userIdToDelete}:`, error);
    if (error.original) {
      console.error("Original DB Error:", error.original);
    }
    res
      .status(500)
      .json({ success: false, message: "Server error deleting user." });
  }
});
