// backend/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Your auth middleware

// Correctly import all needed functions from userController
import {
  getUserPublicProfile,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  // --- IMPORT THE NEW FUNCTION ---
  getSelectableUsers, // <-- Import the function for collaborator selection
} from "../controllers/userController.js"; // Adjust path if needed

// Optional: Import upload middleware if needed for profile picture
// import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// --- Public Routes ---
// GET /api/users/public/:userId - Fetch public profile data for any user
router.get("/public/:userId", getUserPublicProfile);

// --- Protected 'Me' Routes (Operations on the logged-in user's own data) ---
router.put("/profile", protect, updateUserProfile);
router.put("/me/email", protect, updateUserEmail);
router.put("/me/password", protect, updateUserPassword);

// --- !!! NEW ROUTE FOR COLLABORATOR SELECTION !!! ---
// GET /api/users/selectable - Fetches users suitable for collaborator selection
// Requires user to be logged in, but NOT necessarily an admin
router.get(
  "/selectable", // <-- The new path
  protect, // <-- Requires login
  getSelectableUsers // <-- Points to the new controller function
);
// --- END NEW ROUTE ---

// --- Protected Route for Getting OWN profile (optional alternative to /public/:id) ---
// Example: Could add a route like this if needed, uses req.user.id
// router.get("/me", protect, getMyProfileController);

// --- NOTE: Admin routes (e.g., GET /api/users/ or DELETE /api/users/:id)
// should be defined in adminRoutes.js and mounted under /api/admin ---

export default router;
