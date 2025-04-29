// src/pages/CreateProjectPage.jsx

import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaSpinner, FaImage, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- Import Common Components ---
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import TagInput from "../Component/Common/TagInput"; // Assuming this component exists
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Only used implicitly via isLoading

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Setup Axios Instance ---
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let browser set Content-Type for FormData
    // Axios sets application/json for objects automatically
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Style Constants ---
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
const inputClasses =
  "w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors placeholder-gray-400 disabled:bg-gray-100";

// --- Component Constants ---
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
    requiredCollaborators: "1", // Default as string for input type='number'
    status: "Planning",
    duration: "",
    funding: "",
    skillsNeeded: [], // Initialize as empty array
  });
  const [projectImageFile, setProjectImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // For general submission errors
  const [validationErrors, setValidationErrors] = useState({}); // For field-specific errors
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const fileInputRef = useRef(null);

  // --- Utilities & Handlers ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    // Clear validation error for the specific field being changed
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name]; // Remove error for this field
      return newErrors;
    });
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(`handleChange: ${name} = ${value}`); // Log state changes
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files ? e.target.files[0] : null;
      setProjectImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = null; // Reset file input visually

      if (file) {
        if (!file.type.startsWith("image/")) {
          showNotification(
            "Invalid file type. Please select an image.",
            "error"
          );
          return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          showNotification(`File is too large (Max 5MB).`, "error");
          return;
        }
        setProjectImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.onerror = () =>
          showNotification("Could not read image file.", "error");
        reader.readAsDataURL(file);
        console.log("File selected:", file.name);
      } else {
        console.log("File selection cleared.");
      }
    },
    [showNotification]
  );

  const handleSkillsChange = useCallback((newSkills) => {
    setFormData((prev) => ({
      ...prev,
      skillsNeeded: Array.isArray(newSkills) ? newSkills : [],
    }));
    setValidationErrors((prev) => ({ ...prev, skillsNeeded: undefined }));
  }, []);

  // --- Frontend Validation Logic ---
  const validateForm = useCallback(() => {
    console.log("Running validateForm...");
    const errors = {};
    const currentTitle = formData.title?.trim();
    const currentDescription = formData.description?.trim();

    if (!currentTitle) errors.title = "Project title is required.";
    else if (currentTitle.length < 5)
      errors.title = "Title must be at least 5 characters.";

    if (!currentDescription) errors.description = "Description is required.";
    else if (currentDescription.length < 20)
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
    }
    // Add other validations if needed...

    setValidationErrors(errors);
    console.log("Validation Errors:", errors);
    return Object.keys(errors).length === 0; // True if no errors
  }, [formData]);

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({}); // Clear errors on new submission attempt

    console.log("handleSubmit triggered.");
    if (!validateForm()) {
      console.log("Frontend validation FAILED.");
      showNotification("Please fix the errors in the form.", "warning");
      // Scroll to the first error field? Optional enhancement.
      return; // Stop submission
    }
    console.log("Frontend validation PASSED.");

    setIsLoading(true);

    let dataToSend;
    let requestConfig = { headers: {} }; // Initialize headers
    const token = localStorage.getItem("authToken");

    if (!token) {
      showNotification("Authentication Error. Please log in again.", "error");
      setError("Authentication token not found.");
      setIsLoading(false);
      return;
    }
    requestConfig.headers.Authorization = `Bearer ${token}`;

    // Prepare data based on file presence
    if (projectImageFile) {
      console.log("Preparing FormData (with file)...");
      dataToSend = new FormData();
      // Append required fields first
      dataToSend.append("title", formData.title.trim());
      dataToSend.append("description", formData.description.trim());
      dataToSend.append(
        "requiredCollaborators",
        formData.requiredCollaborators
      ); // Send as string; backend parses
      dataToSend.append("status", formData.status);
      // Append optional fields only if they have a value
      if (formData.category) dataToSend.append("category", formData.category);
      if (formData.duration) dataToSend.append("duration", formData.duration);
      if (formData.funding) dataToSend.append("funding", formData.funding);
      if (formData.skillsNeeded.length > 0)
        dataToSend.append(
          "skillsNeeded",
          JSON.stringify(formData.skillsNeeded)
        );
      // Append file (Match key 'projectImageFile' with backend route's multer middleware)
      dataToSend.append(
        "projectImageFile",
        projectImageFile,
        projectImageFile.name
      );
      // Let browser set Content-Type header for multipart/form-data
      console.log("FormData prepared.");
    } else {
      console.log("Preparing JSON payload (no file)...");
      dataToSend = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requiredCollaborators: parseInt(formData.requiredCollaborators, 10), // Send as number
        status: formData.status,
        // Conditionally add optional fields only if they have values
        ...(formData.category && { category: formData.category }),
        ...(formData.duration && { duration: formData.duration }),
        ...(formData.funding && { funding: formData.funding }),
        ...(formData.skillsNeeded.length > 0 && {
          skillsNeeded: formData.skillsNeeded,
        }), // Send as array
      };
      requestConfig.headers["Content-Type"] = "application/json"; // Set correct header for JSON
      console.log(
        "JSON payload prepared:",
        JSON.stringify(dataToSend, null, 2)
      );
    }

    // --- Log final data just before sending ---
    if (dataToSend instanceof FormData) {
      console.log("--- Sending FormData ---");
      for (let [key, value] of dataToSend.entries()) {
        console.log(
          `  ${key}:`,
          value instanceof File ? `File(${value.name})` : value
        );
      }
      console.log("-------------------------");
    } else {
      console.log("--- Sending JSON Payload ---");
      console.log(JSON.stringify(dataToSend, null, 2));
      console.log("--------------------------");
    }
    console.log("Request Config Headers:", requestConfig.headers);

    // API Call
    try {
      const response = await apiClient.post(
        "/api/projects",
        dataToSend,
        requestConfig
      );
      console.log("Backend Success Response:", response.data);

      // Use the 'data' key returned by your controller's success response
      if (response.data?.success && response.data?.data?.id) {
        showNotification("Project created successfully!", "success");
        navigate(`/projects`); // Redirect to projects list page
      } else {
        throw new Error(
          response.data?.message ||
            "Project created, but unexpected success response."
        );
      }
    } catch (err) {
      console.error("--- Project Creation Axios Error ---");
      console.error("Status:", err.response?.status);
      console.error("Backend Response Data:", err.response?.data); // <<< Check this for the specific 400 reason
      console.error("Request Config:", err.config);
      console.error("Error Message:", err.message);
      console.error("----------------------------------");

      let displayError = "An error occurred while creating the project.";
      if (err.response?.data?.message) {
        // Use specific backend message
        displayError = err.response.data.message;
        // If backend sends structured validation errors, map them here
        // e.g., if(err.response.data.errors) { setValidationErrors(mapBackendErrors(err.response.data.errors)); }
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
            {" "}
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            />{" "}
          </motion.div>
        )}{" "}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-6 sm:p-8 rounded-lg shadow-xl border border-gray-200"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4 flex items-center">
          <FaPlus className="mr-3 text-indigo-500" /> Create New Project
        </h1>
        {error && (
          <div className="mb-5">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Title */}
          <div>
            <label htmlFor="title" className={labelClasses}>
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength="150"
              className={`${inputClasses} ${
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
          {/* Description */}
          <div>
            <label htmlFor="description" className={labelClasses}>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
              className={`${inputClasses} ${
                validationErrors.description
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Detailed description..."
              disabled={isLoading}
              aria-invalid={!!validationErrors.description}
              aria-describedby={
                validationErrors.description ? "description-error" : undefined
              }
            ></textarea>
            {validationErrors.description && (
              <p id="description-error" className="mt-1 text-xs text-red-600">
                {validationErrors.description}
              </p>
            )}
          </div>
          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label htmlFor="category" className={labelClasses}>
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`${inputClasses} bg-white`}
                disabled={isLoading}
              >
                <option value="">-- Select --</option>
                {projectCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
              <label htmlFor="status" className={labelClasses}>
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`${inputClasses} bg-white`}
                disabled={isLoading}
              >
                {projectStatuses.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Collaborators & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label htmlFor="requiredCollaborators" className={labelClasses}>
                Collaborators Needed <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="requiredCollaborators"
                name="requiredCollaborators"
                min="0"
                step="1"
                value={formData.requiredCollaborators}
                onChange={handleChange}
                required
                className={`${inputClasses} ${
                  validationErrors.requiredCollaborators
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="e.g., 3"
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
              <label htmlFor="duration" className={labelClasses}>
                Est. Duration
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={inputClasses}
                placeholder="e.g., 6 Months"
                disabled={isLoading}
              />
            </div>
          </div>
          {/* Funding */}
          <div>
            <label htmlFor="funding" className={labelClasses}>
              Funding Status
            </label>
            <input
              type="text"
              id="funding"
              name="funding"
              value={formData.funding}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., Grant Funded"
              disabled={isLoading}
            />
          </div>
          {/* Skills Needed */}
          <div>
            <label htmlFor="skillsNeeded" className={labelClasses}>
              Skills Needed
            </label>
            <TagInput
              tags={formData.skillsNeeded || []}
              setTags={handleSkillsChange}
              placeholder="Add skills & press Enter"
              disabled={isLoading}
            />
            {validationErrors.skillsNeeded && (
              <p className="mt-1 text-xs text-red-600">
                {validationErrors.skillsNeeded}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">Key skills required.</p>
          </div>
          {/* Project Image */}
          <div>
            <label className={labelClasses}>Project Image (Optional)</label>
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
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <label
                htmlFor="project-image-upload"
                className={`cursor-pointer bg-white py-1.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 ${
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
            <p className="text-xs text-gray-500 mt-1">Max 5MB.</p>
          </div>
          {/* Submit */}
          <div className="pt-5 border-t mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
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
