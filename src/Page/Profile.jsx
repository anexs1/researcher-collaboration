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
const MAX_PROFILE_IMAGE_SIZE_MB = 5;
const MAX_PROFILE_IMAGE_SIZE_BYTES = MAX_PROFILE_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_BACKGROUND_IMAGE_SIZE_MB = 10;
const MAX_BACKGROUND_IMAGE_SIZE_BYTES =
  MAX_BACKGROUND_IMAGE_SIZE_MB * 1024 * 1024;

// Default Profile Data
const defaultUserProfileData = {
  id: null,
  username: "",
  email: "",
  bio: "",
  profilePictureUrl: null,
  backgroundImageUrl: null, // For header background
  // pageBackgroundImageUrl: null, // Potentially for user-configurable page background
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

// Profile Field Configuration (remains the same)
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
    (message, type = "success", duration = 3000) => {
      // Shorter duration for subtle notifications
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
        if (!fetchedUser?.id)
          throw new Error("Invalid profile data received (no ID).");

        const constructFullUrl = (baseUrl, relativePath) => {
          if (
            !relativePath ||
            relativePath.startsWith("http") ||
            relativePath.startsWith("blob:")
          )
            return relativePath;
          const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
          const path = relativePath.startsWith("/")
            ? relativePath
            : `/${relativePath}`;
          return `${base}${path}`;
        };

        const finalProfilePictureUrl = constructFullUrl(
          API_BASE_URL,
          fetchedUser.profilePictureUrl
        );
        const finalBackgroundImageUrl = constructFullUrl(
          API_BASE_URL,
          fetchedUser.backgroundImageUrl
        );

        const completeUserData = {
          ...defaultUserProfileData,
          ...fetchedUser,
          profilePictureUrl: finalProfilePictureUrl,
          backgroundImageUrl: finalBackgroundImageUrl,
          socialLinks: {
            ...defaultUserProfileData.socialLinks,
            ...(fetchedUser.socialLinks || {}),
          },
        };
        if (isMounted) setViewedUser(completeUserData);
      } catch (err) {
        if (isMounted) {
          let message = "Failed to load profile.";
          if (err instanceof AxiosError) {
            message = err.response?.data?.message || err.message;
            if (err.response?.status === 404) message = "Profile not found.";
            else if (err.response?.status === 401)
              message = isOwnProfile
                ? "Authentication failed."
                : "Cannot access profile.";
          } else if (err instanceof Error) message = err.message;
          console.error("[ProfileData] Error:", err);
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
  }, [profileUserIdToFetch, isOwnProfile, fetchTrigger, currentUser]);
  return { viewedUser, isOwnProfile, isLoading, error, refetch };
}

// --- STYLES FOR THE PAGE BACKGROUND ---
// You can change 'your-subtle-background-image.jpg' to an actual URL or keep it blank.
// Or use a very light pattern or gradient.
const PAGE_BACKGROUND_IMAGE_URL = "your-subtle-background-image.jpg"; // e.g., "url('/path/to/your/subtle-bg.png')" or ""
const PAGE_BACKGROUND_COLOR_LIGHT = "bg-slate-50"; // Very light gray for light mode
const PAGE_BACKGROUND_COLOR_DARK = "dark:bg-slate-950"; // Very dark gray for dark mode

