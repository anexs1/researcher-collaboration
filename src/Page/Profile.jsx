import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  FaTag,
  FaCalendarAlt,
  FaFlask, // Added icons
} from "react-icons/fa";
import Sidebar from "../Component/Sidebar"; // Verify path
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Verify path
import Notification from "../Component/Common/Notification"; // Verify path
import ErrorMessage from "../Component/Common/ErrorMessage"; // Verify path

// API Base URL (Ensure consistent with axios instance if you create one)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Default User Data (Keep as is)
const defaultUserData = {
  /* ... */
};

// --- UPDATED Default Publication Form Data ---
const defaultPublicationData = {
  title: "",
  summary: "", // Renamed from abstract
  author: "",
  tags: "", // Store tags as comma-separated string in form state
  area: "",
  publicationDate: "",
  document_link: "",
};

// Research Areas for dropdown (match ExplorePage or fetch)
const researchAreas = [
  "", // Add an empty option for default/unselected
  "Computer Science",
  "Physics",
  "Engineering",
  "Biology",
  "Health",
  "Ethics",
  "Other", // Add an 'Other' option
];

export default function Profile({ currentUser }) {
  // --- Profile State (Keep as is) ---
  const [user, setUser] = useState(currentUser);
  const [profileFormData, setProfileFormData] = useState(defaultUserData);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!currentUser);

  // --- Publication Form State ---
  // Initialize with UPDATED default data
  const [publicationFormData, setPublicationFormData] = useState(
    defaultPublicationData
  );
  const [publicationFormErrors, setPublicationFormErrors] = useState({});
  const [isSubmittingPublication, setIsSubmittingPublication] = useState(false);

  // --- Common State (Keep as is) ---
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [apiError, setApiError] = useState("");

  // --- Refs and Hooks (Keep as is) ---
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- Notification Handler (Keep as is) ---
  const showNotification = (message, type = "success") => {
    /* ... */
  };

  // --- Effect to Sync with currentUser Prop & Load if needed ---
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      const initialProfileData = {
        // ... (keep profile data sync logic)
      };
      setProfileFormData(initialProfileData);

      // --- Update Publication Author Default ---
      setPublicationFormData((prev) => ({
        ...defaultPublicationData, // Use UPDATED default data
        author:
          `${initialProfileData.firstName || ""} ${
            initialProfileData.lastName || ""
          }`.trim() ||
          initialProfileData.username ||
          "",
      }));
      // --- End Update ---

      setEditingProfile(false);
      setIsLoadingProfile(false);
      console.log("Profile synced with currentUser prop.");
    } else if (!isLoadingProfile) {
      // ... (keep initial setup logic)
      setPublicationFormData(defaultPublicationData); // Use UPDATED default data
      // ...
    }
  }, [currentUser, isLoadingProfile]);

  // --- Profile Handlers (Keep as is) ---
  const handleProfileInputChange = (e) => {
    /* ... */
  };
  const handleNestedProfileInputChange = (e, section) => {
    /* ... */
  };
  const triggerFileInput = () => {
    /* ... */
  };
  const handleImageChange = (e) => {
    /* ... */
  };
  const handleProfileSave = async () => {
    // ... (keep profile save logic) ...
    // --- Update publication author default after saving profile ---
    try {
      // ... (API call simulation/actual call) ...
      const updatedUser = { ...profileFormData }; // Assuming response contains updated user

      // ... (rest of success logic) ...
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
    }
    // ...
  };
  const handleProfileCancel = () => {
    /* ... */
  };

  // --- Publication Form Handlers (UPDATED) ---
  const handlePublicationInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setPublicationFormData((prev) => ({ ...prev, [name]: value }));
      // Clear validation error for the field being changed
      if (publicationFormErrors[name]) {
        setPublicationFormErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [publicationFormErrors]
  ); // Add dependency

  const validatePublicationForm = useCallback(() => {
    let errors = {};
    if (!publicationFormData.title?.trim()) errors.title = "Title is required";
    // --- Validate summary instead of abstract ---
    if (!publicationFormData.summary?.trim())
      errors.summary = "Summary is required";
    // --- End change ---
    if (!publicationFormData.author?.trim())
      errors.author = "Author name is required";
    // --- Optional: Validate new fields ---
    if (!publicationFormData.area?.trim())
      errors.area = "Research Area is required";
    // if (!publicationFormData.tags?.trim()) errors.tags = "At least one tag is recommended";
    if (!publicationFormData.publicationDate)
      errors.publicationDate = "Publication Date is required";
    // --- End optional validation ---
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
    const currentAuthor =
      `${profileFormData.firstName || ""} ${
        profileFormData.lastName || ""
      }`.trim() ||
      profileFormData.username ||
      "";
    // --- Reset with UPDATED default data ---
    setPublicationFormData({
      ...defaultPublicationData,
      author: currentAuthor,
    });
    // --- End reset ---
    setPublicationFormErrors({});
  }, [profileFormData]); // Depend on profileFormData for author default

  const handlePublicationSubmit = async (e) => {
    e.preventDefault();
    if (!validatePublicationForm()) {
      showNotification(
        "Please fix the errors in the publication form.",
        "error"
      );
      return;
    }
    setIsSubmittingPublication(true);
    setApiError("");
    const token = localStorage.getItem("authToken");
    if (!token) {
      setApiError("Authentication required. Please log in again.");
      showNotification("Authentication required.", "error");
      setIsSubmittingPublication(false);
      return;
    }

    // --- Prepare Payload ---
    // Split tags string into an array, trim whitespace, remove empty strings
    const tagsArray = publicationFormData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const payload = {
      title: publicationFormData.title,
      summary: publicationFormData.summary, // Use summary
      author: publicationFormData.author,
      document_link: publicationFormData.document_link,
      tags: tagsArray, // Send as array
      area: publicationFormData.area,
      publicationDate: publicationFormData.publicationDate,
      // collaborationStatus defaults to 'open' on backend
    };
    // --- End Prepare Payload ---

    try {
      const url = `${API_BASE_URL}/api/publications`; // Ensure this endpoint is correct
      const response = await axios.post(url, payload, {
        // Send prepared payload
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Publication posted successfully!", "success");
      resetPublicationForm();
      navigate("/publications"); // Navigate after successful post
    } catch (error) {
      console.error("Error submitting publication:", error);
      const errMsg =
        error.response?.data?.message || "Failed to post publication.";
      showNotification(errMsg, "error");
      setApiError(errMsg);
    } finally {
      setIsSubmittingPublication(false);
    }
  };

  // --- Loading State (Keep as is) ---
  if (isLoadingProfile) {
    /* ... */
  }

  // --- Render Helper for Profile Fields (Keep as is) ---
  const renderProfileField = (label, name, value /*...*/) => {
    /* ... */
  };

  // --- Main Render ---
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isLoggedIn={!!user} />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {/* Header, Notifications, Errors, Profile Card (Keep as is) */}
        {/* ... */}

        {/* ====== Post Publication Form Section (UPDATED) ====== */}
        {user && ( // Only show form if user is loaded/logged in
          <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
              Post New Publication
            </h2>
            <form
              onSubmit={handlePublicationSubmit}
              className="space-y-4"
              noValidate
            >
              {/* Title Field (Keep as is) */}
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
                  className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
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

              {/* --- Summary Field (Replaced Abstract) --- */}
              <div>
                <label
                  htmlFor="pub-summary"
                  className="block text-sm font-medium text-gray-700"
                >
                  Summary
                </label>
                <textarea
                  id="pub-summary"
                  name="summary"
                  rows="4"
                  value={publicationFormData.summary}
                  onChange={handlePublicationInputChange}
                  placeholder="Brief summary of the publication"
                  required
                  className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    publicationFormErrors.summary
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {publicationFormErrors.summary && (
                  <p className="mt-1 text-xs text-red-600">
                    {publicationFormErrors.summary}
                  </p>
                )}
              </div>
              {/* --- End Summary Field --- */}

              {/* Author Field (Keep as is) */}
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
                  placeholder="Defaults to your name, add others if needed"
                  required
                  className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
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

              {/* --- NEW: Tags Field --- */}
              <div>
                <label
                  htmlFor="pub-tags"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tags (comma-separated)
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {" "}
                    <FaTag className="h-4 w-4 text-gray-400" />{" "}
                  </div>
                  <input
                    type="text"
                    id="pub-tags"
                    name="tags"
                    value={publicationFormData.tags}
                    onChange={handlePublicationInputChange}
                    placeholder="e.g., AI, Machine Learning, NLP"
                    className={`pl-10 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      publicationFormErrors.tags
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {publicationFormErrors.tags && (
                  <p className="mt-1 text-xs text-red-600">
                    {publicationFormErrors.tags}
                  </p>
                )}
              </div>
              {/* --- End Tags Field --- */}

              {/* --- NEW: Area Field (Dropdown) --- */}
              <div>
                <label
                  htmlFor="pub-area"
                  className="block text-sm font-medium text-gray-700"
                >
                  Research Area
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {" "}
                    <FaFlask className="h-4 w-4 text-gray-400" />{" "}
                  </div>
                  <select
                    id="pub-area"
                    name="area"
                    value={publicationFormData.area}
                    onChange={handlePublicationInputChange}
                    required
                    className={`pl-10 block w-full py-2 pr-8 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      publicationFormErrors.area
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    {researchAreas.map((areaOption) => (
                      <option
                        key={areaOption}
                        value={areaOption}
                        disabled={areaOption === ""}
                      >
                        {areaOption === "" ? "Select an area..." : areaOption}
                      </option>
                    ))}
                  </select>
                </div>
                {publicationFormErrors.area && (
                  <p className="mt-1 text-xs text-red-600">
                    {publicationFormErrors.area}
                  </p>
                )}
              </div>
              {/* --- End Area Field --- */}

              {/* --- NEW: Publication Date Field --- */}
              <div>
                <label
                  htmlFor="pub-date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Publication Date
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {" "}
                    <FaCalendarAlt className="h-4 w-4 text-gray-400" />{" "}
                  </div>
                  <input
                    type="date"
                    id="pub-date"
                    name="publicationDate"
                    value={publicationFormData.publicationDate}
                    onChange={handlePublicationInputChange}
                    required
                    className={`pl-10 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      publicationFormErrors.publicationDate
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {publicationFormErrors.publicationDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {publicationFormErrors.publicationDate}
                  </p>
                )}
              </div>
              {/* --- End Publication Date Field --- */}

              {/* Document Link Field (Keep as is) */}
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
                  className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
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

              {/* Submit Button (Keep as is) */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPublication}
                  className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmittingPublication ? (
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  ) : (
                    <FaPaperPlane className="-ml-1 mr-2 h-5 w-5" />
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
