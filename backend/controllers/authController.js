// backend/controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Import the database object

const { User } = db; // Destructure the User model

// Helper function to generate JWT
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "fallback_secret_key_for_dev_only"; // Use environment variable with fallback
  // Include role in the token payload for easy access control
  return jwt.sign({ id: user.id, role: user.role }, secret, {
    expiresIn: process.env.JWT_EXPIRATION || "7d", // Use environment variable with fallback
  });
};

// --- User Registration ---
// Creates user as 'pending', requires admin approval
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, ...otherData } = req.body;

  console.log("Registration attempt:", { username, email, role });

  // Prevent self-assigning admin role during public registration
  if (role && role.toLowerCase() === "admin") {
    res.status(403).json({
      success: false,
      message: "Admin registration via API is not permitted.",
    });
    return;
  }
  // Basic validation
  if (!username || !email || !password) {
    res.status(400).json({
      success: false,
      message: "Username, email, and password are required",
    });
    return;
  }

  // Check if email already exists (case-insensitive)
  const existingUser = await User.findOne({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    res.status(400).json({ success: false, message: "Email already in use" });
    return;
  }

  try {
    // Create User - status defaults to 'pending' via model
    const user = await User.create({
      username,
      email: email.toLowerCase(), // Store consistently
      password, // Hashing happens in the model's beforeSave hook
      role: role || "user", // Default to 'user' if not provided
      ...otherData, // Save other relevant signup form data (make sure keys match model fields)
    });

    console.log(
      `New user registered (pending approval): ID=${user.id}, Email=${user.email}`
    );

    // Send Success Response (No Token - requires approval)
    res.status(201).json({
      success: true,
      message:
        "Registration successful! Your account is pending admin approval.",
      // Do NOT return user data or token here
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        success: false,
        message: error.errors ? error.errors[0].message : "Validation Error",
      });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Server error during registration." });
    }
  }
});

// --- User Login ---
// Authenticates, checks if status is 'approved', returns token and user data
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res
      .status(400)
      .json({ success: false, message: "Email and password required" });
    return;
  }

  // Fetch user using the 'withPassword' scope to include the password hash
  const user = await User.scope("withPassword").findOne({
    where: { email: email.toLowerCase() },
  });

  // Check if user exists and if the password matches using the correct model method
  // --- CORRECTED METHOD NAME ---
  if (!user || !(await user.matchPassword(password))) {
    // Use matchPassword
    res
      .status(401)
      .json({ success: false, message: "Invalid email or password" }); // Generic error
    return;
  }

  // Check Approval Status - User must be 'approved' to log in
  if (user.status !== "approved") {
    let statusMessage = "Login failed. Account not active.";
    switch (user.status) {
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
    res.status(403).json({ success: false, message: statusMessage }); // 403 Forbidden
    return;
  }

  // If credentials are valid and status is approved, generate token
  const token = generateToken(user);
  console.log(
    `User login successful: ID=${user.id}, Role=${user.role}, Status=${user.status}`
  );

  // Return token and public user data (password excluded by default scope)
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email, // Consider if email should always be returned
      role: user.role,
      status: user.status,
      // Add other non-sensitive fields the frontend might need immediately
      university: user.university,
      department: user.department,
      companyName: user.companyName,
      jobTitle: user.jobTitle,
      medicalSpecialty: user.medicalSpecialty,
      hospitalName: user.hospitalName,
      bio: user.bio,
      profilePictureUrl: user.profilePictureUrl,
      // etc. based on your `publicUserFields` concept
    },
  });
});

