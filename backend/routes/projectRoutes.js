// routes/projectRoutes.js
import express from "express";
import projectController from "../controllers/projectController.js"; // Add .js extension

const router = express.Router();

router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.post("/", projectController.createProject);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

export default router; // Use default export
