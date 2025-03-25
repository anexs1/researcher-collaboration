// routes/authRoutes.js
import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js"; // Import controller functions
import multer from "multer"; // Import Multer
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure Multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Specify the folder to save the file
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Use a unique file name
  },
});

const upload = multer({ storage: storage });

// Protect the signup route with authentication (only admins can sign up other users)
router.post(
  "/signup",
  authenticateToken,
  upload.single("profileImage"),
  registerUser
);
router.post("/login", loginUser);

export default router;
