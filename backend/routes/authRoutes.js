// routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  getMe, // Make sure this matches exactly
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

export default router;
