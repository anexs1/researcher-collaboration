import express from "express";
import multer from "multer"; // Ensure multer is installed: npm install multer
import {
  getAllProjects,
  getMyProjects, // Make sure this is used or remove import
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectRequests, // Import the new controller function
  adminGetAllProjects, // Make sure this is used or remove import
} from "../controllers/projectController.js"; // Adjust path if needed

// Import your authentication middleware
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Adjust path if needed

const router = express.Router();

// --- Multer Configuration (Example for handling image uploads) ---
// Configure storage as needed (memory, disk, cloud)
const storage = multer.memoryStorage(); // Example: Store file in memory buffer

// Filter for image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    // Accept common image types
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (jpeg, png, gif, webp) are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Example: 5MB file size limit
});
// -----------------------------------------------------------------

// --- Project Routes ---

// GET /api/projects - Get all visible projects (paginated, filtered)
// Requires user to be logged in (remove 'protect' if public)
router.get("/", protect, getAllProjects);

// GET /api/projects/my - Get projects owned by the current user
// Requires user to be logged in
router.get("/my", protect, getMyProjects); // Assuming you have this route/controller

// GET /api/projects/:id - Get a single project by ID
// Requires user to be logged in (remove 'protect' if public)
router.get("/:id", protect, getProjectById);

// GET /api/projects/:projectId/requests - Get join requests for a specific project
// Requires user to be logged in AND be the project owner (checked in controller)
router.get("/:projectId/requests", protect, getProjectRequests);

// POST /api/projects - Create a new project
// Requires user to be logged in
router.post(
  "/",
  protect, // 1. Authenticate user
  // 2. Use upload middleware ONLY if you expect an image file named 'projectImageFile'
  // upload.single("projectImageFile"), // Uncomment if handling image upload
  createProject // 3. Run controller
);

// PUT /api/projects/:id - Update a project by ID
// Requires user to be logged in (ownership checked in controller)
router.put(
  "/:id",
  protect, // 1. Authenticate user
  // 2. Use upload middleware ONLY if allowing image updates via 'projectImageFile'
  // upload.single("projectImageFile"), // Uncomment if handling image upload
  updateProject // 3. Run controller
);

// DELETE /api/projects/:id - Delete a project by ID
// Requires user to be logged in (ownership checked in controller)
router.delete(
  "/:id",
  protect, // 1. Authenticate user
  deleteProject // 2. Run controller
);

// --- Example Admin Route ---
// GET /api/projects/admin/all - Get all projects (for Admin dashboard)
// Requires user to be logged in AND be an admin
// Make sure you mount this router under a path that doesn't conflict (e.g., /api/admin/projects)
// or define a specific route like below if mounted under /api/projects
// router.get("/admin/all", protect, adminOnly, adminGetAllProjects); // Example if mounted at /api/projects

export default router;
