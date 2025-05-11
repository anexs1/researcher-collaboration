// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Assuming this is your Sequelize entry point
const { User } = db; // Assuming User model is exported from db.User

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "CRITICAL ERROR: JWT_SECRET environment variable not set. Authentication will fail."
  );
  // process.exit(1); // Consider for production
}

export const protect = async (req, res, next) => {
  let token;
  // console.log("[Protect Middleware] Incoming Request Headers:", JSON.stringify(req.headers.authorization || "No Auth Header"));

  if (req.headers.authorization?.startsWith("Bearer ")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      // console.log("[Protect Middleware] Token extracted:", token);

      if (!JWT_SECRET) {
        console.error(
          "[Protect Middleware] JWT_SECRET is missing during request."
        );
        return res.status(500).json({
          success: false,
          message: "Internal server error: Auth configuration missing.",
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      // console.log(`[Protect Middleware] Token decoded:`, decoded);

      const user = await User.findByPk(decoded.id, {
        // VVVV --- CORRECTED ATTRIBUTES LIST --- VVVV
        attributes: [
          "id",
          "username",
          "email",
          // 'fullName', // REMOVED - column does not exist
          "role",
          "status", // You might want this on req.user
          "profilePictureUrl",
          // Add other existing columns you might need on req.user, like 'university', 'department', etc.
        ],
      });

      if (!user) {
        // console.warn(`[Protect Middleware] User ID ${decoded.id} (from token) NOT FOUND in DB.`);
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found for token.",
        });
      }

      req.user = user.get({ plain: true });
      // If you still need a 'fullName' like property for display purposes later,
      // you can construct it here if needed, e.g., from username or other fields.
      // For example, if username is used as display name:
      // req.user.displayName = req.user.username;
      // Or if you decide to add first/last name columns later, you'd construct it from those.

      console.log(
        `[Protect Middleware] User ${req.user.id} (Role: ${req.user.role}) attached to req.user. Proceeding...`
      );
      next();
    } catch (error) {
      console.error(
        "[Protect Middleware] Token verification FAILED or other error:",
        error.name,
        error.message
      );
      let message = "Not authorized, token processing failed.";
      if (error.name === "TokenExpiredError")
        message = "Not authorized, token expired.";
      else if (error.name === "JsonWebTokenError")
        message = "Not authorized, invalid token format or signature.";

      return res
        .status(401)
        .json({ success: false, message, errorName: error.name });
    }
  } else {
    // console.log("[Protect Middleware] No 'Bearer ' token found in authorization header.");
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided or incorrect format.",
    });
  }
};

export const optionalProtect = async (req, res, next) => {
  let token;
  req.user = null;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      if (!JWT_SECRET) {
        return next();
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        // VVVV --- CORRECTED ATTRIBUTES LIST --- VVVV
        attributes: [
          "id",
          "username",
          "email",
          // 'fullName', // REMOVED
          "role",
          "status",
          "profilePictureUrl",
        ],
      });
      if (user) {
        req.user = user.get({ plain: true });
      }
    } catch (error) {
      // Ignore errors for optional protect, just means user isn't authenticated
    }
  }
  next();
};

export const adminOnly = (req, res, next) => {
  // console.log("[AdminOnly Middleware] Checking user role. req.user:", req.user);
  if (!req.user) {
    // console.error("[AdminOnly Middleware] Error: req.user not found.");
    return res.status(401).json({
      success: false,
      message: "User not authenticated for admin check.",
    });
  }

  if (req.user.role === "admin") {
    // console.log(`[AdminOnly Middleware] Access GRANTED for User ID ${req.user.id} (Role: ${req.user.role}).`);
    next();
  } else {
    // console.warn(`[AdminOnly Middleware] Access DENIED for User ID ${req.user.id} (Role: ${req.user.role}). Required 'admin'.`);
    res.status(403).json({
      success: false,
      message: "Forbidden: Admin privileges required.",
    });
  }
};
export const userOnly = (req, res, next) => {
  // console.log("[UserOnly Middleware] Checking user role. req.user:", req.user);
  if (!req.user) {
    // console.error("[UserOnly Middleware] Error: req.user not found.");
    return res.status(401).json({
      success: false,
      message: "User not authenticated for user check.",
    });
  }

  if (req.user.role === "user") {
    // console.log(`[UserOnly Middleware] Access GRANTED for User ID ${req.user.id} (Role: ${req.user.role}).`);
    next();
  } else {
    // console.warn(`[UserOnly Middleware] Access DENIED for User ID ${req.user.id} (Role: ${req.user.role}). Required 'user'.`);
    res.status(403).json({
      success: false,
      message: "Forbidden: User privileges required.",
    });
  }
};
export const userOrAdminOnly = (req, res, next) => {
  // console.log("[UserOrAdminOnly Middleware] Checking user role. req.user:", req.user);
  if (!req.user) {
    // console.error("[UserOrAdminOnly Middleware] Error: req.user not found.");
    return res.status(401).json({
      success: false,
      message: "User not authenticated for user/admin check.",
    });
  }

  if (req.user.role === "user" || req.user.role === "admin") {
    // console.log(`[UserOrAdminOnly Middleware] Access GRANTED for User ID ${req.user.id} (Role: ${req.user.role}).`);
    next();
  } else {
    // console.warn(`[UserOrAdminOnly Middleware] Access DENIED for User ID ${req.user.id} (Role: ${req.user.role}). Required 'user' or 'admin'.`);
    res.status(403).json({
      success: false,
      message: "Forbidden: User or Admin privileges required.",
    });
  }
};
export const userOrAdminOrSelf = (req, res, next) => {
  // console.log("[UserOrAdminOrSelf Middleware] Checking user role. req.user:", req.user);
  if (!req.user) {
    // console.error("[UserOrAdminOrSelf Middleware] Error: req.user not found.");
    return res.status(401).json({
      success: false,
      message: "User not authenticated for user/admin/self check.",
    });
  }

  if (
    req.user.role === "user" ||
    req.user.role === "admin" ||
    req.user.id === req.params.id
  ) {
    // console.log(`[UserOrAdminOrSelf Middleware] Access GRANTED for User ID ${req.user.id} (Role: ${req.user.role}).`);
    next();
  } else {
    // console.warn(`[UserOrAdminOrSelf Middleware] Access DENIED for User ID ${req.user.id} (Role: ${req.user.role}). Required 'user', 'admin', or self access.`);
    res.status(403).json({
      success: false,
      message: "Forbidden: User, Admin, or Self privileges required.",
    });
  }
};
export const userOrAdminOrSelfOrPublic = (req, res, next) => {
  // console.log("[UserOrAdminOrSelfOrPublic Middleware] Checking user role. req.user:", req.user);
  if (!req.user) {
    // console.error("[UserOrAdminOrSelfOrPublic Middleware] Error: req.user not found.");
    return res.status(401).json({
      success: false,
      message: "User not authenticated for user/admin/self/public check.",
    });
  }

  if (
    req.user.role === "user" ||
    req.user.role === "admin" ||
    req.user.id === req.params.id ||
    req.params.id === "public"
  ) {
    // console.log(`[UserOrAdminOrSelfOrPublic Middleware] Access GRANTED for User ID ${req.user.id} (Role: ${req.user.role}).`);
    next();
  } else {
    // console.warn(`[UserOrAdminOrSelfOrPublic Middleware] Access DENIED for User ID ${req.user.id} (Role: ${req.user.role}). Required 'user', 'admin', self access, or public access.`);
    res.status(403).json({
      success: false,
      message: "Forbidden: User, Admin, Self, or Public privileges required.",
    });
  }
};
