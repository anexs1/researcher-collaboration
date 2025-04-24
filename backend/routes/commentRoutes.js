// backend/routes/commentRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Auth middleware
import { adminOnly } from "../middleware/authMiddleware.js"; // Optional: Admin middleware
import {
  // Note: getCommentsForPublication is usually nested under publications route
  createComment,
  deleteComment,
  // updateComment // If you implement update
} from "../controllers/commentController.js";

const router = express.Router({ mergeParams: true }); // mergeParams allows access to :publicationId from parent router

// --- Routes specific to /api/comments ---

// DELETE /api/comments/:commentId (Requires login, owner or admin check done in controller)
router.delete("/:commentId", protect, deleteComment);

// PUT /api/comments/:commentId (Requires login, owner check done in controller)
// router.put('/:commentId', protect, updateComment); // Example for editing

// --- Routes nested under publications ---
// These are defined in publicationRoutes.js

export default router;
