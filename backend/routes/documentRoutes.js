// backend/routes/documentRoutes.js
import express from "express";
import {
  createDocument,
  getDocumentById,
  updateDocumentContent,
  listDocuments,
} from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js"; // Use your existing protect middleware

const router = express.Router();

router.route("/").post(protect, createDocument).get(protect, listDocuments); // To list documents (e.g., owned by user)

router
  .route("/:id")
  .get(protect, getDocumentById)
  .put(protect, updateDocumentContent); // For saving document changes

// Optional: If you want to list documents under a project
// You might put this in projectRoutes.js:
// router.route('/:projectId/documents').get(protect, listProjectDocumentsControllerFn);

export default router;
