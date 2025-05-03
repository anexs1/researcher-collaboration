// backend/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Your auth middleware

// Import controller functions
import {
  getUserPublicProfile,
  updateUserProfile,
  updateUserEmail, // Handles PUT /api/users/me/email
  updateUserPassword, // Handles PUT /api/users/me/password
  getSelectableUsers,
} from "../controllers/userController.js"; // Adjust path if needed

// Optional: Import upload middleware if needed for profile picture
// import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// --- Public Routes ---
// GET /api/users/public/:userId - Fetch public profile data for any user
// NOTE: Parameter name is ':userId', ensure controller uses req.params.userId
router.get("/public/:userId", getUserPublicProfile);

// --- Protected 'Me' Routes (Operations on the logged-in user's own data) ---
// These routes rely on `protect` middleware setting `req.user`

// PUT /api/users/profile - Update non-sensitive profile info
router.put("/profile", protect, updateUserProfile);

// PUT /api/users/me/email - Update user's email (requires password verification)
router.put("/me/email", protect, updateUserEmail);

// PUT /api/users/me/password - Update user's password (requires current password)
router.put("/me/password", protect, updateUserPassword);

// --- Route for Collaborator Selection ---
// GET /api/users/selectable - Fetches users suitable for collaborator selection
// Requires user to be logged in.
router.get("/selectable", protect, getSelectableUsers);

// --- NOTE: Admin routes (e.g., GET /api/admin/users/ or DELETE /api/admin/users/:id)
// should be defined in a separate adminRoutes.js file and mounted under /api/admin
// using admin-specific middleware checks.

export default router;
