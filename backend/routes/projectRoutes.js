import express from "express";
import projectController from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/projects - Get projects for the logged-in user
router.get("/", protect, projectController.getProjects);

// GET /api/projects/:id - Get a single project (if owner or collaborator)
router.get("/:id", protect, projectController.getProjectById);

// POST /api/projects - Create a new project
router.post("/", protect, projectController.createProject);

// PUT /api/projects/:id - Update a specific project
router.put("/:id", protect, projectController.updateProject);

// DELETE /api/projects/:id - Delete a specific project
router.delete("/:id", protect, projectController.deleteProject);

export default router;
