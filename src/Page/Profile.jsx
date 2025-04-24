// src/pages/Profile.jsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaFileUpload,
  FaUser,
  FaSpinner,
  FaEdit,
  FaCheck,
  FaTimes,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe, // Icons for social links
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";

// --- Import Common Components ---
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
// import TagInput from "../Component/Common/TagInput";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Helper to safely get nested values ---
const getNestedValue = (obj, path, defaultValue = "") => {
  return (
    path
      .split(".")
      .reduce(
        (acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined),
        obj
      ) ?? defaultValue
  );
};

// --- Initial Empty State ---
const defaultUserData = {
  id: null,
  username: "",
  email: "",
  bio: "",
  profilePictureUrl: null,
  socialLinks: { linkedin: "", github: "", twitter: "", website: "" },
  interests: [],
  university: "",
  department: "",
  companyName: "",
  jobTitle: "",
  medicalSpecialty: "",
  hospitalName: "",
  createdAt: null,
  updatedAt: null,
};

// --- Sub-Components (ProfileHeader, ProfileAvatar, ProfileField, ProfileSection - Unchanged) ---
// Header with Title and Action Buttons
const ProfileHeader = React.memo(
  ({
    username,
    isOwnProfile,
    isEditing,
    isSaving,
    onEdit,
    onSave,
    onCancel,
  }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 border-b border-gray-200 pb-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-0">
        {username ? `${username}'s Profile` : "Profile"}
      </h1>
      {isOwnProfile && (
        <div className="flex space-x-2 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? (
                  <FaSpinner className="animate-spin h-4 w-4" />
                ) : (
                  <FaCheck className="h-4 w-4" />
                )}{" "}
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onCancel}
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                disabled={isSaving}
              >
                <FaTimes className="h-4 w-4" /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <FaEdit className="h-4 w-4" /> Edit Profile
            </button>
          )}
        </div>
      )}
    </div>
  )
);

