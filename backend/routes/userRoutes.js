// backend/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Assuming protect is needed

// **** CORRECT THE IMPORT NAME HERE ****
import {
  getUserPublicProfile, // Changed from getPublicUserProfile
  updateUserProfile,
  // ... other imports from userController ...
} from "../controllers/userController.js";

const router = express.Router();

// --- Public Routes ---
// **** USE THE CORRECT FUNCTION NAME HERE ****
router.get("/public/:userId", getUserPublicProfile); // Route to get public profile

// --- Protected Routes ---
router.put("/profile", protect, updateUserProfile); // Route to update OWN profile

// Add other user-related routes here

export default router;
