import express from "express";
import multer from "multer";
import {
  getAllProjects,
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectRequests,
  getProjectMembers,
  adminGetAllProjects,
} from "../controllers/projectController.js";
// Import optionalProtect as well
import {
  protect,
  optionalProtect,
  adminOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Multer Configuration ---
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

// --- PUBLIC / OPTIONALLY AUTHENTICATED ROUTES ---
// GET /api/projects - View all projects
// optionalProtect will set req.user if a valid token is present, otherwise req.user is null.
router.get("/", optionalProtect, getAllProjects); // <<< CORRECTED: Use optionalProtect

// GET /api/projects/:id - View a single project by ID
router.get("/:id", optionalProtect, getProjectById); // <<< CORRECTED: Use optionalProtect

// --- PROTECTED ROUTES (Require Login via 'protect' middleware) ---
// GET /api/projects/my - View projects created/joined by the logged-in user
router.get("/my", protect, getMyProjects);

// GET /api/projects/:projectId/requests - View join requests for a specific project
router.get("/:projectId/requests", protect, getProjectRequests);

// GET /api/projects/:projectId/members - View members of a specific project
router.get("/:projectId/members", protect, getProjectMembers);

// POST /api/projects - Create a new project
router.post("/", protect, upload.single("projectImageFile"), createProject);

// PUT /api/projects/:id - Update a project by ID
router.put("/:id", protect, upload.single("projectImageFile"), updateProject);

// DELETE /api/projects/:id - Delete a project by ID
router.delete("/:id", protect, deleteProject);

// --- ADMIN ROUTES (Example - Require Login and Admin Role) ---
// router.get("/admin/all", protect, adminOnly, adminGetAllProjects);

export default router;
