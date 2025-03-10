import express from "express";
import { loginUser, registerUser } from "../controllers/authController.js";

const router = express.Router();

// Define routes for login and registration
router.post("/login", loginUser);
router.post("/register", registerUser);

export default router;
