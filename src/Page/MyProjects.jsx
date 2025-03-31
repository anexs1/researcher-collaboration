// src/components/MyProjects.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaPlus,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
} from "react-icons/fa";
import axios from "axios";

import "../index.css"; // Assuming Tailwind is set up here

// --- Helper Components (or import from separate files) ---

// Simple Notification Component
const Notification = ({ message, type, onClose }) => {
  if (!message) return null;
  const baseStyle = "p-4 rounded mb-4 text-sm";
  const typeStyles = {
    success: "bg-green-100 border border-green-400 text-green-700",
    error: "bg-red-100 border border-red-400 text-red-700",
  };
  return (
    <div
      className={`${baseStyle} ${typeStyles[type] || typeStyles.error}`}
      role="alert"
    >
      <span>{message}</span>
      <button onClick={onClose} className="float-right font-bold">
        X
      </button>
    </div>
  );
};

// Simple Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="modal fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="modal-content bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, onAction, isLoggedIn }) => {
  // Limit description length for display
  const shortDescription =
    project.description.length > 100
      ? project.description.substring(0, 100) + "..."
      : project.description;

  return (
    <div className="project-card bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <div className="p-5">
        <h3 className="project-title text-xl font-semibold text-gray-800 mb-2 truncate">
          {project.title}
        </h3>
        <p className="project-description text-gray-600 text-sm mb-3 h-12">
          {shortDescription}
        </p>

        {project.dueDate && (
          <p className="text-xs text-gray-500 mb-1">
            <strong>Due:</strong>{" "}
            {new Date(project.dueDate).toLocaleDateString()}
          </p>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="collaborators text-gray-600 text-sm mt-2 mb-4">
          <strong>Collaborators:</strong>{" "}
          {project.collaborators && project.collaborators.length > 0
            ? project.collaborators.join(", ")
            : "None"}
        </p>

        <div className="button-group flex space-x-2 mt-auto">
          <button
            title="View Details"
            className="btn view bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full text-sm"
            onClick={() => onAction("view", project)}
          >
            <FaEye />
          </button>
          {isLoggedIn && (
            <>
              <button
                title="Edit Project"
                className="btn edit bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full text-sm"
                onClick={() => onAction("edit", project)}
              >
                <FaEdit />
              </button>
              <button
                title="Delete Project"
                className="btn delete bg-red-500 hover:bg-red-600 text-white p-2 rounded-full text-sm"
                onClick={() => onAction("delete", project)}
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Project Form Modal (Simplified - kept inside main component for state management ease in this example)
// A separate component would be cleaner for larger applications.

// --- Main MyProjects Component ---

const MyProjects = ({ isLoggedIn }) => {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("ongoing");
  const [loading, setLoading] = useState({ list: true, action: false }); // More granular loading
  const [notification, setNotification] = useState({ message: "", type: "" }); // For success/error messages
  const [selectedProject, setSelectedProject] = useState(null); // Project for modal/view
  const [modalMode, setModalMode] = useState("add"); // 'add', 'edit', 'view'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc' for title sorting
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Ongoing",
    collaborators: [],
    tags: [], // New field
    dueDate: "", // New field
  });
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [tagInput, setTagInput] = useState(""); // Input for adding tags

  const API_ENDPOINT = "http://localhost:5000/api/myprojects"; // Use environment variable in real app

  // --- API & Data Handling ---

  const fetchProjects = useCallback(async () => {
    setLoading((prev) => ({ ...prev, list: true }));
    setNotification({ message: "", type: "" }); // Clear previous notifications
    try {
      const response = await axios.get(API_ENDPOINT);
      if (response.status !== 200) {
        throw new Error(`HTTP error ${response.status}`);
      }
      // Ensure collaborators and tags are always arrays
      const processedProjects = response.data.map((p) => ({
        ...p,
        collaborators: Array.isArray(p.collaborators) ? p.collaborators : [],
        tags: Array.isArray(p.tags) ? p.tags : [],
      }));
      setProjects(processedProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setNotification({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to load projects.",
        type: "error",
      });
    } finally {
      setLoading((prev) => ({ ...prev, list: false }));
    }
  }, [API_ENDPOINT]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "Ongoing",
      collaborators: [],
      tags: [],
      dueDate: "",
    });
    setCollaboratorInput("");
    setTagInput("");
  };

  const showNotification = (message, type = "error", duration = 4000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), duration);
  };

  // --- Modal & Form Handlers ---

  const handleOpenModal = (mode, project = null) => {
    setModalMode(mode);
    if (mode === "add") {
      resetForm();
      setSelectedProject(null);
    } else if (project) {
      setSelectedProject(project);
      setFormData({
        title: project.title || "",
        description: project.description || "",
        status: project.status || "Ongoing",
        collaborators: [...(project.collaborators || [])],
        tags: [...(project.tags || [])],
        dueDate: project.dueDate
          ? new Date(project.dueDate).toISOString().split("T")[0]
          : "", // Format for date input
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    resetForm(); // Reset form when closing
    // Consider adding focus management back to the triggering button if possible
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Generic handler for adding items to array fields (collaborators, tags)
  const handleAddItemToArray = (item, itemInput, setItemInput, arrayName) => {
    if (item && !formData[arrayName].includes(item)) {
      setFormData((prev) => ({
        ...prev,
        [arrayName]: [...prev[arrayName], item.trim()],
      }));
      setItemInput("");
    }
  };

  // Generic handler for removing items from array fields
  const handleRemoveItemFromArray = (itemToRemove, arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((item) => item !== itemToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, action: true }));
    setNotification({ message: "", type: "" });

    const apiCall =
      modalMode === "edit" && selectedProject
        ? axios.put(`${API_ENDPOINT}/${selectedProject.id}`, formData)
        : axios.post(API_ENDPOINT, formData);

    try {
      const response = await apiCall;
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(
          response.data?.message ||
            `Failed to ${modalMode === "edit" ? "update" : "create"} project.`
        );
      }
      handleCloseModal();
      fetchProjects(); // Refresh project list
      showNotification(
        `Project successfully ${modalMode === "edit" ? "updated" : "created"}!`,
        "success"
      );
    } catch (err) {
      console.error("Error saving project:", err);
      showNotification(
        err.response?.data?.message || err.message || "Failed to save project."
      );
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // --- Delete Handling ---

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsConfirmModalOpen(false);
    setLoading((prev) => ({ ...prev, action: true }));
    setNotification({ message: "", type: "" });

    try {
      const response = await axios.delete(
        `${API_ENDPOINT}/${projectToDelete.id}`
      );
      if (response.status !== 200 && response.status !== 204) {
        // Handle 204 No Content
        throw new Error(response.data?.message || "Failed to delete project.");
      }
      setProjectToDelete(null);
      fetchProjects(); // Refresh project list
      showNotification("Project successfully deleted!", "success");
    } catch (err) {
      console.error("Error deleting project:", err);
      showNotification(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete project."
      );
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setProjectToDelete(null);
  };

  // --- Filtering & Sorting ---

  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Tab filter
        const statusMatch =
          activeTab === "ongoing"
            ? project.status === "Ongoing"
            : project.status === "Completed";
        if (!statusMatch) return false;

        // Search term filter (case-insensitive)
        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          return (
            project.title.toLowerCase().includes(lowerSearchTerm) ||
            project.description.toLowerCase().includes(lowerSearchTerm) ||
            (project.tags &&
              project.tags.some((tag) =>
                tag.toLowerCase().includes(lowerSearchTerm)
              ))
          );
        }
        return true; // No search term, keep project
      })
      .sort((a, b) => {
        // Sort by title
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (sortOrder === "asc") {
          return titleA.localeCompare(titleB);
        } else {
          return titleB.localeCompare(titleA);
        }
      });
  }, [projects, activeTab, searchTerm, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // --- Card Actions ---
  const handleCardAction = (actionType, project) => {
    switch (actionType) {
      case "view":
        handleOpenModal("view", project);
        break;
      case "edit":
        handleOpenModal("edit", project);
        break;
      case "delete":
        handleDeleteClick(project);
        break;
      default:
        console.warn("Unknown card action:", actionType);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the project "${projectToDelete?.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <h2 className="text-2xl md:text-3xl font-semibold mb-5 text-gray-800">
        My Research Projects
      </h2>

      {/* Notifications Area */}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />

      {/* Controls: Tabs, Search, Sort, Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        {/* Tabs */}
        <div className="tabs flex space-x-2">
          <button
            className={`tab px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "ongoing"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("ongoing")}
          >
            Ongoing
          </button>
          <button
            className={`tab px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "completed"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={toggleSortOrder}
            title={`Sort by title ${
              sortOrder === "asc" ? "Descending (Z-A)" : "Ascending (A-Z)"
            }`}
            className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
          </button>
        </div>

        {/* Add Button */}
        {isLoggedIn && (
          <button
            className="add-project-btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-sm flex items-center transition-colors w-full md:w-auto justify-center"
            onClick={() => handleOpenModal("add")}
          >
            <FaPlus className="mr-2" /> Add New Project
          </button>
        )}
      </div>

      {/* Project List */}
      {loading.list ? (
        <div className="loading text-center py-10 text-gray-600 flex items-center justify-center">
          <FaSpinner className="animate-spin mr-2 text-xl" /> Loading
          projects...
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        <p className="empty-message text-center text-gray-500 py-10">
          No projects found matching your criteria.
        </p>
      ) : (
        <div className="project-grid grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedProjects.map((project) => (
            <ProjectCard
              key={project.id || project._id} // Use _id if using MongoDB ID
              project={project}
              onAction={handleCardAction}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}

      {/* Modal for Creating/Editing/Viewing Projects */}
      {/* Note: This modal is still complex. For very large apps, breaking it down further is recommended */}
      {isModalOpen && (
        <div className="modal fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4">
          {/* Added overflow-y-auto for long content */}
          <div className="modal-content bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalMode === "add" && "Add New Project"}
                {modalMode === "edit" && "Edit Project"}
                {modalMode === "view" && "View Project Details"}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-800 text-2xl"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            {/* Read-only view */}
            {modalMode === "view" && selectedProject ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Title:</strong> {selectedProject.title}
                </p>
                <p>
                  <strong>Description:</strong> {selectedProject.description}
                </p>
                <p>
                  <strong>Status:</strong> {selectedProject.status}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {selectedProject.dueDate
                    ? new Date(selectedProject.dueDate).toLocaleDateString()
                    : "Not set"}
                </p>
                <p>
                  <strong>Collaborators:</strong>{" "}
                  {selectedProject.collaborators?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Tags:</strong>
                  {selectedProject.tags && selectedProject.tags.length > 0 ? (
                    <span className="ml-2">
                      {selectedProject.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mr-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : (
                    " None"
                  )}
                </p>
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    className="cancel-button bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Form for Add/Edit */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-gray-700 text-sm font-bold mb-1"
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
                    className="form-input"
                  />
                </div>
                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-gray-700 text-sm font-bold mb-1"
                  >
                    Description:
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="form-input"
                  ></textarea>
                </div>
                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-gray-700 text-sm font-bold mb-1"
                  >
                    Status:
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    {/* Add other statuses if needed: Planning, On Hold, etc. */}
                  </select>
                </div>
                {/* Due Date */}
                <div>
                  <label
                    htmlFor="dueDate"
                    className="block text-gray-700 text-sm font-bold mb-1"
                  >
                    Due Date (Optional):
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                {/* Collaborators */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">
                    Collaborators:
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      placeholder="Add collaborator email or name"
                      value={collaboratorInput}
                      onChange={(e) => setCollaboratorInput(e.target.value)}
                      className="form-input flex-grow mr-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddItemToArray(
                            collaboratorInput,
                            collaboratorInput,
                            setCollaboratorInput,
                            "collaborators"
                          );
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleAddItemToArray(
                          collaboratorInput,
                          collaboratorInput,
                          setCollaboratorInput,
                          "collaborators"
                        )
                      }
                      className="btn-add-item bg-blue-500 hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="flex flex-wrap gap-1">
                    {formData.collaborators.map((c) => (
                      <li key={c} className="item-tag bg-gray-200">
                        {c}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveItemFromArray(c, "collaborators")
                          }
                          className="btn-remove-item"
                        >
                          <FaTimes />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">
                    Tags:
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      placeholder="Add relevant tags (e.g., AI, Data Analysis)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="form-input flex-grow mr-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddItemToArray(
                            tagInput,
                            tagInput,
                            setTagInput,
                            "tags"
                          );
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleAddItemToArray(
                          tagInput,
                          tagInput,
                          setTagInput,
                          "tags"
                        )
                      }
                      className="btn-add-item bg-blue-500 hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="flex flex-wrap gap-1">
                    {formData.tags.map((tag) => (
                      <li
                        key={tag}
                        className="item-tag bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromArray(tag, "tags")}
                          className="btn-remove-item text-blue-600 hover:text-blue-800"
                        >
                          <FaTimes />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    className="cancel-button bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                    onClick={handleCloseModal}
                    disabled={loading.action}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center disabled:opacity-50"
                    disabled={loading.action}
                  >
                    {loading.action ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-1" /> Save Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}{" "}
            {/* End Add/Edit Form */}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
