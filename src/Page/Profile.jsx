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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import Notification from "../Component/Common/Notification";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

export default function Profile({ currentUser }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [viewedUser, setViewedUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
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

  const fileInputRef = useRef(null);

  useHotkeys("esc", () => editingProfile && handleProfileCancel());
  useHotkeys("cmd+s, ctrl+s", (e) => {
    e.preventDefault();
    if (editingProfile) handleProfileSave();
  });

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification({ message: "", type: "", show: false }),
      5000
    );
  }, []);

  const syncFormWithViewedUser = (userToSync) => {
    const userData = userToSync || defaultUserData;
    setProfileFormData({
      username: userData.username || "",
      email: userData.email || "",
      bio: userData.bio || "",
      profilePictureUrl: userData.profilePictureUrl || null,
      socialLinks: {
        linkedin: userData.socialLinks?.linkedin || "",
        github: userData.socialLinks?.github || "",
        twitter: userData.socialLinks?.twitter || "",
        website: userData.socialLinks?.website || "",
      },
      interests: Array.isArray(userData.interests) ? userData.interests : [],
      university: userData.university || "",
      department: userData.department || "",
      companyName: userData.companyName || "",
      jobTitle: userData.jobTitle || "",
      medicalSpecialty: userData.medicalSpecialty || "",
      hospitalName: userData.hospitalName || "",
    });
    setImagePreview(userData.profilePictureUrl || null);
  };

  useEffect(() => {
    const profileUserIdToFetch = userId || currentUser?.id;
    const loggedInUserId = currentUser?.id;

    setIsOwnProfile(
      profileUserIdToFetch &&
        String(profileUserIdToFetch) === String(loggedInUserId)
    );
    setIsLoadingProfile(true);
    setApiError("");

    const fetchUrl = isOwnProfile
      ? `${API_BASE_URL}/api/auth/me`
      : `${API_BASE_URL}/api/users/public/${profileUserIdToFetch}`;

    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    };

    axios
      .get(fetchUrl, config)
      .then((response) => {
        const fetchedUser = response.data?.data || response.data;
        if (
          !fetchedUser ||
          typeof fetchedUser !== "object" ||
          !fetchedUser.id
        ) {
          throw new Error("Invalid profile data.");
        }
        setViewedUser(fetchedUser);
        syncFormWithViewedUser(fetchedUser);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        setApiError(
          error.response?.data?.message || "Failed to load profile data."
        );
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [userId, currentUser]);

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

    const formDataToSubmit = new FormData();
    Object.keys(profileFormData).forEach((key) => {
      if (key !== "socialLinks") {
        formDataToSubmit.append(key, profileFormData[key]);
      } else {
        // Handle socialLinks separately
        Object.keys(profileFormData.socialLinks).forEach((socialKey) => {
          formDataToSubmit.append(
            `socialLinks[${socialKey}]`,
            profileFormData.socialLinks[socialKey]
          );
        });
      }
    });

    if (newProfileImage) {
      formDataToSubmit.append("profileImageFile", newProfileImage);
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        formDataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const updatedUser = response.data?.data || response.data;
      setViewedUser(updatedUser);
      syncFormWithViewedUser(updatedUser);
      setEditingProfile(false);
      showNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      setApiError(error.response?.data?.message || "Failed to update profile.");
      showNotification("Error updating profile.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showNotification("Please upload a valid image file.", "error");
        return;
      }
      setNewProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const renderProfileField = (label, name) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={profileFormData[name] || ""}
        onChange={(e) =>
          setProfileFormData({ ...profileFormData, [name]: e.target.value })
        }
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        disabled={!editingProfile}
      />
    </div>
  );

  if (isLoadingProfile) {
    return <LoadingSpinner />;
  }

  if (apiError) {
    return <ErrorMessage message={apiError} onClose={() => setApiError("")} />;
  }

  if (!viewedUser) {
    return <div>No profile data available.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{viewedUser.username}'s Profile</h1>
        {isOwnProfile && (
          <button
            onClick={editingProfile ? handleProfileSave : handleEditClick}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={isSavingProfile}
          >
            {isSavingProfile ? (
              <FaSpinner className="animate-spin" />
            ) : editingProfile ? (
              <>
                <FaCheck /> Save
              </>
            ) : (
              <>
                <FaEdit /> Edit Profile
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img
                  src={
                    imagePreview ||
                    viewedUser.profilePictureUrl ||
                    "/default-avatar.png"
                  }
                  alt={viewedUser.username}
                  className="w-32 h-32 rounded-full object-cover"
                />
                {editingProfile && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                  >
                    <FaFileUpload />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center">
              {viewedUser.username}
            </h2>
            {viewedUser.bio && (
              <p className="text-gray-600 text-center mt-2">{viewedUser.bio}</p>
            )}
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            {renderProfileField("Username", "username")}
            {renderProfileField("Email", "email")}
            {renderProfileField("Bio", "bio")}

            <h2 className="text-xl font-semibold mt-6 mb-4">
              Professional Information
            </h2>
            {renderProfileField("University", "university")}
            {renderProfileField("Department", "department")}
            {renderProfileField("Company Name", "companyName")}
            {renderProfileField("Job Title", "jobTitle")}
            {renderProfileField("Medical Specialty", "medicalSpecialty")}
            {renderProfileField("Hospital Name", "hospitalName")}

            <h2 className="text-xl font-semibold mt-6 mb-4">Social Links</h2>
            {renderProfileField("LinkedIn", "socialLinks.linkedin")}
            {renderProfileField("GitHub", "socialLinks.github")}
            {renderProfileField("Twitter", "socialLinks.twitter")}
            {renderProfileField("Website", "socialLinks.website")}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
