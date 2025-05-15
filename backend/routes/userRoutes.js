import express from "express";
import multer from "multer";
import {
  protect,
  adminOnly, // Changed 'admin' to 'adminOnly'
} from "../middleware/authMiddleware.js";

// Import ALL controller functions used in this file
import {
  getUserPublicProfile,
  getDiscoverableUsers, // For the explore page
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  getSelectableUsers,
  getUserActivity,
  adminGetAllUsers,
  adminGetPendingUsers,
  adminGetUserById,
  adminUpdateUserStatus,
  adminUpdateUserRole,
  adminDeleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// --- Multer Configuration for Profile Pictures ---
const storage = multer.memoryStorage(); // Using memory storage
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."), false);
  }
};
const uploadProfilePic = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
// --- End Multer Configuration ---

// === PUBLIC ROUTES ===
// No 'protect' or 'adminOnly' middleware
router.get("/public/:userId", getUserPublicProfile);
router.get("/discoverable", getDiscoverableUsers); // Explore page route

// === AUTHENTICATED USER ROUTES ('ME' ROUTES) ===
// These routes require the user to be logged in (via 'protect' middleware)

// Profile update: uses multer for profileImageFile, then protect, then controller
router.put(
  "/profile", // Endpoint for logged-in user to update their own profile
  protect,
  uploadProfilePic.single("profileImageFile"), // 'profileImageFile' is the field name from form-data
  updateUserProfile
);

router.put("/me/email", protect, updateUserEmail);
router.put("/me/password", protect, updateUserPassword);
router.get("/selectable", protect, getSelectableUsers); // For dropdowns, etc.
router.get("/:userId/activity", protect, getUserActivity); // User getting their own or admin getting any

// === ADMIN ROUTES ===
// These routes require the user to be logged in AND have an 'admin' role
// (via 'protect' and 'adminOnly' middleware)

router.get("/admin/all", protect, adminOnly, adminGetAllUsers);
router.get("/admin/pending", protect, adminOnly, adminGetPendingUsers);
router.get("/admin/:id", protect, adminOnly, adminGetUserById); // Get specific user details
router.put("/admin/:id/status", protect, adminOnly, adminUpdateUserStatus); // Update user status
router.put("/admin/:id/role", protect, adminOnly, adminUpdateUserRole); // Update user role
router.delete("/admin/:id", protect, adminOnly, adminDeleteUser); // Delete a user

// --- Multer Error Handling Middleware (Specific to this router) ---
// This should be placed after all routes that use multer if you want to catch its errors
// Or you can handle multer errors within each controller.
// For a more global approach, you'd put it in your main server.js error handlers.
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    console.error("Multer Error:", err.message, "Field:", err.field);
    let message = "File upload error: " + err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Maximum size is 5MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message =
        "Unexpected file field. Ensure you are using 'profileImageFile'.";
    }
    return res.status(400).json({ success: false, message });
  } else if (
    err &&
    err.message === "Invalid file type. Only images are allowed."
  ) {
    // Custom error from our fileFilter
    console.error("File Type Error:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
  // If it's not a multer error or our custom file type error, pass it on
  next(err);
});

export default router;
