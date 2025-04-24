// backend/routes/publicationRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Import your authentication middleware
import {
  createPublication,
  // getAllPublications, // Can remove if not used, or keep for potential future use
  getMyPublications, // <-- CORRECTED IMPORT NAME
  getPublicationById,
  updatePublication,
  deletePublication,
  getExplorePublications, // Public explore endpoint
  // Import bookmark/clone controllers if they exist
  // updateBookmarkStatus,
  // clonePublication,
} from "../controllers/publicationController.js";

// Optional: Import admin-specific middleware if needed
// import { adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes ---
// These generally do not need the 'protect' middleware
router.get("/explore", getExplorePublications); // Public explore/search endpoint (e.g., /api/publications/explore)
router.get("/:id", getPublicationById); // Public view for a single publication by ID (e.g., /api/publications/123)

// --- Protected Routes (Require Authentication via 'protect' middleware) ---

router.post("/", protect, createPublication); // CREATE a new publication (POST /api/publications)

// ** CORRECTED ROUTE for fetching OWN publications **
router.get("/my-publications", protect, getMyPublications); // GET /api/publications/my-publications

router.put("/:id", protect, updatePublication); // UPDATE a specific publication (PUT /api/publications/123)
router.delete("/:id", protect, deletePublication); // DELETE a specific publication (DELETE /api/publications/123)

// --- Optional Protected Routes ---
// router.patch('/:id/bookmark', protect, updateBookmarkStatus); // Example: PATCH /api/publications/123/bookmark
// router.post('/:id/clone', protect, clonePublication);       // Example: POST /api/publications/123/clone

// --- Note on Admin Routes ---
// Admin-specific routes (like deleting *any* publication) are usually better
// placed in adminRoutes.js and mounted under /api/admin prefix for clarity.
// Example if kept here:
// router.delete('/admin/:id', protect, adminOnly, adminDeletePublication); // Requires adminOnly middleware

export default router;
