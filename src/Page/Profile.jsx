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

// Icons - Keep these if other fields use them
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

// Default Profile Data - skillsNeeded removed
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
  hospitalName: "", // skillsNeeded removed
  createdAt: null,
  updatedAt: null,
};

// Profile Field Configuration - skillsSection removed
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
  // skillsSection removed
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

// Custom Hooks (Identical, no changes needed here)
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
        if (!fetchedUser?.id)
          throw new Error("Invalid profile data received from API (no ID).");

        // skillsNeeded processing removed

        let finalProfilePictureUrl = fetchedUser.profilePictureUrl;
        if (
          finalProfilePictureUrl &&
          !finalProfilePictureUrl.startsWith("http") &&
          !finalProfilePictureUrl.startsWith("blob:")
        ) {
          let base = API_BASE_URL.endsWith("/")
            ? API_BASE_URL.slice(0, -1)
            : API_BASE_URL;
          let path = finalProfilePictureUrl.startsWith("/")
            ? finalProfilePictureUrl
            : `/${finalProfilePictureUrl}`;
          finalProfilePictureUrl = `${base}${path}`;
        }
        // Ensure all fields from defaultUserProfileData are present, even if not in fetchedUser
        const completeUserData = {
          ...defaultUserProfileData, // Start with all defined default fields
          ...fetchedUser, // Overlay with fetched data
          profilePictureUrl: finalProfilePictureUrl,
          socialLinks: {
            ...defaultUserProfileData.socialLinks,
            ...(fetchedUser.socialLinks || {}),
          },
          // skillsNeeded is no longer part of default or fetched data structure here
        };
        if (isMounted) setViewedUser(completeUserData);
      } catch (err) {
        if (isMounted) {
          let message = "Failed to load profile data.";
          if (err instanceof AxiosError) {
            message = err.response?.data?.message || err.message;
            if (err.response?.status === 404) message = "Profile not found.";
            else if (err.response?.status === 401)
              message = isOwnProfile
                ? "Authentication failed. Please log in again."
                : "Cannot access this profile.";
          } else if (err instanceof Error) message = err.message;
          console.error("[ProfileData] Error fetching profile:", err);
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
  }, [
    profileUserIdToFetch,
    isOwnProfile,
    fetchTrigger,
    API_BASE_URL,
    currentUser,
  ]); // Added currentUser
  return { viewedUser, isOwnProfile, isLoading, error, refetch };
}

