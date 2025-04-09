// File: backend/routes/authRoutes.js

import express from "express";
import {
  registerUser, // Handles POST /signup
  loginUser, // Handles POST /login
  loginAdminUser, // Handles POST /admin-login
  getMe, // Handles GET /me (for fetching logged-in user's profile)
  // REMOVE getAllUsers, getPendingUsers, updateUserStatus FROM HERE
} from "../controllers/authController.js"; // Verify path

// Only import 'protect' if needed for routes defined *in this file* (like /me)
import { protect } from "../middleware/authMiddleware.js"; // Verify path
// <<< REMOVE adminOnly import from this file >>>

const router = express.Router();

// --- Public Auth Routes ---
router.post("/signup", registerUser); // User registration (creates pending usually)
router.post("/login", loginUser); // Regular user login
router.post("/admin-login", loginAdminUser); // Specific endpoint for admin login

// --- Protected User Route ---
// Route to get the profile of the currently logged-in user
router.get("/me", protect, getMe);

// <<< REMOVE THE '/admin/*' routes from this file >>>

export default router;
