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
  adminGetAllProjects, // <<< IMPORTED
  adminGetProjectMessages,
  adminDeleteMessage,
  getAdminSettings, // <<< IMPORTED
  updateAdminSettings, // <<< IMPORTED
  // ... other admin controllers
} from "../controllers/adminController.js"; // <<< Ensure path is correct

const router = express.Router();

// Apply global admin protection
router.use(protect);
router.use(adminOnly);

// --- Dashboard Route ---
router.get("/dashboard/stats", getDashboardStats); // GET /api/admin/dashboard/stats

// --- User Management Routes ---
router.get("/users", adminGetAllUsers);
router.get("/pending-users", adminGetPendingUsers);
router.get("/users/:id", adminGetUserById);
router.patch("/users/:id/status", adminUpdateUserStatus);
router.patch("/users/:id/role", adminUpdateUserRole);
router.delete("/users/:id", adminDeleteUser);

// --- Publication Management Routes ---
router.get("/publications", getAdminPublications);
// Example: router.patch("/publications/:id/status", adminUpdatePublicationStatus);

// --- Project Management Routes ---
router.get("/projects", adminGetAllProjects); // GET /api/admin/projects
// Example: router.delete("/projects/:id", adminDeleteProject);

// --- Message Management Routes ---
router.get("/messages/project/:projectId", adminGetProjectMessages);
router.delete("/messages/:messageId", adminDeleteMessage);

// --- Settings Routes ---
router.get("/settings", getAdminSettings); // GET /api/admin/settings
router.put("/settings", updateAdminSettings); // PUT /api/admin/settings

// Add other admin routes (Reports, etc.)

export default router;
