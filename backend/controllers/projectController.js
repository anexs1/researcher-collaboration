// controllers/projectController.js
import Project from "../models/projectModel.js";

const getProjects = async (req, res) => {
  try {
    const projects = await Project.getAll();
    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch projects",
    });
  }
};
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      status = "Ongoing",
      collaborators = [],
      tags = [],
      dueDate = null,
    } = req.body;

    // Validate required fields
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
        fields: {
          title: !title?.trim(),
          description: !description?.trim(),
        },
      });
    }

    // Validate array types
    if (!Array.isArray(collaborators) || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: "Collaborators and tags must be arrays",
      });
    }

    // Create project
    const newProject = await Project.create({
      title: title.trim(),
      description: description.trim(),
      status,
      collaborators,
      tags,
      dueDate,
    });

    res.status(201).json({
      success: true,
      data: newProject,
    });
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message.includes("required")
        ? error.message
        : "Failed to create project. Please try again.",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, collaborators, tags, dueDate } =
      req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // Basic validation
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const updatedProject = await Project.update(id, {
      title: title.trim(),
      description: description.trim(),
      status: status || "Ongoing",
      collaborators: collaborators || [],
      tags: tags || [],
      dueDate: dueDate || null,
    });

    res.status(200).json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update project",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    await Project.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting project:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete project",
    });
  }
};

export default {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
};