export default function Profile({ currentUser }) {
  const { userId: routeUserId } = useParams();
  const profilePicFileInputRef = useRef(null);
  const bgImageFileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profileFormData, setProfileFormData] = useState(
    defaultUserProfileData
  );

  const [selectedProfileImageFile, setSelectedProfileImageFile] =
    useState(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState(null);

  const [selectedBackgroundImageFile, setSelectedBackgroundImageFile] =
    useState(null);
  const [backgroundImagePreviewUrl, setBackgroundImagePreviewUrl] =
    useState(null);

  const { notification, showNotification, closeNotification } =
    useNotificationHandler();
  const {
    viewedUser,
    isOwnProfile,
    isLoading: isLoadingProfile,
    error: fetchProfileError,
    refetch: refetchProfileData,
  } = useUserProfileData(routeUserId, currentUser);

  useEffect(() => {
    if (viewedUser) {
      setProfileFormData({
        ...defaultUserProfileData,
        ...viewedUser,
        socialLinks: {
          ...defaultUserProfileData.socialLinks,
          ...(viewedUser.socialLinks || {}),
        },
      });
      if (isEditing) {
        if (
          !profileImagePreviewUrl ||
          (!profileImagePreviewUrl.startsWith("blob:") &&
            profileImagePreviewUrl !== viewedUser.profilePictureUrl)
        ) {
          setProfileImagePreviewUrl(viewedUser.profilePictureUrl || null);
        }
        if (
          !backgroundImagePreviewUrl ||
          (!backgroundImagePreviewUrl.startsWith("blob:") &&
            backgroundImagePreviewUrl !== viewedUser.backgroundImageUrl)
        ) {
          setBackgroundImagePreviewUrl(viewedUser.backgroundImageUrl || null);
        }
      } else {
        if (
          profileImagePreviewUrl?.startsWith("blob:") &&
          profileImagePreviewUrl !== viewedUser.profilePictureUrl
        )
          URL.revokeObjectURL(profileImagePreviewUrl);
        setProfileImagePreviewUrl(viewedUser.profilePictureUrl || null);
        if (selectedProfileImageFile) setSelectedProfileImageFile(null);

        if (
          backgroundImagePreviewUrl?.startsWith("blob:") &&
          backgroundImagePreviewUrl !== viewedUser.backgroundImageUrl
        )
          URL.revokeObjectURL(backgroundImagePreviewUrl);
        setBackgroundImagePreviewUrl(viewedUser.backgroundImageUrl || null);
        if (selectedBackgroundImageFile) setSelectedBackgroundImageFile(null);
      }
    } else {
      setProfileFormData(defaultUserProfileData);
      if (profileImagePreviewUrl?.startsWith("blob:"))
        URL.revokeObjectURL(profileImagePreviewUrl);
      setProfileImagePreviewUrl(null);
      setSelectedProfileImageFile(null);
      if (backgroundImagePreviewUrl?.startsWith("blob:"))
        URL.revokeObjectURL(backgroundImagePreviewUrl);
      setBackgroundImagePreviewUrl(null);
      setSelectedBackgroundImageFile(null);
    }
  }, [isEditing, viewedUser]); // Removed imagePreviewUrl and selectedImageFile from deps as they are handled internally

  useEffect(() => {
    const p = profileImagePreviewUrl;
    return () => {
      if (p?.startsWith("blob:")) URL.revokeObjectURL(p);
    };
  }, [profileImagePreviewUrl]);
  useEffect(() => {
    const b = backgroundImagePreviewUrl;
    return () => {
      if (b?.startsWith("blob:")) URL.revokeObjectURL(b);
    };
  }, [backgroundImagePreviewUrl]);

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
    if (profileImagePreviewUrl?.startsWith("blob:"))
      URL.revokeObjectURL(profileImagePreviewUrl);
    setProfileImagePreviewUrl(viewedUser?.profilePictureUrl || null);
    setSelectedProfileImageFile(null);
    if (backgroundImagePreviewUrl?.startsWith("blob:"))
      URL.revokeObjectURL(backgroundImagePreviewUrl);
    setBackgroundImagePreviewUrl(viewedUser?.backgroundImageUrl || null);
    setSelectedBackgroundImageFile(null);
  }, [profileImagePreviewUrl, backgroundImagePreviewUrl, viewedUser]);

  const handleImageFileChange = useCallback(
    (event, type) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showNotification("Please select a valid image file.", "error");
        event.target.value = null;
        return;
      }

      let maxSize, maxMb, setPreviewUrl, setSelectedFile, currentPreviewUrl;
      if (type === "profile") {
        maxSize = MAX_PROFILE_IMAGE_SIZE_BYTES;
        maxMb = MAX_PROFILE_IMAGE_SIZE_MB;
        setPreviewUrl = setProfileImagePreviewUrl;
        setSelectedFile = setSelectedProfileImageFile;
        currentPreviewUrl = profileImagePreviewUrl;
      } else {
        // background
        maxSize = MAX_BACKGROUND_IMAGE_SIZE_BYTES;
        maxMb = MAX_BACKGROUND_IMAGE_SIZE_MB;
        setPreviewUrl = setBackgroundImagePreviewUrl;
        setSelectedFile = setSelectedBackgroundImageFile;
        currentPreviewUrl = backgroundImagePreviewUrl;
      }

      if (file.size > maxSize) {
        showNotification(`Image too large (Max ${maxMb}MB).`, "error");
        event.target.value = null;
        return;
      }
      if (currentPreviewUrl?.startsWith("blob:"))
        URL.revokeObjectURL(currentPreviewUrl);
      const newBlobUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(newBlobUrl);
      event.target.value = null;
    },
    [showNotification, profileImagePreviewUrl, backgroundImagePreviewUrl]
  );

  const triggerProfileImageUpload = useCallback(
    () => profilePicFileInputRef.current?.click(),
    []
  );
  const triggerBackgroundImageUpload = useCallback(
    () => bgImageFileInputRef.current?.click(),
    []
  );

  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    setProfileFormData((prev) => {
      if (keys.length === 1) return { ...prev, [name]: value };
      if (keys.length === 2 && keys[0] === "socialLinks")
        return {
          ...prev,
          socialLinks: { ...prev.socialLinks, [keys[1]]: value },
        };
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

    const formDataToSubmit = new FormData();
    Object.keys(profileFormData).forEach((key) => {
      if (
        [
          "id",
          "username",
          "email",
          "profilePictureUrl",
          "backgroundImageUrl",
          "createdAt",
          "updatedAt",
        ].includes(key)
      )
        return;
      if (key === "socialLinks")
        formDataToSubmit.append(
          "socialLinksJson",
          JSON.stringify(profileFormData.socialLinks || {})
        );
      else if (
        profileFormData[key] !== null &&
        typeof profileFormData[key] !== "undefined"
      )
        formDataToSubmit.append(key, profileFormData[key]);
    });

    if (selectedProfileImageFile)
      formDataToSubmit.append(
        "profileImageFile",
        selectedProfileImageFile,
        selectedProfileImageFile.name
      );
    if (selectedBackgroundImageFile)
      formDataToSubmit.append(
        "backgroundImageFile",
        selectedBackgroundImageFile,
        selectedBackgroundImageFile.name
      );

    try {
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await apiClient.put(
        `/api/users/profile`,
        formDataToSubmit
      );
      if (!response.data?.data?.id)
        throw new Error("Invalid API response after update.");
      setIsEditing(false);
      setSelectedProfileImageFile(null);
      setSelectedBackgroundImageFile(null);
      showNotification("Profile updated successfully!", "success");
      refetchProfileData();
    } catch (err) {
      let message = "Failed to update profile.";
      if (err instanceof AxiosError && err.response?.data?.message)
        message = err.response.data.message;
      else if (err.response?.data?.errors)
        message = err.response.data.errors.map((e) => e.msg).join(", ");
      else if (err instanceof Error) message = err.message;
      console.error("[ProfileSave] Error:", err.response || err);
      setSaveError(message);
      showNotification(`Error: ${message}`, "error", 5000);
    } finally {
      setIsSaving(false);
    }
  }, [
    isOwnProfile,
    isEditing,
    profileFormData,
    selectedProfileImageFile,
    selectedBackgroundImageFile,
    showNotification,
    closeNotification,
    refetchProfileData,
  ]);

  // Dynamic page background style
  const pageStyle = PAGE_BACKGROUND_IMAGE_URL
    ? {
        backgroundImage: `url(${PAGE_BACKGROUND_IMAGE_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : {};

  if (isLoadingProfile) {
    return (
      <div
        className={`flex justify-center items-center min-h-screen w-full ${PAGE_BACKGROUND_COLOR_LIGHT} ${PAGE_BACKGROUND_COLOR_DARK} p-4 transition-colors duration-300`}
        style={pageStyle}
      >
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  if (fetchProfileError && !viewedUser) {
    return (
      <div
        className={`min-h-screen ${PAGE_BACKGROUND_COLOR_LIGHT} ${PAGE_BACKGROUND_COLOR_DARK} transition-colors duration-300`}
        style={pageStyle}
      >
        <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-md shadow-sm">
            {" "}
            {/* Softer shadow, rounded-md */}
            <ErrorMessage
              title="Error Loading Profile"
              message={fetchProfileError}
              onRetry={refetchProfileData}
            />
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 dark:focus:ring-offset-slate-800 transition-colors duration-150"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div
        className={`min-h-screen ${PAGE_BACKGROUND_COLOR_LIGHT} ${PAGE_BACKGROUND_COLOR_DARK} transition-colors duration-300`}
        style={pageStyle}
      >
        <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-md shadow-sm">
            {" "}
            {/* Softer shadow, rounded-md */}
            <ErrorMessage
              title="Profile Unavailable"
              message="Could not load profile data."
            />
            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 dark:focus:ring-offset-slate-800 transition-colors duration-150"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen py-6 sm:py-10 transition-colors duration-300 ${
        !PAGE_BACKGROUND_IMAGE_URL
          ? `${PAGE_BACKGROUND_COLOR_LIGHT} ${PAGE_BACKGROUND_COLOR_DARK}`
          : ""
      }`}
      style={pageStyle}
    >
      <input
        type="file"
        ref={profilePicFileInputRef}
        onChange={(e) => handleImageFileChange(e, "profile")}
        accept="image/*"
        style={{ display: "none" }}
        id="profileImageUploadInput"
      />
      <input
        type="file"
        ref={bgImageFileInputRef}
        onChange={(e) => handleImageFileChange(e, "background")}
        accept="image/*"
        style={{ display: "none" }}
        id="backgroundImageUploadInput"
      />

      <div className="container mx-auto max-w-screen-lg px-3 sm:px-4 lg:px-6">
        {" "}
        {/* Slightly smaller max-width and padding for a tighter feel */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-5 right-5 z-[100] w-full max-w-sm sm:max-w-md" // Adjusted notification style
            >
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-5 sm:space-y-6">
          {" "}
          {/* Slightly reduced spacing */}
          <ProfileHeader
            username={viewedUser.username}
            isOwnProfile={isOwnProfile}
            isEditing={isEditing}
            isSaving={isSaving}
            onEdit={handleEditClick}
            onSave={handleProfileSave}
            onCancel={handleCancelEdit}
            backgroundImageUrl={backgroundImagePreviewUrl}
            onTriggerBgUpload={triggerBackgroundImageUpload}
            // Pass jobTitle if you want it in header:
            // jobTitle={profileFormData.jobTitle || viewedUser.jobTitle}
          />
          {isEditing && saveError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/40 border-l-4 border-red-400 dark:border-red-500 text-red-600 dark:text-red-200 rounded-md shadow-sm text-sm">
              {" "}
              {/* Softer error message */}
              <ErrorMessage
                message={saveError}
                onClose={() => setSaveError("")}
                minimal
              />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            <div className="lg:col-span-4 xl:col-span-3 md:sticky md:top-8">
              {" "}
              {/* Adjusted sticky top */}
              <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-5 sm:p-6 transition-colors duration-300">
                {" "}
                {/* Softer shadow, rounded-lg */}
                <ProfileSidebar
                  user={viewedUser}
                  profilePictureUrl={profileImagePreviewUrl}
                  isEditing={isEditing}
                  isOwnProfile={isOwnProfile}
                  isUploading={isSaving && !!selectedProfileImageFile} // Only show for profile pic for simplicity
                  onTriggerUpload={triggerProfileImageUpload}
                />
              </div>
            </div>

            <div className="lg:col-span-8 xl:col-span-9 space-y-5 sm:space-y-6">
              <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-5 sm:p-6 transition-colors duration-300">
                {" "}
                {/* Softer shadow, rounded-lg */}
                <ProfileContent
                  profileFormData={profileFormData}
                  isEditing={isEditing}
                  isSaving={isSaving}
                  handleFieldChange={handleFieldChange}
                  fieldConfig={profileFieldConfig}
                  viewedUserOriginalData={viewedUser}
                />
                {isEditing && (
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-5 mt-5 border-t border-slate-200 dark:border-slate-700 transition-colors duration-300">
                    {" "}
                    {/* Softer border, reduced spacing */}
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-100 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-offset-slate-800 transition-all duration-150 ease-in-out disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProfileSave}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 dark:focus:ring-offset-slate-800 transition-all duration-150 ease-in-out disabled:opacity-60"
                    >
                      {isSaving ? <LoadingSpinner size="xs" /> : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
