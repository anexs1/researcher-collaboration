import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { Link } from "react-router-dom";
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
  FaGlobe,
  FaEnvelope, // Added for Email
  FaInfoCircle, // Added for Bio (conceptual)
  FaUniversity,
  FaBuilding,
  FaBriefcase,
  FaUserMd,
  FaHospital,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- Import Common Components ---
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";

// --- Constants ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// --- Helper Functions ---
const getNestedValue = (obj, path, defaultValue = "") => {
  // Robust check for obj before reducing
  if (!obj || typeof obj !== "object") return defaultValue;
  return (
    path
      .split(".")
      .reduce(
        (acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined),
        obj
      ) ?? defaultValue
  );
};

const getAuthToken = () => localStorage.getItem("authToken");

const createAxiosInstance = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// --- Type Definitions (Conceptual) ---
/**
 * @typedef {object} SocialLinks
 * @property {string} linkedin
 * @property {string} github
 * @property {string} twitter
 * @property {string} website
 */

/**
 * @typedef {object} UserProfile
 * @property {string|number} id
 * @property {string} username
 * @property {string} email
 * @property {string} bio
 * @property {string|null} profilePictureUrl
 * @property {SocialLinks} socialLinks
 * @property {string} university
 * @property {string} department
 * @property {string} companyName
 * @property {string} jobTitle
 * @property {string} medicalSpecialty
 * @property {string} hospitalName
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

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
  createdAt: null,
  updatedAt: null,
};

// --- Field Configuration ---
// Define fields structure outside the component for clarity and potential reuse
const profileFieldConfig = {
  basicInfo: [
    {
      label: "Username",
      name: "username",
      placeholder: "Your display name",
      Icon: FaUser,
      editable: false,
    }, // Example: Mark as non-editable
    {
      label: "Email",
      name: "email",
      placeholder: "Your email address",
      Icon: FaEnvelope,
      editable: false,
    }, // Usually not editable directly
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
    }, // Changed icon
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

// --- Sub-Components (Memoized for Performance) ---

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
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 border-b border-gray-200 pb-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-0 break-words">
        {username ? `${username}'s Profile` : "Profile"}
      </h1>
      {isOwnProfile && (
        <div className="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                disabled={isSaving}
                aria-live="polite"
                aria-label={
                  isSaving ? "Saving profile changes" : "Save profile changes"
                }
              >
                {isSaving ? (
                  <FaSpinner className="animate-spin h-4 w-4" />
                ) : (
                  <FaCheck className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onCancel}
                className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out disabled:opacity-70 shadow-sm hover:shadow-md"
                disabled={isSaving}
                aria-label="Cancel editing profile"
              >
                <FaTimes className="h-4 w-4" /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out shadow-sm hover:shadow-md"
              aria-label="Edit profile"
            >
              <FaEdit className="h-4 w-4" /> Edit Profile
            </button>
          )}
        </div>
      )}
    </header>
  )
);

const ProfileAvatar = React.memo(
  ({
    username,
    profilePictureUrl,
    imagePreview,
    isEditing,
    isUploading,
    onImageChange,
    onTriggerUpload,
  }) => {
    const currentImage =
      imagePreview || profilePictureUrl || "/default-avatar.png";
    const ariaLabel = `${username || "User"}'s profile picture${
      isEditing ? ", click button to upload new" : ""
    }`;

    return (
      <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md border border-gray-200 sticky top-24">
        {" "}
        {/* Added sticky top */}
        <div className="relative mb-4 group">
          <img
            src={currentImage}
            alt={ariaLabel}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white shadow-lg transition-opacity duration-300"
            key={currentImage} // Force re-render on change if needed
          />
          {isEditing && (
            <button
              type="button"
              onClick={onTriggerUpload}
              className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 shadow-md transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload new picture"
              aria-label="Upload new profile picture"
              disabled={isUploading}
            >
              {isUploading ? (
                <FaSpinner className="animate-spin h-4 w-4" />
              ) : (
                <FaFileUpload className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-800 break-words">
          {username}
        </h2>
        {/* Hidden file input, triggered by the button */}
        <input
          type="file"
          id="profile-image-upload" // Added ID for potential label association
          onChange={onImageChange}
          className="hidden"
          accept="image/png, image/jpeg, image/gif, image/webp"
          disabled={isUploading}
          aria-hidden="true" // Hide from screen readers as it's triggered by button
        />
      </div>
    );
  }
);

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
    editable = true,
  }) => {
    const InputComponent = type === "textarea" ? "textarea" : "input";
    const displayValue = value || "";
    const isEmpty = !displayValue;

    // Determine if the field should be rendered based on editing state and value presence
    // Don't render empty fields in view mode (unless it's Bio maybe? - decided to show "Not provided")
    // if (!isEditing && isEmpty && name !== 'bio') {
    //     return null; // Or render nothing
    // }

    return (
      <div className="mb-4 last:mb-0 transition-all duration-200">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1.5"
        >
          {Icon && <Icon className="text-gray-400 flex-shrink-0" size={14} />}
          {label}
        </label>
        {isEditing && editable ? (
          <div className="relative">
            {Icon && type !== "textarea" && (
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Icon className="text-gray-400" size={14} />
              </span>
            )}
            <InputComponent
              type={type === "textarea" ? undefined : type}
              id={name}
              name={name}
              value={displayValue}
              onChange={onChange}
              rows={type === "textarea" ? rows : undefined}
              className={`mt-1 block w-full ${
                Icon && type !== "textarea" ? "pl-9" : "px-3"
              } py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
              placeholder={placeholder}
              disabled={disabled}
              aria-label={label} // Add aria-label for accessibility
            />
          </div>
        ) : (
          // Display Mode
          <div
            className={`relative mt-1 flex items-start text-sm sm:text-base text-gray-800 bg-gray-50 px-3 py-2 rounded-md border border-gray-100 min-h-[42px] ${
              Icon ? "pl-9" : ""
            }`}
          >
            {Icon && (
              <span className="absolute left-0 top-0 pt-[9px] pl-3 flex items-center pointer-events-none">
                <Icon className="text-gray-400" size={14} />
              </span>
            )}
            {displayValue ? (
              type === "url" ? (
                <a
                  href={
                    displayValue.startsWith("http")
                      ? displayValue
                      : `https://${displayValue}`
                  } // Add protocol if missing
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 hover:underline break-all transition-colors duration-150"
                  title={`Visit ${label} link`}
                >
                  {displayValue}
                </a>
              ) : (
                <span className="whitespace-pre-wrap break-words">
                  {displayValue}
                </span>
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

const ProfileSection = React.memo(({ title, children }) => {
  // Check if children exist before rendering the section? Maybe not, allow empty sections.
  const hasContent = React.Children.count(children) > 0;

  // if (!hasContent) return null; // Option to hide empty sections

  return (
    <section
      className="bg-white p-5 sm:p-6 rounded-lg shadow-md border border-gray-200 mb-6 last:mb-0"
      aria-labelledby={`section-title-${title.replace(/\s+/g, "-")}`}
    >
      <h2
        id={`section-title-${title.replace(/\s+/g, "-")}`}
        className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2"
      >
        {title}
      </h2>
      <div className="space-y-4">
        {" "}
        {/* Add spacing between fields within section */}
        {children}
      </div>
    </section>
  );
});

// --- Custom Hooks ---

/**
 * Hook for managing notifications.
 * @returns {{
 *   notification: { message: string, type: string, show: boolean },
 *   showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void,
 *   closeNotification: () => void
 * }}
 */
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
      clearTimeout(timeoutRef.current); // Clear previous timeout if any
      setNotification({ message, type, show: true });
      timeoutRef.current = setTimeout(closeNotification, duration);
    },
    [closeNotification]
  );

  // Clear timeout on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return { notification, showNotification, closeNotification };
}

/**
 * Hook for fetching user profile data.
 * @param {string|number|undefined} targetUserId - The ID from URL params.
 * @param {UserProfile|null} currentUser - The logged-in user object.
 * @returns {{
 *   viewedUser: UserProfile | null,
 *   isOwnProfile: boolean,
 *   isLoading: boolean,
 *   error: string | null,
 *   refetch: () => void // Function to manually trigger refetch
 * }}
 */
function useUserProfileData(targetUserId, currentUser) {
  const [viewedUser, setViewedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0); // State to trigger refetch

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

    console.log(
      `Fetching profile for user ID: ${profileUserIdToFetch}, Is own: ${isOwnProfile}`
    );
    setIsLoading(true);
    setError(null);
    setViewedUser(null); // Clear previous data

    const fetchUrl = isOwnProfile
      ? `/api/auth/me` // Relative URL if axios instance has baseURL
      : `/api/users/public/${profileUserIdToFetch}`;
    const token = getAuthToken();
    const apiClient = createAxiosInstance(token); // Create instance with token if available

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
          throw new Error("Invalid profile data received from API.");
        }
        // Merge with default structure to ensure all keys exist
        const completeUserData = {
          ...defaultUserProfileData,
          ...fetchedUser,
          socialLinks: {
            ...defaultUserProfileData.socialLinks,
            ...(fetchedUser.socialLinks || {}),
          },
        };
        setViewedUser(completeUserData);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(
          "Error fetching profile:",
          err.response?.data || err.message,
          err
        );
        let message = "Failed to load profile data.";
        if (err instanceof AxiosError) {
          if (err.response?.status === 404) message = "Profile not found.";
          else if (err.response?.status === 401)
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
      isMounted = false; // Prevent state updates on unmounted component
      console.log("Unmounting profile fetch effect.");
    };
  }, [profileUserIdToFetch, isOwnProfile, fetchTrigger]); // Re-run on ID change or manual trigger

  return { viewedUser, isOwnProfile, isLoading, error, refetch };
}

