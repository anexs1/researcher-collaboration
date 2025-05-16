// src/Page/EditProjectPage.jsx

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import CreatableSelect from "react-select/creatable";
import {
  FaPencilAlt,
  FaSave,
  FaSpinner,
  FaArrowLeft,
  FaExclamationTriangle,
} from "react-icons/fa";

import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import LoadingSpinner from "../Component/Common/LoadingSpinner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const defaultProjectData = {
  id: null,
  title: "",
  description: "",
  status: "Planning", // Default to a valid capitalized ENUM value
  tags: [],
  dueDate: "",
  requiredCollaborators: 0,
  category: "General",
  duration: "",
  funding: "",
  progress: 0,
  imageUrl: null,
  collaborators: [],
  members: [],
};

const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
const inputClasses =
  "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 disabled:bg-gray-100";
const buttonClasses =
  "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";

const selectStyles = {
  control: (p, s) => ({
    ...p,
    borderColor: s.isFocused ? "#6366f1" : "#d1d5db",
    boxShadow: s.isFocused ? "0 0 0 1px #6366f1" : "none",
    "&:hover": { borderColor: "#a5b4fc" },
    minHeight: "42px",
    borderRadius: "0.375rem",
    backgroundColor: s.isDisabled ? "#f3f4f6" : "white",
  }),
  multiValue: (p) => ({
    ...p,
    backgroundColor: "#e0e7ff",
    borderRadius: "0.375rem",
  }),
  multiValueLabel: (p) => ({
    ...p,
    color: "#3730a3",
    fontSize: "0.875rem",
    paddingLeft: "0.5rem",
    paddingRight: "0.25rem",
  }),
  multiValueRemove: (p, s) => ({
    ...p,
    color: "#4338ca",
    cursor: s.isDisabled ? "not-allowed" : "pointer",
    "&:hover": {
      backgroundColor: s.isDisabled ? undefined : "#c7d2fe",
      color: s.isDisabled ? undefined : "#3730a3",
    },
    borderRadius: "0 0.375rem 0.375rem 0",
  }),
  option: (p, s) => ({
    ...p,
    backgroundColor: s.isSelected
      ? "#4f46e5"
      : s.isFocused
      ? "#e0e7ff"
      : "white",
    color: s.isSelected ? "white" : "#1f2937",
    "&:active": { backgroundColor: "#4338ca" },
  }),
  menu: (base) => ({ ...base, zIndex: 50 }),
};

