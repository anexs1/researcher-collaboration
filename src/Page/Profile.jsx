// src/Page/Profile.jsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Ensure useNavigate is imported
import axios from "axios"; // Using Axios for consistency
import {
  FaBell,
  FaEnvelope,
  FaFileUpload,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaSave,
  FaEdit,
  FaSpinner,
  FaPaperPlane,
} from "react-icons/fa";
import Sidebar from "../Component/Sidebar"; // Verify path
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Verify path
import Notification from "../Component/Common/Notification"; // Verify path
import ErrorMessage from "../Component/Common/ErrorMessage"; // Verify path
// import "../index.css"; // Ensure Tailwind is configured via index.css or setup

// API Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Default User Data
const defaultUserData = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  affiliation: "",
  role: "",
  aboutMe: "",
  skills: "",
  researchInterests: "",
  achievements: "",
  socialLinks: { github: "", linkedin: "", twitter: "" },
  contactInfo: { phone: "" },
  profileImage: "https://via.placeholder.com/150",
};

// Default Publication Form Data
const defaultPublicationData = {
  title: "",
  abstract: "",
  author: "",
  document_link: "",
};

// Accept currentUser as a prop
export default function Profile({ currentUser }) {
  // --- Profile State ---
  const [user, setUser] = useState(currentUser); // Initialize with prop
  const [profileFormData, setProfileFormData] = useState(defaultUserData);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!currentUser); // Only load if prop isn't initially passed

  // --- Publication Form State ---
  const [publicationFormData, setPublicationFormData] = useState(
    defaultPublicationData
  );
  const [publicationFormErrors, setPublicationFormErrors] = useState({});
  const [isSubmittingPublication, setIsSubmittingPublication] = useState(false);

  // --- Common State ---
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [apiError, setApiError] = useState("");

  // --- Refs and Hooks ---
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- Notification Handler ---
  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  // --- Effect to Sync with currentUser Prop & Load if needed ---
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser); // Update internal state if prop changes
      const initialProfileData = {
        ...defaultUserData,
        ...currentUser,
        socialLinks: {
          ...defaultUserData.socialLinks,
          ...(currentUser.socialLinks || {}),
        },
        contactInfo: {
          ...defaultUserData.contactInfo,
          ...(currentUser.contactInfo || {}),
        },
        profileImage: currentUser.profileImage || defaultUserData.profileImage,
      };
      setProfileFormData(initialProfileData);
      setPublicationFormData((prev) => ({
        ...defaultPublicationData, // Start fresh for form data except author
        author:
          `${initialProfileData.firstName || ""} ${
            initialProfileData.lastName || ""
          }`.trim() ||
          initialProfileData.username ||
          "",
      }));
      setEditingProfile(false); // Default to view mode when user data is available
      setIsLoadingProfile(false); // Data is ready
      console.log("Profile synced with currentUser prop.");
    } else if (!isLoadingProfile) {
      // Only enter setup if loading is finished AND currentUser is still null/undefined
      console.warn(
        "No currentUser prop found. Entering initial profile setup mode."
      );
      setUser(null);
      setProfileFormData(defaultUserData);
      setPublicationFormData(defaultPublicationData);
      setEditingProfile(true);
      setIsLoadingProfile(false); // Ensure loading stops
    }
  }, [currentUser, isLoadingProfile]); // Re-run if currentUser prop changes

  // --- Profile Input Handlers ---
  const handleProfileInputChange = (e) => {
    setProfileFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const handleNestedProfileInputChange = (e, section) => {
    setProfileFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [e.target.name]: e.target.value },
    }));
  };
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const handleImageChange = (e) => {
    /* ... logic to read file and set preview/formData ... */
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target.result;
        setNewProfileImage(imageDataUrl);
        setProfileFormData((prev) => ({ ...prev, profileImage: imageDataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Profile Save/Cancel Handlers ---
  const handleProfileSave = async () => {
    setIsSavingProfile(true);
    setApiError("");
    const token = localStorage.getItem("authToken");
    if (!token) {
      /* ... handle auth error ... */ return;
    }
    console.log("Saving profile:", profileFormData);
    try {
      // --- TODO: REPLACE WITH ACTUAL API CALL ---
      await new Promise((res) => setTimeout(res, 1000)); // Simulate API call
      const updatedUser = { ...profileFormData }; // Use form data as result in simulation
      // --- End Simulation ---

      localStorage.setItem("user", JSON.stringify(updatedUser)); // Update local storage
      setUser(updatedUser); // Update internal state
      setProfileFormData(updatedUser); // Sync form state
      setNewProfileImage(null);
      setEditingProfile(false);
      showNotification("Profile updated successfully!", "success");
      // Update publication author field in case name changed
      setPublicationFormData((prev) => ({
        ...prev,
        author:
          `${updatedUser.firstName || ""} ${
            updatedUser.lastName || ""
          }`.trim() ||
          updatedUser.username ||
          "",
      }));
    } catch (error) {
      /* ... error handling ... */
      console.error("Failed to save profile:", error);
      const errMsg = error.response?.data?.message || "Failed to save profile.";
      showNotification(errMsg, "error");
      setApiError(errMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };
  const handleProfileCancel = () => {
    /* ... logic to reset profileFormData from user state ... */
    if (user) {
      setProfileFormData({
        /* ... restore from user state ... */ ...defaultUserData,
        ...user,
        socialLinks: {
          ...defaultUserData.socialLinks,
          ...(user.socialLinks || {}),
        },
        contactInfo: {
          ...defaultUserData.contactInfo,
          ...(user.contactInfo || {}),
        },
        profileImage: user.profileImage || defaultUserData.profileImage,
      });
    } else {
      setProfileFormData(defaultUserData);
    }
    setNewProfileImage(null);
    setEditingProfile(false);
  };

  // --- Publication Form Handlers ---
  const handlePublicationInputChange = useCallback((e) => {
    /* ... keep as is ... */
    const { name, value } = e.target;
    setPublicationFormData((prev) => ({ ...prev, [name]: value }));
    setPublicationFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);
  const validatePublicationForm = useCallback(() => {
    /* ... keep as is ... */
    let errors = {};
    if (!publicationFormData.title?.trim()) errors.title = "Title is required";
    if (!publicationFormData.abstract?.trim())
      errors.abstract = "Abstract is required";
    if (!publicationFormData.author?.trim())
      errors.author = "Author name is required";
    if (!publicationFormData.document_link?.trim()) {
      errors.document_link = "Document link is required";
    } else {
      try {
        new URL(publicationFormData.document_link);
      } catch (_) {
        errors.document_link = "Please enter a valid URL";
      }
    }
    setPublicationFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [publicationFormData]);
  const resetPublicationForm = useCallback(() => {
    /* ... keep as is ... */
    const currentAuthor =
      `${profileFormData.firstName || ""} ${
        profileFormData.lastName || ""
      }`.trim() ||
      profileFormData.username ||
      "";
    setPublicationFormData({
      ...defaultPublicationData,
      author: currentAuthor,
    });
    setPublicationFormErrors({});
  }, [profileFormData]);
  const handlePublicationSubmit = async (e) => {
    /* ... keep as is, including navigation ... */
    e.preventDefault();
    if (!validatePublicationForm()) {
      return;
    }
    setIsSubmittingPublication(true);
    setApiError("");
    const token = localStorage.getItem("authToken");
    if (!token) {
      /* ... handle auth error ... */ return;
    }
    try {
      const url = `${API_BASE_URL}/api/publications`;
      const response = await axios.post(url, publicationFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Publication posted successfully!", "success");
      resetPublicationForm();
      // ***** NAVIGATE to the publication list page *****
      navigate("/publications"); // Use the correct path for your publication list page
      // ****************************************************
    } catch (error) {
      /* ... error handling ... */
      console.error("Error submitting publication:", error);
      const errMsg =
        error.response?.data?.message || "Failed to post publication.";
      showNotification(errMsg, "error");
      setApiError(errMsg);
    } finally {
      setIsSubmittingPublication(false);
    }
  };

  // --- Loading State ---
  if (isLoadingProfile) {
    /* ... keep as is ... */
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        {" "}
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-xl text-gray-600">
          Loading Profile...
        </span>{" "}
      </div>
    );
  }

  // --- Render Helper for Profile Fields ---
  const renderProfileField = (
    label,
    name,
    value,
    placeholder = "",
    type = "text",
    isNested = false,
    section = ""
  ) => {
    /* ... keep as is ... */
    if (editingProfile) {
      /* ... return editing input/textarea ... */
      const commonProps = {
        id: `profile-${name}`,
        name,
        value: value || "",
        onChange: isNested
          ? (e) => handleNestedProfileInputChange(e, section)
          : handleProfileInputChange,
        placeholder: placeholder || `Enter ${label}`,
        className:
          "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100",
        disabled: isSavingProfile,
      };
      return (
        <div className="mb-4">
          {" "}
          <label
            htmlFor={`profile-${name}`}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>{" "}
          {type === "textarea" ? (
            <textarea {...commonProps} rows="4" />
          ) : (
            <input {...commonProps} type={type} />
          )}{" "}
        </div>
      );
    }
    return (
      <div className="mb-3">
        {" "}
        <span className="text-sm font-medium text-gray-500">
          {label}
          {label ? ":" : ""}
        </span>{" "}
        <p className="text-gray-800 whitespace-pre-wrap break-words mt-1">
          {value || <span className="text-gray-400 italic">Not set</span>}
        </p>{" "}
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Ensure Sidebar receives correct login status */}
      <Sidebar isLoggedIn={!!user} />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {user ? "Your Profile" : "Create Your Profile"}
          </h1>
          {/* Optional Action Buttons (like messages/notifications) */}
          <div className="flex flex-wrap gap-2">{/* ... */}</div>
        </div>

        {/* Notifications & Errors */}
        <Notification
          /* ... props ... */ message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        />
        {apiError && (
          <div className="mb-4">
            <ErrorMessage message={apiError} onClose={() => setApiError("")} />
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8">
          {/* Profile Header (Image, Name, Edit button) */}
          <div className="flex flex-col sm:flex-row items-center mb-8 pb-6 border-b border-gray-200 gap-4">
            {/* ... Image + Upload Button ... */}
            <div className="relative flex-shrink-0">
              <img
                src={
                  newProfileImage ||
                  profileFormData.profileImage ||
                  defaultUserData.profileImage
                }
                alt="Profile"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md"
              />
              {editingProfile && (
                <button
                  onClick={triggerFileInput}
                  disabled={isSavingProfile} /* ... */
                >
                  <FaEdit size={16} />
                </button>
              )}
            </div>
            {/* ... Name/Role/Affiliation (uses renderProfileField) ... */}
            <div className="text-center sm:text-left flex-grow">
              {/* Name/Role/Affiliation */}
            </div>
            {/* ... Edit Profile Button ... */}
            {!editingProfile && user && (
              <button onClick={() => setEditingProfile(true)} className="...">
                <FaEdit className="mr-2" /> Edit Profile
              </button>
            )}
          </div>
          {/* Profile Body (About, Contact, Social, Skills etc. uses renderProfileField) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* About Me */}
            <div className="md:col-span-2">
              {renderProfileField(
                "",
                "aboutMe",
                profileFormData.aboutMe,
                "Tell us...",
                "textarea"
              )}
            </div>
            {/* Contact */}
            <div>
              {renderProfileField(
                "Email",
                "email",
                profileFormData.email,
                "",
                "email"
              )}
              {renderProfileField(
                "Phone",
                "phone",
                profileFormData.contactInfo.phone,
                "",
                "tel",
                true,
                "contactInfo"
              )}
            </div>
            {/* Social */}
            <div>
              {/* ... renderProfileField for github, linkedin, twitter ... */}
            </div>
            {/* Skills */}
            <div className="md:col-span-2">
              {renderProfileField(
                "",
                "skills",
                profileFormData.skills,
                "Comma-separated...",
                "textarea"
              )}
            </div>
            {/* Interests */}
            <div className="md:col-span-2">
              {renderProfileField(
                "",
                "researchInterests",
                profileFormData.researchInterests,
                "Comma-separated...",
                "textarea"
              )}
            </div>
            {/* Achievements */}
            <div className="md:col-span-2">
              {renderProfileField(
                "",
                "achievements",
                profileFormData.achievements,
                "List achievements...",
                "textarea"
              )}
            </div>
          </div>
          {/* Profile Save/Cancel Buttons */}
          {editingProfile && (
            <div className="mt-8 pt-6 border-t ... flex justify-end gap-3">
              <button
                type="button"
                onClick={handleProfileCancel}
                disabled={isSavingProfile} /* ... */
              >
                {" "}
                Cancel{" "}
              </button>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={isSavingProfile} /* ... */
              >
                {" "}
                {isSavingProfile
                  ? "Saving..."
                  : user
                  ? "Save Changes"
                  : "Create Profile"}{" "}
              </button>
            </div>
          )}
        </div>

        {/* ====== Post Publication Form Section ====== */}
        {/* Only show form if user data exists (i.e., logged in and profile loaded/created) */}
        {user && (
          <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
              Post New Publication
            </h2>
            <form
              onSubmit={handlePublicationSubmit}
              className="space-y-4"
              noValidate
            >
              {/* Title Field */}
              <div>
                <label
                  htmlFor="pub-title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="pub-title"
                  name="title"
                  value={publicationFormData.title}
                  onChange={handlePublicationInputChange}
                  placeholder="Publication title"
                  required
                  className={`mt-1 block w-full ... ${
                    publicationFormErrors.title
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {publicationFormErrors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {publicationFormErrors.title}
                  </p>
                )}
              </div>
              {/* Abstract Field */}
              <div>
                <label
                  htmlFor="pub-abstract"
                  className="block text-sm font-medium text-gray-700"
                >
                  Abstract
                </label>
                <textarea
                  id="pub-abstract"
                  name="abstract"
                  rows="4"
                  value={publicationFormData.abstract}
                  onChange={handlePublicationInputChange}
                  placeholder="Brief summary or abstract"
                  required
                  className={`mt-1 block w-full ... ${
                    publicationFormErrors.abstract
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {publicationFormErrors.abstract && (
                  <p className="mt-1 text-xs text-red-600">
                    {publicationFormErrors.abstract}
                  </p>
                )}
              </div>
              {/* Author Field */}
              <div>
                <label
                  htmlFor="pub-author"
                  className="block text-sm font-medium text-gray-700"
                >
                  Author(s)
                </label>
                <input
                  type="text"
                  id="pub-author"
                  name="author"
                  value={publicationFormData.author}
                  onChange={handlePublicationInputChange}
                  placeholder="Defaults to your name"
                  required
                  className={`mt-1 block w-full ... ${
                    publicationFormErrors.author
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {publicationFormErrors.author && (
                  <p className="mt-1 text-xs text-red-600">
                    {publicationFormErrors.author}
                  </p>
                )}
              </div>
              {/* Document Link Field */}
              <div>
                <label
                  htmlFor="pub-link"
                  className="block text-sm font-medium text-gray-700"
                >
                  Document Link (URL)
                </label>
                <input
                  type="url"
                  id="pub-link"
                  name="document_link"
                  value={publicationFormData.document_link}
                  onChange={handlePublicationInputChange}
                  placeholder="https://example.com/paper.pdf"
                  required
                  className={`mt-1 block w-full ... ${
                    publicationFormErrors.document_link
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {publicationFormErrors.document_link && (
                  <p className="mt-1 text-xs text-red-600">
                    {publicationFormErrors.document_link}
                  </p>
                )}
              </div>
              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPublication}
                  className="inline-flex justify-center items-center py-2 px-4 ..."
                >
                  {isSubmittingPublication ? (
                    <FaSpinner className="animate-spin ..." />
                  ) : (
                    <FaPaperPlane className="mr-2" />
                  )}
                  {isSubmittingPublication
                    ? "Submitting..."
                    : "Post Publication"}
                </button>
              </div>
            </form>
          </div>
        )}
        {/* End Publication Form Section */}
      </main>
    </div>
  );
}
