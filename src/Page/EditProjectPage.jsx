// src/pages/EditProjectPage.jsx

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom"; // Added useParams, Link
import axios from "axios";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  FaPencilAlt, // Changed Icon
  FaSave,
  FaSpinner,
  FaUserPlus,
  FaUsers,
  FaTimes,
  FaArrowLeft, // Added Back Arrow
  FaExclamationTriangle, // Added for error display
} from "react-icons/fa";

// Import shared components
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Added Loading Spinner

// API Client Setup
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

// Default state for the form
const defaultProjectData = {
  title: "",
  description: "",
  status: "Planning",
  collaborators: [], // Stores collaborator IDs
  tags: [], // Stores tag strings
  dueDate: "",
  members: [], // Stores member objects { email, role, message? }
};

// Style constants
const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
const inputClasses =
  "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 disabled:bg-gray-100"; // Added disabled style
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
    backgroundColor: s.isDisabled ? "#f3f4f6" : "white", // Added disabled style
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

// --- Component Start ---
const EditProjectPage = ({ currentUser }) => {
  const navigate = useNavigate();
  const { projectId } = useParams(); // Get project ID from URL params

  // State
  const [formData, setFormData] = useState(defaultProjectData);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(true); // Loading state for initial fetch
  const [projectNotFoundError, setProjectNotFoundError] = useState(false); // State for 404 error
  const [apiError, setApiError] = useState(""); // State for other API errors
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    email: "",
    role: "Collaborator",
    message: "",
  });
  const [collaboratorOptions, setCollaboratorOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Notification handler
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification({ message: "", type: "", show: false }),
      5000
    );
  }, []);

  // Fetch users for collaborator dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        // Replace with your actual endpoint to get users for selection
        const response = await apiClient.get("/api/users/searchable");
        const users = response.data?.data || [];
        setCollaboratorOptions(
          users.map((u) => ({
            value: u.id,
            label: `${u.firstName || ""} ${u.lastName || ""} (${
              u.email
            })`.trim(), // Handle missing names
            email: u.email,
          }))
        );
      } catch (err) {
        console.error("Failed to load collaborator options:", err);
        // Handle error appropriately, maybe show a silent error or log it
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // Fetch existing project data when the component mounts or projectId changes
  useEffect(() => {
    if (!projectId) {
      setApiError("Project ID is missing in the URL.");
      setIsLoadingProject(false);
      return;
    }
    console.log(`Fetching project data for ID: ${projectId}`);

    const fetchProject = async () => {
      setIsLoadingProject(true);
      setProjectNotFoundError(false);
      setApiError("");
      try {
        // *** VERIFY THIS API ENDPOINT IS CORRECT FOR YOUR BACKEND ***
        const response = await apiClient.get(`/api/projects/${projectId}`);
        const projectData = response.data?.data;

        if (!projectData) {
          console.warn("API returned success but no project data found.");
          setProjectNotFoundError(true); // Trigger the 'not found' display
        } else {
          console.log("Fetched Project Data:", projectData);
          // Populate the form state with fetched data
          setFormData({
            title: projectData.title || "",
            description: projectData.description || "",
            status: projectData.status || "Planning",
            collaborators: Array.isArray(projectData.collaborators)
              ? projectData.collaborators.map((c) =>
                  typeof c === "object" ? c.id : c
                )
              : [],
            tags: Array.isArray(projectData.tags) ? projectData.tags : [],
            dueDate: projectData.dueDate
              ? new Date(projectData.dueDate).toISOString().split("T")[0]
              : "",
            members: Array.isArray(projectData.members)
              ? projectData.members
              : [],
          });
        }
      } catch (err) {
        console.error("Fetch project API error:", err);
        if (err.response?.status === 404) {
          // *** THIS CODE CORRECTLY HANDLES THE 404 ERROR ***
          console.log(`API returned 404 for project ID: ${projectId}`);
          setProjectNotFoundError(true); // This state triggers the error message display
        } else {
          setApiError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load project data. Please try again."
          );
        }
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId]); // Re-fetch if the projectId changes

  // --- Member Management Functions ---
  const handleAddMember = () => {
    if (!newMember.email || !/\S+@\S+\.\S+/.test(newMember.email)) {
      setFormErrors((prev) => ({
        ...prev,
        memberEmail: "Valid email is required",
      }));
      return;
    }
    const memberExists = formData.members.some(
      (m) => m.email === newMember.email
    );
    if (memberExists) {
      setFormErrors((prev) => ({
        ...prev,
        memberEmail: "Member already added",
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      members: [...prev.members, { ...newMember }],
    }));
    setNewMember({ email: "", role: "Collaborator", message: "" });
    setShowMemberModal(false);
  };
  const handleRemoveMember = (email) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.email !== email),
    }));
  };
  const handleMemberInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({ ...prev, [name]: value }));
    if (name === "email" && formErrors.memberEmail) {
      setFormErrors((prev) => ({ ...prev, memberEmail: undefined }));
    }
  };

  // --- Standard Input & Select Handlers ---
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
  const handleCollaboratorChange = (selectedOptions) => {
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFormData((prev) => ({ ...prev, collaborators: values }));
    if (formErrors.collaborators) {
      setFormErrors((prev) => ({ ...prev, collaborators: undefined }));
    }
    setApiError("");
  };
  const handleTagsChange = (selectedOptions) => {
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFormData((prev) => ({ ...prev, tags: values }));
    if (formErrors.tags) {
      setFormErrors((prev) => ({ ...prev, tags: undefined }));
    }
    setApiError("");
  };

  // --- Form Validation ---
  const validateForm = useCallback(() => {
    let errors = {};
    if (!formData.title?.trim()) errors.title = "Project title is required.";
    if (!formData.description?.trim())
      errors.description = "Project description is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // --- Form Submission (Update Logic) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification("Please fill all required fields correctly.", "error");
      return;
    }
    setIsSubmitting(true);
    setApiError("");
    const payload = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      collaborators: formData.collaborators,
      members: formData.members,
      tags: formData.tags,
      dueDate: formData.dueDate || null,
    };
    console.log("Submitting updated data:", payload);
    try {
      // *** VERIFY THIS API ENDPOINT AND METHOD (PUT/PATCH) ARE CORRECT ***
      const response = await apiClient.put(
        `/api/projects/${projectId}`,
        payload
      );
      if (response.data?.success && response.data?.data) {
        showNotification("Project updated successfully!", "success");
        navigate("/my-projects");
      } else {
        throw new Error(response.data?.message || "Failed to update project.");
      }
    } catch (err) {
      console.error("Update project API error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while saving changes.";
      setApiError(errMsg);
      showNotification(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---

  // 1. Show loading spinner
  if (isLoadingProject) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[300px]">
        <LoadingSpinner size="lg" message="Loading project details..." />
      </div>
    );
  }

  // 2. Show "Not Found" message <<< THIS IS BEING TRIGGERED CORRECTLY
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
          The project you are trying to edit could not be found. It might have
          been deleted or the ID is incorrect.
        </p>
        <Link
          to="/my-projects"
          className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FaArrowLeft className="mr-2" /> Back to My Projects
        </Link>
      </div>
    );
  }

  // 3. Show general API error
  if (apiError && !formData.title) {
    return (
      <div className="text-center py-10 px-4">
        <ErrorMessage message={apiError} />
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 mr-2"
        >
          Try Again
        </button>
        <Link
          to="/my-projects"
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  // 4. Prepare select values
  const collaboratorSelectValue =
    !isLoadingOptions && formData.collaborators
      ? collaboratorOptions.filter((opt) =>
          formData.collaborators.includes(opt.value)
        )
      : [];
  const tagsSelectValue = formData.tags
    ? formData.tags.map((tag) => ({ value: tag, label: tag }))
    : [];

  // 5. Render the Edit Form
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
      <div className="max-w-3xl mx-auto mb-10">
        <div className="bg-white shadow-xl rounded-lg border border-gray-200 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
            {" "}
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
              <FaPencilAlt className="mr-3 text-indigo-600" /> Edit Project
            </h1>{" "}
            <Link
              to="/my-projects"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <FaArrowLeft className="mr-1" /> Back to Projects
            </Link>{" "}
          </div>
          {/* Submission API error */}
          {apiError && (
            <div className="mb-4">
              <ErrorMessage
                message={apiError}
                onClose={() => setApiError("")}
              />
            </div>
          )}
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}{" "}
            <div>
              {" "}
              <label htmlFor="title" className={labelClasses}>
                Project Title <span className="text-red-600">*</span>
              </label>{" "}
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className={inputClasses}
                maxLength={150}
              />{" "}
              {formErrors.title && (
                <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
              )}{" "}
            </div>
            {/* Description */}{" "}
            <div>
              {" "}
              <label htmlFor="description" className={labelClasses}>
                Description <span className="text-red-600">*</span>
              </label>{" "}
              <textarea
                id="description"
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleInputChange}
                required
                className={inputClasses}
                placeholder="Provide a detailed overview..."
              ></textarea>{" "}
              {formErrors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.description}
                </p>
              )}{" "}
            </div>
            {/* Status & Due Date */}{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {" "}
              <div>
                {" "}
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>{" "}
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={inputClasses}
                >
                  {" "}
                  <option value="Planning">Planning</option>{" "}
                  <option value="Ongoing">Ongoing</option>{" "}
                  <option value="Completed">Completed</option>{" "}
                  <option value="On Hold">On Hold</option>{" "}
                </select>{" "}
              </div>{" "}
              <div>
                {" "}
                <label htmlFor="dueDate" className={labelClasses}>
                  Due Date (Optional)
                </label>{" "}
                <input
                  type="date"
                  name="dueDate"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className={inputClasses}
                />{" "}
              </div>{" "}
            </div>
            {/* Collaborators */}{" "}
            <div>
              {" "}
              <label htmlFor="collaborators" className={labelClasses}>
                Collaborators
              </label>{" "}
              <Select
                id="collaborators"
                name="collaborators"
                isMulti
                options={collaboratorOptions}
                isLoading={isLoadingOptions}
                value={collaboratorSelectValue}
                onChange={handleCollaboratorChange}
                styles={selectStyles}
                placeholder="Select users..."
                noOptionsMessage={() =>
                  isLoadingOptions ? "Loading users..." : "No users found"
                }
              />{" "}
              <p className="mt-1 text-xs text-gray-500">
                Users selected here will be associated with the project.
              </p>{" "}
            </div>
            {/* Members */}{" "}
            <div>
              {" "}
              <div className="flex justify-between items-center mb-2">
                {" "}
                <label className={labelClasses}>
                  Team Members (Invited/Added)
                </label>{" "}
                <button
                  type="button"
                  onClick={() => setShowMemberModal(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <FaUserPlus className="mr-1" /> Add/Invite Member
                </button>{" "}
              </div>{" "}
              {formData.members.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                  {" "}
                  {formData.members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm"
                    >
                      {" "}
                      <div>
                        {" "}
                        <span className="font-medium text-gray-800">
                          {member.email}
                        </span>{" "}
                        <span className="text-gray-500 ml-2">
                          ({member.role})
                        </span>{" "}
                      </div>{" "}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.email)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                        title="Remove Member"
                      >
                        <FaTimes />
                      </button>{" "}
                    </div>
                  ))}{" "}
                </div>
              ) : (
                <div className="text-sm text-gray-500 py-2 text-center border rounded bg-gray-50">
                  No members added yet.
                </div>
              )}{" "}
              {formErrors.memberEmail && (
                <p className="mt-1 text-xs text-red-600">
                  {formErrors.memberEmail}
                </p>
              )}{" "}
            </div>
            {/* Tags */}{" "}
            <div>
              {" "}
              <label htmlFor="tags" className={labelClasses}>
                Tags (Keywords)
              </label>{" "}
              <CreatableSelect
                id="tags"
                name="tags"
                isMulti
                isClearable
                value={tagsSelectValue}
                onChange={handleTagsChange}
                styles={selectStyles}
                placeholder="Type or select tags..."
                formatCreateLabel={(inputValue) => `Add tag: "${inputValue}"`}
              />{" "}
              <p className="mt-1 text-xs text-gray-500">
                Enter relevant keywords. Press Enter or Tab after typing a new
                tag.
              </p>{" "}
            </div>
            {/* Submit Button */}{" "}
            <div className="flex justify-end pt-5 border-t border-gray-200 mt-4">
              {" "}
              <button
                type="submit"
                disabled={isSubmitting || isLoadingProject}
                className={buttonClasses}
              >
                {" "}
                {isSubmitting ? (
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                ) : (
                  <FaSave className="-ml-1 mr-2 h-4 w-4" />
                )}{" "}
                {isSubmitting ? "Saving Changes..." : "Save Changes"}{" "}
              </button>{" "}
            </div>
          </form>
        </div>
      </div>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {" "}
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            {" "}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                <FaUserPlus className="inline mr-2" /> Add Team Member
              </h3>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setNewMember({
                    email: "",
                    role: "Collaborator",
                    message: "",
                  });
                  setFormErrors((prev) => ({
                    ...prev,
                    memberEmail: undefined,
                  }));
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>{" "}
            <div className="space-y-4">
              {" "}
              <div>
                <label htmlFor="memberEmail" className={labelClasses}>
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="memberEmail"
                  name="email"
                  value={newMember.email}
                  onChange={handleMemberInputChange}
                  className={inputClasses}
                  placeholder="member@example.com"
                  required
                />
                {formErrors.memberEmail && (
                  <p className="mt-1 text-xs text-red-600">
                    {formErrors.memberEmail}
                  </p>
                )}
              </div>{" "}
              <div>
                <label htmlFor="memberRole" className={labelClasses}>
                  Role
                </label>
                <select
                  id="memberRole"
                  name="role"
                  value={newMember.role}
                  onChange={handleMemberInputChange}
                  className={inputClasses}
                >
                  <option value="Collaborator">Collaborator</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Observer">Observer</option>
                </select>
              </div>{" "}
              <div>
                <label htmlFor="memberMessage" className={labelClasses}>
                  Invitation Message (Optional)
                </label>
                <textarea
                  id="memberMessage"
                  name="message"
                  rows="3"
                  value={newMember.message}
                  onChange={handleMemberInputChange}
                  className={inputClasses}
                  placeholder="Add a personal message..."
                ></textarea>
              </div>{" "}
            </div>{" "}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Add Member
              </button>
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </>
  );
};

export default EditProjectPage;