// --- Main Profile Component ---
export default function Profile({ currentUser }) {
  const { userId: routeUserId } = useParams(); // ID from the URL
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- State Management ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(""); // Specific error for save operation
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
  // Initialize form state when entering edit mode or when viewedUser data becomes available while already editing
  const initializeFormState = useCallback(
    (userToSync) => {
      if (!userToSync) return;
      console.log("Initializing form state with user data:", userToSync);
      const userData = {
        ...defaultUserProfileData,
        ...userToSync,
        socialLinks: {
          ...defaultUserProfileData.socialLinks,
          ...(userToSync.socialLinks || {}),
        },
      };
      setProfileFormData(userData);
      // Set initial image preview (don't clear if already set by user action)
      if (!selectedImageFile) {
        setImagePreviewUrl(userData.profilePictureUrl || null);
      }
      setSelectedImageFile(null); // Clear any previously selected file when initializing
    },
    [selectedImageFile]
  ); // Dependency needed? Yes, to decide whether to overwrite preview

  // --- Event Handlers ---

  const handleEditClick = useCallback(() => {
    if (isOwnProfile && viewedUser) {
      initializeFormState(viewedUser);
      setIsEditing(true);
      setSaveError(""); // Clear previous save errors
      closeNotification(); // Close any lingering notifications
    }
  }, [isOwnProfile, viewedUser, initializeFormState, closeNotification]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setSaveError("");
    setSelectedImageFile(null);
    // Reset preview to the original viewed user's image
    setImagePreviewUrl(viewedUser?.profilePictureUrl || null);
    // Optionally refetch data if concerned about stale state? Usually not needed.
    // refetchProfileData();
  }, [viewedUser]);

  const handleImageFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showNotification(
          "Please select a valid image file (PNG, JPG, GIF, WEBP).",
          "error"
        );
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        showNotification(
          `Image too large (Max ${MAX_IMAGE_SIZE_MB}MB).`,
          "error"
        );
        return;
      }

      setSelectedImageFile(file);
      // Create and set preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);

      // Cleanup function for the object URL - Important!
      // This might need adjustment if the component unmounts before saving
      // Consider storing the cleanup function ref if needed.
      // For now, assume it lives long enough.
      // URL.revokeObjectURL(imagePreviewUrl); // Revoke previous if exists?
    },
    [showNotification]
  );

  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handler for ProfileField changes (handles nested state)
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    setProfileFormData((prev) => {
      if (keys.length === 1) {
        // Top-level field
        return { ...prev, [name]: value };
      } else if (keys.length === 2 && keys[0] === "socialLinks") {
        // Nested social link
        return {
          ...prev,
          socialLinks: { ...prev.socialLinks, [keys[1]]: value },
        };
      }
      // Handle other potential nested structures if needed
      console.warn("Unhandled field change:", name);
      return prev;
    });
  }, []);

  // --- Save Profile Handler ---
  const handleProfileSave = useCallback(async () => {
    if (!isOwnProfile || !isEditing) return;

    setIsSaving(true);
    setSaveError("");
    closeNotification();
    const token = getAuthToken();
    if (!token) {
      showNotification("Authentication error. Please log in again.", "error");
      setIsSaving(false);
      return;
    }

    // Use FormData for multipart request if image is included
    const formData = new FormData();

    // Append non-file fields
    Object.keys(profileFormData).forEach((key) => {
      // Exclude fields that shouldn't be sent or handle nesting
      if (
        key === "id" ||
        key === "email" ||
        key === "username" ||
        key === "profilePictureUrl" ||
        key === "createdAt" ||
        key === "updatedAt"
      ) {
        return; // Skip non-editable/meta fields
      }
      if (
        key === "socialLinks" &&
        typeof profileFormData.socialLinks === "object"
      ) {
        Object.keys(profileFormData.socialLinks).forEach((socialKey) => {
          const linkValue = profileFormData.socialLinks[socialKey];
          // Only append if value is not null/undefined (allow empty string to clear)
          if (linkValue !== null && linkValue !== undefined) {
            formData.append(`socialLinks.${socialKey}`, linkValue);
          }
        });
      } else if (
        profileFormData[key] !== null &&
        profileFormData[key] !== undefined
      ) {
        formData.append(key, profileFormData[key]);
      }
    });

    // Append image file if selected
    if (selectedImageFile) {
      formData.append("profileImageFile", selectedImageFile);
    }

    // --- Log FormData for Debugging ---
    console.log("--- Saving Profile ---");
    for (let [key, value] of formData.entries()) {
      console.log(
        `  ${key}: ${
          value instanceof File
            ? `File(${value.name}, ${value.size} bytes)`
            : value
        }`
      );
    }
    console.log("---------------------");
    // --- End Log ---

    try {
      const apiClient = createAxiosInstance(token);
      const response = await apiClient.put(`/api/users/profile`, formData); // PUT request

      const updatedUser = response.data?.data || response.data;
      if (!updatedUser || !updatedUser.id) {
        throw new Error("Invalid profile update response from API.");
      }

      // Successfully saved
      setIsEditing(false);
      setSelectedImageFile(null); // Clear selected file state
      //setImagePreviewUrl(updatedUser.profilePictureUrl || null); // Preview updates handled by refetch
      showNotification("Profile updated successfully!", "success");
      refetchProfileData(); // Refetch data to show the latest saved state including new image URL
    } catch (err) {
      console.error(
        "Error saving profile:",
        err.response?.data || err.message,
        err
      );
      let message = "Failed to update profile.";
      if (err instanceof AxiosError && err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setSaveError(message);
      showNotification(`Error: ${message}`, "error", 7000); // Longer duration for errors
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
    refetchProfileData, // Add refetch dependency
  ]);

  // --- Render Logic ---

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  // Display fetch error prominently if it occurs and we're not editing
  if (fetchProfileError && !isEditing) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <ErrorMessage
          title="Error Loading Profile"
          message={fetchProfileError}
          onRetry={refetchProfileData} // Allow retrying fetch
        />
        <div className="mt-4 text-center">
          <Link to="/dashboard" className="text-indigo-600 hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Handle case where user data is still null after loading (e.g., fetch failed silently or invalid data)
  if (!viewedUser && !isLoadingProfile) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center">
        <ErrorMessage
          title="Profile Unavailable"
          message="Could not load profile data."
        />
        <div className="mt-4">
          <Link to="/dashboard" className="text-indigo-600 hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If fetch error occurred but user started editing, show error near save button
  const displayError = isEditing ? saveError : fetchProfileError;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Notification Area */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-5 right-5 z-[100] w-full max-w-sm sm:max-w-md" // Responsive max-width
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

      <ProfileHeader
        username={viewedUser.username}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={handleEditClick}
        onSave={handleProfileSave}
        onCancel={handleCancelEdit}
      />

      {/* Display Save/Fetch Error (Contextual) */}
      {displayError && (
        <div
          className={`mb-4 ${
            isEditing ? "border border-red-200 bg-red-50 p-3 rounded-md" : ""
          }`}
        >
          <ErrorMessage
            message={displayError}
            onClose={() =>
              isEditing ? setSaveError("") : refetchProfileData()
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* --- Left Column (Avatar - Sticky) --- */}
        <div className="lg:col-span-1 relative">
          {/* Pass the ref to the component if needed, or handle trigger locally */}
          <input
            type="file"
            ref={fileInputRef} // Attach ref here
            onChange={handleImageFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/webp"
            disabled={isSaving}
            aria-hidden="true"
          />
          <ProfileAvatar
            username={viewedUser.username}
            profilePictureUrl={viewedUser.profilePictureUrl}
            imagePreview={imagePreviewUrl}
            isEditing={isEditing}
            isUploading={isSaving} // Link avatar loading state to overall saving state
            onImageChange={handleImageFileChange} // Pass handler
            onTriggerUpload={triggerImageUpload} // Pass trigger
          />
        </div>

        {/* --- Right Column (Details & Form) --- */}
        <main className="lg:col-span-2">
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProfileSave();
              }}
              noValidate
            >
              <ProfileSection title="Basic Information">
                {profileFieldConfig.basicInfo.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field} // Spread field config
                    value={getNestedValue(profileFormData, field.name)}
                    isEditing={isEditing}
                    onChange={handleFieldChange}
                    disabled={isSaving || !field.editable} // Disable based on saving state or field config
                    editable={field.editable} // Pass editable flag
                  />
                ))}
                {/* Explicit message for non-editable fields */}
                <p className="text-xs text-gray-500 mt-1 pl-1">
                  Username and Email cannot be changed here.
                </p>
              </ProfileSection>

              <ProfileSection title="Professional & Academic Info">
                {profileFieldConfig.professionalInfo.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(profileFormData, field.name)}
                    isEditing={isEditing}
                    onChange={handleFieldChange}
                    disabled={isSaving || !field.editable}
                    editable={field.editable}
                  />
                ))}
              </ProfileSection>

              <ProfileSection title="Social & Online Presence">
                {profileFieldConfig.socialLinks.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(profileFormData, field.name)}
                    isEditing={isEditing}
                    onChange={handleFieldChange}
                    disabled={isSaving || !field.editable}
                    editable={field.editable}
                  />
                ))}
              </ProfileSection>
              {/* Hidden submit button for accessibility/form submission */}
              <button type="submit" className="hidden" aria-hidden="true">
                Save
              </button>
            </form>
          ) : (
            // --- Display Mode ---
            <>
              <ProfileSection title="Basic Information">
                {profileFieldConfig.basicInfo.map((field) => (
                  <ProfileField
                    key={field.name}
                    {...field}
                    value={getNestedValue(viewedUser, field.name)}
                    isEditing={false}
                    editable={field.editable}
                  />
                ))}
              </ProfileSection>

              <ProfileSection title="Professional & Academic Info">
                {profileFieldConfig.professionalInfo
                  .filter((field) => !!getNestedValue(viewedUser, field.name)) // Only show fields with value
                  .map((field) => (
                    <ProfileField
                      key={field.name}
                      {...field}
                      value={getNestedValue(viewedUser, field.name)}
                      isEditing={false}
                      editable={field.editable}
                    />
                  ))}
                {/* Show message if no professional info */}
                {!profileFieldConfig.professionalInfo.some(
                  (field) => !!getNestedValue(viewedUser, field.name)
                ) && (
                  <p className="text-sm text-gray-500 italic">
                    No professional or academic information provided.
                  </p>
                )}
              </ProfileSection>

              <ProfileSection title="Social & Online Presence">
                {profileFieldConfig.socialLinks
                  .filter((field) => !!getNestedValue(viewedUser, field.name)) // Only show links with value
                  .map((field) => (
                    <ProfileField
                      key={field.name}
                      {...field}
                      value={getNestedValue(viewedUser, field.name)}
                      isEditing={false}
                      editable={field.editable}
                    />
                  ))}
                {/* Show message if no links */}
                {!profileFieldConfig.socialLinks.some(
                  (field) => !!getNestedValue(viewedUser, field.name)
                ) && (
                  <p className="text-sm text-gray-500 italic">
                    No social links provided.
                  </p>
                )}
              </ProfileSection>
            </>
          )}

          {/* Bottom Action Buttons (only in edit mode) */}
          {isEditing && (
            <footer className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button" // Ensure it doesn't submit the form
                onClick={handleCancelEdit}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out shadow-sm hover:shadow"
                disabled={isSaving}
                aria-label="Cancel profile edits"
              >
                Cancel
              </button>
              <button
                type="button" // Use button type, form submission handled by onSubmit/header button
                onClick={handleProfileSave}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                disabled={isSaving}
                aria-live="polite"
                aria-label={
                  isSaving ? "Saving profile changes" : "Save profile changes"
                }
              >
                {isSaving ? (
                  <FaSpinner className="animate-spin h-4 w-4" />
                ) : (
                  <FaCheck className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
