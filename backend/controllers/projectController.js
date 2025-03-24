import Project from "../models/projectModel.js";

const getProjects = async (req, res) => {
  try {
    const projects = await Project.getAll();
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch projects" });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, status, collaborators } = req.body;

    // Validate inputs
    if (!title || !description || !status || !collaborators) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!Array.isArray(collaborators)) {
      return res.status(400).json({ error: "Collaborators must be an array." });
    }

    if (!["Ongoing", "Completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const project = await Project.create(
      title,
      description,
      status,
      collaborators
    );
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    console.error("Error creating project:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create project" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, collaborators } = req.body;
    const project = await Project.update(
      id,
      title,
      description,
      status,
      collaborators
    );
    res.json({ message: "Project updated successfully", project });
  } catch (error) {
    console.error("Error updating project:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to update project" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await Project.delete(id);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to delete project" });
  }
};

export default {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
};
