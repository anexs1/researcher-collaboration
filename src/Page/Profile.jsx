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
} from "react-icons/fa"; // FaUser can be used as placeholder
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Adjust path as needed
import Notification from "../Component/Common/Notification"; // Adjust path as needed
import ErrorMessage from "../Component/Common/ErrorMessage"; // Adjust path as needed

// API Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Default Data Structure - profilePictureUrl starts as null
const defaultUserData = {
  id: null,
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  bio: "",
  profilePictureUrl: null, // <-- Set to null, no default file expected
  socialLinks: { linkedin: "", github: "", twitter: "" },
  interests: [],
  institution: "",
};

export default function Profile({ currentUser }) {
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
  const [imagePreview, setImagePreview] = useState(null); // <-- Initialize as null
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const fileInputRef = useRef(null);

  // --- Callbacks & Handlers ---
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
        profilePictureUrl: userData.profilePictureUrl || null, // Use null if missing
        socialLinks: {
          linkedin: userData.socialLinks?.linkedin || "",
          github: userData.socialLinks?.github || "",
          twitter: userData.socialLinks?.twitter || "",
        },
        interests: Array.isArray(userData.interests) ? userData.interests : [],
        institution: userData.institution || "",
      });
      const newPreviewUrl = userData.profilePictureUrl || null; // Preview URL can be null
      if (
        imagePreview &&
        imagePreview.startsWith("blob:") &&
        imagePreview !== newPreviewUrl
      ) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(newPreviewUrl); // Update preview display (might be null)
      setNewProfileImage(null);
    },
    [imagePreview]
  );

  // --- Effect to Load Profile ---
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
      fetchUrl = `${API_BASE_URL}/api/auth/me`; // Use corrected endpoint for self
    } else if (profileUserIdToFetch) {
      fetchUrl = `${API_BASE_URL}/api/users/public/${profileUserIdToFetch}`; // Public endpoint
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
          : response.data; // Adjust based on API
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

  // --- Editing Handlers ---
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

  // --- Render Helper ---
  const renderProfileField = (
    label,
    name,
    displayValue,
    type = "text",
    isNested = false,
    section = null,
    placeholder = ""
  ) => {
    const canEditField = isOwnProfile && editingProfile;
    const commonInputClasses =
      "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed";
    const displayClasses =
      "mt-1 text-sm text-gray-900 py-2 min-h-[38px] break-words";
    const inputValue = isNested
      ? profileFormData[section]?.[name] ?? ""
      : profileFormData[name] ?? "";

    if (name === "email" && !isOwnProfile) return null; // Hide email if not own profile

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

  // --- Main Render ---
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center p-20">
        <LoadingSpinner />
      </div>
    );
  }
  if (profileNotFound) {
    return (
      <div className="bg-white shadow-md rounded-lg p-8 text-center max-w-lg mx-auto mt-10">
        {" "}
        <FaUser className="mx-auto h-16 w-16 text-gray-400 mb-4" />{" "}
        <h2 className="text-2xl font-semibold text-gray-800">
          Profile Not Found
        </h2>{" "}
        <p className="text-gray-500 mt-2 mb-6">
          This user profile does not exist or could not be loaded.
        </p>{" "}
        <Link
          to="/explore"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Back to Explore
        </Link>{" "}
      </div>
    );
  }
  if (apiError && !viewedUser) {
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10 text-center">
        {" "}
        <h2 className="text-xl font-semibold">Error Loading Profile</h2>{" "}
        <p className="mt-2 mb-6">{apiError}</p>{" "}
        <Link
          to="/explore"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Back to Explore
        </Link>{" "}
      </div>
    );
  }
  if (!viewedUser) {
    return (
      <div className="p-6 text-center text-gray-500">
        Unable to display profile information.
      </div>
    );
  }

  // Determine initials for placeholder if needed
  const getInitials = (firstName = "", lastName = "") =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const initials = getInitials(viewedUser.firstName, viewedUser.lastName);

  // Determine the source for the image display area
  const displayImageUrl =
    isOwnProfile &&
    editingProfile &&
    imagePreview &&
    imagePreview.startsWith("blob:")
      ? imagePreview // Use blob preview if editing own and file selected
      : viewedUser.profilePictureUrl; // Otherwise use the URL from backend (which might be null)

  return (
    <>
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-6 border-b border-gray-200 pb-6 gap-4">
          <div className="flex items-center space-x-4 flex-grow min-w-0">
            {/* Image Area */}
            <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-slate-200 text-slate-500 overflow-hidden border-2 border-gray-300">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl} // Use the determined URL (fetched or blob)
                  alt={`${viewedUser.username || "User"}'s profile`}
                  className="w-full h-full object-cover" // Cover the area
                />
              ) : // Show Initials or Icon if no image URL
              initials ? (
                <span className="text-3xl sm:text-4xl font-semibold">
                  {initials}
                </span>
              ) : (
                <FaUser className="w-10 h-10 sm:w-12 sm:h-12" /> // Fallback icon
              )}
              {/* Upload button shown only when editing own profile */}
              {isOwnProfile && editingProfile && (
                <>
                  <button
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                    aria-label="Upload new profile picture"
                    title="Upload/Change profile picture"
                  >
                    {" "}
                    <FaFileUpload className="w-4 h-4" />{" "}
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
            </div>
            {/* Text Info */}
            <div className="flex-grow min-w-0">
              <h2
                className="text-xl sm:text-2xl font-semibold text-gray-900 truncate"
                title={
                  `${viewedUser.firstName || ""} ${
                    viewedUser.lastName || ""
                  }`.trim() || viewedUser.username
                }
              >
                {" "}
                {`${viewedUser.firstName || ""} ${
                  viewedUser.lastName || ""
                }`.trim() || viewedUser.username}{" "}
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
                {" "}
                {viewedUser.institution || (
                  <span className="italic text-gray-400">Not set</span>
                )}{" "}
              </p>
            </div>
          </div>
          {/* Action Buttons */}
          {isOwnProfile && (
            <div className="flex-shrink-0 mt-4 sm:mt-0">
              {" "}
              {editingProfile ? (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {" "}
                  <button
                    onClick={handleProfileSave}
                    disabled={isSavingProfile}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {" "}
                    {isSavingProfile ? (
                      <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    ) : (
                      <FaSave className="-ml-1 mr-2 h-5 w-5" />
                    )}{" "}
                    Save{" "}
                  </button>{" "}
                  <button
                    onClick={handleProfileCancel}
                    disabled={isSavingProfile}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {" "}
                    Cancel{" "}
                  </button>{" "}
                </div>
              ) : (
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {" "}
                  <FaEdit className="-ml-1 mr-2 h-5 w-5" /> Edit Profile{" "}
                </button>
              )}{" "}
            </div>
          )}
        </div>

        {/* --- Details Grid --- */}
        {isOwnProfile && apiError && editingProfile && (
          <div className="mb-4">
            <ErrorMessage message={apiError} onClose={() => setApiError("")} />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {renderProfileField("Username", "username", viewedUser.username)}
          {isOwnProfile &&
            renderProfileField("Email", "email", viewedUser.email, "email")}
          {renderProfileField("First Name", "firstName", viewedUser.firstName)}
          {renderProfileField("Last Name", "lastName", viewedUser.lastName)}
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
              isOwnProfile ? "Tell us about yourself..." : ""
            )}
          </div>

          {/* Social Links Section */}
          {(viewedUser.socialLinks?.linkedin ||
            viewedUser.socialLinks?.github ||
            viewedUser.socialLinks?.twitter ||
            (isOwnProfile && editingProfile)) && (
            <div className="md:col-span-2 mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Online Presence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                {renderProfileField(
                  "LinkedIn",
                  "linkedin",
                  viewedUser.socialLinks?.linkedin,
                  "url",
                  true,
                  "socialLinks",
                  "https://linkedin.com/in/..."
                )}
                {renderProfileField(
                  "GitHub",
                  "github",
                  viewedUser.socialLinks?.github,
                  "url",
                  true,
                  "socialLinks",
                  "https://github.com/..."
                )}
                {renderProfileField(
                  "Twitter",
                  "twitter",
                  viewedUser.socialLinks?.twitter,
                  "url",
                  true,
                  "socialLinks",
                  "https://twitter.com/..."
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
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {" "}
                  {viewedUser.interests?.length > 0 ? (
                    viewedUser.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No interests listed.
                    </p>
                  )}{" "}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
