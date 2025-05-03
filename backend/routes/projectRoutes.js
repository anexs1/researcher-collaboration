// backend/routes/projectRoutes.js
import express from "express";
import multer from "multer";
import {
  getAllProjects,
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectRequests, // Assuming controller still exports this for separate calls
  getProjectMembers,
  adminGetAllProjects, // Keep if controller exports it
} from "../controllers/projectController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Keep protect for other routes

const router = express.Router();

// --- Multer Configuration ---
// (Keep Multer config as is - it's for file uploads, not route protection)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Invalid file type. Only images allowed."
      ),
      false
    );
  }
};
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
// ---------------------------

// --- Project Routes ---

// --- PUBLIC ROUTES ---
// GET /api/projects - View all projects (Made public)
router.get("/", getAllProjects); // <<< REMOVED 'protect'

// GET /api/projects/:id - View a single project by ID (Made public)
router.get("/:id", getProjectById); // <<< REMOVED 'protect'

// --- PROTECTED ROUTES (Require Login) ---
// GET /api/projects/my - View projects created by the logged-in user
router.get("/my", protect, getMyProjects);

// GET /api/projects/:projectId/requests - View join requests for a specific project (Owner only logic likely in controller)
router.get("/:projectId/requests", protect, getProjectRequests);

// GET /api/projects/:projectId/members - View members of a specific project
router.get("/:projectId/members", protect, getProjectMembers);

// POST /api/projects - Create a new project
router.post(
  "/",
  protect, // Keep protected
  upload.single("projectImageFile"),
  createProject
);

// PUT /api/projects/:id - Update a project by ID (Owner only logic likely in controller)
router.put(
  "/:id",
  protect, // Keep protected
  upload.single("projectImageFile"),
  updateProject
);

// DELETE /api/projects/:id - Delete a project by ID (Owner only logic likely in controller)
router.delete(
  "/:id",
  protect, // Keep protected
  deleteProject
);

// --- ADMIN ROUTES (Optional - Require Login and Admin Role) ---
// Example Admin Route (Uncomment if needed and implemented)
// router.get("/admin/all", protect, adminOnly, adminGetAllProjects);

export default router;
