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
  skillsNeeded: "[]",
  createdAt: null,
  updatedAt: null,
};

// Profile Field Configuration (Ensure this matches your needs)
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
    // Ensure backend handles skillsNeeded as JSON string or parses it
    {
      label: "Skills",
      name: "skillsNeeded",
      type: "textarea",
      placeholder: 'Enter skills as JSON array string e.g., ["React", "Node"]',
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
      console.warn("[ProfileData] No user ID to fetch.");
      setError("No user specified or logged in.");
      setIsLoading(false);
      setViewedUser(null);
      return;
    }
    console.log(
      `[ProfileData] Fetching profile for user ID: ${profileUserIdToFetch}, isOwnProfile: ${isOwnProfile}`
    );

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
        console.log(
          `[ProfileData] Calling API: GET ${API_BASE_URL}${fetchUrl}`
        );
        const response = await apiClient.get(fetchUrl);
        const fetchedUser = response.data?.data || response.data;
        console.log("[ProfileData] Raw fetched user data:", fetchedUser);

        if (!fetchedUser?.id)
          throw new Error("Invalid profile data received from API (no ID).");

        let skillsString = fetchedUser.skillsNeeded; // Assume it's already a JSON string from backend or needs to be stringified if array
        if (Array.isArray(fetchedUser.skillsNeeded)) {
          try {
            skillsString = JSON.stringify(fetchedUser.skillsNeeded);
          } catch (e) {
            console.error("Error stringifying skillsNeeded array:", e);
            skillsString = "[]";
          }
        } else if (
          typeof fetchedUser.skillsNeeded === "undefined" ||
          fetchedUser.skillsNeeded === null
        ) {
          skillsString = "[]";
        } else if (typeof fetchedUser.skillsNeeded !== "string") {
          console.warn(
            "skillsNeeded is not a string or array, attempting to stringify. Data:",
            fetchedUser.skillsNeeded
          );
          try {
            skillsString = JSON.stringify(fetchedUser.skillsNeeded);
          } catch (e) {
            // Best effort
            skillsString = "[]";
          }
        }

        let finalProfilePictureUrl = fetchedUser.profilePictureUrl;
        console.log(
          "[ProfileData] Original profilePictureUrl from API:",
          finalProfilePictureUrl
        );
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
          console.log(
            "[ProfileData] Constructed full profilePictureUrl:",
            finalProfilePictureUrl
          );
        }

        const completeUserData = {
          ...defaultUserProfileData,
          ...fetchedUser,
          profilePictureUrl: finalProfilePictureUrl,
          socialLinks: {
            ...defaultUserProfileData.socialLinks,
            ...(fetchedUser.socialLinks || {}),
          },
          skillsNeeded: skillsString,
        };
        console.log(
          "[ProfileData] Processed complete user data for state:",
          completeUserData
        );

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
  }, [profileUserIdToFetch, isOwnProfile, fetchTrigger]);

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
  );
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // This will hold blob URLs or final HTTP URLs

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
    console.log(
      "[ProfileEffect] ViewedUser changed or isEditing toggled. ViewedUser:",
      viewedUser,
      "isEditing:",
      isEditing
    );
    if (viewedUser) {
      setProfileFormData({
        ...defaultUserProfileData,
        ...viewedUser,
        socialLinks: {
          ...defaultUserProfileData.socialLinks,
          ...(viewedUser.socialLinks || {}),
        },
        // skillsNeeded should already be a string from useUserProfileData
      });

      if (isEditing) {
        // In edit mode, if a local preview (blob) exists, keep it. Otherwise, use server URL.
        if (!imagePreviewUrl || !imagePreviewUrl.startsWith("blob:")) {
          console.log(
            "[ProfileEffect Editing] Setting imagePreviewUrl from viewedUser.profilePictureUrl:",
            viewedUser.profilePictureUrl
          );
          setImagePreviewUrl(viewedUser.profilePictureUrl || null);
        } else {
          console.log(
            "[ProfileEffect Editing] Keeping existing blob imagePreviewUrl:",
            imagePreviewUrl
          );
        }
      } else {
        // In view mode (or after save/cancel), always display the definitive profile picture from server.
        console.log(
          "[ProfileEffect ViewMode] Setting imagePreviewUrl from viewedUser.profilePictureUrl:",
          viewedUser.profilePictureUrl
        );
        setImagePreviewUrl(viewedUser.profilePictureUrl || null);
        // Clean up any selected file if we are moving out of edit mode or data refreshed
        if (selectedImageFile) {
          console.log("[ProfileEffect ViewMode] Clearing selectedImageFile.");
          setSelectedImageFile(null);
        }
        // Revoke old blob if it's not the current server URL (which shouldn't be a blob)
        if (
          imagePreviewUrl &&
          imagePreviewUrl.startsWith("blob:") &&
          imagePreviewUrl !== viewedUser.profilePictureUrl
        ) {
          console.log(
            "[ProfileEffect ViewMode] Revoking old blob URL:",
            imagePreviewUrl
          );
          URL.revokeObjectURL(imagePreviewUrl);
        }
      }
    } else {
      // No viewedUser, reset form and image
      setProfileFormData(defaultUserProfileData);
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:"))
        URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setSelectedImageFile(null);
    }
  }, [isEditing, viewedUser]); // Removed selectedImageFile, imagePreviewUrl to simplify and rely on primary sources

  // Cleanup effect for blob URLs when component unmounts
  useEffect(() => {
    const currentImagePreview = imagePreviewUrl; // Capture value at time of effect
    return () => {
      if (currentImagePreview && currentImagePreview.startsWith("blob:")) {
        console.log(
          "[ProfileEffect Unmount/Cleanup] Revoking blob URL:",
          currentImagePreview
        );
        URL.revokeObjectURL(currentImagePreview);
      }
    };
  }, [imagePreviewUrl]); // Runs when imagePreviewUrl changes or unmount

  const handleEditClick = useCallback(() => {
    if (isOwnProfile) {
      setIsEditing(true);
      setSaveError("");
      closeNotification();
      // Form data and imagePreviewUrl will be set by the useEffect based on viewedUser
      console.log("[ProfileEvent] Edit clicked.");
    }
  }, [isOwnProfile, closeNotification]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setSaveError("");
    // Revoke current blob URL if one was created for preview
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      console.log("[ProfileEvent Cancel] Revoking blob URL:", imagePreviewUrl);
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    // The main useEffect will reset imagePreviewUrl to viewedUser.profilePictureUrl
    // and profileFormData based on viewedUser.
    console.log("[ProfileEvent] Cancel edit clicked.");
  }, [imagePreviewUrl]); // Add imagePreviewUrl as it's used

  const handleImageFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      console.log(
        "[ProfileEvent] Image file selected:",
        file.name,
        file.type,
        file.size
      );

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
        // Revoke previous blob if any
        console.log(
          "[ProfileEvent ImageChange] Revoking old blob URL:",
          imagePreviewUrl
        );
        URL.revokeObjectURL(imagePreviewUrl);
      }

      const newBlobUrl = URL.createObjectURL(file);
      setSelectedImageFile(file);
      setImagePreviewUrl(newBlobUrl);
      console.log(
        "[ProfileEvent ImageChange] New blob URL created:",
        newBlobUrl
      );
      event.target.value = null; // Allows selecting the same file again
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
      else if (keys.length === 2 && keys[0] === "socialLinks") {
        newFormData = {
          ...prev,
          socialLinks: { ...prev.socialLinks, [keys[1]]: value },
        };
      } else newFormData = prev;
      // console.log("[ProfileEvent] Field changed:", name, value, "New form data:", newFormData);
      return newFormData;
    });
  }, []);

  const handleProfileSave = useCallback(async () => {
    if (!isOwnProfile || !isEditing) return;
    console.log(
      "[ProfileEvent] Save clicked. Current form data:",
      profileFormData,
      "Selected image:",
      selectedImageFile?.name
    );

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
    // Append all fields from profileFormData EXCEPT non-editable, id, and profilePictureUrl (handled by file)
    Object.keys(profileFormData).forEach((key) => {
      if (
        [
          "id",
          "username",
          "email",
          "profilePictureUrl",
          "createdAt",
          "updatedAt",
        ].includes(key)
      )
        return;

      if (key === "socialLinks") {
        formDataToSubmit.append(
          "socialLinksJson",
          JSON.stringify(profileFormData.socialLinks || {})
        );
      } else if (key === "skillsNeeded") {
        try {
          JSON.parse(profileFormData.skillsNeeded || "[]"); // Validate JSON
          formDataToSubmit.append(
            "skillsNeeded",
            profileFormData.skillsNeeded || "[]"
          );
        } catch (e) {
          console.error(
            "Invalid JSON for skillsNeeded:",
            profileFormData.skillsNeeded
          );
          setSaveError(
            "Invalid format for 'Skills'. Must be a valid JSON array string e.g., [\"Skill1\"]."
          );
          setIsSaving(false);
          return; // Stop submission
        }
      } else if (
        profileFormData[key] !== null &&
        typeof profileFormData[key] !== "undefined"
      ) {
        formDataToSubmit.append(key, profileFormData[key]);
      }
    });

    if (selectedImageFile) {
      formDataToSubmit.append(
        "profileImageFile",
        selectedImageFile,
        selectedImageFile.name
      );
    }

    // For debugging: Log FormData contents (not straightforward for files, but text fields)
    // for (let [key, value] of formDataToSubmit.entries()) { console.log(`[Save FormData] ${key}: ${value}`); }

    try {
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(
        `[ProfileSave] Calling API: PUT ${API_BASE_URL}/api/users/profile`
      );
      const response = await apiClient.put(
        `/api/users/profile`,
        formDataToSubmit
      );
      const updatedUser = response.data?.data || response.data;
      console.log("[ProfileSave] API response data:", updatedUser);

      if (!updatedUser?.id)
        throw new Error("Invalid API response after update (no user ID).");

      setIsEditing(false);
      // selectedImageFile is cleared by the main useEffect when isEditing becomes false, after data refetches.
      // imagePreviewUrl will be updated by the main useEffect after refetchProfileData updates viewedUser.
      showNotification("Profile updated successfully!", "success");
      refetchProfileData(); // This is key to get the new profilePictureUrl from server
    } catch (err) {
      let message = "Failed to update profile.";
      if (err instanceof AxiosError && err.response?.data?.message)
        message = err.response.data.message;
      else if (err.response?.data?.errors)
        message = err.response.data.errors
          .map((e) => e.msg)
          .join(", "); // For express-validator
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
  ]);

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)] w-full bg-gray-100 p-4">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  if (fetchProfileError && !viewedUser) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center bg-gray-100">
        <ErrorMessage
          title="Error Loading Profile"
          message={fetchProfileError}
          onRetry={refetchProfileData}
        />
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10 text-center bg-gray-100">
        <ErrorMessage
          title="Profile Unavailable"
          message="Could not load profile data for the specified user."
        />
        <Link
          to="/dashboard"
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 sm:py-12">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png, image/jpeg, image/gif, image/webp"
        style={{ display: "none" }}
        id="profileImageUploadInput"
      />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <ErrorMessage
                message={saveError}
                onClose={() => setSaveError("")}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
            <div className="md:col-span-1 lg:col-span-1 md:sticky md:top-6 bg-white shadow-xl rounded-lg p-6">
              <ProfileSidebar
                user={viewedUser} // Pass the fully processed viewedUser
                imagePreview={imagePreviewUrl} // This is critical, should be blob or full HTTP URL
                isEditing={isEditing}
                isOwnProfile={isOwnProfile}
                isUploading={isSaving && !!selectedImageFile}
                onTriggerUpload={triggerImageUpload}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 space-y-6 bg-white shadow-xl rounded-lg p-6 sm:p-8">
              <ProfileContent
                profileFormData={profileFormData} // Form data for inputs
                isEditing={isEditing}
                isSaving={isSaving}
                handleFieldChange={handleFieldChange}
                fieldConfig={profileFieldConfig}
                // Pass viewedUser if ProfileContent needs to display non-editable original data alongside form fields
                viewedUserOriginalData={viewedUser}
              />
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-300">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
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