export default function Profile({ currentUser }) {
  const { userId: routeUserId } = useParams();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profileFormData, setProfileFormData] = useState(
    defaultUserProfileData
  ); // Uses updated default
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

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
      // Spread default to ensure all keys exist, then viewedUser
      setProfileFormData({
        ...defaultUserProfileData,
        ...viewedUser,
        socialLinks: {
          ...defaultUserProfileData.socialLinks,
          ...(viewedUser.socialLinks || {}),
        },
      });
      if (isEditing) {
        if (!imagePreviewUrl || !imagePreviewUrl.startsWith("blob:")) {
          setImagePreviewUrl(viewedUser.profilePictureUrl || null);
        }
      } else {
        setImagePreviewUrl(viewedUser.profilePictureUrl || null);
        if (selectedImageFile) {
          setSelectedImageFile(null);
        }
        if (
          imagePreviewUrl &&
          imagePreviewUrl.startsWith("blob:") &&
          imagePreviewUrl !== viewedUser.profilePictureUrl
        ) {
          URL.revokeObjectURL(imagePreviewUrl);
        }
      }
    } else {
      setProfileFormData(defaultUserProfileData);
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:"))
        URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setSelectedImageFile(null);
    }
  }, [isEditing, viewedUser, imagePreviewUrl, selectedImageFile]);

  useEffect(() => {
    const currentImagePreview = imagePreviewUrl;
    return () => {
      if (currentImagePreview && currentImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentImagePreview);
      }
    };
  }, [imagePreviewUrl]);

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
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
  }, [imagePreviewUrl]);
  const handleImageFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
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
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      const newBlobUrl = URL.createObjectURL(file);
      setSelectedImageFile(file);
      setImagePreviewUrl(newBlobUrl);
      event.target.value = null;
    },
    [showNotification, imagePreviewUrl]
  );
  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    setProfileFormData((prev) => {
      let newFormData;
      if (keys.length === 1) newFormData = { ...prev, [name]: value };
      else if (keys.length === 2 && keys[0] === "socialLinks")
        newFormData = {
          ...prev,
          socialLinks: { ...prev.socialLinks, [keys[1]]: value },
        };
      else newFormData = prev;
      return newFormData;
    });
  }, []);

  const handleProfileSave = useCallback(async () => {
    if (!isOwnProfile || !isEditing) return;

    setIsSaving(true);
    setSaveError("");
    closeNotification();
    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification("Authentication error. Please log in again.", "error");
      setIsSaving(false);
      return;
    }

    const formDataToSubmit = new FormData();

    Object.keys(profileFormData).forEach((key) => {
      // Exclude non-editable fields, ID, and skillsNeeded (since it's removed)
      if (
        [
          "id",
          "username",
          "email",
          "profilePictureUrl",
          "createdAt",
          "updatedAt",
          "skillsNeeded",
        ].includes(key)
      )
        return;

      if (key === "socialLinks") {
        formDataToSubmit.append(
          "socialLinksJson",
          JSON.stringify(profileFormData.socialLinks || {})
        );
      } else if (
        profileFormData[key] !== null &&
        typeof profileFormData[key] !== "undefined"
      ) {
        formDataToSubmit.append(key, profileFormData[key]);
      }
    });

    if (selectedImageFile)
      formDataToSubmit.append(
        "profileImageFile",
        selectedImageFile,
        selectedImageFile.name
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
      const updatedUser = response.data?.data || response.data;
      if (!updatedUser?.id)
        throw new Error("Invalid API response after update (no user ID).");
      setIsEditing(false);
      showNotification("Profile updated successfully!", "success");
      refetchProfileData();
    } catch (err) {
      let message = "Failed to update profile.";
      if (err instanceof AxiosError && err.response?.data?.message)
        message = err.response.data.message;
      else if (err.response?.data?.errors)
        message = err.response.data.errors.map((e) => e.msg).join(", ");
      else if (err instanceof Error) message = err.message;
      console.error("[ProfileSave] Error saving profile:", err.response || err);
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
    API_BASE_URL,
  ]);

  // --- JSX (Rendering Logic - identical styling to previous version) ---
  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)] w-full bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  if (fetchProfileError && !viewedUser) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12 text-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl">
          <ErrorMessage
            title="Error Loading Profile"
            message={fetchProfileError}
            onRetry={refetchProfileData}
          />
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12 text-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl">
          <ErrorMessage
            title="Profile Unavailable"
            message="Could not load profile data for the specified user."
          />
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-8 sm:py-12 transition-colors duration-300">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png, image/jpeg, image/gif, image/webp"
        style={{ display: "none" }}
        id="profileImageUploadInput"
      />
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed top-6 right-6 z-[100] w-full max-w-md"
            >
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl transition-colors duration-300">
            <ProfileHeader
              username={viewedUser.username}
              isOwnProfile={isOwnProfile}
              isEditing={isEditing}
              isSaving={isSaving}
              onEdit={handleEditClick}
              onSave={handleProfileSave}
              onCancel={handleCancelEdit}
            />
          </div>

          {isEditing && saveError && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md shadow-md transition-colors duration-300">
              <ErrorMessage
                message={saveError}
                onClose={() => setSaveError("")}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 xl:col-span-3 md:sticky md:top-10">
              <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8 transition-colors duration-300">
                <ProfileSidebar
                  user={viewedUser}
                  imagePreview={imagePreviewUrl}
                  isEditing={isEditing}
                  isOwnProfile={isOwnProfile}
                  isUploading={isSaving && !!selectedImageFile}
                  onTriggerUpload={triggerImageUpload}
                />
              </div>
            </div>

            <div className="lg:col-span-8 xl:col-span-9 space-y-8">
              <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 md:p-8 transition-colors duration-300">
                <ProfileContent
                  profileFormData={profileFormData}
                  isEditing={isEditing}
                  isSaving={isSaving}
                  handleFieldChange={handleFieldChange}
                  fieldConfig={profileFieldConfig} // Uses updated config without skills
                  viewedUserOriginalData={viewedUser}
                />
                {isEditing && (
                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 mt-8 border-t border-slate-200 dark:border-slate-700 transition-colors duration-300">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 transition-all duration-150 ease-in-out disabled:opacity-70"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProfileSave}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-all duration-150 ease-in-out disabled:opacity-70"
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
    </div>
  );
}
