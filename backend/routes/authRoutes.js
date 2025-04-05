import express from "express";
import {
  registerUser,
  loginUser,
  loginAdminUser,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.post("/admin-login", loginAdminUser); // Admin login route
router.post("/signup", registerUser);
router.post("/login", loginUser);

// Protected Routes
router.get("/me", protect, getMe);

export default router;
