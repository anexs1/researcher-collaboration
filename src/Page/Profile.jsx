/// src/Page/Profile.jsx
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
import ProfileSidebar from "../Component/Profile/ProfileSidebar";
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
};

export default function Profile({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

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

  // Hotkeys
  useHotkeys("esc", () => editingProfile && handleProfileCancel());
  useHotkeys("cmd+s, ctrl+s", (e) => {
    e.preventDefault();
    if (editingProfile) handleProfileSave();
  });

  const debouncedSave = useCallback(
    debounce(() => {
      if (editingProfile) {
        handleProfileSave();
      }
    }, 5000),
    [editingProfile, profileFormData]
  );

  useEffect(() => {
    if (editingProfile) {
      debouncedSave();
    }
    return () => debouncedSave.cancel();
  }, [profileFormData, editingProfile, debouncedSave]);

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

  // Drag and drop handlers
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
      } else {
        showNotification("Only image files can be dropped here.", "error");
      }
    }
  };

  // Load profile data
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
        setApiError("Authentication required to view your profile.");
        navigate("/login");
        return;
      }
      fetchUrl = `${API_BASE_URL}/api/auth/me`;
    } else if (profileUserIdToFetch) {
      fetchUrl = `${API_BASE_URL}/api/users/public/${profileUserIdToFetch}`;
    } else {
      setIsLoadingProfile(false);
      setApiError("Cannot determine which profile to load.");
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

        if (
          !fetchedUser ||
          typeof fetchedUser !== "object" ||
          !fetchedUser.id
        ) {
          throw new Error("Received invalid profile data from server.");
        }

        setViewedUser(fetchedUser);
        syncFormWithViewedUser(fetchedUser);
      })
      .catch((error) => {
        if (error.name === "CanceledError") {
          console.log("Profile fetch request cancelled");
          return;
        }
        console.error(`Error fetching profile from ${fetchUrl}:`, error);
        if (!ownProfileCheck && error.response?.status === 404) {
          setProfileNotFound(true);
        } else {
          setApiError(
            error.response?.data?.message ||
              error.message ||
              "Failed to load profile information."
          );
        }
        setViewedUser(null);
        syncFormWithViewedUser(null);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });

    return () => {
      controller.abort();
    };
  }, [userId, currentUser, syncFormWithViewedUser, navigate]);

  // Edit handlers
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
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(viewedUser.profilePictureUrl || null);
      setNewProfileImage(null);
    }
  };

  const handleProfileSave = async () => {
    if (!isOwnProfile) return;
    setIsSavingProfile(true);
    setApiError("");
    const token = localStorage.getItem("authToken");

    if (!token) {
      showNotification("Authentication required to save profile.", "error");
      setIsSavingProfile(false);
      return;
    }

    const formDataToSubmit = new FormData();

    // Append simple fields
    [
      "username",
      "email",
      "firstName",
      "lastName",
      "bio",
      "institution",
    ].forEach((key) => {
      if (profileFormData[key] !== null && profileFormData[key] !== undefined) {
        formDataToSubmit.append(key, profileFormData[key]);
      }
    });

    // Append social links
    if (profileFormData.socialLinks) {
      Object.keys(profileFormData.socialLinks).forEach((linkKey) => {
        formDataToSubmit.append(
          `socialLinks[${linkKey}]`,
          profileFormData.socialLinks[linkKey] || ""
        );
      });
    }

    // Append interests
    if (Array.isArray(profileFormData.interests)) {
      profileFormData.interests.forEach((interest, index) => {
        formDataToSubmit.append(`interests[${index}]`, interest);
      });
    }

    // Append complex arrays
    ["education", "publications", "awards"].forEach((key) => {
      if (Array.isArray(profileFormData[key])) {
        formDataToSubmit.append(key, JSON.stringify(profileFormData[key]));
      }
    });

    // Append profile image if changed
    if (newProfileImage) {
      formDataToSubmit.append("profileImageFile", newProfileImage);
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data?.data || response.data;
      if (!updatedUser) {
        throw new Error("Update response from server was invalid.");
      }

      setViewedUser(updatedUser);
      syncFormWithViewedUser(updatedUser);
      setEditingProfile(false);
      setNewProfileImage(null);

      showNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      const errMsg =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile. Please try again.";
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
        showNotification(
          "Please upload a valid image file (e.g., JPG, PNG, GIF).",
          "error"
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image size should not exceed 5MB.", "error");
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

  const handleAddArrayItem = (arrayName) => {
    let newItem = {};
    if (arrayName === "education")
      newItem = {
        id: `new_${Date.now()}`,
        degree: "",
        institution: "",
        year: "",
        thesis: "",
      };
    else if (arrayName === "publications")
      newItem = {
        id: `new_${Date.now()}`,
        title: "",
        authors: "",
        year: "",
        journal: "",
        doi: "",
      };
    else if (arrayName === "awards")
      newItem = {
        id: `new_${Date.now()}`,
        name: "",
        year: "",
        organization: "",
        description: "",
      };
    else newItem = { id: `new_${Date.now()}`, value: "" };

    setProfileFormData((prev) => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), newItem],
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
      if (newArray[index] && typeof newArray[index] === "object") {
        newArray[index] = { ...newArray[index], [field]: value };
      } else {
        console.warn(
          `Item at index ${index} in ${arrayName} is not an object.`
        );
      }
      return { ...prev, [arrayName]: newArray };
    });
  };

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
    const commonInputClasses = `mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:text-gray-500 disabled:cursor-not-allowed ${extraClasses}`;
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
                  className="absolute right-2 bottom-2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-pressed={bioPreview}
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
          <div className={displayClasses}>
            {displayValue || (
              <span className="text-gray-400 italic">Not set</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center p-10 md:p-20 h-full">
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
          The profile you are looking for does not exist or is private.
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
        <button
          onClick={() => window.location.reload()}
          className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium mr-2"
        >
          Try Again
        </button>
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
        Unable to display profile information.
      </div>
    );
  }

  const getInitials = (firstName = "", lastName = "") =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  const initials = getInitials(viewedUser.firstName, viewedUser.lastName);
  const displayImageUrl =
    isOwnProfile && editingProfile && imagePreview
      ? imagePreview
      : viewedUser.profilePictureUrl;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Central Profile Content Area */}
      <div className="flex-grow min-w-0">
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
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

        {/* Main profile card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white shadow-xl rounded-lg p-6 md:p-8"
        >
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-6 border-b border-gray-200 pb-6 gap-4">
            <div className="flex items-center space-x-4 flex-grow min-w-0">
              {/* Profile Picture/Initials */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden border-2 group ${
                  isOwnProfile && editingProfile
                    ? "cursor-pointer hover:border-indigo-400"
                    : ""
                } ${
                  isDragging
                    ? "border-dashed border-indigo-500 bg-indigo-50"
                    : "border-gray-300 bg-slate-200"
                }`}
                onClick={
                  isOwnProfile && editingProfile ? triggerFileInput : undefined
                }
                title={
                  isOwnProfile && editingProfile
                    ? "Click or drop image to change"
                    : ""
                }
              >
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt={`${viewedUser.username || "User"}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : initials ? (
                  <span
                    className={`text-3xl sm:text-4xl font-semibold text-slate-500 ${
                      displayImageUrl ? "hidden" : ""
                    }`}
                  >
                    {initials}
                  </span>
                ) : (
                  <FaUser
                    className={`w-10 h-10 sm:w-12 sm:h-12 text-slate-500 ${
                      displayImageUrl || initials ? "hidden" : ""
                    }`}
                  />
                )}

                {isOwnProfile && editingProfile && (
                  <>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <FaFileUpload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
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
                  <div className="absolute inset-0 bg-indigo-500 bg-opacity-30 flex items-center justify-center pointer-events-none">
                    <div className="text-indigo-800 font-semibold text-sm text-center p-2 bg-white rounded shadow">
                      Drop Image
                    </div>
                  </div>
                )}
              </div>

              {/* Name, Email, Institution */}
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
                  title={viewedUser.institution || "Institution not set"}
                >
                  {viewedUser.institution || (
                    <span className="italic text-gray-400">
                      Institution not set
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwnProfile && (
              <div className="flex-shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
                {editingProfile ? (
                  <div className="flex flex-col sm:flex-row gap-2">
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
                        <FaCheck className="-ml-1 mr-2 h-5 w-5" />
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
                      <FaTimes className="-ml-1 mr-2 h-5 w-5" />
                      Cancel
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEditClick}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                  >
                    <FaEdit className="-ml-1 mr-2 h-5 w-5" /> Edit Profile
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto">
              {[
                { key: "overview", label: "Overview" },
                { key: "education", label: "Education" },
                { key: "publications", label: "Publications" },
                { key: "awards", label: "Awards" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    activeTab === tab.key
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                >
                  {tab.label}
                </button>
              ))}
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
              {/* Overview Tab */}
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

                  {/* Bio Field */}
                  <div className="md:col-span-2">
                    {renderProfileField(
                      "Bio",
                      "bio",
                      !editingProfile && viewedUser.bio ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="prose prose-sm max-w-none mt-1 py-2"
                        >
                          {viewedUser.bio}
                        </ReactMarkdown>
                      ) : (
                        viewedUser.bio
                      ),
                      "textarea",
                      false,
                      null,
                      isOwnProfile
                        ? "Tell us about yourself (Markdown supported)..."
                        : "",
                      "min-h-[100px]"
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
                          {profileFormData.bio || "*No content yet*"}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                        {renderProfileField(
                          "LinkedIn",
                          "linkedin",
                          viewedUser.socialLinks?.linkedin ? (
                            <a
                              href={
                                viewedUser.socialLinks.linkedin.startsWith(
                                  "http"
                                )
                                  ? viewedUser.socialLinks.linkedin
                                  : `https://${viewedUser.socialLinks.linkedin}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center break-all"
                            >
                              {viewedUser.socialLinks.linkedin}
                              <FaExternalLinkAlt className="ml-1.5 text-xs flex-shrink-0" />
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
                              href={
                                viewedUser.socialLinks.github.startsWith("http")
                                  ? viewedUser.socialLinks.github
                                  : `https://${viewedUser.socialLinks.github}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center break-all"
                            >
                              {viewedUser.socialLinks.github}
                              <FaExternalLinkAlt className="ml-1.5 text-xs flex-shrink-0" />
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
                              href={
                                viewedUser.socialLinks.twitter.startsWith(
                                  "http"
                                )
                                  ? viewedUser.socialLinks.twitter
                                  : `https://${viewedUser.socialLinks.twitter}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center break-all"
                            >
                              {viewedUser.socialLinks.twitter}
                              <FaExternalLinkAlt className="ml-1.5 text-xs flex-shrink-0" />
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
                              href={
                                viewedUser.socialLinks.website.startsWith(
                                  "http"
                                )
                                  ? viewedUser.socialLinks.website
                                  : `https://${viewedUser.socialLinks.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center break-all"
                            >
                              {viewedUser.socialLinks.website}
                              <FaExternalLinkAlt className="ml-1.5 text-xs flex-shrink-0" />
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
                            placeholder="e.g., Artificial Intelligence, Quantum Physics"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Separate interests with commas.
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

              {/* Education Tab */}
              {activeTab === "education" && (
                <div>
                  {isOwnProfile && editingProfile ? (
                    <div className="space-y-4">
                      {(profileFormData.education || []).map((item, index) => (
                        <div
                          key={item.id || index}
                          className="border border-gray-200 rounded-lg p-4 relative"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Degree*
                              </label>
                              <input
                                type="text"
                                required
                                value={item.degree || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "education",
                                    index,
                                    "degree",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Ph.D in Neuroscience"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Institution*
                              </label>
                              <input
                                type="text"
                                required
                                value={item.institution || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "education",
                                    index,
                                    "institution",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., University of Cambridge"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year(s)
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
                                placeholder="e.g., 2018-2022 or 2022"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Thesis/Dissertation (Optional)
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
                                placeholder="Title of thesis/dissertation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveArrayItem("education", index)
                            }
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                            title="Remove Education Entry"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddArrayItem("education")}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaPlus className="mr-2 -ml-1 h-4 w-4" /> Add Education
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
                            className="border-l-4 border-indigo-200 pl-4 py-2 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mt-0.5">
                                <FaGraduationCap className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <h4 className="text-base font-semibold text-gray-900">
                                  {edu.degree || "N/A"}
                                </h4>
                                <p className="text-sm text-gray-700">
                                  {edu.institution || "N/A"}
                                </p>
                                {edu.year && (
                                  <p className="text-sm text-gray-500">
                                    {edu.year}
                                  </p>
                                )}
                                {edu.thesis && (
                                  <div className="mt-1.5">
                                    <p className="text-sm font-medium text-gray-600">
                                      Thesis:
                                    </p>
                                    <p className="text-sm text-gray-600 italic">
                                      "{edu.thesis}"
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
                          <p>No education information provided.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Publications Tab */}
              {activeTab === "publications" && (
                <div>
                  {isOwnProfile && editingProfile ? (
                    <div className="space-y-4">
                      {(profileFormData.publications || []).map(
                        (item, index) => (
                          <div
                            key={item.id || index}
                            className="border border-gray-200 rounded-lg p-4 relative"
                          >
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title*
                              </label>
                              <input
                                type="text"
                                required
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
                                  Authors*
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={item.authors || ""}
                                  onChange={(e) =>
                                    handleArrayItemChange(
                                      "publications",
                                      index,
                                      "authors",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Smith J, Doe A"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Year*
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={item.year || ""}
                                  onChange={(e) =>
                                    handleArrayItemChange(
                                      "publications",
                                      index,
                                      "year",
                                      e.target.value
                                    )
                                  }
                                  placeholder="YYYY"
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
                                placeholder="e.g., Nature Communications"
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
                                placeholder="DOI or URL (e.g., 10.1038/s41467...)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveArrayItem("publications", index)
                              }
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                              title="Remove Publication Entry"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      )}
                      <button
                        onClick={() => handleAddArrayItem("publications")}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaPlus className="mr-2 -ml-1 h-4 w-4" /> Add
                        Publication
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
                            className="border-l-4 border-indigo-200 pl-4 py-2 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mt-0.5">
                                <FaBook className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <h4 className="text-base font-semibold text-gray-900">
                                  {pub.title || "N/A"}
                                </h4>
                                <p className="text-sm text-gray-700">
                                  {pub.authors || "N/A"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {pub.journal || ""}{" "}
                                  {pub.year ? `(${pub.year})` : ""}
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
                                    <FaExternalLinkAlt className="ml-1.5 text-xs flex-shrink-0" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FaBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No publications listed.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Awards Tab */}
              {activeTab === "awards" && (
                <div>
                  {isOwnProfile && editingProfile ? (
                    <div className="space-y-4">
                      {(profileFormData.awards || []).map((item, index) => (
                        <div
                          key={item.id || index}
                          className="border border-gray-200 rounded-lg p-4 relative"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Award Name*
                              </label>
                              <input
                                type="text"
                                required
                                value={item.name || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "awards",
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Nobel Prize"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year*
                              </label>
                              <input
                                type="text"
                                required
                                value={item.year || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(
                                    "awards",
                                    index,
                                    "year",
                                    e.target.value
                                  )
                                }
                                placeholder="YYYY"
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
                              placeholder="e.g., Nobel Foundation"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description (Optional)
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
                              rows="2"
                              placeholder="Brief description"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm min-h-[60px]"
                            />
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveArrayItem("awards", index)
                            }
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                            title="Remove Award Entry"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddArrayItem("awards")}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaPlus className="mr-2 -ml-1 h-4 w-4" /> Add Award
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
                            className="border-l-4 border-indigo-200 pl-4 py-2 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mt-0.5">
                                <FaAward className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <h4 className="text-base font-semibold text-gray-900">
                                  {award.name || "N/A"}
                                </h4>
                                <p className="text-sm text-gray-700">
                                  {award.organization || ""}{" "}
                                  {award.year ? `(${award.year})` : ""}
                                </p>
                                {award.description && (
                                  <p className="text-sm text-gray-600 mt-1 italic">
                                    "{award.description}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FaAward className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No awards listed.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Profile-Specific Sidebar (Right) */}
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
        <ProfileSidebar
          isOwnProfile={isOwnProfile}
          isEditing={editingProfile}
          onEditClick={handleEditClick}
          userData={viewedUser}
        />
      </div>
    </div>
  );
}
