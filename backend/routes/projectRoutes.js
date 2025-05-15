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
  adminGetAllProjects, // Assuming this was correctly imported from your controller
  getProjectsByUserId, // <<<=== NEWLY ADDED IMPORT
} from "../controllers/projectController.js";
// Import optionalProtect as well
import {
  protect,
  optionalProtect,
  adminOnly, // Assuming this is your admin middleware from authMiddleware.js
} from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    // For Multer, it's better to pass a MulterError or a custom error that your error handler can identify
    // cb(new Error("Invalid file type. Only images allowed."), false); // This works but...
    // Using MulterError or a specific error code can be more structured for error handling middleware
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
router.get("/", optionalProtect, getAllProjects);

// GET /api/projects/user/:userId - View projects for a specific user << NEW ROUTE
// Added (\\d+) to ensure userId is numeric and avoid conflict with other string-based routes
router.get("/user/:userId(\\d+)", optionalProtect, getProjectsByUserId);

// GET /api/projects/:id - View a single project by ID
// Added (\\d+) to ensure id is numeric
router.get("/:id(\\d+)", optionalProtect, getProjectById);

// --- PROTECTED ROUTES (Require Login via 'protect' middleware) ---
// GET /api/projects/my - View projects created/joined by the logged-in user
router.get("/my", protect, getMyProjects);

// GET /api/projects/:projectId/requests - View join requests for a specific project
// Added (\\d+) to ensure projectId is numeric
router.get("/:projectId(\\d+)/requests", protect, getProjectRequests);

// GET /api/projects/:projectId/members - View members of a specific project
// Added (\\d+) to ensure projectId is numeric
router.get("/:projectId(\\d+)/members", protect, getProjectMembers);

// POST /api/projects - Create a new project
router.post("/", protect, upload.single("projectImageFile"), createProject);

// PUT /api/projects/:id - Update a project by ID
// Added (\\d+) to ensure id is numeric
router.put(
  "/:id(\\d+)",
  protect,
  upload.single("projectImageFile"),
  updateProject
);

// DELETE /api/projects/:id - Delete a project by ID
// Added (\\d+) to ensure id is numeric
router.delete("/:id(\\d+)", protect, deleteProject);

// --- ADMIN ROUTES (Example - Require Login and Admin Role) ---
// This was commented out in your provided routes, uncomment if you intend to use it
// router.get("/admin/all", protect, adminOnly, adminGetAllProjects);

// --- Multer Error Handling Middleware (Specific to this router) ---
// Placed at the end of this router to catch multer-specific errors from routes above
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(
      "Multer Error in Project Routes:",
      err.message,
      "Field:",
      err.field
    );
    let message = "File upload error: " + err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Maximum size is 5MB.";
    } else if (
      err.code === "LIMIT_UNEXPECTED_FILE" &&
      err.message === "Invalid file type. Only images allowed."
    ) {
      // This is the custom message we set in fileFilter for wrong type
      message = "Invalid file type. Only images (e.g., JPEG, PNG) are allowed.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message =
        "Unexpected file field or too many files. Ensure you are uploading to 'projectImageFile'.";
    }
    return res.status(400).json({ success: false, message });
  }
  // If it's not a multer error, pass it to the next error handler (e.g., global error handler in server.js)
  next(err);
});

export default router;
