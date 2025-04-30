import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Import your authentication middleware
import {
  createPublication,
  getMyPublications,
  getPublicationById,
  updatePublication,
  deletePublication,
  getExplorePublications, // Public explore endpoint
  toggleBookmark, // <<< IMPORT the new bookmark handler
  // clonePublication, // Import if/when implemented
  // Admin functions - Keep separate if using admin routes
  // adminGetAllPublications,
  // adminDeletePublication,
} from "../controllers/publicationController.js";

// *** Import comment controller functions ***
import {
  getCommentsForPublication,
  createComment,
} from "../controllers/commentController.js"; // Assuming this exists

// Optional: Import admin-specific middleware if needed
// import { adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes ---
// These generally do not need the 'protect' middleware
router.get("/explore", getExplorePublications); // GET /api/publications/explore
router.get("/:id", getPublicationById); // GET /api/publications/:id

// --- ** NESTED COMMENT ROUTES for a specific Publication ** ---
// GET /api/publications/:publicationId/comments (Fetch comments for a publication)
// This can be public or protected depending on your needs
router.get("/:publicationId/comments", getCommentsForPublication);

// --- Protected Routes (Require Authentication via 'protect' middleware) ---

router.post("/", protect, createPublication); // POST /api/publications
router.get("/my-publications", protect, getMyPublications); // GET /api/publications/my-publications
router.put("/:id", protect, updatePublication); // PUT /api/publications/:id
router.delete("/:id", protect, deletePublication); // DELETE /api/publications/:id

// POST /api/publications/:publicationId/comments (Requires login to post)
router.post("/:publicationId/comments", protect, createComment);

// --- Bookmark Route ---
router.patch("/:id/bookmark", protect, toggleBookmark); // <<< ADDED/ENABLED THIS ROUTE

// --- Optional Clone Route (Requires Implementation) ---
// router.post('/:id/clone', protect, clonePublication);       // POST /api/publications/:id/clone

export default router;
