// backend/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Your auth middleware

// Correctly import all needed functions from userController
import {
  getUserPublicProfile, // Route target for fetching profile data for chat header
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  // Admin functions should be imported in adminRoutes.js
  // adminGetAllUsers,
  // adminGetPendingUsers,
  // adminGetUserById,
  // adminUpdateUserStatus,
  // adminUpdateUserRole,
  // adminDeleteUser
} from "../controllers/userController.js"; // Adjust path if needed

// Optional: Import upload middleware if needed for profile picture
// import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// --- Public Routes ---
// GET /api/users/public/:userId - Fetch public profile data for any user
// This is the route your ChatPage should call
router.get("/public/:userId", getUserPublicProfile);

// --- Protected 'Me' Routes (Operations on the logged-in user's own data) ---
// These require the user to be logged in (via 'protect' middleware)

// PUT /api/users/profile - Update the logged-in user's profile details
router.put(
  "/profile",
  protect,
  // upload.single('profileImage'), // Uncomment and configure if handling uploads
  updateUserProfile
);

// PUT /api/users/me/email - Update the logged-in user's email
router.put("/me/email", protect, updateUserEmail);

// PUT /api/users/me/password - Update the logged-in user's password
router.put("/me/password", protect, updateUserPassword);

// --- Protected Route for Getting OWN profile (optional alternative to /public/:id) ---
// Example: Could add a route like this if needed, uses req.user.id
// router.get("/me", protect, getMyProfileController);

// --- NOTE: Admin routes (e.g., GET /api/users/ or DELETE /api/users/:id)
// should be defined in adminRoutes.js and mounted under /api/admin ---

export default router;
