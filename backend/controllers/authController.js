import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
// controllers/authController.js
import db from "../models/index.js"; // Import the entire db object

const { User } = db; // Destructure User from db

// Your existing logic here

// Token generation helper (no changes needed)
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "fallback_secret_key_for_dev_only"; // Ensure fallback for safety
  return jwt.sign({ id: user.id, role: user.role }, secret, {
    expiresIn: process.env.JWT_EXPIRATION || "7d",
  });
};

// --- EDITED User Registration ---
// Creates user as 'pending', does NOT return token
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, ...otherData } = req.body;

  console.log("Registration attempt:", { username, email, role });

  if (role && role.toLowerCase() === "admin") {
    res.status(403);
    throw new Error("Admin registration via API is not permitted.");
  }
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Username, email, and password are required");
  }
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    res.status(400);
    throw new Error("Email already in use");
  }

  // Create User - status defaults to 'pending' via model
  const user = await User.create({
    username,
    email,
    password,
    role: role || "user",
    ...otherData, // Save other signup form data
  });

  console.log(
    `New user registered (pending approval): ID=${user.id}, Email=${email}`
  );

  // Send Success Response (No Token)
  res.status(201).json({
    success: true,
    message: "Registration successful! Your account is pending admin approval.",
  });
});

// --- EDITED User Login ---
// Checks status IS 'approved' before returning token
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials"); // Use 401 for failed login attempts
  }

  // ---> Check Approval Status <---
  if (user.status !== "approved") {
    let statusMessage = "Login failed. Account not active.";
    switch (
      user.status // Provide specific feedback
    ) {
      case "pending":
        statusMessage = "Account is pending admin approval.";
        break;
      case "rejected":
        statusMessage = "Account registration was rejected.";
        break;
      case "suspended":
        statusMessage = "Account has been suspended.";
        break;
    }
    console.warn(`Login blocked for user ${email}. Status: ${user.status}`);
    res.status(403); // 403 Forbidden - Authenticated but not authorized to proceed
    throw new Error(statusMessage);
  }
  // ---> End Status Check <---

  // If approved, proceed
  const token = generateToken(user);
  console.log(
    `User login successful: ID=${user.id}, Role=${user.role}, Status=${user.status}`
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

// --- Admin login ---
// Checks role IS 'admin', DOES NOT check status
export const loginAdminUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials"); // Use 401
  }

  // Check if the user HAS the 'admin' role
  if (user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied. Admins only.");
  }

  // --- No status check here for admin login endpoint ---
  // Admins can log in regardless of status via this specific route,
  // assuming their role is 'admin' and password is correct.
  // Database record should still ideally be 'approved'.

  console.log(`Admin login successful: ID=${user.id}, Email=${email}`);
  res.status(200).json({
    success: true,
    message: "Admin login successful",
    token: generateToken(user),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

// --- Get logged-in user profile ---
// (Might add status check here later if needed)
export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(404);
    throw new Error("User not found (from token)");
  }
  // Optional: Check status even for logged-in user on profile fetch
  // if (req.user.status !== 'approved') {
  //     res.status(403); throw new Error("Account is not currently active.");
  // }
  res.json({ success: true, data: req.user }); // req.user excludes password from middleware
});

// --- Get all users (Admin-only) ---
// Includes status field
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: [
      "id",
      "username",
      "email",
      "role",
      "createdAt",
      "status" /* other fields */,
    ],
    order: [["createdAt", "DESC"]],
    // Consider adding where clause if needed, e.g., where: { status: 'approved' }
  });
  res.status(200).json({ success: true, count: users.length, data: users });
});

// --- NEW CONTROLLERS for Admin Approval ---

/**
 * @desc    Get users pending approval
 * @route   GET /api/auth/admin/users/pending
 * @access  Private/Admin
 */
export const getPendingUsers = asyncHandler(async (req, res) => {
  const pendingUsers = await User.findAll({
    where: { status: "pending" },
    attributes: ["id", "username", "email", "role", "createdAt", "status"],
    order: [["createdAt", "ASC"]],
  });
  res
    .status(200)
    .json({ success: true, count: pendingUsers.length, data: pendingUsers });
});

/**
 * @desc    Update user status (approve/reject/suspend)
 * @route   PATCH /api/auth/admin/users/:userId/status
 * @access  Private/Admin
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { userId } = req.params; // Get userId from route parameters

  const allowedStatuses = ["approved", "rejected", "suspended", "pending"];
  if (!status || !allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error(
      `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`
    );
  }

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Prevent admin changing own status via this route
  if (user.id.toString() === req.user.id.toString()) {
    // Ensure type comparison if needed
    res.status(400);
    throw new Error("Admins cannot change their own status via this endpoint.");
  }

  // Update status and save
  user.status = status;
  await user.save();

  console.log(
    `Admin ${req.user.email} updated status of user ${user.email} (ID: ${userId}) to ${status}`
  );
  // TODO: Add email notification logic here if desired

  res.status(200).json({
    success: true,
    message: `User "${user.username}" status updated to ${status}.`,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});
