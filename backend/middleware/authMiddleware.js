// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// Generic authentication middleware (verifies token and attaches user to req)
export const authenticateToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res.status(403).json({ message: "Invalid token." });
    }
    req.user = user; // Attach decoded user information to the request
    next();
  });
};

// Role-based authorization middleware (dynamically checks for required roles)
export const authorizeRoles = (...roles) => {
  // ...roles is a rest parameter (array)
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." }); // Not authenticated
    }

    if (!roles.includes(req.user.role)) {
      // Check if the user's role is in the allowed roles
      return res.status(403).json({ message: "Insufficient permissions." }); // Forbidden
    }

    next(); // User has the required role, proceed
  };
};
