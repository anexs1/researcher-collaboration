// src/Page/Profile.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FaFileUpload,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaSave,
  FaEdit,
  FaSpinner,
  FaUser,
  FaExternalLinkAlt,
  FaTimes,
  FaPlus,
  FaCheck,
  FaGlobe,
  FaGraduationCap,
  FaBook,
  FaAward,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { debounce } from "lodash";

// Import Main Sidebar (Left)
import Sidebar from "../Component/Sidebar";

// Import NEW Profile Sidebar (Right)
import ProfileSidebar from "../Component/Profile/ProfileSidebar";

// Import Common Components
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";

// API Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Default Data Structure
const defaultUserData = {
  id: null,
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  bio: "",
  profilePictureUrl: null,
  socialLinks: { linkedin: "", github: "", twitter: "", website: "" },
  interests: [],
  institution: "",
  education: [],
  publications: [],
  awards: [],
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
};

export default function Profile({ currentUser, isLoggedIn, handleLogout }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  // State
  const [viewedUser, setViewedUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [apiError, setApiError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState(defaultUserData);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [isDragging, setIsDragging] = useState(false);
  const [bioPreview, setBioPreview] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Hotkeys for better UX
  useHotkeys("esc", () => editingProfile && handleProfileCancel());
  useHotkeys("cmd+s, ctrl+s", (e) => {
    e.preventDefault();
    if (editingProfile) handleProfileSave();
  });

  // Debounced save for autosave feature
  const debouncedSave = useCallback(
    debounce(() => {
      if (editingProfile) {
        handleProfileSave();
      }
    }, 5000),
    [editingProfile, profileFormData]
  );

  // Effect for autosave
  useEffect(() => {
    if (editingProfile) {
      debouncedSave();
    }
    return () => debouncedSave.cancel();
  }, [profileFormData, editingProfile, debouncedSave]);

  // Callbacks & Handlers
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification({ message: "", type: "", show: false }),
      5000
    );
  }, []);

  const syncFormWithViewedUser = useCallback(
    (userToSync) => {
      const userData = userToSync || defaultUserData;
      setProfileFormData({
        username: userData.username || "",
        email: userData.email || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        bio: userData.bio || "",
        profilePictureUrl: userData.profilePictureUrl || null,
        socialLinks: {
          linkedin: userData.socialLinks?.linkedin || "",
          github: userData.socialLinks?.github || "",
          twitter: userData.socialLinks?.twitter || "",
          website: userData.socialLinks?.website || "",
        },
        interests: Array.isArray(userData.interests) ? userData.interests : [],
        institution: userData.institution || "",
        education: Array.isArray(userData.education) ? userData.education : [],
        publications: Array.isArray(userData.publications)
          ? userData.publications
          : [],
        awards: Array.isArray(userData.awards) ? userData.awards : [],
      });

      const newPreviewUrl = userData.profilePictureUrl || null;
      if (
        imagePreview &&
        imagePreview.startsWith("blob:") &&
        imagePreview !== newPreviewUrl
      ) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(newPreviewUrl);
      setNewProfileImage(null);
    },
    [imagePreview]
  );

  // Drag and drop handlers for profile image
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOwnProfile && editingProfile) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isOwnProfile || !editingProfile) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleImageChange({ target: { files: [file] } });
      }
    }
  };

  // Effect to Load Profile
  useEffect(() => {
    const profileUserIdToFetch = userId;
    const loggedInUserId = currentUser?.id;
    const ownProfileCheck =
      (!profileUserIdToFetch && loggedInUserId) ||
      (profileUserIdToFetch &&
        loggedInUserId &&
        String(profileUserIdToFetch) === String(loggedInUserId));
    setIsOwnProfile(ownProfileCheck);
    setIsLoadingProfile(true);
    setApiError("");
    setProfileNotFound(false);
    setViewedUser(null);
    setEditingProfile(false);
    let fetchUrl = "";
    const config = { headers: {} };
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (ownProfileCheck) {
      if (!loggedInUserId) {
        setIsLoadingProfile(false);
        setApiError("Login required.");
        return;
      }
      fetchUrl = `${API_BASE_URL}/api/auth/me`;
    } else if (profileUserIdToFetch) {
      fetchUrl = `${API_BASE_URL}/api/users/public/${profileUserIdToFetch}`;
    } else {
      setIsLoadingProfile(false);
      setApiError("Cannot determine profile.");
      return;
    }
    const controller = new AbortController();
    config.signal = controller.signal;
    axios
      .get(fetchUrl, config)
      .then((response) => {
        const fetchedUser = ownProfileCheck
          ? response.data?.data
          : response.data;
        if (!fetchedUser || typeof fetchedUser !== "object" || !fetchedUser.id)
          throw new Error("Invalid profile data.");
        setViewedUser(fetchedUser);
        syncFormWithViewedUser(fetchedUser);
      })
      .catch((error) => {
        if (error.name === "CanceledError") return;
        console.error(`Error fetching profile from ${fetchUrl}:`, error);
        if (!ownProfileCheck && error.response?.status === 404) {
          setProfileNotFound(true);
        } else {
          setApiError(
            error.response?.data?.message ||
              error.message ||
              "Failed to load profile."
          );
        }
        setViewedUser(null);
        syncFormWithViewedUser(null);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
    return () => controller.abort();
  }, [userId, currentUser, syncFormWithViewedUser]);

  // Editing Handlers
  const handleEditClick = () => {
    if (isOwnProfile) {
      syncFormWithViewedUser(viewedUser);
      setEditingProfile(true);
      setApiError("");
    }
  };

  const handleProfileCancel = () => {
    if (isOwnProfile && viewedUser) {
      syncFormWithViewedUser(viewedUser);
      setEditingProfile(false);
      setApiError("");
    }
  };

  const handleProfileSave = async () => {
    if (!isOwnProfile) return;
    setIsSavingProfile(true);
    setApiError("");
    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification("Authentication required.", "error");
      setIsSavingProfile(false);
      return;
    }

    const formDataToSubmit = new FormData();
    Object.keys(profileFormData).forEach((key) => {
      if (key === "profilePictureUrl") return;
      if (key === "socialLinks") {
        Object.keys(profileFormData.socialLinks).forEach((linkKey) =>
          formDataToSubmit.append(
            `socialLinks[${linkKey}]`,
            profileFormData.socialLinks[linkKey] || ""
          )
        );
      } else if (key === "interests") {
        if (Array.isArray(profileFormData.interests)) {
          profileFormData.interests.forEach((interest, index) =>
            formDataToSubmit.append(`interests[${index}]`, interest)
          );
        }
      } else if (
        key === "education" ||
        key === "publications" ||
        key === "awards"
      ) {
        if (Array.isArray(profileFormData[key])) {
          formDataToSubmit.append(key, JSON.stringify(profileFormData[key]));
        }
      } else if (
        profileFormData[key] !== null &&
        profileFormData[key] !== undefined
      ) {
        formDataToSubmit.append(key, profileFormData[key]);
      }
    });

    if (newProfileImage) {
      formDataToSubmit.append("profileImageFile", newProfileImage);
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        formDataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = response.data?.data || response.data;
      if (!updatedUser) throw new Error("Update response invalid.");
      setViewedUser(updatedUser);
      syncFormWithViewedUser(updatedUser);
      setEditingProfile(false);
      showNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      const errMsg =
        error.response?.data?.message || "Failed to update profile.";
      setApiError(errMsg);
      showNotification(errMsg, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleImageChange = (e) => {
    if (!isOwnProfile || !editingProfile) return;
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showNotification("Please upload an image file", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showNotification("Image size should be less than 5MB", "error");
        return;
      }
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setNewProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    if (isOwnProfile && editingProfile) {
      fileInputRef.current?.click();
    }
  };

  const handleProfileInputChange = (e) => {
    if (!isOwnProfile || !editingProfile) return;
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedProfileInputChange = (e, section) => {
    if (!isOwnProfile || !editingProfile) return;
    const { name, value } = e.target;
    setProfileFormData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [name]: value },
    }));
  };

  // Array item handlers for education, publications, awards
  const handleAddArrayItem = (arrayName) => {
    setProfileFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], { id: Date.now(), value: "" }],
    }));
  };

  const handleRemoveArrayItem = (arrayName, index) => {
    setProfileFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const handleArrayItemChange = (arrayName, index, field, value) => {
    setProfileFormData((prev) => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  // Render Helper
  const renderProfileField = (
    label,
    name,
    displayValue,
    type = "text",
    isNested = false,
    section = null,
    placeholder = "",
    extraClasses = ""
  ) => {
    const canEditField = isOwnProfile && editingProfile;
    const commonInputClasses = `mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed ${extraClasses}`;
    const displayClasses = `mt-1 text-sm text-gray-900 py-2 min-h-[38px] break-words ${extraClasses}`;
    const inputValue = isNested
      ? profileFormData[section]?.[name] ?? ""
      : profileFormData[name] ?? "";

    if (name === "email" && !isOwnProfile) return null;

    return (
      <div className="mb-4">
        <label
          htmlFor={canEditField ? name : undefined}
          className="block text-sm font-medium text-gray-700 mb-0.5"
        >
          {label}
        </label>
        {canEditField ? (
          type === "textarea" ? (
            <div className="relative">
              <textarea
                id={name}
                name={name}
                rows="4"
                value={inputValue}
                onChange={(e) =>
                  isNested
                    ? handleNestedProfileInputChange(e, section)
                    : handleProfileInputChange(e)
                }
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                className={commonInputClasses}
              />
              {name === "bio" && (
                <button
                  type="button"
                  onClick={() => setBioPreview(!bioPreview)}
                  className="absolute right-2 bottom-2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                >
                  {bioPreview ? "Hide Preview" : "Show Preview"}
                </button>
              )}
            </div>
          ) : (
            <input
              type={type}
              id={name}
              name={name}
              value={inputValue}
              onChange={(e) =>
                isNested
                  ? handleNestedProfileInputChange(e, section)
                  : handleProfileInputChange(e)
              }
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className={commonInputClasses}
              disabled={name === "username" || name === "email"}
            />
          )
        ) : (
          <p className={displayClasses}>
            {displayValue || (
              <span className="text-gray-400 italic">Not set</span>
            )}
          </p>
        )}
      </div>
    );
  };

  // Loading / Error / Not Found States
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center p-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (profileNotFound) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-white shadow-md rounded-lg p-8 text-center max-w-lg mx-auto mt-10"
      >
        <FaUser className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800">
          Profile Not Found
        </h2>
        <p className="text-gray-500 mt-2 mb-6">
          This user profile does not exist.
        </p>
        <Link
          to="/explore"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Back to Explore
        </Link>
      </motion.div>
    );
  }

  if (apiError && !viewedUser) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-red-50 border border-red-300 text-red-800 p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10 text-center"
      >
        <h2 className="text-xl font-semibold">Error Loading Profile</h2>
        <p className="mt-2 mb-6">{apiError}</p>
        <Link
          to="/explore"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Back to Explore
        </Link>
      </motion.div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="p-6 text-center text-gray-500">
        Unable to display profile.
      </div>
    );
  }

  // Helper for Initials & Image URL
  const getInitials = (firstName = "", lastName = "") =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  const initials = getInitials(viewedUser.firstName, viewedUser.lastName);
  const displayImageUrl =
    isOwnProfile &&
    editingProfile &&
    imagePreview &&
    imagePreview.startsWith("blob:")
      ? imagePreview
      : viewedUser.profilePictureUrl;

  // Main Render with 3 Columns
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Column 1: Main Navigation Sidebar */}
      <Sidebar
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        currentUser={currentUser}
      />

      {/* Column 2: Central Profile Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() =>
                  setNotification({ ...notification, show: false })
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-6 border-b border-gray-200 pb-6 gap-4">
            <div className="flex items-center space-x-4 flex-grow min-w-0">
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                  isDragging
                    ? "border-dashed border-indigo-500 bg-indigo-50"
                    : "border-gray-300 bg-slate-200"
                }`}
              >
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt={`${viewedUser.username || "User"}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : initials ? (
                  <span className="text-3xl sm:text-4xl font-semibold text-slate-500">
                    {initials}
                  </span>
                ) : (
                  <FaUser className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                )}
                {isOwnProfile && editingProfile && (
                  <>
                    <button
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                      aria-label="Upload new profile picture"
                      title="Upload/Change profile picture"
                    >
                      <FaFileUpload className="w-4 h-4" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                      aria-hidden="true"
                    />
                  </>
                )}
                {isDragging && (
                  <div className="absolute inset-0 bg-indigo-500 bg-opacity-20 flex items-center justify-center">
                    <div className="text-indigo-700 font-medium text-sm text-center p-2">
                      Drop image here
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h2
                  className="text-xl sm:text-2xl font-semibold text-gray-900 truncate"
                  title={
                    `${viewedUser.firstName || ""} ${
                      viewedUser.lastName || ""
                    }`.trim() || viewedUser.username
                  }
                >
                  {`${viewedUser.firstName || ""} ${
                    viewedUser.lastName || ""
                  }`.trim() || viewedUser.username}
                </h2>
                {isOwnProfile && (
                  <p
                    className="text-sm text-gray-500 truncate"
                    title={viewedUser.email}
                  >
                    {viewedUser.email}
                  </p>
                )}
                <p
                  className="text-sm text-gray-600 mt-1 truncate"
                  title={viewedUser.institution}
                >
                  {viewedUser.institution || (
                    <span className="italic text-gray-400">Not set</span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwnProfile && (
              <div className="flex-shrink-0 mt-4 sm:mt-0">
                {editingProfile ? (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProfileSave}
                      disabled={isSavingProfile}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {isSavingProfile ? (
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      ) : (
                        <FaSave className="-ml-1 mr-2 h-5 w-5" />
                      )}
                      Save
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProfileCancel}
                      disabled={isSavingProfile}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 w-full sm:w-auto"
                    >
                      Cancel
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEditClick}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FaEdit className="-ml-1 mr-2 h-5 w-5" /> Edit Profile
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("education")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "education"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Education
              </button>
              <button
                onClick={() => setActiveTab("publications")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "publications"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Publications
              </button>
              <button
                onClick={() => setActiveTab("awards")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "awards"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Awards
              </button>
            </nav>
          </div>

          {/* Error Message */}
          {isOwnProfile && apiError && editingProfile && (
            <div className="mb-4">
              <ErrorMessage
                message={apiError}
                onClose={() => setApiError("")}
              />
            </div>
          )}

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  {renderProfileField(
                    "Username",
                    "username",
                    viewedUser.username
                  )}
                  {isOwnProfile &&
                    renderProfileField(
                      "Email",
                      "email",
                      viewedUser.email,
                      "email"
                    )}
                  {renderProfileField(
                    "First Name",
                    "firstName",
                    viewedUser.firstName
                  )}
                  {renderProfileField(
                    "Last Name",
                    "lastName",
                    viewedUser.lastName
                  )}
                  {renderProfileField(
                    "Institution",
                    "institution",
                    viewedUser.institution
                  )}
                  <div className="md:col-span-2">
                    {renderProfileField(
                      "Bio",
                      "bio",
                      viewedUser.bio,
                      "textarea",
                      false,
                      null,
                      isOwnProfile
                        ? "Tell us about yourself (Markdown supported)..."
                        : ""
                    )}
                    {bioPreview && editingProfile && (
                      <div className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Preview:
                        </h4>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="prose prose-sm max-w-none"
                        >
                          {profileFormData.bio}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Social Links Section */}
                  {(viewedUser.socialLinks?.linkedin ||
                    viewedUser.socialLinks?.github ||
                    viewedUser.socialLinks?.twitter ||
                    viewedUser.socialLinks?.website ||
                    (isOwnProfile && editingProfile)) && (
                    <div className="md:col-span-2 mt-6 border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Online Presence
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                        {renderProfileField(
                          "LinkedIn",
                          "linkedin",
                          viewedUser.socialLinks?.linkedin ? (
                            <a
                              href={viewedUser.socialLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              {viewedUser.socialLinks.linkedin}
                              <FaExternalLinkAlt className="ml-1 text-xs" />
                            </a>
                          ) : null,
                          "url",
                          true,
                          "socialLinks",
                          "https://linkedin.com/in/..."
                        )}
                        {renderProfileField(
                          "GitHub",
                          "github",
                          viewedUser.socialLinks?.github ? (
                            <a
                              href={viewedUser.socialLinks.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              {viewedUser.socialLinks.github}
                              <FaExternalLinkAlt className="ml-1 text-xs" />
                            </a>
                          ) : null,
                          "url",
                          true,
                          "socialLinks",
                          "https://github.com/..."
                        )}
                        {renderProfileField(
                          "Twitter",
                          "twitter",
                          viewedUser.socialLinks?.twitter ? (
                            <a
                              href={viewedUser.socialLinks.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              {viewedUser.socialLinks.twitter}
                              <FaExternalLinkAlt className="ml-1 text-xs" />
                            </a>
                          ) : null,
                          "url",
                          true,
                          "socialLinks",
                          "https://twitter.com/..."
                        )}
                        {renderProfileField(
                          "Website",
                          "website",
                          viewedUser.socialLinks?.website ? (
                            <a
                              href={viewedUser.socialLinks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              {viewedUser.socialLinks.website}
                              <FaExternalLinkAlt className="ml-1 text-xs" />
                            </a>
                          ) : null,
                          "url",
                          true,
                          "socialLinks",
                          "https://yourwebsite.com"
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interests Section */}
                  {(viewedUser.interests?.length > 0 ||
                    (isOwnProfile && editingProfile)) && (
                    <div className="md:col-span-2 mt-6 border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Research Interests
                      </h3>
                      {isOwnProfile && editingProfile ? (
                        <div>
                          <input
                            type="text"
                            name="interests"
                            value={profileFormData.interests?.join(", ") ?? ""}
                            onChange={(e) =>
                              setProfileFormData((prev) => ({
                                ...prev,
                                interests: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }))
                            }
                            placeholder="e.g., AI, Neuroscience (comma-separated)"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Separate multiple interests with commas
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {viewedUser.interests?.length > 0 ? (
                            viewedUser.interests.map((interest, index) => (
                              <motion.span
                                key={index}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full"
                              >
                                {interest}
                              </motion.span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No interests listed.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "education" && (
                <div>
                  {isOwnProfile && editingProfile ? (
                    <div className="space-y-4">
                      {profileFormData.education.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Degree
                              </label>
                              <input
                                type="text"
                                value={item.degree || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "education",
                                    index,
                                    "degree",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Ph.D in Computer Science"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Institution
                              </label>
                              <input
                                type="text"
                                value={item.institution || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "education",
                                    index,
                                    "institution",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Stanford University"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year
                              </label>
                              <input
                                type="text"
                                value={item.year || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "education",
                                    index,
                                    "year",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., 2015-2020"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Thesis/Dissertation
                              </label>
                              <input
                                type="text"
                                value={item.thesis || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "education",
                                    index,
                                    "thesis",
                                    e.target.value
                                  )
                                }
                                placeholder="Title of your thesis/dissertation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                handleRemoveArrayItem("education", index)
                              }
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                            >
                              <FaTimes className="mr-1" /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddArrayItem("education")}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaPlus className="mr-2" /> Add Education
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {viewedUser.education?.length > 0 ? (
                        viewedUser.education.map((edu, index) => (
                          <motion.div
                            key={index}
                            initial="hidden"
                            animate="visible"
                            variants={slideUp}
                            className="border-l-4 border-indigo-200 pl-4 py-2"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mt-1">
                                <FaGraduationCap className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <h4 className="text-lg font-medium text-gray-900">
                                  {edu.degree}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {edu.institution}
                                </p>
                                {edu.year && (
                                  <p className="text-sm text-gray-500">
                                    {edu.year}
                                  </p>
                                )}
                                {edu.thesis && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700">
                                      Thesis/Dissertation:
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {edu.thesis}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FaGraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No education information available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "publications" && (
                <div>
                  {isOwnProfile && editingProfile ? (
                    <div className="space-y-4">
                      {profileFormData.publications.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={item.title || ""}
                              onChange={(e) =>
                                handleArrayItemChange(
                                  "publications",
                                  index,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="Title of publication"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Authors
                              </label>
                              <input
                                type="text"
                                value={item.authors || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "publications",
                                    index,
                                    "authors",
                                    e.target.value
                                  )
                                }
                                placeholder="List of authors"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year
                              </label>
                              <input
                                type="text"
                                value={item.year || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "publications",
                                    index,
                                    "year",
                                    e.target.value
                                  )
                                }
                                placeholder="Publication year"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Journal/Conference
                            </label>
                            <input
                              type="text"
                              value={item.journal || ""}
                              onChange={(e) =>
                                handleArrayItemChange(
                                  "publications",
                                  index,
                                  "journal",
                                  e.target.value
                                )
                              }
                              placeholder="Journal or conference name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              DOI/Link
                            </label>
                            <input
                              type="text"
                              value={item.doi || ""}
                              onChange={(e) =>
                                handleArrayItemChange(
                                  "publications",
                                  index,
                                  "doi",
                                  e.target.value
                                )
                              }
                              placeholder="DOI or URL"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                handleRemoveArrayItem("publications", index)
                              }
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                            >
                              <FaTimes className="mr-1" /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddArrayItem("publications")}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaPlus className="mr-2" /> Add Publication
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {viewedUser.publications?.length > 0 ? (
                        viewedUser.publications.map((pub, index) => (
                          <motion.div
                            key={index}
                            initial="hidden"
                            animate="visible"
                            variants={slideUp}
                            className="border-l-4 border-indigo-200 pl-4 py-2"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mt-1">
                                <FaBook className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <h4 className="text-lg font-medium text-gray-900">
                                  {pub.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {pub.authors}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {pub.journal} {pub.year && `(${pub.year})`}
                                </p>
                                {pub.doi && (
                                  <a
                                    href={
                                      pub.doi.startsWith("http")
                                        ? pub.doi
                                        : `https://doi.org/${pub.doi}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center mt-1"
                                  >
                                    View Publication{" "}
                                    <FaExternalLinkAlt className="ml-1 text-xs" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FaBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No publications available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "awards" && (
                <div>
                  {isOwnProfile && editingProfile ? (
                    <div className="space-y-4">
                      {profileFormData.awards.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Award Name
                              </label>
                              <input
                                type="text"
                                value={item.name || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "awards",
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Name of award"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year
                              </label>
                              <input
                                type="text"
                                value={item.year || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "awards",
                                    index,
                                    "year",
                                    e.target.value
                                  )
                                }
                                placeholder="Year received"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Organization
                            </label>
                            <input
                              type="text"
                              value={item.organization || ""}
                              onChange={(e) =>
                                handleArrayItemChange(
                                  "awards",
                                  index,
                                  "organization",
                                  e.target.value
                                )
                              }
                              placeholder="Organization granting award"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={item.description || ""}
                              onChange={(e) =>
                                handleArrayItemChange(
                                  "awards",
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Brief description of award"
                              rows="2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() =>
                                handleRemoveArrayItem("awards", index)
                              }
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                            >
                              <FaTimes className="mr-1" /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddArrayItem("awards")}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaPlus className="mr-2" /> Add Award
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {viewedUser.awards?.length > 0 ? (
                        viewedUser.awards.map((award, index) => (
                          <motion.div
                            key={index}
                            initial="hidden"
                            animate="visible"
                            variants={slideUp}
                            className="border-l-4 border-indigo-200 pl-4 py-2"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mt-1">
                                <FaAward className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <h4 className="text-lg font-medium text-gray-900">
                                  {award.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {award.organization}{" "}
                                  {award.year && `(${award.year})`}
                                </p>
                                {award.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {award.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FaAward className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No awards available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Column 3: Profile-Specific Sidebar (Right) */}
      <ProfileSidebar
        isOwnProfile={isOwnProfile}
        isEditing={editingProfile}
        onEditClick={handleEditClick}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userData={viewedUser}
      />
    </div>
  );
}
