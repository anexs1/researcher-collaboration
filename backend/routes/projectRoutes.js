// backend/routes/projectRoutes.js
import express from "express";
import multer from "multer"; // Ensure multer is installed: npm install multer
import {
  getAllProjects,
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectRequests,
  getProjectMembers, // <<< IMPORTED the new controller function
  adminGetAllProjects,
} from "../controllers/projectController.js"; // Adjust path if needed

// Import authentication middleware
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Adjust path if needed

const router = express.Router();

// --- Multer Configuration (Optional - If handling image uploads) ---
// Keep this only if your create/update project handles file uploads
const storage = multer.memoryStorage(); // Example: In-memory storage
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images allowed."), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Example: 5MB limit
});
// -----------------------------------------------------------------

// --- Project Routes ---

// GET /api/projects - Get all visible projects (paginated, filtered)
router.get("/", protect, getAllProjects); // Assuming public projects require login to view list

// GET /api/projects/my - Get projects owned by the current user
router.get("/my", protect, getMyProjects);

// GET /api/projects/:id - Get a single project by ID
router.get("/:id", protect, getProjectById); // Requires login to view details

// GET /api/projects/:projectId/requests - Get PENDING join requests for a project (Owner only)
router.get("/:projectId/requests", protect, getProjectRequests); // Authorization in controller

// --- *** ADDED ROUTE for Project Members *** ---
// GET /api/projects/:projectId/members - Get ACTIVE members of a project (Owner/Member access)
router.get("/:projectId/members", protect, getProjectMembers); // Authorization in controller
// --- *** END OF ADDED ROUTE *** ---

// POST /api/projects - Create a new project
router.post(
  "/",
  protect,
  // upload.single("projectImageFile"), // Uncomment if handling image upload
  createProject
);

// PUT /api/projects/:id - Update a project by ID (Owner only)
router.put(
  "/:id",
  protect,
  // upload.single("projectImageFile"), // Uncomment if handling image update
  updateProject
);

// DELETE /api/projects/:id - Delete a project by ID (Owner only)
router.delete("/:id", protect, deleteProject);

// --- Admin Route Example (Keep only if implemented) ---
// GET /api/projects/admin/all - Get all projects (for Admin dashboard)
// Note: Often admin routes are grouped under /api/admin/*
// router.get("/admin/all", protect, adminOnly, adminGetAllProjects);

export default router;
