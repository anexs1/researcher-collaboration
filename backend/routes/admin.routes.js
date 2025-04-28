// backend/routes/admin.routes.js
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

// Import User Management controllers (adjust path if they move)
import {
  adminGetAllUsers,
  adminGetPendingUsers,
  adminGetUserById,
  adminUpdateUserStatus,
  adminUpdateUserRole,
  adminDeleteUser,
} from "../controllers/userController.js";

// Import controllers from adminController.js
import {
  getDashboardStats,
  getAdminPublications,
  adminGetAllProjects, // <<< IMPORTED Admin Project List controller
  adminGetProjectMessages,
  adminDeleteMessage,
  // adminDeleteProject, // Import if implemented
  // adminUpdatePublicationStatus, // Import if implemented
  // adminDeletePublication // Import if implemented
} from "../controllers/adminController.js";

const router = express.Router();

// --- Apply global admin protection ---
router.use(protect);
router.use(adminOnly);

// --- Dashboard Route ---
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

// --- Project Management Routes ---
router.get("/projects", adminGetAllProjects); // GET /api/admin/projects
// Example: router.delete("/projects/:id", adminDeleteProject);

// --- Message Management Routes ---
router.get("/messages/project/:projectId", adminGetProjectMessages); // GET /api/admin/messages/project/:projectId
router.delete("/messages/:messageId", adminDeleteMessage); // DELETE /api/admin/messages/:messageId

// --- Add other admin routes (Settings, Reports, etc.) ---

export default router;
