// backend/routes/admin.routes.js
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Auth & Admin check middleware

// --- Import ONLY the admin-specific controllers ---
// Assuming they are defined and exported from userController for now
// If you move them to adminController.js, update the import path
import {
  adminGetAllUsers,
  adminGetPendingUsers,
  adminGetUserById,
  adminUpdateUserStatus,
  adminUpdateUserRole,
  adminDeleteUser,
} from "../controllers/userController.js"; // <<< Ensure path is correct

// Import other admin controllers if needed (e.g., for projects, publications)
// import { adminGetAllProjects } from "../controllers/projectController.js";

const router = express.Router();

// --- Apply global middleware for ALL admin routes ---
router.use(protect); // 1. Ensure user is logged in
router.use(adminOnly); // 2. Ensure user has 'admin' role

// --- User Management Routes ---
router.get("/users", adminGetAllUsers); // GET /api/admin/users
router.get("/pending-users", adminGetPendingUsers); // GET /api/admin/pending-users
router.get("/users/:id", adminGetUserById); // GET /api/admin/users/:id
router.patch("/users/:id/status", adminUpdateUserStatus); // PATCH /api/admin/users/:id/status
router.patch("/users/:id/role", adminUpdateUserRole); // PATCH /api/admin/users/:id/role
router.delete("/users/:id", adminDeleteUser); // DELETE /api/admin/users/:id

// --- Project Management Routes (Example) ---
// router.get("/projects", adminGetAllProjects); // GET /api/admin/projects
// router.delete("/projects/:id", adminDeleteProject); // Need controller

// --- Publication Management Routes (Example) ---
// router.get("/publications", adminGetAllPublications);
// router.patch("/publications/:id/status", adminUpdatePublicationStatus);
// router.delete("/publications/:id", adminDeletePublication);

// Add other admin routes as needed (settings, reports etc.)

export default router;
