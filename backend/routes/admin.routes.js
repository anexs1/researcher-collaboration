// backend/routes/admin.routes.js
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

// --- Import Admin-Specific Controllers ---
// User Management (Assuming these are ONLY for admin use now)
import {
  adminGetAllUsers,
  adminGetPendingUsers,
  adminGetUserById,
  adminUpdateUserStatus, // Corrected typo from previous version if any
  adminUpdateUserRole,
  adminDeleteUser,
} from "../controllers/userController.js"; // Adjust path if needed, or move to adminController

// Import from adminController
import {
  getDashboardStats, // <<< IMPORTED Dashboard controller
  getAdminPublications,
  adminGetProjectMessages,
  adminDeleteMessage,
  // Import other admin controllers as needed
} from "../controllers/adminController.js"; // <<< Ensure path is correct

// Project Management (Example - Requires controller functions in adminController or projectController)
// import { adminGetAllProjects, adminDeleteProject } from "../controllers/adminController.js";

const router = express.Router();

// --- Apply global middleware for ALL admin routes ---
// Ensures only logged-in administrators can access these endpoints
router.use(protect);
router.use(adminOnly);

// --- Dashboard Route ---
// Defines the endpoint the frontend will call to get dashboard statistics
router.get("/dashboard/stats", getDashboardStats); // GET /api/admin/dashboard/stats

// --- User Management Routes ---
router.get("/users", adminGetAllUsers); // GET /api/admin/users
router.get("/pending-users", adminGetPendingUsers); // GET /api/admin/pending-users
router.get("/users/:id", adminGetUserById); // GET /api/admin/users/:id
router.patch("/users/:id/status", adminUpdateUserStatus); // PATCH /api/admin/users/:id/status
router.patch("/users/:id/role", adminUpdateUserRole); // PATCH /api/admin/users/:id/role
router.delete("/users/:id", adminDeleteUser); // DELETE /api/admin/users/:id

// --- Publication Management Routes ---
router.get("/publications", getAdminPublications); // GET /api/admin/publications
// Example: router.patch("/publications/:id/status", adminUpdatePublicationStatus);
// Example: router.delete("/publications/:id", adminDeletePublication);

// --- Project Management Routes (Example) ---
// Example: router.get("/projects", adminGetAllProjects); // GET /api/admin/projects
// Example: router.delete("/projects/:id", adminDeleteProject);

// --- Message Management Routes ---
router.get("/messages/project/:projectId", adminGetProjectMessages); // GET /api/admin/messages/project/:projectId
router.delete("/messages/:messageId", adminDeleteMessage); // DELETE /api/admin/messages/:messageId

// Add other admin-specific routes here (e.g., settings, reports)

export default router;
