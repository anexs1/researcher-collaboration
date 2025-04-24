// backend/routes/adminRoutes.js

import express from "express";
// Ensure correct middleware import names
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Assuming adminOnly is your admin check middleware

// --- Import Controllers ---
import {
  getDashboardStats,
  getAdminPublications, // <-- Import the new publications controller
} from "../controllers/adminController.js";

// Import user management functions (confirm these should be handled here vs. userRoutes with admin check)
import {
  adminGetAllUsers,
  adminGetPendingUsers,
  adminGetUserById,
  adminUpdateUserStatus,
  adminUpdateUserRole,
  adminDeleteUser,
} from "../controllers/userController.js"; // Assuming these remain in userController for now

const router = express.Router();

// --- Middleware for all admin routes ---
// Apply authentication and admin authorization check to all routes defined below
router.use(protect, adminOnly);

// --- Dashboard Route ---
router.get("/dashboard", getDashboardStats);

// --- User Management Routes (from userController) ---
// Consider if these should be moved to adminController or stay in userController but be routed here
router.get("/users", adminGetAllUsers);
router.get("/users/pending", adminGetPendingUsers);
router.get("/users/:id", adminGetUserById);
router.patch("/users/:id/status", adminUpdateUserStatus);
router.patch("/users/:id/role", adminUpdateUserRole);
router.delete("/users/:id", adminDeleteUser);

// --- Publication Management Route (from adminController) ---
router.get("/publications", getAdminPublications); // <-- ADD THIS ROUTE

// --- Add other admin-specific routes here ---
// e.g., Project management, Settings, Reports

export default router;
