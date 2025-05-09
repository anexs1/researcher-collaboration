// backend/routes/publicationRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPublication,
  getMyPublications,
  getPublicationById,
  updatePublication,
  deletePublication,
  getExplorePublications,
  toggleBookmark,
  incrementDownloadCount, // 🆕 Import new controller function
  // ratePublication, // Import if you implement it
} from "../controllers/publicationController.js";

import {
  getCommentsForPublication,
  createComment,
} from "../controllers/commentController.js";

const router = express.Router();

// --- Public Routes ---
router.get("/explore", getExplorePublications);
router.get("/:id", getPublicationById);
router.patch("/:id/download", incrementDownloadCount); // 🆕 Route for incrementing download count

// --- Nested Comment Routes ---
router.get("/:publicationId/comments", getCommentsForPublication);

// --- Protected Routes ---
router.post("/", protect, createPublication);
router.get("/my-publications", protect, getMyPublications);
router.put("/:id", protect, updatePublication);
router.delete("/:id", protect, deletePublication);
router.post("/:publicationId/comments", protect, createComment);
router.patch("/:id/bookmark", protect, toggleBookmark);
// router.patch("/:id/rate", protect, ratePublication); // 🆕 Example route for rating (if implemented)

export default router;
