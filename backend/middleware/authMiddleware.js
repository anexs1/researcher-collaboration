// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import db from "../models/index.js"; // Adjust path if needed
const { User } = db;

// Use environment variable, provide a fallback ONLY for immediate local testing if needed
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn(
    "⚠️ WARNING: JWT_SECRET environment variable not set. Using insecure fallback for authMiddleware."
  );
  // It's better to throw an error or exit in server.js, but add fallback here just in case
  // process.env.JWT_SECRET = 'your_insecure_fallback_secret_for_testing_only';
}

// Middleware to protect routes
// <<< Use EXPORT directly on the function >>>
export const protect = async (req, res, next) => {
  let token;
  console.log("Protect Middleware: Checking authorization header..."); // Add entry log

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Protect Middleware: Token found.");
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use process.env directly
      console.log(
        `Protect Middleware: Token verified for User ID: ${decoded.id}`
      );

      // Fetch user using default scope (should exclude password)
      const user = await User.findByPk(decoded.id); // No need for explicit attributes if defaultScope is correct

      if (!user) {
        console.warn(
          `Protect Middleware: User ID ${decoded.id} not found in DB.`
        );
        // Keep response generic for security
        return res
          .status(401)
          .json({ success: false, message: "Not authorized" });
      }

      // Attach user to the request object (excluding password is handled by defaultScope)
      req.user = user;
      console.log(`Protect Middleware: User ${user.id} attached to req.user.`);
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error("Protect Middleware Error:", error.message);
      let message = "Not authorized";
      // Provide more specific (but still safe) messages
      if (error.name === "TokenExpiredError")
        message = "Not authorized, token expired";
      else if (error.name === "JsonWebTokenError")
        message = "Not authorized, invalid token";
      // Avoid sending detailed internal errors to the client

      return res.status(401).json({ success: false, message });
    }
  } else {
    console.log("Protect Middleware: No Bearer token found in header.");
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};

// Middleware for admin-only access
// <<< Use EXPORT directly on the function >>>
export const adminOnly = (req, res, next) => {
  // This middleware MUST run AFTER 'protect', so req.user should exist
  if (!req.user) {
    // This case indicates a setup error (adminOnly used before protect)
    console.error(
      "AdminOnly Middleware Error: req.user not found. Ensure 'protect' runs first."
    );
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  console.log(
    `AdminOnly Middleware: Checking role for User ID ${req.user.id}. Role: ${req.user.role}`
  );

  if (req.user.role === "admin") {
    console.log(
      `AdminOnly Middleware: Access granted for User ID ${req.user.id}.`
    );
    next(); // User is admin, proceed
  } else {
    console.warn(
      `AdminOnly Middleware: Access denied for User ID ${req.user.id} (Role: ${req.user.role}).`
    );
    res
      .status(403)
      .json({ success: false, message: "Forbidden: Admin access required" }); // 403 Forbidden is more appropriate
  }
};

// REMOVE the default export object
// export default {
//   protect,
//   adminOnly,
// };
