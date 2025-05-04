// src/Pages/Profile.jsx
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Components
import ProfileHeader from "../Component/Profile/ProfileHeader";
import ProfileSidebar from "../Component/Profile/ProfileSidebar";
import ProfileContent from "../Component/Profile/ProfileContent";
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import { Link } from "react-router-dom";

// Icons
import {
  FaUser,
  FaEnvelope,
  FaInfoCircle,
  FaUniversity,
  FaBuilding,
  FaBriefcase,
  FaUserMd,
  FaHospital,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
} from "react-icons/fa";

// Constants
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Default Profile Data
const defaultUserProfileData = {
  id: null,
  username: "",
  email: "",
  bio: "",
  profilePictureUrl: null,
  socialLinks: { linkedin: "", github: "", twitter: "", website: "" },
  university: "",
  department: "",
  companyName: "",
  jobTitle: "",
  medicalSpecialty: "",
  hospitalName: "",
  skillsNeeded: [],
  createdAt: null,
  updatedAt: null,
};

// Profile Field Configuration
const profileFieldConfig = {
  basicInfo: [
    {
      label: "Username",
      name: "username",
      placeholder: "Your display name",
      Icon: FaUser,
      editable: false,
    },
    {
      label: "Email",
      name: "email",
      placeholder: "Your email address",
      Icon: FaEnvelope,
      editable: false,
    },
    {
      label: "Bio",
      name: "bio",
      type: "textarea",
      placeholder: "Tell us a bit about yourself...",
      Icon: FaInfoCircle,
      editable: true,
    },
  ],
  professionalInfo: [
    {
      label: "University",
      name: "university",
      placeholder: "University Name",
      Icon: FaUniversity,
      editable: true,
    },
    {
      label: "Department",
      name: "department",
      placeholder: "Dept. or Field of Study",
      Icon: FaBriefcase,
      editable: true,
    },
    {
      label: "Company Name",
      name: "companyName",
      placeholder: "Company You Work For",
      Icon: FaBuilding,
      editable: true,
    },
    {
      label: "Job Title",
      name: "jobTitle",
      placeholder: "Your Current Role",
      Icon: FaBriefcase,
      editable: true,
    },
    {
      label: "Medical Specialty",
      name: "medicalSpecialty",
      placeholder: "e.g., Cardiology",
      Icon: FaUserMd,
      editable: true,
    },
    {
      label: "Hospital/Affiliation",
      name: "hospitalName",
      placeholder: "Hospital or Institution Name",
      Icon: FaHospital,
      editable: true,
    },
  ],
  skillsSection: [
    {
      label: "Skills",
      name: "skillsNeeded",
      type: "textarea",
      placeholder: 'Enter skills as JSON array e.g., ["React", "Node"]',
      Icon: FaInfoCircle,
      editable: true,
    },
  ],
  socialLinks: [
    {
      label: "LinkedIn",
      name: "socialLinks.linkedin",
      placeholder: "https://linkedin.com/in/...",
      Icon: FaLinkedin,
      type: "url",
      editable: true,
    },
    {
      label: "GitHub",
      name: "socialLinks.github",
      placeholder: "https://github.com/...",
      Icon: FaGithub,
      type: "url",
      editable: true,
    },
    {
      label: "Twitter",
      name: "socialLinks.twitter",
      placeholder: "https://twitter.com/...",
      Icon: FaTwitter,
      type: "url",
      editable: true,
    },
    {
      label: "Website",
      name: "socialLinks.website",
      placeholder: "https://your-website.com",
      Icon: FaGlobe,
      type: "url",
      editable: true,
    },
  ],
};

// Custom Hooks
function useNotificationHandler() {
  const [notification, setNotification] = useState({
    message: "",
    type: "success",
    show: false,
  });
  const timeoutRef = useRef(null);

  const closeNotification = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setNotification((prev) => ({ ...prev, show: false }));
  }, []);

  const showNotification = useCallback(
    (message, type = "success", duration = 5000) => {
      clearTimeout(timeoutRef.current);
      setNotification({ message, type, show: true });
      timeoutRef.current = setTimeout(closeNotification, duration);
    },
    [closeNotification]
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return { notification, showNotification, closeNotification };
}

