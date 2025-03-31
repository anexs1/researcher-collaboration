import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Token generation helper (keep as is)
const generateToken = (user) => {
  // Ensure JWT_SECRET is loaded, provide a fallback for safety but log a warning
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file!");
    // In a real app, you might want to throw an error or exit
  }
  return jwt.sign(
    { id: user.id, role: user.role },
    secret || "fallback_secret_key_for_dev_only", // Use loaded secret
    { expiresIn: process.env.JWT_EXPIRATION || "7d" } // Use expiration from env or default
  );
};

// User registration
export const registerUser = async (req, res) => {
  try {
    // Get potential role from request body along with other details
    const { username, email, password, role } = req.body;

    console.log("Registration attempt:", { username, email, role });

    // --- *** START: Prevent Admin Signup via API *** ---
    // Check if the role provided in the request is 'admin'
    if (role && role.toLowerCase() === "admin") {
      console.warn(
        `Signup attempt with admin role blocked for email: ${email}`
      );
      return res.status(403).json({
        // 403 Forbidden is appropriate
        success: false, // Maintain consistent response structure if using 'success' flag
        message:
          "Admin registration via API is not permitted. Admins must be created manually.",
      });
    }
    // --- *** END: Prevent Admin Signup via API *** ---

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Username, email, and password are required",
        });
    }

    // Check if user exists (keep as is)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Create user in DB, explicitly setting role to 'user'
    // The password hashing is handled by the Sequelize hook in User.js model
    const user = await User.create({
      username,
      email,
      password,
      role: "user", // *** Force role to 'user' for all API signups ***
    });

    console.log("New 'user' role created via API with ID:", user.id);

    const token = generateToken(user);

    // Prepare user data for response (exclude password)
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role, // This will be 'user' as forced above
      createdAt: user.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: "User registered successfully!", // Added success message
      data: {
        // Keep the nested data structure if preferred
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle Sequelize validation errors specifically (keep as is)
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

    // Handle other errors (e.g., database connection issues)
    return res.status(500).json({
      success: false,
      message: "Registration failed due to a server error.",
      error: error.message, // Provide error message for debugging
    });
  }
};

// User login (keep as is - it correctly returns the role from the DB)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Keep generic message for security
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Use the comparePassword method defined in the User model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Keep generic message for security
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);
    console.log(`User login successful: ID=${user.id}, Role=${user.role}`);

    res.json({
      success: true,
      token,
      user: {
        // Send user details back
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // Correctly sends the actual role from DB
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error during login",
        error: error.message,
      });
  }
};

// Get current user profile (keep as is)
export const getMe = async (req, res) => {
  try {
    // req.user is attached by the 'protect' middleware
    // Find by primary key, exclude password
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      // Should technically not happen if protect middleware worked, but good practice
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error retrieving user profile",
        error: error.message,
      });
  }
};
