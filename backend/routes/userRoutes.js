// backend/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Your auth middleware

// Correctly import all needed functions from userController
import {
  getUserPublicProfile, // Corrected name
  updateUserProfile,
  updateUserEmail, // <-- Import new function
  updateUserPassword, // <-- Import new function
  // Import admin functions if they belong here, otherwise they should be in adminRoutes.js
} from "../controllers/userController.js";

// Optional: Import upload middleware if used for profile picture in updateUserProfile
// import { profileUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// --- Public Routes ---
router.get("/public/:userId", getUserPublicProfile); // Route to get public profile

// --- Protected 'Me' Routes (Operations on the logged-in user's own data) ---
router.put(
  "/profile",
  protect,
  // profileUpload.single('profileImage'), // Add upload middleware here if used
  updateUserProfile
); // Route to update OWN profile (general data)

router.put("/me/email", protect, updateUserEmail); // Route to update OWN email (requires password verification)

router.put("/me/password", protect, updateUserPassword); // Route to update OWN password (requires current password verification)

// --- NOTE ---
// Admin routes (like managing ANY user) should typically be in a separate
// file (e.g., adminRoutes.js) and mounted under an /api/admin prefix
// in your main server file (server.js or app.js).

export default router;
