// File: backend/routes/authRoutes.js

import express from "express";
import {
  registerUser,
  loginUser,
  loginAdminUser,
  getMe,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Public Auth Routes ---
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/admin-login", loginAdminUser);

// --- Protected Routes ---
router.get("/me", protect, getMe);

// ✅ Token validation endpoint
router.get("/validate", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: req.user,
  });
});

export default router;