// Avatar Display and Upload Component
const ProfileAvatar = React.memo(
  ({
    username,
    profilePictureUrl,
    imagePreview,
    isEditing,
    onImageChange,
    isLoading,
  }) => {
    const fileInputRef = useRef(null);
    const currentImage =
      imagePreview || profilePictureUrl || "/default-avatar.png";

    return (
      <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="relative mb-4">
          <img
            src={currentImage}
            alt={username || "User Avatar"}
            className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg"
          />
          {isEditing && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onImageChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif, image/webp"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 shadow-md transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                title="Upload new picture"
                disabled={isLoading}
              >
                <FaFileUpload className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-800">
          {username}
        </h2>
      </div>
    );
  }
);

// Reusable Field Display/Input Component
const ProfileField = React.memo(
  ({
    label,
    name,
    value,
    isEditing,
    onChange,
    type = "text",
    placeholder = "",
    disabled = false,
    rows = 3,
    Icon = null,
  }) => {
    const InputComponent = type === "textarea" ? "textarea" : "input";
    const hasIcon = Icon !== null;

    return (
      <div className="mb-4 last:mb-0">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-600 mb-1 flex items-center"
        >
          {Icon && <Icon className="mr-2 text-gray-400" size={14} />}
          {label}
        </label>
        {isEditing ? (
          <div className="relative">
            {hasIcon && type !== "textarea" && (
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="text-gray-400" size={14} />
              </span>
            )}
            <InputComponent
              type={type === "textarea" ? undefined : type}
              id={name}
              name={name}
              value={value || ""}
              onChange={onChange}
              rows={type === "textarea" ? rows : undefined}
              className={`mt-1 block w-full ${
                hasIcon && type !== "textarea" ? "pl-9" : "px-3"
              } py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-gray-100 disabled:cursor-not-allowed`}
              placeholder={placeholder}
              disabled={disabled}
            />
          </div>
        ) : (
          <div
            className={`mt-1 flex items-start text-sm sm:text-base text-gray-800 bg-gray-50 px-3 py-2 rounded-md border border-gray-100 min-h-[42px] ${
              hasIcon ? "pl-9 relative" : ""
            }`}
          >
            {hasIcon && (
              <span className="absolute left-0 top-0 pt-[9px] pl-3 flex items-center pointer-events-none">
                <Icon className="text-gray-400" size={14} />
              </span>
            )}
            {value ? (
              type === "url" ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline break-all"
                >
                  {value}
                </a>
              ) : (
                <span className="whitespace-pre-wrap break-words">{value}</span>
              )
            ) : (
              <span className="text-gray-400 italic">Not provided</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

// Reusable Section Component
const ProfileSection = React.memo(({ title, children }) => (
  <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md border border-gray-200 mb-6 last:mb-0">
    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
      {title}
    </h2>
    {children}
  </div>
));

// --- Main Profile Component ---
export default function Profile({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [viewedUser, setViewedUser] = useState(null);
  const [profileFormData, setProfileFormData] = useState(defaultUserData);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [apiError, setApiError] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  // --- Utility Functions ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification({ message: "", type: "", show: false }),
      5000
    );
    return () => clearTimeout(timer);
  }, []);

  const initializeFormState = useCallback((userToSync) => {
    const userData = userToSync || defaultUserData;
    setProfileFormData({
      username: userData.username ?? "",
      email: userData.email ?? "",
      bio: userData.bio ?? "",
      socialLinks: {
        linkedin: userData.socialLinks?.linkedin ?? "",
        github: userData.socialLinks?.github ?? "",
        twitter: userData.socialLinks?.twitter ?? "",
        website: userData.socialLinks?.website ?? "",
      },
      university: userData.university ?? "",
      department: userData.department ?? "",
      companyName: userData.companyName ?? "",
      jobTitle: userData.jobTitle ?? "",
      medicalSpecialty: userData.medicalSpecialty ?? "",
      hospitalName: userData.hospitalName ?? "",
    });
    setImagePreview(userData.profilePictureUrl || null);
    setNewProfileImage(null);
  }, []);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const profileUserIdToFetch = userId || currentUser?.id;
    const loggedInUserId = currentUser?.id;
    if (!profileUserIdToFetch) {
      setIsLoadingProfile(false);
      setApiError("No user specified or logged in.");
      return;
    }
    const isFetchingOwn =
      String(profileUserIdToFetch) === String(loggedInUserId);
    setIsOwnProfile(isFetchingOwn);
    setIsLoadingProfile(true);
    setApiError("");
    setViewedUser(null);

    const fetchUrl = isFetchingOwn
      ? `${API_BASE_URL}/api/auth/me`
      : `${API_BASE_URL}/api/users/public/${profileUserIdToFetch}`;
    const token = localStorage.getItem("authToken");
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    axios
      .get(fetchUrl, config)
      .then((response) => {
        const fetchedUser = response.data?.data || response.data;
        if (
          !fetchedUser ||
          typeof fetchedUser !== "object" ||
          !fetchedUser.id
        ) {
          throw new Error("Invalid profile data received.");
        }
        setViewedUser(fetchedUser);
        if (isFetchingOwn && editingProfile) {
          initializeFormState(fetchedUser);
        } else if (isFetchingOwn) {
          setImagePreview(fetchedUser.profilePictureUrl || null);
        }
      })
      .catch((error) => {
        console.error(
          "Error fetching profile:",
          error.response?.data || error.message
        );
        let message = "Failed to load profile data.";
        if (error.response?.status === 404) message = "Profile not found.";
        else if (error.response?.status === 401)
          message = "Authentication failed.";
        else if (error.response?.data?.message)
          message = error.response.data.message;
        setApiError(message);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [userId, currentUser, editingProfile, initializeFormState]);

  // --- Edit Mode Handlers ---
  const handleEditClick = useCallback(() => {
    if (isOwnProfile && viewedUser) {
      initializeFormState(viewedUser);
      setEditingProfile(true);
      setApiError("");
    }
  }, [isOwnProfile, viewedUser, initializeFormState]);

  const handleProfileCancel = useCallback(() => {
    setEditingProfile(false);
    setApiError("");
    setNewProfileImage(null);
    setImagePreview(viewedUser?.profilePictureUrl || null);
  }, [viewedUser]);

  // --- Save Profile Handler ---
  const handleProfileSave = useCallback(async () => {
    if (!isOwnProfile) return;
    setIsSavingProfile(true);
    setApiError("");
    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification("Authentication error.", "error");
      setIsSavingProfile(false);
      return;
    }

    const formDataToSubmit = new FormData();
    [
      "username",
      "bio",
      "university",
      "department",
      "companyName",
      "jobTitle",
      "medicalSpecialty",
      "hospitalName",
    ].forEach((key) => {
      if (profileFormData[key] !== null && profileFormData[key] !== undefined) {
        formDataToSubmit.append(key, profileFormData[key]);
      }
    });
    if (profileFormData.socialLinks) {
      Object.keys(profileFormData.socialLinks).forEach((socialKey) => {
        const linkValue = profileFormData.socialLinks[socialKey];
        if (linkValue !== null && linkValue !== undefined) {
          formDataToSubmit.append(`socialLinks.${socialKey}`, linkValue);
        }
      });
    }
    if (newProfileImage) {
      formDataToSubmit.append("profileImageFile", newProfileImage);
    }

    console.log("--- Saving Profile - FormData Content ---");
    for (let [key, value] of formDataToSubmit.entries()) {
      if (value instanceof File) console.log(`  ${key}: File - ${value.name}`);
      else console.log(`  ${key}: ${value}`);
    }
    console.log("----------------------------------------");

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        formDataToSubmit,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = response.data?.data || response.data;
      if (!updatedUser || !updatedUser.id)
        throw new Error("Invalid update response.");

      setViewedUser(updatedUser);
      setEditingProfile(false);
      setNewProfileImage(null);
      setImagePreview(updatedUser.profilePictureUrl || null);
      showNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error(
        "Error saving profile:",
        error.response?.data || error.message
      );
      const message =
        error.response?.data?.message || "Failed to update profile.";
      setApiError(message);
      showNotification("Error updating profile.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  }, [
    isOwnProfile,
    profileFormData,
    newProfileImage,
    showNotification,
    navigate,
  ]);

  // Image Input Change Handler
  const handleImageChange = useCallback(
    (e) => {
      const file = e.target.files ? e.target.files[0] : null;
      if (file) {
        if (!file.type.startsWith("image/")) {
          showNotification("Please select a valid image file.", "error");
          return;
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          showNotification(
            `Image too large (Max ${maxSize / 1024 / 1024}MB)`,
            "error"
          );
          return;
        }
        setNewProfileImage(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        // Optional: Clean up previous object URL - more complex, usually okay without it for single image preview
        // return () => URL.revokeObjectURL(previewUrl);
      }
    },
    [showNotification]
  );

  // Handler for ProfileField changes
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    setProfileFormData((prev) => {
      if (keys.length === 1) {
        return { ...prev, [name]: value };
      } else if (keys.length === 2 && keys[0] === "socialLinks") {
        return {
          ...prev,
          socialLinks: { ...prev.socialLinks, [keys[1]]: value },
        };
      }
      return prev;
    });
  }, []);

  // --- Define field configurations with Icons ---
  const basicInfoFields = [
    {
      label: "Username",
      name: "username",
      placeholder: "Your display name",
      Icon: FaUser,
    },
    {
      label: "Bio",
      name: "bio",
      type: "textarea",
      placeholder: "Tell us a bit about yourself...",
      Icon: null,
    },
  ];
  const professionalInfoFields = [
    { label: "University", name: "university", placeholder: "University Name" },
    {
      label: "Department",
      name: "department",
      placeholder: "Department or Field of Study",
    },
    {
      label: "Company Name",
      name: "companyName",
      placeholder: "Company You Work For",
    },
    { label: "Job Title", name: "jobTitle", placeholder: "Your Current Role" },
    {
      label: "Medical Specialty",
      name: "medicalSpecialty",
      placeholder: "e.g., Cardiology",
    },
    {
      label: "Hospital/Affiliation",
      name: "hospitalName",
      placeholder: "Hospital or Institution Name",
    },
  ];
  const socialLinkFields = [
    {
      label: "LinkedIn",
      name: "socialLinks.linkedin",
      placeholder: "https://linkedin.com/in/...",
      Icon: FaLinkedin,
      type: "url",
    },
    {
      label: "GitHub",
      name: "socialLinks.github",
      placeholder: "https://github.com/...",
      Icon: FaGithub,
      type: "url",
    },
    {
      label: "Twitter",
      name: "socialLinks.twitter",
      placeholder: "https://twitter.com/...",
      Icon: FaTwitter,
      type: "url",
    },
    {
      label: "Website",
      name: "socialLinks.website",
      placeholder: "https://your-website.com",
      Icon: FaGlobe,
      type: "url",
    },
  ];

  // --- Render Logic ---
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (apiError && !editingProfile) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <ErrorMessage message={apiError} onClose={() => setApiError("")} />
      </div>
    );
  }
  if (!viewedUser) {
    return (
      <div className="text-center py-20 text-gray-500">
        Profile data could not be loaded or does not exist.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Notification Area - FIXED SYNTAX */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -30 }} // Restored animation props
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-5 right-5 z-[100] w-full max-w-sm" // Added class
          >
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileHeader
        username={viewedUser.username}
        isOwnProfile={isOwnProfile}
        isEditing={editingProfile}
        isSaving={isSavingProfile}
        onEdit={handleEditClick}
        onSave={handleProfileSave}
        onCancel={handleProfileCancel}
      />

      {/* Display specific saving error near buttons if editing */}
      {editingProfile && apiError && (
        <div className="mb-4">
          <ErrorMessage message={apiError} onClose={() => setApiError("")} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Avatar */}
        <div className="lg:col-span-1">
          <ProfileAvatar
            username={viewedUser.username}
            profilePictureUrl={viewedUser.profilePictureUrl}
            imagePreview={imagePreview}
            isEditing={editingProfile}
            onImageChange={handleImageChange}
            isLoading={isSavingProfile}
          />
        </div>

        {/* Right Column - Details & Form */}
        <div className="lg:col-span-2">
          {editingProfile ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProfileSave();
              }}
            >
              <ProfileSection title="Basic Information">
                {basicInfoFields.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(profileFormData, field.name)}
                    isEditing={editingProfile}
                    onChange={handleFieldChange}
                    disabled={isSavingProfile || field.name === "username"}
                  />
                ))}
                {/* Example: Make username non-editable */}
                <p className="text-xs text-gray-500 mt-1 pl-1">
                  Username cannot be changed.
                </p>
              </ProfileSection>
              <ProfileSection title="Professional & Academic Info">
                {professionalInfoFields.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(profileFormData, field.name)}
                    isEditing={editingProfile}
                    onChange={handleFieldChange}
                    disabled={isSavingProfile}
                  />
                ))}
              </ProfileSection>
              <ProfileSection title="Social & Online Presence">
                {socialLinkFields.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(profileFormData, field.name)}
                    isEditing={editingProfile}
                    onChange={handleFieldChange}
                    disabled={isSavingProfile}
                  />
                ))}
              </ProfileSection>
              <button type="submit" className="hidden" aria-hidden="true">
                Save
              </button>
            </form>
          ) : (
            <>
              <ProfileSection title="Basic Information">
                {/* Pass viewedUser data in view mode */}
                {basicInfoFields.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(viewedUser, field.name)}
                    isEditing={false}
                  />
                ))}
              </ProfileSection>
              <ProfileSection title="Professional & Academic Info">
                {professionalInfoFields.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(viewedUser, field.name)}
                    isEditing={false}
                  />
                ))}
              </ProfileSection>
              <ProfileSection title="Social & Online Presence">
                {socialLinkFields.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(viewedUser, field.name)}
                    isEditing={false}
                  />
                ))}
              </ProfileSection>
            </>
          )}

          {/* Display Save/Cancel buttons again at the bottom in edit mode */}
          {editingProfile && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleProfileCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md text-sm font-medium transition-colors"
                disabled={isSavingProfile}
              >
                {" "}
                Cancel{" "}
              </button>
              <button
                onClick={handleProfileSave}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <FaSpinner className="animate-spin h-4 w-4" />
                ) : (
                  <FaCheck className="h-4 w-4" />
                )}
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