function useUserProfileData(targetUserId, currentUser) {
  const [viewedUser, setViewedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const loggedInUserId = currentUser?.id;
  const profileUserIdToFetch = targetUserId || loggedInUserId;

  const isOwnProfile = useMemo(
    () =>
      !!loggedInUserId &&
      String(profileUserIdToFetch) === String(loggedInUserId),
    [profileUserIdToFetch, loggedInUserId]
  );

  const refetch = useCallback(() => setFetchTrigger((c) => c + 1), []);

  useEffect(() => {
    let isMounted = true;
    if (!profileUserIdToFetch) {
      setError("No user specified or logged in.");
      setIsLoading(false);
      setViewedUser(null);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      setViewedUser(null);

      const fetchUrl = isOwnProfile
        ? `/api/auth/me`
        : `/api/users/public/${profileUserIdToFetch}`;

      const token = localStorage.getItem("authToken");
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      try {
        const response = await apiClient.get(fetchUrl);
        const fetchedUser = response.data?.data || response.data;

        if (!fetchedUser?.id) {
          throw new Error("Invalid profile data received from API.");
        }

        const completeUserData = {
          ...defaultUserProfileData,
          ...fetchedUser,
          socialLinks: {
            ...defaultUserProfileData.socialLinks,
            ...(fetchedUser.socialLinks || {}),
          },
          skillsNeeded: Array.isArray(fetchedUser.skillsNeeded)
            ? fetchedUser.skillsNeeded
            : [],
        };

        if (isMounted) {
          setViewedUser(completeUserData);
        }
      } catch (err) {
        if (isMounted) {
          let message = "Failed to load profile data.";
          if (err instanceof AxiosError) {
            if (err.response?.status === 404) message = "Profile not found.";
            else if (err.response?.status === 401) {
              message = isOwnProfile
                ? "Authentication failed. Please log in again."
                : "Cannot access this profile.";
            } else if (err.response?.data?.message) {
              message = err.response.data.message;
            }
          } else if (err instanceof Error) {
            message = err.message;
          }
          setError(message);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [profileUserIdToFetch, isOwnProfile, fetchTrigger]);

  return { viewedUser, isOwnProfile, isLoading, error, refetch };
}

// Main Profile Component
export default function Profile({ currentUser }) {
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profileFormData, setProfileFormData] = useState(
    defaultUserProfileData
  );
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Hooks
  const { notification, showNotification, closeNotification } =
    useNotificationHandler();
  const {
    viewedUser,
    isOwnProfile,
    isLoading: isLoadingProfile,
    error: fetchProfileError,
    refetch: refetchProfileData,
  } = useUserProfileData(routeUserId, currentUser);

  // Effects
  const initializeFormState = useCallback(
    (userToSync) => {
      if (!userToSync) return;
      const userData = {
        ...defaultUserProfileData,
        ...userToSync,
        socialLinks: {
          ...defaultUserProfileData.socialLinks,
          ...(userToSync.socialLinks || {}),
        },
        skillsNeeded: Array.isArray(userToSync.skillsNeeded)
          ? userToSync.skillsNeeded
          : [],
      };
      setProfileFormData(userData);
      if (!selectedImageFile) {
        setImagePreviewUrl(userData.profilePictureUrl || null);
      }
      setSelectedImageFile(null);
    },
    [selectedImageFile]
  );

  useEffect(() => {
    if (isEditing && viewedUser) {
      initializeFormState(viewedUser);
    }
  }, [isEditing, viewedUser, initializeFormState]);

  // Handlers
  const handleEditClick = useCallback(() => {
    if (isOwnProfile) {
      setIsEditing(true);
      setSaveError("");
      closeNotification();
    }
  }, [isOwnProfile, closeNotification]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setSaveError("");
    setSelectedImageFile(null);
    setImagePreviewUrl(viewedUser?.profilePictureUrl || null);
    if (viewedUser) initializeFormState(viewedUser);
  }, [viewedUser, initializeFormState]);

  const handleImageFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validation
      if (!file.type.startsWith("image/")) {
        showNotification(
          "Please select a valid image file (PNG, JPG, GIF, WEBP).",
          "error"
        );
        event.target.value = null;
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        showNotification(
          `Image too large (Max ${MAX_IMAGE_SIZE_MB}MB).`,
          "error"
        );
        event.target.value = null;
        return;
      }

      // Clean up previous blob URL
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }

      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    },
    [showNotification, imagePreviewUrl]
  );

  useEffect(
    () => () => {
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    },
    [imagePreviewUrl]
  );

  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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

  const handleProfileSave = useCallback(async () => {
    if (!isOwnProfile || !isEditing) return;

    setIsSaving(true);
    setSaveError("");
    closeNotification();

    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification("Authentication error.", "error");
      setIsSaving(false);
      return;
    }

    const formData = new FormData();

    // Append fields
    Object.keys(profileFormData).forEach((key) => {
      if (key === "socialLinks" || key === "skillsNeeded") return;
      if (profileFormData[key] != null) {
        formData.append(key, profileFormData[key]);
      }
    });

    // Handle skills
    if (profileFormData.skillsNeeded !== undefined) {
      try {
        const skillsArray = Array.isArray(profileFormData.skillsNeeded)
          ? profileFormData.skillsNeeded
          : JSON.parse(profileFormData.skillsNeeded || "[]");
        formData.append("skillsNeeded", JSON.stringify(skillsArray));
      } catch (e) {
        setSaveError(
          "Invalid format for 'Skills'. Use JSON array like [\"Skill1\"]."
        );
        setIsSaving(false);
        return;
      }
    }

    // Handle social links
    if (profileFormData.socialLinks) {
      formData.append(
        "socialLinksJson",
        JSON.stringify(profileFormData.socialLinks)
      );
    }

    // Append image if selected
    if (selectedImageFile) {
      formData.append("profileImageFile", selectedImageFile);
    }

    try {
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await apiClient.put(`/api/users/profile`, formData);
      const updatedUser = response.data?.data || response.data;

      if (!updatedUser?.id)
        throw new Error("Invalid API response after update.");

      setIsEditing(false);
      setSelectedImageFile(null);
      showNotification("Profile updated successfully!", "success");
      refetchProfileData();
    } catch (err) {
      let message = "Failed to update profile.";
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setSaveError(message);
      showNotification(`Error: ${message}`, "error", 7000);
    } finally {
      setIsSaving(false);
    }
  }, [
    isOwnProfile,
    isEditing,
    profileFormData,
    selectedImageFile,
    showNotification,
    closeNotification,
    refetchProfileData,
  ]);

  // Render States
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] w-full bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  if (fetchProfileError && !viewedUser) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center">
        <ErrorMessage
          title="Error Loading Profile"
          message={fetchProfileError}
          onRetry={refetchProfileData}
        />
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center">
        <ErrorMessage
          title="Profile Unavailable"
          message="Could not load profile data for the specified user."
        />
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-slate-900 min-h-screen py-8 sm:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Notification */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-5 right-5 z-[100] w-full max-w-sm sm:max-w-md"
            >
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Layout */}
        <div className="space-y-6">
          <ProfileHeader
            username={viewedUser.username}
            isOwnProfile={isOwnProfile}
            isEditing={isEditing}
            isSaving={isSaving}
            onEdit={handleEditClick}
            onSave={handleProfileSave}
            onCancel={handleCancelEdit}
          />

          {isEditing && saveError && (
            <div className="mb-4">
              <ErrorMessage
                message={saveError}
                onClose={() => setSaveError("")}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
            {/* Sidebar */}
            <div className="md:col-span-1 lg:col-span-1 md:sticky md:top-6">
              <ProfileSidebar
                user={viewedUser}
                imagePreview={imagePreviewUrl}
                isEditing={isEditing}
                isOwnProfile={isOwnProfile}
                isUploading={isSaving}
                onTriggerUpload={triggerImageUpload}
                fileInputRef={fileInputRef}
              />
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 lg:col-span-3 space-y-6">
              <ProfileContent
                viewedUser={viewedUser}
                profileFormData={profileFormData}
                isEditing={isEditing}
                isSaving={isSaving}
                handleFieldChange={handleFieldChange}
                fieldConfig={profileFieldConfig}
              />

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving ? <LoadingSpinner size="sm" /> : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
