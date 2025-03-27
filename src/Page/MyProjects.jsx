// MyProjects.js (or wherever you render the projects)
import React, { useState, useEffect, useCallback } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSpinner,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import axios from "axios"; // Import Axios for API calls
import "../index.css";

const MyProjects = ({ isLoggedIn }) => {
  //  Receive isLoggedIn as a prop
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
  const API_ENDPOINT = "http://localhost:5000/api/myprojects"; //Fixed to follow standard

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
        setLoading(true);
        await axios.delete(`${API_ENDPOINT}/${id}`);
        fetchProjects(); // Refresh project list
      } catch (err) {
        console.error("Error deleting project:", err);
        setError(err.message || "Failed to delete project.");
      } finally {
        setLoading(false);
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

      const response = selectedProject
        ? await axios.put(`${API_ENDPOINT}/${selectedProject.id}`, formData)
        : await axios.post(API_ENDPOINT, formData);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data.message || "Failed to save project.");
      }

      setIsModalOpen(false);
      fetchProjects(); // Refresh project list
    } catch (err) {
      console.error("Error saving project:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to save project."
      );
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
    <div className="container mx-auto p-4">
      <h2 className="title text-2xl font-semibold mb-4 text-gray-800">
        My Research Projects
      </h2>

      {/* Error Message */}
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mb-4">
          {error}
        </div>
      )}

      {/* Tabs for Ongoing and Completed Projects */}
      <div className="tabs flex space-x-2 mb-4">
        <button
          className={`tab px-4 py-2 rounded-md ${
            activeTab === "ongoing"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing Projects
        </button>
        <button
          className={`tab px-4 py-2 rounded-md ${
            activeTab === "completed"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Projects
        </button>
      </div>

      {/* Conditionally Render the "Add New Project" Button */}
      {isLoggedIn && (
        <button
          className="add-project-btn bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
          onClick={handleAddProject}
        >
          Add New Project
        </button>
      )}

      {/* Project List */}
      {loading ? (
        <div className="loading text-center py-4 text-gray-600">
          Loading projects... <FaSpinner className="spinner animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <p className="empty-message text-gray-500">
          No projects found in this category.
        </p>
      ) : (
        <div className="project-grid grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="project-card bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4">
                <h3 className="project-title text-xl font-semibold text-gray-800 mb-2">
                  {project.title}
                </h3>
                <p className="project-description text-gray-700">
                  {project.description}
                </p>

                <p className="collaborators text-gray-600 mt-2">
                  <strong>Collaborators:</strong>{" "}
                  {project.collaborators.join(", ")}
                </p>

                <div className="button-group flex space-x-2 mt-4">
                  <button
                    className="btn view bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded"
                    onClick={() => handleViewProject(project)}
                  >
                    <FaEye className="mr-1" /> View
                  </button>
                  {/*
                  <button className="btn invite">
                    <FaUserPlus /> Invite
                  </button>
                  */}
                  {/* Conditionally Render Edit and Delete Buttons */}
                  {isLoggedIn && (
                    <>
                      <button
                        className="btn edit bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-3 rounded"
                        onClick={() => handleEditProject(project)}
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                      <button
                        className="btn delete bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating/Editing Projects */}
      {isModalOpen && (
        <div className="modal fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-content bg-white rounded-lg p-6 w-full max-w-md">
            <span
              className="close absolute top-2 right-2 text-gray-500 hover:text-gray-800 cursor-pointer text-2xl"
              onClick={handleCloseModal}
            >
              ×
            </span>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {selectedProject ? "Edit Project" : "Add New Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Title:
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Description:
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Status:
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="collaborators"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Collaborators:
                </label>
                <div className="collaborator-input-group flex">
                  <input
                    type="text"
                    id="collaborators"
                    placeholder="Enter collaborator name"
                    value={collaboratorInput}
                    onChange={(e) => setCollaboratorInput(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={handleAddCollaborator}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
                  >
                    Add
                  </button>
                </div>
                <ul className="collaborator-list list-none mt-2">
                  {formData.collaborators.map((collaborator) => (
                    <li
                      key={collaborator}
                      className="collaborator-item bg-gray-100 rounded-full px-3 py-1 inline-flex items-center justify-between mr-2 mb-1"
                    >
                      {collaborator}
                      <button
                        type="button"
                        onClick={() => handleRemoveCollaborator(collaborator)}
                        className="remove-collaborator text-red-500 hover:text-red-700 ml-2 focus:outline-none"
                      >
                        <FaTimes />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  className="submit-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {loading ? (
                    <>
                      Saving... <FaSpinner className="spinner animate-spin" />
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-1" /> Save Project
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="cancel-button bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
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
