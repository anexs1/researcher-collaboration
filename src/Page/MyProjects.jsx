import React, { useState, useEffect, useCallback } from "react";
import {
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSpinner,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import "./MyProjects.css"; // Import CSS file
import axios from "axios"; // Import Axios for API calls

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("ongoing");
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [selectedProject, setSelectedProject] = useState(null); // Project for detailed view/editing
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state for detailed view/editing
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Ongoing",
    collaborators: [],
  }); // Form data for creating/editing projects
  const [collaboratorInput, setCollaboratorInput] = useState(""); // Input for adding collaborators

  // API Endpoint (replace with your actual API endpoint)
  const API_ENDPOINT = "http://localhost:5000/api/my-projects";

  // Function to fetch projects from the API
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_ENDPOINT);
      if (response.status !== 200) {
        throw new Error(`Failed to fetch projects: HTTP ${response.status}`);
      }
      setProjects(response.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, [API_ENDPOINT]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Function to handle adding a new project
  const handleAddProject = () => {
    setSelectedProject(null);
    setFormData({
      title: "",
      description: "",
      status: "Ongoing",
      collaborators: [],
    });
    setIsModalOpen(true);
  };

  // Function to handle editing a project
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      status: project.status,
      collaborators: [...project.collaborators], // Create a copy to avoid modifying the original
    });
    setIsModalOpen(true);
  };

  // Function to handle deleting a project
  const handleDeleteProject = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await axios.delete(`${API_ENDPOINT}/${id}`);
        fetchProjects(); // Refresh project list
      } catch (err) {
        console.error("Error deleting project:", err);
        setError(err.message || "Failed to delete project.");
      }
    }
  };

  // Function to handle viewing a project
  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Function to handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Function to add a collaborator
  const handleAddCollaborator = () => {
    if (
      collaboratorInput &&
      !formData.collaborators.includes(collaboratorInput)
    ) {
      setFormData({
        ...formData,
        collaborators: [...formData.collaborators, collaboratorInput],
      });
      setCollaboratorInput("");
    }
  };

  // Function to remove a collaborator
  const handleRemoveCollaborator = (collaborator) => {
    setFormData({
      ...formData,
      collaborators: formData.collaborators.filter((c) => c !== collaborator),
    });
  };

  // Function to handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (selectedProject) {
        // Update existing project
        await axios.put(`${API_ENDPOINT}/${selectedProject.id}`, formData);
      } else {
        // Create a new project
        await axios.post(API_ENDPOINT, formData);
      }

      setIsModalOpen(false);
      fetchProjects(); // Refresh project list
    } catch (err) {
      console.error("Error saving project:", err);
      setError(err.message || "Failed to save project.");
    } finally {
      setLoading(false);
    }
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // Filter projects by status
  const filteredProjects = projects.filter((project) =>
    activeTab === "ongoing"
      ? project.status === "Ongoing"
      : project.status === "Completed"
  );

  return (
    <div className="container">
      <h2 className="title">My Research Projects</h2>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Tabs for Ongoing and Completed Projects */}
      <div className="tabs">
        <button
          className={activeTab === "ongoing" ? "tab active" : "tab"}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing Projects
        </button>
        <button
          className={activeTab === "completed" ? "tab active" : "tab"}
          onClick={() => setActiveTab("completed")}
        >
          Completed Projects
        </button>
      </div>

      {/* Add Project Button */}
      <button className="add-project-btn" onClick={handleAddProject}>
        Add New Project
      </button>

      {/* Project List */}
      {loading ? (
        <div className="loading">
          Loading projects... <FaSpinner className="spinner" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <p className="empty-message">No projects found in this category.</p>
      ) : (
        <div className="project-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>

              <p className="collaborators">
                <strong>Collaborators:</strong>{" "}
                {project.collaborators.join(", ")}
              </p>

              <div className="button-group">
                <button
                  className="btn view"
                  onClick={() => handleViewProject(project)}
                >
                  <FaEye /> View
                </button>
                {/*
                <button className="btn invite">
                  <FaUserPlus /> Invite
                </button>
                */}
                <button
                  className="btn edit"
                  onClick={() => handleEditProject(project)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="btn delete"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating/Editing Projects */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>
              ×
            </span>
            <h2>{selectedProject ? "Edit Project" : "Add New Project"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="collaborators">Collaborators:</label>
                <div className="collaborator-input-group">
                  <input
                    type="text"
                    id="collaborators"
                    placeholder="Enter collaborator name"
                    value={collaboratorInput}
                    onChange={(e) => setCollaboratorInput(e.target.value)}
                  />
                  <button type="button" onClick={handleAddCollaborator}>
                    Add
                  </button>
                </div>
                <ul className="collaborator-list">
                  {formData.collaborators.map((collaborator) => (
                    <li key={collaborator} className="collaborator-item">
                      {collaborator}
                      <button
                        type="button"
                        onClick={() => handleRemoveCollaborator(collaborator)}
                        className="remove-collaborator"
                      >
                        <FaTimes />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="form-group">
                <button type="submit" className="submit-button">
                  {loading ? (
                    <>
                      Saving... <FaSpinner className="spinner" />
                    </>
                  ) : (
                    <>
                      <FaCheck /> Save Project
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
