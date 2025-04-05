// routes/projectRoutes.js
import express from "express"; // Use standard import if not already
import projectController from "../controllers/projectController.js";

const router = express.Router(); // Use express.Router()

// GET /api/myprojects - Get all projects
router.get("/", projectController.getProjects);

// POST /api/myprojects - Create a new project
router.post("/", projectController.createProject);

// PUT /api/myprojects/:id - Update a project by ID
router.put("/:id", projectController.updateProject); // Changed :requestId to :id

// DELETE /api/myprojects/:id - Delete a project by ID
router.delete("/:id", projectController.deleteProject); // Changed :requestId to :id

export default router;
