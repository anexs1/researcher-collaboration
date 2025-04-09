// routes/publicationRoutes.js
import express from "express";
import * as publicationController from "../controllers/publicationController.js";
// Assuming 'protect' is your middleware for checking JWT authentication
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Routes ---

// GET /api/publications/explore -> Get publications for the Explore page (filtered, sorted etc)
// Use protect if exploring requires login, otherwise leave it public/semi-public
router.get("/explore", protect, publicationController.getExplorePublications); // ADDED ROUTE FOR EXPLORE

// GET /api/publications/ -> Get ALL publications (less useful for explore, maybe for a general feed)
router.get("/", publicationController.getAllPublications);

// GET /api/publications/my-publications -> Get ONLY the logged-in user's publications
router.get(
  "/my-publications",
  protect,
  publicationController.getMyPublications
);

// GET /api/publications/:id -> Get ONE specific publication by ID
router.get("/:id", publicationController.getPublicationById);

// POST /api/publications/ -> Create a new publication
router.post("/", protect, publicationController.createPublication);

// PUT /api/publications/:id -> Update a specific publication
router.put("/:id", protect, publicationController.updatePublication);

// DELETE /api/publications/:id -> Delete a specific publication
router.delete("/:id", protect, publicationController.deletePublication);

export default router;
