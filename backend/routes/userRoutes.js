// File: backend/routes/userRoutes.js

import express from "express";
import {
  updateMyProfile,
  getPublicUserProfile,
  getSearchableUsers, // <-- IMPORT NEW CONTROLLER FUNCTION
} from "../controllers/userController.js"; // Adjust path if needed
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- User Profile Routes ---
router.put("/profile", protect, updateMyProfile);
router.get("/public/:userId", getPublicUserProfile);

// --- ADD THIS ROUTE for Collaborator Search/Dropdown ---
// @desc    Get a list of users for collaborator selection (e.g., dropdown/search)
// @route   GET /api/users/searchable
// @access  Private (usually only logged-in users can see others to collaborate)
router.get("/searchable", protect, getSearchableUsers);
// --- END ADD ---

export default router;
