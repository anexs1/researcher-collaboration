// src/Page/CreateProjectPage.jsx
import React, { useState, useCallback, useEffect } from "react"; // Added useEffect for potential fetching
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Or your configured apiClient
import Select from "react-select"; // Import react-select for collaborators
import CreatableSelect from "react-select/creatable"; // Import Creatable for tags
import { FaPlusCircle, FaSave, FaSpinner } from "react-icons/fa"; // Icons

// Import shared components (adjust paths as needed)
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";

// API Client Setup (or use imported apiClient)
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

// Default state for the form using arrays for selects
const defaultProjectData = {
  title: "",
  description: "",
  status: "Planning", // Default status
  collaborators: [], // Store selected collaborator values (e.g., usernames or IDs)
  tags: [], // Store selected/created tag values
  dueDate: "",
};

// This page will render inside the UserLayout (standard left sidebar)
const CreateProjectPage = ({ currentUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(defaultProjectData);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  // --- State for Select Options ---
  // TODO: Replace with actual API fetch in a useEffect
  const [collaboratorOptions, setCollaboratorOptions] = useState([
    { value: "user1_id", label: "User One (user1)" }, // Ideally use user IDs as values
    { value: "user2_id", label: "User Two (user2)" },
  ]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false); // Loading state for options

  // --- Handlers ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification({ message: "", type: "", show: false }),
      5000
    );
  }, []);

  // Handles standard input/textarea/select changes
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formErrors[name]) {
        setFormErrors((prev) => ({ ...prev, [name]: undefined }));
      }
      setApiError("");
    },
    [formErrors]
  );

  // Handler specifically for the Collaborators react-select (multi-select)
  const handleCollaboratorChange = (selectedOptions) => {
    // Store only the values (e.g., user IDs) in formData
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFormData((prev) => ({ ...prev, collaborators: values }));
    if (formErrors.collaborators) {
      setFormErrors((prev) => ({ ...prev, collaborators: undefined }));
    }
    setApiError("");
  };

  // Handler specifically for the Tags Creatable react-select (multi-select)
  const handleTagsChange = (selectedOptions) => {
    // Store the string values of the tags
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFormData((prev) => ({ ...prev, tags: values }));
    if (formErrors.tags) {
      setFormErrors((prev) => ({ ...prev, tags: undefined }));
    }
    setApiError("");
  };

  // Validation
  const validateForm = useCallback(() => {
    let errors = {};
    if (!formData.title?.trim()) errors.title = "Project title is required.";
    if (!formData.description?.trim())
      errors.description = "Project description is required.";
    // Optional: Add validation for collaborators/tags if needed (e.g., max number)
    // if (formData.collaborators.length < 1) errors.collaborators = "Add at least one collaborator.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification("Please fill required fields.", "error");
      return;
    }
    setIsSubmitting(true);
    setApiError("");

    // Payload uses the arrays directly from state now
    const payload = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      collaborators: formData.collaborators, // Array of collaborator IDs/usernames
      tags: formData.tags, // Array of tag strings
      dueDate: formData.dueDate || null,
      // Backend extracts ownerId from token
    };

    try {
      const response = await apiClient.post("/api/projects", payload);
      if (response.data?.success && response.data?.data) {
        showNotification("Project created successfully!", "success");
        setFormData(defaultProjectData); // Reset form
        navigate("/my-projects");
      } else {
        throw new Error(response.data?.message || "Failed to create project.");
      }
    } catch (err) {
      console.error("Create project error:", err);
      const errMsg =
        err.response?.data?.message || err.message || "An error occurred.";
      setApiError(errMsg);
      showNotification(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Styling ---
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400";
  const buttonClasses =
    "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";
  // Custom styles for react-select
  const selectStyles = {
    control: (p, s) => ({
      ...p,
      borderColor: s.isFocused ? "#6366f1" : "#d1d5db",
      boxShadow: s.isFocused ? "0 0 0 1px #6366f1" : "none",
      "&:hover": { borderColor: "#a5b4fc" },
      minHeight: "42px",
      borderRadius: "0.375rem",
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
    multiValueRemove: (p) => ({
      ...p,
      color: "#4338ca",
      "&:hover": { backgroundColor: "#c7d2fe", color: "#3730a3" },
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
  }; // Add zIndex for menu overlay

  // --- TODO: Fetch collaborator options ---
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        // Replace with your actual endpoint to get users
        const response = await apiClient.get("/api/users/searchable"); // Example endpoint
        const users = response.data?.data || [];
        setCollaboratorOptions(
          users.map((u) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName} (${u.username})`,
          }))
        );
      } catch (err) {
        console.error("Failed to load collaborator options:", err);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  return (
    <>
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg border border-gray-200 p-6 md:p-8">
          {/* Header */}
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center border-b border-gray-200 pb-3">
            <FaPlusCircle className="mr-3 text-indigo-600" /> Create New Project
          </h1>

          {apiError && (
            <div className="mb-4">
              <ErrorMessage
                message={apiError}
                onClose={() => setApiError("")}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
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
              />
              {formErrors.title && (
                <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
              )}
            </div>

            {/* Description */}
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
              ></textarea>
              {formErrors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.description}
                </p>
              )}
            </div>

            {/* Status & Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={inputClasses}
                >
                  <option value="Planning">Planning</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
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
                />
                {formErrors.dueDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {formErrors.dueDate}
                  </p>
                )}
              </div>
            </div>

            {/* Collaborators Select */}
            <div>
              <label htmlFor="collaborators" className={labelClasses}>
                Collaborators
              </label>
              <Select
                id="collaborators"
                name="collaborators" // Connects to handleMultiSelectChange
                isMulti
                options={collaboratorOptions}
                isLoading={isLoadingOptions} // Show loading state
                value={collaboratorOptions.filter((opt) =>
                  formData.collaborators.includes(opt.value)
                )} // Display selected
                onChange={handleCollaboratorChange} // Use specific handler
                styles={selectStyles}
                placeholder="Select users..."
                noOptionsMessage={() =>
                  isLoadingOptions ? "Loading users..." : "No users found"
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                Select users to invite to this project.
              </p>
              {formErrors.collaborators && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.collaborators}
                </p>
              )}
            </div>

            {/* Tags Creatable Select */}
            <div>
              <label htmlFor="tags" className={labelClasses}>
                Tags (Keywords)
              </label>
              <CreatableSelect
                id="tags"
                name="tags"
                isMulti
                isClearable
                // You might fetch common tags to suggest as options
                // options={commonTagOptions}
                value={formData.tags.map((tag) => ({ value: tag, label: tag }))} // Map array to options
                onChange={handleTagsChange} // Use specific handler
                styles={selectStyles}
                placeholder="Type to add tags..."
                formatCreateLabel={(inputValue) => `Add tag: "${inputValue}"`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter relevant keywords. Press Enter or Tab after typing a new
                tag.
              </p>
              {formErrors.tags && (
                <p className="mt-1 text-xs text-red-600">{formErrors.tags}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={buttonClasses}
              >
                {isSubmitting && (
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Creating Project..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default CreateProjectPage;
