// src/pages/CreateProjectPage.jsx

import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaSpinner, FaImage, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- Import Common Components ---
// CRITICAL: Adjust paths if needed
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import TagInput from "../Component/Common/TagInput"; // Assumes this component works correctly
import LoadingSpinner from "../Component/Common/LoadingSpinner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Component Constants ---
const projectStatuses = ["Planning", "Active", "Completed", "On Hold"]; // Align with your backend/DB enum if possible
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
    category: "", // Ensure this exists in your Project model/table if used
    description: "",
    requiredCollaborators: "", // <<< Changed: Start empty to force user input
    status: "Planning",
    duration: "", // Ensure this exists in your Project model/table if used
    funding: "", // Ensure this exists in your Project model/table if used
    skillsNeeded: [], // Ensure this exists in your Project model/table if used
    // Add other relevant fields from your Project model if needed (e.g., progress, imageUrl)
    // imageUrl: null, // Usually handled by file upload state
    // progress: 0, // Example if you have progress
  });
  const [projectImageFile, setProjectImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // For displaying persistent errors
  const [validationErrors, setValidationErrors] = useState({}); // For inline field errors
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
    const { name, value } = e.target;
    // Clear specific field validation error when user types
    setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files ? e.target.files[0] : null;
      // Reset previous state
      setProjectImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = null; // Clear native input

      if (file) {
        // Validation
        if (!file.type.startsWith("image/")) {
          showNotification(
            "Invalid file type. Please select an image.",
            "error"
          );
          return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          showNotification(
            `File is too large (Max ${maxSize / 1024 / 1024}MB).`,
            "error"
          );
          return;
        }
        // Set state and preview
        setProjectImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.onerror = () =>
          showNotification("Could not read image file.", "error");
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
    // Clear validation error for skills if needed
    setValidationErrors((prev) => ({ ...prev, skillsNeeded: undefined }));
  }, []);

  // --- Frontend Validation Logic ---
  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.title?.trim()) errors.title = "Project title is required.";
    else if (formData.title.length < 5)
      errors.title = "Title must be at least 5 characters.";

    if (!formData.description?.trim())
      errors.description = "Description is required.";
    else if (formData.description.length < 20)
      errors.description = "Description must be at least 20 characters.";

    const collabValue = formData.requiredCollaborators;
    if (
      collabValue === "" ||
      collabValue === null ||
      collabValue === undefined
    ) {
      errors.requiredCollaborators = "Number of collaborators is required.";
    } else {
      const numCollaborators = parseInt(collabValue, 10);
      if (isNaN(numCollaborators) || numCollaborators < 0) {
        errors.requiredCollaborators = "Must be a valid, non-negative number.";
      }
      // Optional: Set a minimum like 1 if 0 is not allowed
      // if (numCollaborators < 1) errors.requiredCollaborators = "Must need at least 1 collaborator (or 0).";
    }

    // Add validation for other required fields if necessary (e.g., category)
    // if (!formData.category) errors.category = "Category is required.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
  }, [formData]);

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear general error
    setValidationErrors({}); // Clear field errors

    if (!validateForm()) {
      showNotification("Please fix the errors in the form.", "warning");
      return; // Stop submission if frontend validation fails
    }

    setIsLoading(true);
    console.log(
      "Attempting to submit project. Validated form state:",
      formData
    );

    const token = localStorage.getItem("authToken");
    if (!token) {
      const errorMsg = "Authentication required. Please log in.";
      setError(errorMsg);
      setIsLoading(false);
      showNotification(errorMsg, "error");
      return;
    }

    // --- Prepare FormData for Submission ---
    const dataToSubmit = new FormData();

    // Append fields carefully, ensuring correct types/names for backend
    Object.entries(formData).forEach(([key, value]) => {
      // Use the correct key name expected by the backend controller
      // In this case, frontend state key 'requiredCollaborators' matches backend
      const backendKey = key;

      if (key === "skillsNeeded") {
        // Stringify the array for FormData
        dataToSubmit.append(backendKey, JSON.stringify(value || []));
        console.log(
          `Appending ${backendKey} (JSON): ${JSON.stringify(value || [])}`
        );
      } else if (value !== null && value !== undefined && value !== "") {
        // Only append if value is not null, undefined, or an empty string
        // Exception: Allow title/description empty strings if backend handles it? Check backend validation.
        // If backend requires non-empty title/description, frontend validation already catches it.
        dataToSubmit.append(backendKey, value);
        console.log(`Appending field ${backendKey}: '${value}'`);
      } else if (value === "") {
        // Log fields that are empty strings but not appended (unless backend expects them)
        console.log(
          `Field ${backendKey} is an empty string, not appending (unless specifically handled).`
        );
      } else {
        console.log(
          `Skipping appending field ${backendKey} because it is null or undefined.`
        );
      }
    });

    // Append the file if it exists
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

    // Log FormData content for final verification before sending
    console.log("--- FormData Prepared ---");
    for (let [key, value] of dataToSubmit.entries()) {
      console.log(
        `  ${key}:`,
        value instanceof File ? `File(${value.name})` : value
      );
    }
    console.log("-------------------------");

    // --- API Call ---
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/projects`,
        dataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
        // Content-Type is automatically set to 'multipart/form-data' by browser when using FormData
      );

      if (response.data?.success && response.data?.data?.id) {
        showNotification("Project created successfully!", "success");
        navigate(`/projects/${response.data.data.id}`); // Redirect to the new project page
      } else {
        // Handle cases where success is true but data might be missing
        throw new Error(
          response.data?.message ||
            "Project created, but unexpected response received."
        );
      }
    } catch (err) {
      console.error("--- Project Creation Axios Error ---");
      console.error("Status:", err.response?.status);
      console.error("Backend Response Data:", err.response?.data); // <<< CHECK THIS FOR 400 REASON FROM BACKEND
      console.error("Error Message:", err.message);
      console.error("----------------------------------");

      let displayError = "An error occurred while creating the project.";
      // Prioritize backend error message if available
      if (err.response?.data?.message) {
        displayError = err.response.data.message;
        // Optionally map backend validation errors to frontend fields
        if (err.response?.data?.errors) {
          // Assuming backend might send structured errors
          setValidationErrors(err.response.data.errors);
        }
      } else if (err.message) {
        displayError = err.message;
      }
      setError(displayError); // Show general error message
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

        {/* Display General Error Message */}
        {error && (
          <div className="mb-5">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {" "}
          {/* Disable native browser validation */}
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
              maxLength="150" // Match DB/model limit if applicable
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                validationErrors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="A clear and concise title"
              disabled={isLoading}
              aria-invalid={!!validationErrors.title}
              aria-describedby={
                validationErrors.title ? "title-error" : undefined
              }
            />
            {validationErrors.title && (
              <p id="title-error" className="mt-1 text-xs text-red-600">
                {validationErrors.title}
              </p>
            )}
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                validationErrors.description
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Detailed description: goals, methods, expected outcomes..."
              disabled={isLoading}
              aria-invalid={!!validationErrors.description}
              aria-describedby={
                validationErrors.description ? "description-error" : undefined
              }
            />
            {validationErrors.description && (
              <p id="description-error" className="mt-1 text-xs text-red-600">
                {validationErrors.description}
              </p>
            )}
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
                // Add validation styling if category becomes required
              >
                <option value="">-- Select Category --</option>
                {projectCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {" "}
                    {cat}{" "}
                  </option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.category}
                </p>
              )}
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
              {/* No validation needed usually as it defaults */}
            </div>
          </div>
          {/* Collaborators Needed & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label
                htmlFor="requiredCollaborators"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Collaborators Needed <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="requiredCollaborators"
                name="requiredCollaborators"
                min="0"
                step="1" // Or min="1" depending on requirement
                value={formData.requiredCollaborators}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                  validationErrors.requiredCollaborators
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter number (e.g., 3)"
                disabled={isLoading}
                aria-invalid={!!validationErrors.requiredCollaborators}
                aria-describedby={
                  validationErrors.requiredCollaborators
                    ? "collaborators-error"
                    : undefined
                }
              />
              {validationErrors.requiredCollaborators && (
                <p
                  id="collaborators-error"
                  className="mt-1 text-xs text-red-600"
                >
                  {validationErrors.requiredCollaborators}
                </p>
              )}
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
              {/* Optional validation */}
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
              placeholder="e.g., Grant Funded, Self-Funded"
              disabled={isLoading}
            />
            {/* Optional validation */}
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
              placeholder="Add skills & press Enter (e.g., Python)"
              disabled={isLoading}
              // Add validation styling if needed
              // className={validationErrors.skillsNeeded ? 'border-red-500' : ''}
            />
            {validationErrors.skillsNeeded && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.skillsNeeded}
              </p>
            )}
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
                    alt="Preview"
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
                className={`cursor-pointer bg-white py-1.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
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
                  <FaSpinner className="animate-spin h-4 w-4" /> Submitting...
                </>
              ) : (
                <>
                  <FaPlus className="h-4 w-4" /> Create Project
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