// --- Admin login ---
// Authenticates, checks if role is 'admin', DOES NOT check status
export const loginAdminUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res
      .status(400)
      .json({ success: false, message: "Email and password required" });
    return;
  }

  // Fetch user using the 'withPassword' scope
  const user = await User.scope("withPassword").findOne({
    where: { email: email.toLowerCase() },
  });

  // Check credentials using the correct model method
  // --- CORRECTED METHOD NAME ---
  if (!user || !(await user.matchPassword(password))) {
    // Use matchPassword
    res
      .status(401)
      .json({ success: false, message: "Invalid email or password" }); // Generic error
    return;
  }

  // Check if the user HAS the 'admin' role
  if (user.role !== "admin") {
    console.warn(
      `Non-admin login attempt blocked for ${email} on admin endpoint.`
    );
    res.status(403).json({
      success: false,
      message: "Access denied. Not an administrator.",
    });
    return;
  }

  // Admins bypass status check *on this specific endpoint*
  // (Their status should ideally still be 'approved' in the DB for consistency)

  const token = generateToken(user);
  console.log(`Admin login successful: ID=${user.id}, Email=${email}`);
  res.status(200).json({
    success: true,
    message: "Admin login successful",
    token: token,
    user: {
      // Return relevant admin user data
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

// --- Get logged-in user profile ---
// Uses the user data attached by the 'protect' middleware
export const getMe = asyncHandler(async (req, res) => {
  // req.user is populated by 'protect' middleware after verifying token
  // It should already use the default scope (excluding password)
  if (!req.user) {
    // This case implies the 'protect' middleware failed or didn't attach the user
    res.status(401).json({
      success: false,
      message: "Not authorized or user data missing.",
    });
    return;
  }

  // Optional: You could re-fetch from DB if you need the absolute latest data
  // const freshUser = await User.findByPk(req.user.id);
  // if (!freshUser) {
  //   res.status(404).json({ success: false, message: "User not found." });
  //   return;
  // }
  // res.json({ success: true, data: freshUser });

  // Usually, returning req.user is sufficient
  res.json({ success: true, data: req.user });
});

// --- Admin User Management Controllers ---
// Note: These ideally belong in a separate adminController.js and adminRoutes.js

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/admin/users (Example Route - adjust actual route)
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  // Example attributes - adjust based on what admin needs
  const users = await User.findAll({
    attributes: [
      "id",
      "username",
      "email",
      "role",
      "createdAt",
      "updatedAt",
      "status",
      "university",
      "department",
      "companyName",
      "jobTitle",
      "medicalSpecialty",
      "hospitalName",
    ],
    order: [["createdAt", "DESC"]],
    // Consider adding pagination here for large user bases
  });
  res.status(200).json({ success: true, count: users.length, data: users });
});

/**
 * @desc    Get users pending approval (Admin only)
 * @route   GET /api/admin/users/pending (Example Route - adjust actual route)
 * @access  Private/Admin
 */
export const getPendingUsers = asyncHandler(async (req, res) => {
  const pendingUsers = await User.findAll({
    where: { status: "pending" },
    // Select fields relevant for the approval decision
    attributes: [
      "id",
      "username",
      "email",
      "role",
      "createdAt",
      "status",
      "university",
      "department",
      "companyName",
      "jobTitle",
      "medicalSpecialty",
      "hospitalName",
    ],
    order: [["createdAt", "ASC"]], // Show oldest first
  });
  res
    .status(200)
    .json({ success: true, count: pendingUsers.length, data: pendingUsers });
});

/**
 * @desc    Update user status (approve/reject/suspend) (Admin only)
 * @route   PATCH /api/admin/users/:userId/status (Example Route - adjust actual route)
 * @access  Private/Admin
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { userId } = req.params;

  const allowedStatuses = ["approved", "rejected", "suspended", "pending"]; // Include 'pending' if admins can revert
  if (!status || !allowedStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
    });
    return;
  }
  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({
      success: false,
      message: "Valid User ID parameter is required.",
    });
    return;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  // Prevent admin changing own status via this route for safety
  if (user.id.toString() === req.user.id.toString()) {
    res.status(400).json({
      success: false,
      message: "Admins cannot change their own status via this endpoint.",
    });
    return;
  }

  // Update status and save
  try {
    user.status = status;
    await user.save();

    console.log(
      `Admin ${req.user.email} updated status of user ${user.email} (ID: ${userId}) to ${status}`
    );
    // TODO: Add email notification logic here (e.g., send approval/rejection email)

    // Return limited data of the updated user
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
  } catch (error) {
    console.error(`Admin Error Updating Status for ${userId}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating status." });
  }
});
