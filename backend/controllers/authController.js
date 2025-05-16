import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import db from "../models/index.js"; // Import the database object

const { User } = db; // Destructure the User model

// Helper function to generate JWT
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "fallback_secret_key_for_dev_only";
  return jwt.sign({ id: user.id, role: user.role }, secret, {
    expiresIn: process.env.JWT_EXPIRATION || "7d",
  });
};

// Fields to be returned for user profile related endpoints
const userProfileAttributes = [
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
  // Add any other fields the profile page might display
  // 'skillsNeeded' would be here if you had it
];

// --- User Registration ---
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, ...otherData } = req.body;

  // console.log("Registration attempt:", { username, email, role });

  if (role && role.toLowerCase() === "admin") {
    res.status(403).json({
      success: false,
      message: "Admin registration via API is not permitted.",
    });
    return;
  }
  if (!username || !email || !password) {
    res.status(400).json({
      success: false,
      message: "Username, email, and password are required",
    });
    return;
  }

  const existingUser = await User.findOne({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    res.status(400).json({ success: false, message: "Email already in use" });
    return;
  }

  try {
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: role || "user",
      status: "pending", // Explicitly set, though model might have default
      ...otherData,
    });

    // console.log(`New user registered (pending approval): ID=${user.id}, Email=${user.email}`);
    res.status(201).json({
      success: true,
      message:
        "Registration successful! Your account is pending admin approval.",
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
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res
      .status(400)
      .json({ success: false, message: "Email and password required" });
    return;
  }

  const userWithPassword = await User.scope("withPassword").findOne({
    where: { email: email.toLowerCase() },
  });

  if (!userWithPassword || !(await userWithPassword.matchPassword(password))) {
    res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
    return;
  }

  if (userWithPassword.status !== "approved") {
    let statusMessage = "Login failed. Account not active.";
    switch (userWithPassword.status) {
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
    // console.warn(`Login blocked for user ${email}. Status: ${userWithPassword.status}`);
    res.status(403).json({ success: false, message: statusMessage });
    return;
  }

  const token = generateToken(userWithPassword);
  // console.log(`User login successful: ID=${userWithPassword.id}, Role=${userWithPassword.role}, Status=${userWithPassword.status}`);

  // Fetch the user again but with selected attributes for the response
  const userForResponse = await User.findByPk(userWithPassword.id, {
    attributes: userProfileAttributes,
  });

  if (!userForResponse) {
    // Should not happen if login was successful
    console.error(
      `User ${userWithPassword.id} logged in but not found for response construction.`
    );
    return res.status(500).json({
      success: false,
      message: "Error fetching user details post-login.",
    });
  }

  res.json({
    success: true,
    token,
    user: userForResponse, // Send the user object with selected attributes
  });
});

// --- Admin login ---
export const loginAdminUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res
      .status(400)
      .json({ success: false, message: "Email and password required" });
    return;
  }

  const user = await User.scope("withPassword").findOne({
    where: { email: email.toLowerCase() },
  });

  if (!user || !(await user.matchPassword(password))) {
    res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
    return;
  }

  if (user.role !== "admin") {
    // console.warn(`Non-admin login attempt blocked for ${email} on admin endpoint.`);
    res.status(403).json({
      success: false,
      message: "Access denied. Not an administrator.",
    });
    return;
  }

  const token = generateToken(user);
  // console.log(`Admin login successful: ID=${user.id}, Email=${email}`);
  res.status(200).json({
    success: true,
    message: "Admin login successful",
    token: token,
    user: {
      // Send relevant admin user data
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

// --- Get logged-in user profile ---
export const getMe = asyncHandler(async (req, res) => {
  // req.user is populated by 'protect' middleware (should contain at least id and role)
  if (!req.user || !req.user.id) {
    // console.warn("[Backend getMe] No req.user or req.user.id found. Token might be invalid or protect middleware issue.");
    res.status(401).json({
      success: false,
      message: "Not authorized, token invalid, or user ID missing from token.",
    });
    return;
  }

  try {
    // Fetch the most up-to-date user information from the database
    // using the predefined userProfileAttributes.
    const freshUser = await User.findByPk(req.user.id, {
      attributes: userProfileAttributes,
    });

    if (!freshUser) {
      // console.warn(`[Backend getMe] User with ID ${req.user.id} from token not found in DB.`);
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    // console.log("[Backend getMe] Sending fresh user data from DB:", freshUser.toJSON());
    res.json({ success: true, data: freshUser }); // Send the fresh user data
  } catch (error) {
    console.error("[Backend getMe] Error fetching user profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching profile." });
  }
});

// --- Admin User Management Controllers (Kept for completeness, but focus is on getMe/loginUser) ---

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: userProfileAttributes, // Use consistent attributes
    order: [["createdAt", "DESC"]],
  });
  res.status(200).json({ success: true, count: users.length, data: users });
});

export const getPendingUsers = asyncHandler(async (req, res) => {
  const pendingUsers = await User.findAll({
    where: { status: "pending" },
    attributes: userProfileAttributes, // Use consistent attributes
    order: [["createdAt", "ASC"]],
  });
  res
    .status(200)
    .json({ success: true, count: pendingUsers.length, data: pendingUsers });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { userId } = req.params;

  const allowedStatuses = ["approved", "rejected", "suspended", "pending"];
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

  if (user.id.toString() === req.user.id.toString()) {
    res.status(400).json({
      success: false,
      message: "Admins cannot change their own status via this endpoint.",
    });
    return;
  }

  try {
    user.status = status;
    await user.save();
    // console.log(`Admin ${req.user.email} updated status of user ${user.email} (ID: ${userId}) to ${status}`);
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
