import express from "express";
import projectController from "../controllers/projectController.js";

const router = express();

router.get("/", projectController.getProjects);
router.post("/", projectController.createProject);
router.put("/:requestId", projectController.updateProject);
router.delete("/:requestId", projectController.deleteProject);

export default router;
