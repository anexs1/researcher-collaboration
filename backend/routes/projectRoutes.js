// backend/routes/projectRoutes.js
import express from "express";
import * as projectController from "../controllers/projectController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Regular user routes
router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.post("/", projectController.createProject);

// Admin-only routes
router.put("/:id", adminOnly, projectController.updateProject);
router.delete("/:id", adminOnly, projectController.deleteProject);

export default router;
