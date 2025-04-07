// routes/publicationRoutes.js
import express from "express";
import * as publicationController from "../controllers/publicationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Routes ---

// GET /api/publications/ -> Get ALL publications (public) OR Filtered (e.g., by user)
// The controller will handle filtering based on query params or auth
router.get("/", publicationController.getAllPublications); // Keep this for public view if needed

// GET /api/publications/my-publications -> Get ONLY the logged-in user's publications
router.get(
  "/my-publications",
  protect,
  publicationController.getMyPublications
); // USE THIS ENDPOINT

// GET /api/publications/:id -> Get ONE specific publication by ID
router.get("/:id", publicationController.getPublicationById);

// POST /api/publications/ -> Create a new publication
router.post("/", protect, publicationController.createPublication);

// PUT /api/publications/:id -> Update a specific publication
router.put("/:id", protect, publicationController.updatePublication);

// DELETE /api/publications/:id -> Delete a specific publication
router.delete("/:id", protect, publicationController.deletePublication);

export default router;
