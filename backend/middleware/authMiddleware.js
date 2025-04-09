// File: backend/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
// Adjust the User import based on your models setup
// Option 1: If models/index.js exports db = { User, ... }
import db from "../models/index.js";
const { User } = db;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET is not defined in environment variables."
  );
  process.exit(1);
}

// Ensure this is exported exactly as 'protect'
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] }, // Exclude password
      });

      if (!user) {
        // Use 401 for consistency with other auth errors
        return res.status(401).json({
          success: false,
          message: "Authentication failed: User not found",
        });
      }

      // Add status check if needed
      // if (user.status === 'pending') return res.status(403)...

      req.user = user;
      next();
    } catch (error) {
      console.error("JWT verification failed:", error.message);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Authentication failed: Token expired.",
        });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Authentication failed: Invalid token.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
        error: error.message,
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Authentication required: No token provided",
    });
  }
};

// Ensure this is exported exactly as 'adminOnly'
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    // Ensure req.user exists from 'protect' running first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required (User not found before admin check).",
      });
    }
    // If user exists but is not admin
    res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }
};
