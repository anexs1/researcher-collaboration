// controllers/projectController.js
import projectModel from "../models/projectModel.js"; // Add .js extension

const projectController = {
  getAllProjects: async (req, res) => {
    try {
      const projects = await projectModel.getAllProjects();
      res.json(projects);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to get projects" });
    }
  },

  getProjectById: async (req, res) => {
    const { id } = req.params;
    try {
      const project = await projectModel.getProjectById(id);
      if (project) {
        res.json(project);
      } else {
        res.status(404).json({ error: "Project not found" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to get project" });
    }
  },

  createProject: async (req, res) => {
    try {
      const projectId = await projectModel.createProject(req.body);
      res
        .status(201)
        .json({ id: projectId, message: "Project created successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create project" });
    }
  },

  updateProject: async (req, res) => {
    const { id } = req.params;
    try {
      await projectModel.updateProject(id, req.body);
      res.json({ message: "Project updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update project" });
    }
  },

  deleteProject: async (req, res) => {
    const { id } = req.params;
    try {
      await projectModel.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete project" });
    }
  },
};

export default projectController; // Use default export
