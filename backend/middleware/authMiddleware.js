// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import db from "../models/index.js";
const { User } = db;

const JWT_SECRET = process.env.JWT_SECRET || "your_fallback_secret";

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Authentication error:", error.message);
      let message = "Not authorized";
      if (error.name === "TokenExpiredError") message = "Token expired";
      if (error.name === "JsonWebTokenError") message = "Invalid token";

      return res.status(401).json({
        success: false,
        message,
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "No authorization token",
    });
  }
};

// Middleware for admin-only access
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }

  if (req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
};

// Make sure to export both middleware functions
export default {
  protect,
  adminOnly,
};
