// backend/routes/projectRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  // Add other imports if needed
} from "../controllers/projectController.js";

// --- Configure Multer (Example - Place in separate middleware file recommended) ---
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure destination and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/projects/"; // Relative path from server root
    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter (optional) - accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Not an image! Please upload only images."), false); // Reject file
  }
};

// Multer instance with configuration
const uploadProjectImage = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit example
  fileFilter: fileFilter,
});
// --- End Multer Configuration Example ---

const router = express.Router();

// === Project Routes ===

// Create a new project (Protected & Apply Multer for the file field)
// 'projectImageFile' MUST match the name attribute in the FormData on the frontend
router.post(
  "/",
  protect, // 1. Authenticate user
  uploadProjectImage.single("projectImageFile"), // 2. Handle file upload AND parse text fields into req.body
  createProject // 3. Run controller (req.body should now be populated)
);

// Get projects owned by the logged-in user (Protected)
router.get("/my", protect, getMyProjects);

// Get a single project by ID (Public or Protected)
router.get("/:id", getProjectById);

// Update a project (Protected, owner only)
// Apply multer if allowing image update
router.put(
  "/:id",
  protect,
  uploadProjectImage.single("projectImageFile"), // Handle potential new image upload
  updateProject
);

// Delete a project (Protected, owner only)
router.delete("/:id", protect, deleteProject);

export default router;
