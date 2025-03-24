const express = require("express");
const projectController = require("../controllers/projectController.js");

const router = express.Router();

router.get("/", projectController.getProjects);
router.post("/", projectController.createProject);
router.put("/:requestId", projectController.updateProject);
router.delete("/:requestId", projectController.deleteProject);

module.exports = router;
