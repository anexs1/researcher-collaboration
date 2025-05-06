import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Adjust path if needed
const { User } = db;

// Use environment variable, provide a fallback ONLY for immediate local testing if needed
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "CRITICAL ERROR: JWT_SECRET environment variable not set. Authentication will fail."
  );
  // In a real application, you might want to throw an error here or have server.js check and exit.
  // Forcing an exit if JWT_SECRET is not set is a good practice for security.
  // process.exit(1);
}

/**
 * Middleware to protect routes - requires a valid token and an existing user.
 * Sets req.user.
 */
export const protect = async (req, res, next) => {
  let token;
  // console.log("Protect Middleware: Checking authorization header...");

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      // console.log("Protect Middleware: Token found.");

      if (!JWT_SECRET) {
        // Re-check here in case it wasn't caught at startup
        console.error("Protect Middleware: JWT_SECRET is not configured.");
        return res.status(500).json({
          success: false,
          message: "Internal server error: Auth configuration missing.",
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      // console.log(`Protect Middleware: Token verified for User ID: ${decoded.id}`);

      const user = await User.findByPk(decoded.id); // Assuming default scope excludes password

      if (!user) {
        // console.warn(`Protect Middleware: User ID ${decoded.id} not found in DB.`);
        return res
          .status(401)
          .json({ success: false, message: "Not authorized, user not found" });
      }

      req.user = user;
      // console.log(`Protect Middleware: User ${user.id} attached to req.user.`);
      next();
    } catch (error) {
      // console.error("Protect Middleware Error:", error.name, error.message);
      let message = "Not authorized, token failed";
      if (error.name === "TokenExpiredError")
        message = "Not authorized, token expired";
      else if (error.name === "JsonWebTokenError")
        message = "Not authorized, invalid token";

      return res.status(401).json({ success: false, message });
    }
  } else {
    // console.log("Protect Middleware: No Bearer token found in header.");
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};

/**
 * Middleware for optional authentication.
 * If a valid token is present, sets req.user.
 * Otherwise, req.user remains null/undefined and proceeds to the next handler.
 */
export const optionalProtect = async (req, res, next) => {
  let token;
  req.user = null; // Initialize req.user for this request
  // console.log("OptionalProtect Middleware: Checking authorization header...");

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      // console.log("OptionalProtect Middleware: Token found.");

      if (!JWT_SECRET) {
        console.error(
          "OptionalProtect Middleware: JWT_SECRET is not configured."
        );
        // Don't send 500, just proceed as unauthenticated for optional
        return next(); // Proceed without user
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      // console.log(`OptionalProtect Middleware: Token signature verified for User ID: ${decoded.id}`);

      const user = await User.findByPk(decoded.id); // Assuming default scope excludes password

      if (user) {
        req.user = user;
        // console.log(`OptionalProtect Middleware: User ${user.id} attached to req.user.`);
      } else {
        // console.warn(`OptionalProtect Middleware: User ID ${decoded.id} from token not found. Proceeding as guest.`);
      }
    } catch (error) {
      // This is not an "error" for optionalProtect if token is invalid/expired.
      // It simply means the user is not authenticated for this request.
      // console.warn(`OptionalProtect Middleware: Token invalid or expired ('${error.name}: ${error.message}'). Proceeding as guest.`);
    }
  } else {
    // console.log("OptionalProtect Middleware: No Bearer token found. Proceeding as guest.");
  }
  next(); // Always proceed to the next handler
};

/**
 * Middleware for admin-only access.
 * MUST be used after 'protect' or an equivalent middleware that sets req.user.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    // console.error("AdminOnly Middleware Error: req.user not found. 'protect' middleware must be used before 'adminOnly'.");
    return res
      .status(500)
      .json({ success: false, message: "Authorization setup error." });
  }

  // console.log(`AdminOnly Middleware: Checking role for User ID ${req.user.id}. Role: ${req.user.role}`);
  if (req.user.role === "admin") {
    // Ensure your User model has a 'role' attribute
    // console.log(`AdminOnly Middleware: Access granted for User ID ${req.user.id}.`);
    next();
  } else {
    // console.warn(`AdminOnly Middleware: Access denied for User ID ${req.user.id} (Role: ${req.user.role}).`);
    res
      .status(403)
      .json({ success: false, message: "Forbidden: Admin access required" });
  }
};
