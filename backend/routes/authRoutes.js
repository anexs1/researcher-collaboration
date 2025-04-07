// src/routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  loginAdminUser,
  getMe,
  getAllUsers,
  // --- IMPORT NEW CONTROLLERS ---
  getPendingUsers,
  updateUserStatus,
} from "../controllers/authController.js"; // Verify path
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Verify path

const router = express.Router();

// --- Public Auth Routes ---
router.post("/admin-login", loginAdminUser); // Specific endpoint for admin login
router.post("/signup", registerUser); // Creates pending users
router.post("/login", loginUser); // Regular user login (checks status)

// --- Protected User Route ---
router.get("/me", protect, getMe); // Gets profile for logged-in (and approved) user

// --- ADMIN ONLY ROUTES ---
router.get("/admin/users", protect, adminOnly, getAllUsers); // Gets list of users (e.g., all or approved)

// --- NEW Admin Approval Routes ---
router.get("/admin/users/pending", protect, adminOnly, getPendingUsers); // List pending users
router.patch(
  "/admin/users/:userId/status",
  protect,
  adminOnly,
  updateUserStatus
); // Update status

export default router;
