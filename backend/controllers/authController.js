import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

// Token generation helper
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file!");
  }
  return jwt.sign(
    { id: user.id, role: user.role },
    secret || "fallback_secret_key_for_dev_only",
    { expiresIn: process.env.JWT_EXPIRATION || "7d" }
  );
};

// User registration
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    console.log("Registration attempt:", { username, email, role });

    if (role && role.toLowerCase() === "admin") {
      console.warn(
        `Signup attempt with admin role blocked for email: ${email}`
      );
      return res.status(403).json({
        success: false,
        message:
          "Admin registration via API is not permitted. Admins must be created manually.",
      });
    }

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: "user",
    });

    console.log("New 'user' role created via API with ID:", user.id);

    const token = generateToken(user);

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed due to a server error.",
      error: error.message,
    });
  }
};

// User login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);
    console.log(`User login successful: ID=${user.id}, Role=${user.role}`);

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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// Admin login (for admin panel only)
export const loginAdminUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  if (user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied. Admins only.");
  }

  res.status(200).json({
    success: true,
    message: "Admin login successful",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token: generateToken(user), // <-- fixed this to pass the whole user
  });
});

// Get logged-in user profile
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving user profile",
      error: error.message,
    });
  }
};