const EditProjectPage = ({ currentUser }) => {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();

  const [formData, setFormData] = useState(defaultProjectData);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [projectNotFoundError, setProjectNotFoundError] = useState(false);
  const [apiError, setApiError] = useState("");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification({ message: "", type: "", show: false }),
      5000
    );
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (formErrors[name])
        setFormErrors((prev) => ({ ...prev, [name]: undefined }));
      setApiError("");
    },
    [formErrors]
  );

  useEffect(() => {
    if (!routeProjectId) {
      setApiError("Project ID is missing from URL.");
      setIsLoadingProject(false);
      setProjectNotFoundError(true);
      return;
    }

    const fetchProject = async () => {
      console.log(
        `Fetching project data for ID (from routeProjectId): ${routeProjectId}`
      );
      setIsLoadingProject(true);
      setProjectNotFoundError(false);
      setApiError("");
      try {
        const response = await apiClient.get(`/api/projects/${routeProjectId}`);
        console.log(
          "EditProjectPage - fetchProject Raw Response:",
          response.data
        );
        const projectDataFromApi = response.data?.data;

        if (
          response.data?.success &&
          projectDataFromApi &&
          typeof projectDataFromApi === "object"
        ) {
          console.log(
            "EditProjectPage - Fetched and Processed Project Data:",
            projectDataFromApi
          );
          setFormData({
            id: projectDataFromApi.id || routeProjectId,
            title: projectDataFromApi.title || "",
            description: projectDataFromApi.description || "",
            status: projectDataFromApi.status || "Planning", // Ensure this is capitalized if from API
            tags: Array.isArray(projectDataFromApi.skillsNeeded)
              ? projectDataFromApi.skillsNeeded
              : [],
            dueDate: projectDataFromApi.dueDate
              ? new Date(projectDataFromApi.dueDate).toISOString().split("T")[0]
              : "",
            requiredCollaborators:
              projectDataFromApi.requiredCollaborators ?? 0,
            category: projectDataFromApi.category || "General",
            duration: projectDataFromApi.duration || "",
            funding: projectDataFromApi.funding || "",
            progress: projectDataFromApi.progress ?? 0,
            imageUrl: projectDataFromApi.imageUrl || null,
            collaborators: [],
            members: [],
          });
        } else {
          let message = "Failed to retrieve project details.";
          if (
            response.data &&
            !response.data.success &&
            response.data.message
          ) {
            message = response.data.message;
          } else if (
            response.data &&
            response.data.success &&
            (!projectDataFromApi || typeof projectDataFromApi !== "object")
          ) {
            message =
              "API reported success, but project data format is invalid.";
          }
          console.warn(`EditProjectPage - ${message}`, response.data);
          setProjectNotFoundError(true);
          setApiError(message);
        }
      } catch (err) {
        console.error("EditProjectPage - Fetch project API error:", err);
        let errMsg = "Failed to load project data.";
        if (axios.isAxiosError(err)) {
          if (err.response) {
            errMsg =
              err.response.data?.message ||
              `Server error (${err.response.status})`;
            if (err.response.status === 404) {
              setProjectNotFoundError(true);
              errMsg = "Project not found (404 from server).";
            }
          } else if (err.request) {
            errMsg = "Network error. Unable to reach server.";
          } else {
            errMsg = "Error configuring the request.";
          }
        } else {
          errMsg = err.message || errMsg;
        }
        setApiError(errMsg);
        if (err.response?.status === 404) {
          setProjectNotFoundError(true);
        }
      } finally {
        setIsLoadingProject(false);
      }
    };
    fetchProject();
  }, [routeProjectId]);

  const handleTagsChange = (selectedOptions) => {
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFormData((prev) => ({ ...prev, tags: values }));
    if (formErrors.tags)
      setFormErrors((prev) => ({ ...prev, tags: undefined }));
    setApiError("");
  };

  const validateForm = useCallback(() => {
    let errors = {};
    if (!formData.title?.trim()) errors.title = "Project title is required.";
    if (!formData.description?.trim())
      errors.description = "Project description is required.";
    if (formData.requiredCollaborators < 0)
      errors.requiredCollaborators = "Cannot be negative.";
    if (formData.progress < 0 || formData.progress > 100)
      errors.progress = "Must be between 0 and 100.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification("Please correct the errors in the form.", "error");
      return;
    }
    setIsSubmitting(true);
    setApiError("");
    const payload = {
      title: formData.title,
      description: formData.description,
      status: formData.status, // This will now be capitalized if Option 1 is used
      requiredCollaborators: parseInt(formData.requiredCollaborators, 10) || 0,
      category: formData.category,
      duration: formData.duration,
      funding: formData.funding,
      skillsNeeded: formData.tags,
      progress: parseInt(formData.progress, 10) || 0,
      dueDate: formData.dueDate || null,
    };
    console.log(
      "Submitting updated data to backend:",
      payload,
      "for project ID:",
      routeProjectId
    );
    try {
      const response = await apiClient.put(
        `/api/projects/${routeProjectId}`,
        payload
      );
      if (response.data?.success && response.data?.data) {
        showNotification("Project updated successfully!", "success");
        navigate(`/projects/${routeProjectId}`);
      } else {
        const message =
          response.data?.message ||
          "Failed to update project. Unexpected response.";
        console.error(
          "Update project error - unexpected response:",
          response.data
        );
        throw new Error(message);
      }
    } catch (err) {
      console.error("Update project API error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while saving the project.";
      setApiError(errMsg);
      showNotification(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[300px]">
        <LoadingSpinner size="lg" message="Loading project details..." />
      </div>
    );
  }

  if (projectNotFoundError) {
    return (
      <div className="text-center py-10 px-4">
        <div className="inline-block bg-red-100 p-3 rounded-full mb-4">
          <FaExclamationTriangle className="text-red-600 h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-red-700 mb-2">
          Error: Project Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          {apiError ||
            "The project you are trying to edit could not be found or loaded."}
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FaArrowLeft className="mr-2" /> Back to Projects
        </Link>
      </div>
    );
  }

  if (
    apiError &&
    !formData.title &&
    !isLoadingProject &&
    !projectNotFoundError
  ) {
    return (
      <div className="text-center py-10 px-4">
        <ErrorMessage message={`Error loading project: ${apiError}`} />
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 mr-2"
        >
          Try Again
        </button>
        <Link
          to="/projects"
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const tagsSelectValue = Array.isArray(formData.tags)
    ? formData.tags.map((tag) => ({ value: tag, label: tag }))
    : [];

  return (
    <>
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() =>
            setNotification({ message: "", type: "", show: false })
          }
        />
      )}
      <div className="max-w-3xl mx-auto my-8">
        <div className="bg-white shadow-xl rounded-lg border border-gray-200 p-6 md:p-8">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
              <FaPencilAlt className="mr-3 text-indigo-600" /> Edit Project:{" "}
              {formData.title || "..."}
            </h1>
            <Link
              to={routeProjectId ? `/projects/${routeProjectId}` : "/projects"}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <FaArrowLeft className="mr-1" /> Cancel
            </Link>
          </div>
          {apiError &&
            !isSubmitting &&
            !projectNotFoundError &&
            !isLoadingProject && (
              <div className="mb-4">
                <ErrorMessage
                  message={apiError}
                  onClose={() => setApiError("")}
                />
              </div>
            )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className={labelClasses}>
                Project Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className={inputClasses}
                maxLength={150}
                disabled={isSubmitting}
              />
              {formErrors.title && (
                <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
              )}
            </div>
            <div>
              <label htmlFor="description" className={labelClasses}>
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleInputChange}
                required
                className={inputClasses}
                placeholder="Provide a detailed overview..."
                disabled={isSubmitting}
              ></textarea>
              {formErrors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status} // Value should match one of the <option> values
                  onChange={handleInputChange}
                  className={inputClasses}
                  disabled={isSubmitting}
                >
                  {/* CORRECTED: Option values are capitalized to match backend ENUM */}
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <label htmlFor="requiredCollaborators" className={labelClasses}>
                  Required Collaborators
                </label>
                <input
                  type="number"
                  name="requiredCollaborators"
                  id="requiredCollaborators"
                  value={formData.requiredCollaborators}
                  onChange={handleInputChange}
                  className={inputClasses}
                  min="0"
                  disabled={isSubmitting}
                />
                {formErrors.requiredCollaborators && (
                  <p className="mt-1 text-xs text-red-600">
                    {formErrors.requiredCollaborators}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="progress" className={labelClasses}>
                  Progress (%)
                </label>
                <input
                  type="number"
                  name="progress"
                  id="progress"
                  value={formData.progress}
                  onChange={handleInputChange}
                  className={inputClasses}
                  min="0"
                  max="100"
                  disabled={isSubmitting}
                />
                {formErrors.progress && (
                  <p className="mt-1 text-xs text-red-600">
                    {formErrors.progress}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="category" className={labelClasses}>
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  id="category"
                  value={formData.category || ""}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="e.g., Health, Agriculture"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="duration" className={labelClasses}>
                  Estimated Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  id="duration"
                  value={formData.duration || ""}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="e.g., 6 Months, 1 Year"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="funding" className={labelClasses}>
                  Funding Status/Source
                </label>
                <input
                  type="text"
                  name="funding"
                  id="funding"
                  value={formData.funding || ""}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="e.g., Self-funded, Grant Name"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="dueDate" className={labelClasses}>
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className={inputClasses}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label htmlFor="tags" className={labelClasses}>
                Skills Needed (Tags)
              </label>
              <CreatableSelect
                id="tags"
                name="tags"
                isMulti
                isClearable
                value={tagsSelectValue}
                onChange={handleTagsChange}
                styles={selectStyles}
                placeholder="Type or select skills..."
                formatCreateLabel={(inputValue) => `Add skill: "${inputValue}"`}
                isDisabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter relevant skills. Press Enter or Tab after typing a new
                skill.
              </p>
            </div>
            <div className="flex justify-end pt-5 border-t border-gray-200 mt-4">
              <button
                type="submit"
                disabled={isSubmitting || isLoadingProject}
                className={buttonClasses}
              >
                {isSubmitting ? (
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                ) : (
                  <FaSave className="-ml-1 mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProjectPage;
