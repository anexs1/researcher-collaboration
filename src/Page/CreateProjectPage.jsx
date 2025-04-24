// src/pages/CreateProjectPage.jsx

import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaSpinner, FaImage, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- Import Common Components ---
// CRITICAL: Ensure these paths are correct and components exist and are exported
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import TagInput from "../Component/Common/TagInput"; // Ensure this handles tags as an array
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Ensure this exists

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Component Constants ---
// Align these with backend validation/enums if possible
const projectStatuses = ["Planning", "Active", "Completed", "On Hold"];
const projectCategories = [
  "Artificial Intelligence",
  "Data Science",
  "Climate Science",
  "Biomedical Research",
  "Public Health",
  "Engineering",
  "Social Sciences",
  "Humanities",
  "Software Development",
  "Other",
];

// --- Main Component Function ---
function CreateProjectPage() {
  const navigate = useNavigate();

  // --- State Definitions ---
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    collaboratorsNeeded: 1,
    status: "Planning",
    duration: "",
    funding: "",
    skillsNeeded: [],
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

  const fileInputRef = useRef(null);

  // --- Define Utilities FIRST ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
    return () => clearTimeout(timer);
  }, []);

  // --- Event Handlers ---
  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? parseInt(value, 10) || 0 : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files ? e.target.files[0] : null;
      setProjectImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
      if (file) {
        if (!file.type.startsWith("image/")) {
          showNotification(
            "Invalid file type. Please select an image (JPEG, PNG, WEBP, GIF).",
            "error"
          );
          return;
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          showNotification(
            `File is too large (Max ${maxSize / 1024 / 1024}MB).`,
            "error"
          );
          return;
        }
        setProjectImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.onerror = () =>
          showNotification("Could not read file.", "error");
        reader.readAsDataURL(file);
      }
    },
    [showNotification]
  );

  const handleSkillsChange = useCallback((newSkills) => {
    setFormData((prev) => ({
      ...prev,
      skillsNeeded: Array.isArray(newSkills) ? newSkills : [],
    }));
  }, []);

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log("Attempting to submit project. Current form state:", formData);

    const token = localStorage.getItem("authToken");
    if (!token) {
      const errorMsg =
        "Authentication required. Please log in to create a project.";
      setError(errorMsg);
      setIsLoading(false);
      showNotification(errorMsg, "error");
      return;
    }

    const dataToSubmit = new FormData();

    // --- CORRECTED FormData Appending Logic ---
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "skillsNeeded") {
        // Handle array stringification separately
        dataToSubmit.append(key, JSON.stringify(value || [])); // Ensure empty array is handled
        console.log(`Appending ${key} (JSON): ${JSON.stringify(value || [])}`);
      } else if (value !== null && value !== undefined) {
        // <<< FIX: Allow empty strings ""
        // Append all other fields as long as they are not null or undefined
        // This ensures 'title' and 'description' keys are sent even if empty
        dataToSubmit.append(key, value);
        console.log(`Appending field ${key}: '${value}'`); // Log value in quotes to see empty strings
      } else {
        console.log(
          `Skipping appending field ${key} because it is null or undefined.`
        );
      }
    });
    // -----------------------------------------

    if (projectImageFile) {
      dataToSubmit.append(
        "projectImageFile",
        projectImageFile,
        projectImageFile.name
      );
      console.log(`Appending file: ${projectImageFile.name}`);
    } else {
      console.log("No project image file selected to append.");
    }

    // Log FormData before sending (for debugging)
    console.log("--- FormData Prepared for Submission ---");
    let formEntries = "";
    for (let [key, value] of dataToSubmit.entries()) {
      if (value instanceof File) {
        formEntries += `  ${key}: File - ${value.name} (size: ${value.size}, type: ${value.type})\n`;
      } else {
        formEntries += `  ${key}: ${value}\n`;
      }
    }
    console.log(formEntries.trim());
    console.log("--------------------------------------");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/projects`,
        dataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success && response.data?.data?.id) {
        showNotification("Project created successfully!", "success");
        navigate(`/projects/${response.data.data.id}`);
      } else {
        throw new Error(
          response.data?.message ||
            "Project created, but unexpected response received."
        );
      }
    } catch (err) {
      console.error("--- Project Creation Axios Error ---");
      console.error("Status:", err.response?.status);
      console.error("Backend Response Data:", err.response?.data); // <<< CHECK THIS FOR 400 REASON
      console.error("Error Message:", err.message);
      console.error("----------------------------------");
      let displayError = "An error occurred while creating the project.";
      if (err.response?.data?.message) {
        displayError = err.response.data.message;
      } else if (err.message) {
        displayError = err.message;
      }
      setError(displayError);
      showNotification(`Project creation failed: ${displayError}`, "error");
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
        className="bg-white p-6 sm:p-8 rounded-lg shadow-xl border border-gray-200"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4 flex items-center">
          <FaPlus className="mr-3 text-indigo-500" /> Create New Project
        </h1>

        {/* Display Main Error Message */}
        {error && (
          <div className="mb-5">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              Project Title <span className="text-red-500">*</span>{" "}
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              minLength="5"
              maxLength="150"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              placeholder="A clear and concise title"
              disabled={isLoading}
            />
          </div>

          {/* Project Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              Description <span className="text-red-500">*</span>{" "}
            </label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
              minLength="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              placeholder="Detailed description: goals, methods, expected outcomes, potential impact..."
              disabled={isLoading}
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {" "}
                Category{" "}
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm transition-colors"
                disabled={isLoading}
              >
                <option value="">-- Select Category --</option>
                {projectCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {" "}
                    {cat}{" "}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {" "}
                Initial Status{" "}
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm transition-colors"
                disabled={isLoading}
              >
                {projectStatuses.map((stat) => (
                  <option key={stat} value={stat}>
                    {" "}
                    {stat}{" "}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Collaborators Needed & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label
                htmlFor="collaboratorsNeeded"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {" "}
                Collaborators Needed{" "}
              </label>
              <input
                type="number"
                id="collaboratorsNeeded"
                name="collaboratorsNeeded"
                min="0"
                step="1"
                value={formData.collaboratorsNeeded}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="e.g., 3"
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {" "}
                Estimated Duration{" "}
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                placeholder="e.g., 6-12 Months"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Funding */}
          <div>
            <label
              htmlFor="funding"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              Funding Status{" "}
            </label>
            <input
              type="text"
              id="funding"
              name="funding"
              value={formData.funding}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              placeholder="e.g., Grant Funded, Self-Funded, Seeking Funding"
              disabled={isLoading}
            />
          </div>

          {/* Skills Needed (Requires TagInput Component) */}
          <div>
            <label
              htmlFor="skillsNeeded"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {" "}
              Skills Needed{" "}
            </label>
            <TagInput
              tags={formData.skillsNeeded || []}
              setTags={handleSkillsChange}
              placeholder="Add skills & press Enter (e.g., Python, Statistics)"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {" "}
              List key skills required from collaborators.{" "}
            </p>
          </div>

          {/* Project Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {" "}
              Project Image (Optional){" "}
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-4">
              <span className="inline-block h-20 w-32 rounded border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center text-gray-400 flex-shrink-0">
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
              <label
                htmlFor="project-image-upload"
                className={`cursor-pointer bg-white py-1.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {projectImageFile ? "Change Image" : "Upload Image"}
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setProjectImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = null;
                  }}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center disabled:opacity-50"
                  disabled={isLoading}
                >
                  <FaTimes className="mr-1" /> Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {" "}
              PNG, JPG, GIF, WEBP up to 5MB.{" "}
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-5 border-t border-gray-200 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  {" "}
                  <FaSpinner className="animate-spin h-4 w-4" /> Submitting...{" "}
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
