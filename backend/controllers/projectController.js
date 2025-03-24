const Project = require("../models/projectModel");

const getProjects = async (req, res) => {
  try {
    const projects = await Project.getAll();
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, status, collaborators } = req.body;
    const project = await Project.create(
      title,
      description,
      status,
      collaborators
    );
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { title, description, status, collaborators } = req.body;
    const project = await Project.update(
      requestId,
      title,
      description,
      status,
      collaborators
    );
    res.json({ message: "Project updated successfully", project });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { requestId } = req.params;
    await Project.delete(requestId);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
};
