import express from "express";
import researchController from "../controllers/researchController.js";

const router = express.Router();

// Route for getting all research
router.get("/", researchController.getAllResearch);

// Route for getting a research entry by ID
router.get("/:id", researchController.getResearchById);

// Route for searching and filtering research based on field and keyword
router.get("/search/filter", researchController.searchAndFilterResearch);

export default router;
