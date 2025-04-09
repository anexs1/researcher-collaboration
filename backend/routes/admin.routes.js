// File: backend/routes/admin.routes.js - CORRECTED

import express from "express";
// <<< CHANGE THE IMPORT NAMES HERE >>>
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Use the actual exported names

// Import controllers
import {
  adminGetAllPublications,
  adminDeletePublication,
} from "../controllers/publicationController.js"; // Adjust path
import {
  adminGetAllUsers,
  adminGetUserById,
  adminUpdateUserStatus,
  adminUpdateUserRole,
  adminDeleteUser,
} from "../controllers/userController.js"; // Adjust path
import {
  getDashboardStats,
  // Import other general admin controllers
} from "../controllers/adminController.js"; // Adjust path

const router = express.Router();

// --- Dashboard ---
// <<< Use protect, adminOnly >>>
router.get("/dashboard-stats", protect, adminOnly, getDashboardStats);

// --- Publication Management ---
// <<< Use protect, adminOnly >>>
router.get("/publications", protect, adminOnly, adminGetAllPublications);
router.delete("/publications/:id", protect, adminOnly, adminDeletePublication);

// --- User Management ---
// <<< Use protect, adminOnly >>>
router.get("/users", protect, adminOnly, adminGetAllUsers);
router.get("/users/:id", protect, adminOnly, adminGetUserById);
router.put("/users/:id/status", protect, adminOnly, adminUpdateUserStatus);
router.put("/users/:id/role", protect, adminOnly, adminUpdateUserRole);
router.delete("/users/:id", protect, adminOnly, adminDeleteUser);

// --- Add other admin routes (Settings, Reports) ---
// router.get('/settings', protect, adminOnly, getAdminSettings);

export default router;
