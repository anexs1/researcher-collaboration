// src/pages/CreateProjectPage.jsx

import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaSpinner, FaImage, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- Import Common Components ---
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import TagInput from "../Component/Common/TagInput";
import LoadingSpinner from "../Component/Common/LoadingSpinner";

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
    requiredCollaborators: "1",
    status: "Planning",
    duration: "",
    funding: "",
    skillsNeeded: [],
  });
  const [projectImageFile, setProjectImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
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
    setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(`handleChange: ${name} = ${value}`); // Log state changes
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files ? e.target.files[0] : null;
      setProjectImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = null;

      if (file) {
        if (!file.type.startsWith("image/")) {
          showNotification("Invalid file type.", "error");
          return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          showNotification(`File too large (Max 5MB).`, "error");
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
    const currentTitle = formData.title?.trim(); // Trim before validating
    const currentDescription = formData.description?.trim(); // Trim before validating

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
    // Add other validations...

    setValidationErrors(errors);
    console.log("Validation Errors:", errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    console.log("handleSubmit triggered.");
    if (!validateForm()) {
      console.log("Frontend validation FAILED.");
      showNotification("Please fix the errors in the form.", "warning");
      return;
    }
    console.log("Frontend validation PASSED.");

    setIsLoading(true);

    let dataToSend;
    let requestConfig = { headers: {} }; // Initialize headers object

    // Get token *before* constructing payload
    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification("Authentication Error. Please log in again.", "error");
      setError("Authentication token not found.");
      setIsLoading(false);
      return;
    }
    requestConfig.headers.Authorization = `Bearer ${token}`; // Add token for both cases

    // Prepare data based on whether a file is present
    if (projectImageFile) {
      console.log("Preparing FormData (with file)...");
      dataToSend = new FormData();
      // Append fields exactly as expected by backend (match req.body keys and multer field name)
      dataToSend.append("title", formData.title.trim());
      dataToSend.append("description", formData.description.trim());
      dataToSend.append(
        "requiredCollaborators",
        formData.requiredCollaborators
      ); // Send as string
      dataToSend.append("status", formData.status);
      if (formData.category) dataToSend.append("category", formData.category);
      if (formData.duration) dataToSend.append("duration", formData.duration);
      if (formData.funding) dataToSend.append("funding", formData.funding);
      if (formData.skillsNeeded.length > 0)
        dataToSend.append(
          "skillsNeeded",
          JSON.stringify(formData.skillsNeeded)
        );
      // Field name MUST match multer setup in projectRoutes.js
      dataToSend.append(
        "projectImageFile",
        projectImageFile,
        projectImageFile.name
      );

      // DO NOT set Content-Type for FormData; browser does it with boundary
      console.log("FormData prepared. Sending multipart/form-data request.");
    } else {
      console.log("Preparing JSON payload (no file)...");
      dataToSend = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requiredCollaborators: parseInt(formData.requiredCollaborators, 10), // Send as number
        status: formData.status,
        category: formData.category || null,
        duration: formData.duration || null,
        funding: formData.funding || null,
        skillsNeeded: formData.skillsNeeded,
      };
      // Set Content-Type for JSON
      requestConfig.headers["Content-Type"] = "application/json";
      console.log(
        "JSON payload prepared:",
        JSON.stringify(dataToSend, null, 2)
      );
      console.log("Sending application/json request.");
    }

    // API Call
    try {
      const response = await apiClient.post(
        "/api/projects",
        dataToSend,
        requestConfig
      );
      console.log("Backend Success Response:", response.data);

      if (response.data?.success && response.data?.data?.id) {
        showNotification("Project created successfully!", "success");
        navigate(`/projects/${response.data.data.id}`);
      } else {
        throw new Error(
          response.data?.message ||
            "Project created, but unexpected success response structure."
        );
      }
    } catch (err) {
      console.error("--- Project Creation Axios Error ---");
      console.error("Status:", err.response?.status);
      console.error("Backend Response Data:", err.response?.data); // <<< THIS IS THE IMPORTANT PART
      console.error("Request Config:", err.config); // Log request config for headers etc.
      console.error("Error Message:", err.message);
      console.error("----------------------------------");

      let displayError = "An error occurred while creating the project.";
      // Use the specific backend message if available
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
          <motion.div /* ... */>
            {" "}
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification({ ...notification, show: false })}
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center">
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
