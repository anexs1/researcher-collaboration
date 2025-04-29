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
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.memoryStorage(); // Store file in memory buffer
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    // Use specific error object for multer
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

router.get("/", protect, getAllProjects);
router.get("/my", protect, getMyProjects);
router.get("/:id", protect, getProjectById);
router.get("/:projectId/requests", protect, getProjectRequests);
router.get("/:projectId/members", protect, getProjectMembers);

// POST /api/projects - Create a new project
router.post(
  "/",
  protect,
  upload.single("projectImageFile"), // <<< Use multer middleware
  createProject
);

// PUT /api/projects/:id - Update a project by ID (Owner only)
router.put(
  "/:id",
  protect,
  upload.single("projectImageFile"), // <<< Use multer middleware
  updateProject
);

// DELETE /api/projects/:id - Delete a project by ID (Owner only)
router.delete("/:id", protect, deleteProject);

// Example Admin Route (Uncomment if needed and implemented)
// router.get("/admin/all", protect, adminOnly, adminGetAllProjects);

export default router;
