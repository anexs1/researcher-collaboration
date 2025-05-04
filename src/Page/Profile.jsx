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

// --- Import Child Components ---
// Adjust paths based on your folder structure. Assuming components are in src/Component/Profile/
import ProfileHeader from "../Component/Profile/ProfileHeader";
import ProfileSidebar from "../Component/Profile/ProfileSidebar";
import ProfileContent from "../Component/Profile/ProfileContent";

// --- Import Common Components ---
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";
import { Link } from "react-router-dom"; // For fallback link

// --- Constants ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// --- Helper Functions ---
const getAuthToken = () => localStorage.getItem("authToken");

const createAxiosInstance = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// --- Initial Empty State ---
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
  skillsNeeded: [], // Initialize as array
  createdAt: null,
  updatedAt: null,
};

// --- Field Configuration (Can be moved to a separate config file) ---
// Includes Icons as components (requires react-icons installed: npm install react-icons)
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
  // Add Skills Needed as its own section if preferred
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

// --- Custom Hooks (Implementations included here) ---

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
    setIsLoading(true);
    setError(null);
    setViewedUser(null);
    const fetchUrl = isOwnProfile
      ? `/api/auth/me`
      : `/api/users/public/${profileUserIdToFetch}`;
    const token = getAuthToken();
    const apiClient = createAxiosInstance(token);

    console.log(`[useUserProfileData] Fetching from: ${fetchUrl}`);

    apiClient
      .get(fetchUrl)
      .then((response) => {
        if (!isMounted) return;
        const fetchedUser = response.data?.data || response.data;
        if (
          !fetchedUser ||
          typeof fetchedUser !== "object" ||
          !fetchedUser.id
        ) {
          console.error(
            "[useUserProfileData] Invalid data received:",
            fetchedUser
          );
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
        console.log(
          "[useUserProfileData] Setting viewedUser:",
          completeUserData
        );
        setViewedUser(completeUserData);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(
          "[useUserProfileData] Error fetching profile:",
          err.response?.data || err.message,
          err
        );
        let message = "Failed to load profile data.";
        if (err instanceof AxiosError) {
          if (err.response?.status === 404) message = "Profile not found.";
          else if (err.response?.status === 401 && !isOwnProfile)
            message = "Cannot access this profile.";
          else if (err.response?.status === 401 && isOwnProfile)
            message = "Authentication failed. Please log in again.";
          else if (err.response?.data?.message)
            message = err.response.data.message;
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [profileUserIdToFetch, isOwnProfile, fetchTrigger]);

  return { viewedUser, isOwnProfile, isLoading, error, refetch };
}

// --- Main Profile Component ---
export default function Profile({ currentUser }) {
  // Use Profile as component name
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- State Management ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profileFormData, setProfileFormData] = useState(
    defaultUserProfileData
  );
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // --- Hook Integrations ---
  const { notification, showNotification, closeNotification } =
    useNotificationHandler();
  const {
    viewedUser,
    isOwnProfile,
    isLoading: isLoadingProfile,
    error: fetchProfileError,
    refetch: refetchProfileData,
  } = useUserProfileData(routeUserId, currentUser);

  // --- Sync Form Data ---
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
      // Convert skillsNeeded array to JSON string for textarea editing if needed
      // userData.skillsNeeded = JSON.stringify(userData.skillsNeeded); // Uncomment if using textarea for skills edit
      setProfileFormData(userData);
      if (!selectedImageFile) {
        setImagePreviewUrl(userData.profilePictureUrl || null);
      }
      setSelectedImageFile(null);
    },
    [selectedImageFile]
  );

  // Initialize form when switching to edit mode
  useEffect(() => {
    if (isEditing && viewedUser) {
      initializeFormState(viewedUser);
    }
  }, [isEditing, viewedUser, initializeFormState]);

  // --- Event Handlers ---
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
    if (viewedUser) {
      initializeFormState(viewedUser);
    }
  }, [viewedUser, initializeFormState]);

  // --- !!! ADDED CONSOLE LOGS for debugging image preview !!! ---
  const handleImageFileChange = useCallback(
    (event) => {
      console.log("--- handleImageFileChange triggered ---"); // Log 1
      const file = event.target.files?.[0];

      if (!file) {
        console.log("No file selected or event target invalid."); // Log 2
        return;
      }

      console.log("File Selected:", {
        // Log 3
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Validation
      if (!file.type.startsWith("image/")) {
        console.error("Validation Failed: Invalid file type:", file.type); // Log 4
        showNotification(
          "Please select a valid image file (PNG, JPG, GIF, WEBP).",
          "error"
        );
        event.target.value = null; // Clear the input
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        console.error("Validation Failed: File too large:", file.size); // Log 5
        showNotification(
          `Image too large (Max ${MAX_IMAGE_SIZE_MB}MB).`,
          "error"
        );
        event.target.value = null; // Clear the input
        return;
      }

      console.log("Validation Passed."); // Log 6

      // State Updates
      setSelectedImageFile(file); // Store the File object

      // Clean up previous blob URL before creating a new one
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        console.log("Revoking previous blob URL:", imagePreviewUrl);
        URL.revokeObjectURL(imagePreviewUrl);
      }

      const previewUrl = URL.createObjectURL(file); // Create temporary URL
      console.log(
        "Setting state: selectedImageFile=",
        file.name,
        "imagePreviewUrl=",
        previewUrl
      ); // Log 7
      setImagePreviewUrl(previewUrl); // Update state for preview
    },
    [showNotification, imagePreviewUrl]
  ); // Dependency array includes showNotification and imagePreviewUrl for revoke logic
  // --- !!! END OF ADDED LOGS !!! ---

  // Cleanup object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        console.log("Revoking blob URL on cleanup:", imagePreviewUrl);
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    setProfileFormData((prev) => {
      if (keys.length === 1) {
        if (name === "skillsNeeded") {
          return { ...prev, [name]: value };
        } // Keep as string from textarea
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

  // Corrected Save Profile Handler
  const handleProfileSave = useCallback(async () => {
    if (!isOwnProfile || !isEditing) return;
    setIsSaving(true);
    setSaveError("");
    closeNotification();
    const token = getAuthToken();
    if (!token) {
      showNotification("Authentication error.", "error");
      setIsSaving(false);
      return;
    }

    const formData = new FormData();

    // Append simple text fields
    Object.keys(profileFormData).forEach((key) => {
      if (
        [
          "id",
          "email",
          "username",
          "profilePictureUrl",
          "createdAt",
          "updatedAt",
          "socialLinks",
          "skillsNeeded",
        ].includes(key)
      )
        return;
      if (profileFormData[key] !== null && profileFormData[key] !== undefined)
        formData.append(key, profileFormData[key]);
    });

    // Handle skillsNeeded (parse string from textarea, stringify for backend)
    if (profileFormData.skillsNeeded !== undefined) {
      try {
        let skillsArray = [];
        if (Array.isArray(profileFormData.skillsNeeded))
          skillsArray = profileFormData.skillsNeeded;
        else if (
          typeof profileFormData.skillsNeeded === "string" &&
          profileFormData.skillsNeeded.trim() !== ""
        )
          skillsArray = JSON.parse(profileFormData.skillsNeeded);
        if (!Array.isArray(skillsArray))
          throw new Error("Input is not a valid array.");
        formData.append("skillsNeeded", JSON.stringify(skillsArray));
      } catch (e) {
        setSaveError(
          "Invalid format for 'Skills'. Use JSON array like [\"Skill1\"]."
        );
        setIsSaving(false);
        return;
      }
    }

    // Handle socialLinks (Send as JSON string)
    if (
      profileFormData.socialLinks &&
      typeof profileFormData.socialLinks === "object"
    ) {
      formData.append(
        "socialLinksJson",
        JSON.stringify(profileFormData.socialLinks)
      );
    }

    // Append image file if selected
    if (selectedImageFile) {
      formData.append("profileImageFile", selectedImageFile);
    }

    try {
      const apiClient = createAxiosInstance(token);
      const response = await apiClient.put(`/api/users/profile`, formData);
      const updatedUser = response.data?.data || response.data;
      if (!updatedUser || !updatedUser.id)
        throw new Error("Invalid API response after update.");
      setIsEditing(false);
      setSelectedImageFile(null);
      showNotification("Profile updated successfully!", "success");
      refetchProfileData();
    } catch (err) {
      console.error(
        "Error saving profile:",
        err.response?.data || err.message,
        err
      );
      let message = "Failed to update profile.";
      if (err instanceof AxiosError && err.response?.data?.message)
        message = err.response.data.message;
      else if (err instanceof Error) message = err.message;
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

  // --- Render Logic ---
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
        <div className="mt-4">
          <Link
            to="/dashboard"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center">
        <ErrorMessage
          title="Profile Unavailable"
          message={
            fetchProfileError ||
            "Could not load profile data for the specified user."
          }
        />
        <div className="mt-4">
          <Link
            to="/dashboard"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const displayError = isEditing ? saveError : null;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-slate-900 min-h-screen py-8 sm:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Notification Area */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-5 right-5 z-[100] w-full max-w-sm sm:max-w-md"
              role="alert"
            >
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Header */}
        <ProfileHeader
          username={viewedUser.username}
          isOwnProfile={isOwnProfile}
          isEditing={isEditing}
          isSaving={isSaving}
          onEdit={handleEditClick}
          onSave={handleProfileSave}
          onCancel={handleCancelEdit}
        />

        {/* Display Save Error (Only in Edit Mode) */}
        {displayError && (
          <div className="mb-4">
            <ErrorMessage
              message={displayError}
              onClose={() => setSaveError("")}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 items-start mt-6">
          {/* Sidebar */}
          <div className="md:col-span-1 lg:col-span-1 md:sticky md:top-6">
            <ProfileSidebar
              user={viewedUser}
              imagePreview={imagePreviewUrl} // Pass the preview URL state
              isEditing={isEditing}
              isOwnProfile={isOwnProfile}
              isUploading={isSaving}
              onTriggerUpload={triggerImageUpload}
              fileInputRef={fileInputRef} // Pass ref
            />
          </div>

          {/* Content Area */}
          <div className="md:col-span-2 lg:col-span-3">
            <ProfileContent
              viewedUser={viewedUser}
              profileFormData={profileFormData}
              isEditing={isEditing}
              isSaving={isSaving}
              handleFieldChange={handleFieldChange}
              fieldConfig={profileFieldConfig}
            />

            {/* Bottom Save/Cancel Buttons (only in edit mode) */}
            {isEditing && (
              <footer className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-white hover:bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm border border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProfileSave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <LoadingSpinner size="sm" color="text-white" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </footer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
