// backend/routes/projectRoutes.js

import express from "express";
import multer from "multer"; // Import multer
import {
  getAllProjects,
  // getMyProjects, // Uncomment if used
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  // adminGetAllProjects // Uncomment if used
} from "../controllers/projectController.js"; // Adjust path if needed

// --- Correctly import using the exported names from your file ---
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Multer Configuration (Same as before) ---
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
// ---------------------------

// --- Project Routes ---

// Get all projects (visible to logged-in users)
// If this should be public, remove 'protect'
router.get("/", protect, getAllProjects);

// Get a single project by ID
// If this should be public, remove 'protect'
router.get("/:id", protect, getProjectById);

// Create a new project (requires user to be logged in)
router.post(
  "/",
  protect, // 1. Authenticate user
  upload.single("projectImageFile"), // 2. Handle file upload
  createProject // 3. Run controller
);

// Update a project by ID (requires user to be logged in)
// Ownership check happens inside the controller
router.put(
  "/:id",
  protect, // 1. Authenticate user
  upload.single("projectImageFile"), // 2. Handle potential file update
  updateProject // 3. Run controller (checks ownership internally)
);

// Delete a project by ID (requires user to be logged in)
// Ownership check happens inside the controller
router.delete(
  "/:id",
  protect, // 1. Authenticate user
  deleteProject // 2. Run controller (checks ownership internally)
);

export default router;
