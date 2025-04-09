// File: backend/controllers/userController.js

import db from "../models/index.js";
const { User /* other models if needed */ } = db;
import { Op } from "sequelize";
// Import bcrypt if you need password handling (though admin shouldn't set passwords directly maybe)
// import bcrypt from 'bcryptjs';

// --- Keep any existing non-admin User functions (like get own profile) ---
// export const getUserProfile = async (req, res) => { ... };
// export const updateUserProfile = async (req, res) => { ... };
// --- End Existing ---

// --- Admin User Management Controllers ---

// GET /api/admin/users - List all users for admin
export const adminGetAllUsers = async (req, res) => {
  try {
    const {
      search,
      role, // Filter by role ('admin', 'user', etc.)
      status, // Filter by status ('active', 'pending', 'suspended') - Assuming you have a status field
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 15,
    } = req.query;

    let whereClause = {};
    let orderClause = [];

    // Filtering
    if (role) whereClause.role = role;
    if (status) whereClause.status = status; // Add this if User model has 'status'
    if (search) {
      const searchPattern = `%${search}%`;
      whereClause[Op.or] = [
        { username: { [Op.like]: searchPattern } },
        { email: { [Op.like]: searchPattern } },
        { name: { [Op.like]: searchPattern } }, // Assuming 'name' field exists
      ];
    }

    // Sorting
    if (
      ["username", "email", "name", "createdAt", "role", "status"].includes(
        sortBy
      )
    ) {
      orderClause.push([sortBy, sortOrder === "asc" ? "ASC" : "DESC"]);
    } else {
      orderClause.push(["createdAt", "DESC"]); // Default
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters." });
    }
    const offset = (pageNum - 1) * limitNum;

    // Execution
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: limitNum,
      offset: offset,
      attributes: { exclude: ["password"] }, // IMPORTANT: Exclude password hash
      distinct: true,
    });

    const pagination = {
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    };

    res.status(200).json({
      success: true,
      data: {
        users: rows, // Send user list
        pagination: pagination,
      },
    });
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching users for admin",
      error: error.message,
    });
  }
};

// GET /api/admin/users/:id - Get single user details by ID
export const adminGetUserById = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] }, // Exclude password
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user by ID for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching user",
      error: error.message,
    });
  }
};

// PUT /api/admin/users/:id/status - Update user status (example: approve, suspend)
export const adminUpdateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Expecting status like 'active', 'suspended', 'pending'

  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }
  // Add validation for the status field if needed
  const validStatuses = ["active", "pending", "suspended"]; // Example valid statuses
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status provided. Must be one of: ${validStatuses.join(
        ", "
      )}`,
    });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Optional: Prevent admin from changing their own status or other critical admins?
    // if (user.id === req.user.id) { return res.status(403)... }

    user.status = status; // Assuming 'status' field exists on User model
    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: `User status updated to ${status}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user status by admin:", error);
    res.status(500).json({
      success: false,
      message: "Server Error updating user status",
      error: error.message,
    });
  }
};

// PUT /api/admin/users/:id/role - Update user role
export const adminUpdateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // Expecting role like 'admin', 'user'

  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }
  const validRoles = ["admin", "user"]; // Define valid roles
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role provided. Must be one of: ${validRoles.join(
        ", "
      )}`,
    });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Critical: Prevent admin from accidentally removing their own admin role?
    // Or ensure at least one admin always exists? Add safety checks!
    if (
      user.id === req.user.id &&
      req.user.role === "admin" &&
      role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot remove your own admin role.",
      });
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role by admin:", error);
    res.status(500).json({
      success: false,
      message: "Server Error updating user role",
      error: error.message,
    });
  }
};

// DELETE /api/admin/users/:id - Delete a user
export const adminDeleteUser = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Critical: Prevent deleting own account or other admins?
    if (user.id === req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot delete your own account." });
    }
    // if (user.role === 'admin') {
    //     return res.status(403).json({ success: false, message: "Cannot delete another admin account." });
    // }

    const deletedCount = await User.destroy({ where: { id: id } });

    if (deletedCount > 0) {
      res.status(200).json({
        success: true,
        message: "User deleted successfully by admin.",
      });
    } else {
      // Should be caught by findByPk earlier, but good practice
      res
        .status(404)
        .json({ success: false, message: "User not found or delete failed." });
    }
  } catch (error) {
    console.error("Error deleting user by admin:", error);
    // Handle potential foreign key constraints if needed
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Add these exports to your userController.js exports if managed manually
// export { ..., adminGetAllUsers, adminGetUserById, adminUpdateUserStatus, adminUpdateUserRole, adminDeleteUser };
