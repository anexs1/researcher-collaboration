// src/pages/CreateProjectPage.jsx

import React, { useState, useCallback, useRef } from "react"; // Added useRef
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaSpinner, FaImage, FaTimes } from "react-icons/fa"; // Added FaTimes
import { motion, AnimatePresence } from "framer-motion";

// --- Import Common Components ---
// Make sure these paths are correct and components exist and are correctly exported
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import TagInput from "../Component/Common/TagInput"; // CRITICAL: This component must exist and work
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Assuming this exists

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Component Constants ---
// These should ideally match categories supported/validated by the backend
const projectStatuses = ["Planning", "Active", "Completed", "On Hold"];
const projectCategories = [
  "Artificial Intelligence",
  "Data Science",
  "Climate Science",
  "Biomedical Research",
  "Public Health",
  "Engineering",
  "Social Sciences",
  "Other",
];

// --- Main Component Function ---
function CreateProjectPage() {
  const navigate = useNavigate();

  // --- State Definitions ---
  // Initialize state based on the fields your form actually includes
  const [formData, setFormData] = useState({
    title: "",
    category: "", // Make sure this matches a value in projectCategories or is empty
    description: "",
    collaboratorsNeeded: 1, // Changed name if backend expects this
    status: "Planning", // Default status
    duration: "",
    funding: "",
    skillsNeeded: [], // Must be an array for TagInput
  });
  const [projectImageFile, setProjectImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const fileInputRef = useRef(null); // Ref for the hidden file input

  // --- Event Handlers ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    setProjectImageFile(null); // Reset previous file/preview first
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = null; // Clear input visually

    if (file) {
      if (!file.type.startsWith("image/")) {
        showNotification(
          "Please select a valid image file (JPEG, PNG, etc.).",
          "error"
        );
        return;
      }
      // Add size validation if needed here

      setProjectImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        showNotification("Could not generate image preview.", "error");
      };
      reader.readAsDataURL(file);
    }
  };

  // Ensure this function correctly updates the state with an array
  const handleSkillsChange = (newSkills) => {
    setFormData((prev) => ({
      ...prev,
      skillsNeeded: Array.isArray(newSkills) ? newSkills : [],
    }));
  };

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
    return () => clearTimeout(timer); // Cleanup timer on unmount or re-call
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log("Submitting Form - Current State:", formData); // Log state on submit

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
      setIsLoading(false);
      showNotification("You must be logged in to create a project.", "error");
      return;
    }

    const dataToSubmit = new FormData();

    // Append fields from formData state
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "skillsNeeded" && Array.isArray(value)) {
        // Ensure even empty array is stringified if field exists
        dataToSubmit.append(key, JSON.stringify(value));
        console.log(`Appending ${key}: ${JSON.stringify(value)}`); // Log array stringification
      } else if (value !== null && value !== undefined) {
        dataToSubmit.append(key, value);
        console.log(`Appending ${key}: ${value}`); // Log other fields
      }
    });

    // Append file if it exists
    if (projectImageFile) {
      dataToSubmit.append(
        "projectImageFile",
        projectImageFile,
        projectImageFile.name
      );
      console.log(`Appending file: ${projectImageFile.name}`); // Log file append
    }

    // --- Log FormData content before sending ---
    console.log("--- FormData to be sent ---");
    for (let [key, value] of dataToSubmit.entries()) {
      // Be careful logging File objects, log name instead
      if (value instanceof File) {
        console.log(
          `  ${key}: File - ${value.name} (size: ${value.size}, type: ${value.type})`
        );
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    console.log("---------------------------");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/projects`,
        dataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success && response.data?.data) {
        showNotification("Project created successfully!", "success");
        navigate(`/projects/${response.data.data.id}`); // Navigate to new project
      } else {
        // This case might not be hit if backend throws 400/500 properly
        throw new Error(response.data?.message || "Failed to create project.");
      }
    } catch (err) {
      console.error("Project creation error - Response:", err.response); // Log the full response
      console.error("Project creation error - Message:", err.message); // Log the message
      const errorMsg =
        err.response?.data?.message ||
        "An error occurred. Check console & backend logs.";
      setError(errorMsg); // Display specific error from backend
      showNotification(`Project creation failed: ${errorMsg}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX Rendering ---
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Notification Area */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed top-5 right-5 z-[100] w-full max-w-sm sm:max-w-md"
          >
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4">
          <FaPlus className="inline-block mr-2 mb-1 text-indigo-600" /> Create
          New Project
        </h1>

        {error && (
          <ErrorMessage
            message={error}
            onClose={() => setError("")}
            className="mb-5"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {" "}
          {/* Increased spacing */}
          {/* Project Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              minLength="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="A clear and concise title for your project"
            />
          </div>
          {/* Project Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
              minLength="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Detailed description: goals, methods, expected outcomes, potential impact..."
            />
          </div>
          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              >
                <option value="">Select a Category</option>
                {projectCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              >
                {projectStatuses.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Collaborators Needed & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              {/* Ensure name matches state key and backend expected key if different */}
              <label
                htmlFor="collaboratorsNeeded"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Collaborators Needed (approx)
              </label>
              <input
                type="number"
                id="collaboratorsNeeded"
                name="collaboratorsNeeded"
                min="0"
                step="1"
                value={formData.collaboratorsNeeded}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Estimated Duration
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., 12 Months, Ongoing"
              />
            </div>
          </div>
          {/* Funding */}
          <div>
            <label
              htmlFor="funding"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Funding Status/Amount
            </label>
            <input
              type="text"
              id="funding"
              name="funding"
              value={formData.funding}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., $50,000 Grant, Seed Funding, N/A"
            />
          </div>
          {/* Skills Needed (Requires TagInput Component) */}
          <div>
            <label
              htmlFor="skillsNeeded"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Skills Needed
            </label>
            {/* Ensure TagInput component is imported and functional */}
            <TagInput
              tags={formData.skillsNeeded || []}
              setTags={handleSkillsChange} // Pass the dedicated handler
              placeholder="Add skills & press Enter/comma (e.g., Python)"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              List key skills required for collaboration.
            </p>
          </div>
          {/* Project Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Image (Optional)
            </label>
            <div className="mt-1 flex items-center gap-4">
              <span className="inline-block h-20 w-32 rounded border border-dashed border-gray-300 bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Project preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaImage className="h-10 w-10" />
                )}
              </span>
              <label
                htmlFor="project-image-upload"
                className="cursor-pointer bg-white py-1.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {" "}
                Upload Image{" "}
              </label>
              <input
                id="project-image-upload"
                ref={fileInputRef}
                name="projectImageFile"
                type="file"
                className="sr-only"
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setProjectImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = null;
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                  disabled={isLoading}
                >
                  {" "}
                  <FaTimes className="inline mr-1" /> Remove{" "}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recommended: ~800x600px. Max 5MB.
            </p>
          </div>
          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  {" "}
                  <FaSpinner className="animate-spin h-4 w-4" /> Submitting
                  Project...{" "}
                </>
              ) : (
                <>
                  {" "}
                  <FaPlus className="h-4 w-4" /> Create Project{" "}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default CreateProjectPage;
