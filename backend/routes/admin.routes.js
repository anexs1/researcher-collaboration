// backend/routes/admin.routes.js
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

// Import User Management controllers (adjust path if needed or move to adminController)
import {
  adminGetAllUsers,
  adminGetPendingUsers,
  adminGetUserById,
  adminUpdateUserStatus, // Ensure correct export name
  adminUpdateUserRole,
  adminDeleteUser,
} from "../controllers/userController.js";

// Import ALL controllers from adminController.js used in this file
import {
  getDashboardStats,
  getAdminPublications,
  adminGetAllProjects,
  adminGetProjectMessages,
  adminDeleteMessage,
  getAdminSettings,
  updateAdminSettings,
  getReportSummary, // <<< IMPORTED Report Summary controller
  getReportUserGrowth, // <<< IMPORTED Report User Growth controller
  getReportContentOverview, // <<< IMPORTED Report Content Overview controller
} from "../controllers/adminController.js"; // Ensure path is correct

const router = express.Router();

// --- Apply global admin protection ---
// All routes defined below will first require login (protect) and then admin role (adminOnly)
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
// Add PATCH/DELETE for publications if needed, importing controllers

// --- Project Management Routes ---
router.get("/projects", adminGetAllProjects); // GET /api/admin/projects
// Add DELETE for projects if needed, importing controller

// --- Message Management Routes ---
router.get("/messages/project/:projectId", adminGetProjectMessages); // GET /api/admin/messages/project/:projectId
router.delete("/messages/:messageId", adminDeleteMessage); // DELETE /api/admin/messages/:messageId

// --- Settings Routes ---
router.get("/settings", getAdminSettings); // GET /api/admin/settings
router.put("/settings", updateAdminSettings); // PUT /api/admin/settings (Handles updates)

// --- Report Routes ---
router.get("/reports/summary", getReportSummary); // GET /api/admin/reports/summary
router.get("/reports/user-growth", getReportUserGrowth); // GET /api/admin/reports/user-growth
router.get("/reports/content-overview", getReportContentOverview); // GET /api/admin/reports/content-overview

// --- Add other admin-specific routes below ---

export default router;
