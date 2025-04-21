// File: backend/routes/projectRoutes.js

import express from "express";
import projectController from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js"; // Assuming you have this middleware

const router = express.Router();

// GET /api/projects - Get projects for the logged-in user (owned or collaborator)
router.get("/", protect, projectController.getProjects);

// GET /api/projects/:projectId - Get a single project by its ID
// *** CHANGE PARAM NAME HERE TO MATCH CONTROLLER ***
router.get("/:projectId", protect, projectController.getProjectById);

// POST /api/projects - Create a new project
router.post("/", protect, projectController.createProject);

// PUT /api/projects/:projectId - Update a specific project
// *** CHANGE PARAM NAME HERE TO MATCH CONTROLLER ***
router.put("/:projectId", protect, projectController.updateProject);

// DELETE /api/projects/:projectId - Delete a specific project
// *** CHANGE PARAM NAME HERE TO MATCH CONTROLLER ***
router.delete("/:projectId", protect, projectController.deleteProject);

export default router;
