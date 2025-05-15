import express from "express";
import multer from "multer";

// Import controller functions
import {
  getAllProjects,
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectRequests,
  getProjectMembers,
  adminGetAllProjects, // This import is correct IF adminGetAllProjects is exported from the controller
  getProjectsByUserId,
} from "../controllers/projectController.js";

// Import middleware
import {
  protect,
  optionalProtect,
  adminOnly, // This is your admin-checking middleware
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
        "LIMIT_UNEXPECTED_FILE", // Multer error code for unexpected file type
        "Invalid file type. Only images (e.g., JPEG, PNG) are allowed." // Custom message part
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
router.get("/", optionalProtect, getAllProjects);

// GET /api/projects/user/:userId - View projects for a specific user
// (\\d+) ensures userId is numeric to avoid conflicts
router.get("/user/:userId(\\d+)", optionalProtect, getProjectsByUserId);

// GET /api/projects/:id - View a single project by ID
// (\\d+) ensures id is numeric
router.get("/:id(\\d+)", optionalProtect, getProjectById);

// --- PROTECTED ROUTES (Require Login via 'protect' middleware) ---
// GET /api/projects/my - View projects created/joined by the logged-in user
router.get("/my", protect, getMyProjects);

// GET /api/projects/:projectId/requests - View join requests for a specific project
router.get("/:projectId(\\d+)/requests", protect, getProjectRequests);

// GET /api/projects/:projectId/members - View members of a specific project
router.get("/:projectId(\\d+)/members", protect, getProjectMembers);

// POST /api/projects - Create a new project
router.post("/", protect, upload.single("projectImageFile"), createProject);

// PUT /api/projects/:id - Update a project by ID
router.put(
  "/:id(\\d+)",
  protect,
  upload.single("projectImageFile"),
  updateProject
);

// DELETE /api/projects/:id - Delete a project by ID
router.delete("/:id(\\d+)", protect, deleteProject);

// --- ADMIN ROUTES (Example - Require Login and Admin Role) ---
// If you want to use this route, ensure adminGetAllProjects is implemented beyond a placeholder in your controller.
// If you uncomment this, the import for adminGetAllProjects must be valid (i.e., it's exported from the controller).
router.get("/admin/all", protect, adminOnly, adminGetAllProjects); // <<<< IF YOU USE THIS, THE IMPORT MUST BE VALID

// --- Multer Error Handling Middleware (Specific to this router) ---
// Placed at the end of this router to catch multer-specific errors from routes above
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(
      "Multer Error in Project Routes:",
      err.message,
      "Field:",
      err.field // This field property is useful for debugging
    );
    let message = "File upload error: " + err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Maximum size is 5MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      // Check if our custom message part is in err.message
      if (err.message.includes("Invalid file type. Only images allowed.")) {
        message =
          "Invalid file type. Only images (e.g., JPEG, PNG) are allowed.";
      } else {
        message =
          "Unexpected file field or too many files. Ensure you are uploading to 'projectImageFile'.";
      }
    }
    return res
      .status(400)
      .json({ success: false, message: message, code: err.code });
  }
  // If it's not a multer error, pass it to the next error handler (e.g., global error handler in server.js)
  next(err);
});

export default router;
