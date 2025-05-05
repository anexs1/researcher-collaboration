// backend/routes/userRoutes.js
import express from "express";
import multer from "multer"; // Import multer
import path from "path"; // Import path
import { protect } from "../middleware/authMiddleware.js";

// --- !!! CORRECTED & ADDED IMPORT !!! ---
// Make sure ALL controller functions used in this file are imported
import {
  getUserPublicProfile,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  getSelectableUsers,
  getUserActivity, // <<<=== ADDED THIS CONTROLLER IMPORT
} from "../controllers/userController.js"; // Adjust path if needed
// --- END CORRECTION ---

const router = express.Router();

// --- Multer Configuration for Profile Pictures ---
const storage = multer.memoryStorage(); // Use memory storage
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    // Accept only images
    cb(null, true);
  } else {
    // Use a standard Error object for the callback
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};
const uploadProfilePic = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
// --- End Multer Configuration ---

// --- Public Routes ---
router.get("/public/:userId", getUserPublicProfile);

// --- Protected 'Me' Routes ---
router.put(
  "/profile",
  protect, // 1. Authenticate
  uploadProfilePic.single("profileImageFile"), // 2. Process form data (file + text fields)
  updateUserProfile // 3. Call controller
);

router.put("/me/email", protect, updateUserEmail);
router.put("/me/password", protect, updateUserPassword);
router.get("/selectable", protect, getSelectableUsers);

// ==============================================
// === ADDED ROUTE FOR USER ACTIVITY ==========
// ==============================================
// Use :userId because the request comes as /api/users/:userId/activity
router.get("/:userId/activity", protect, getUserActivity);

export default router;
