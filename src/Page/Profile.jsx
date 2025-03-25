// src/Page/Profile.jsx
import React, { useEffect, useState, useRef } from "react";
import "../index.css";
import Sidebar from "../Component/Sidebar";
import { Outlet } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    aboutMe: "",
    skills: "",
    researchInterests: "",
    achievements: "",
    socialLinks: {
      github: "",
      linkedin: "",
      twitter: "",
    },
    collaborationStatus: "",
    recentActivities: "",
    contactInfo: {
      email: "",
      phone: "",
    },
    website: "",
    experience: "",
    education: "",
    location: "",
    profileImage: "",
    password: "",
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        setFormData((prevFormData) => ({
          ...prevFormData,
          ...parsedUser,
          socialLinks: {
            ...prevFormData.socialLinks,
            ...parsedUser.socialLinks,
          },
          contactInfo: {
            ...prevFormData.contactInfo,
            ...parsedUser.contactInfo,
          },
        }));
      }
    } catch (err) {
      setError(err);
      console.error("Error loading data from localStorage:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSocialChange = (e) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [e.target.name]: e.target.value },
    });
  };

  const handleContactChange = (e) => {
    setFormData({
      ...formData,
      contactInfo: { ...formData.contactInfo, [e.target.name]: e.target.value },
    });
  };

  const handleSave = () => {
    try {
      const userProfile = { ...formData };
      delete userProfile.password;
      localStorage.setItem("user", JSON.stringify(userProfile));
      setUser(userProfile);
      setEditing(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } catch (err) {
      setError(err);
      console.error("Error saving data to localStorage:", err);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const size = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > size) {
              height *= size / width;
              width = size;
            }
          } else {
            if (height > size) {
              width *= size / height;
              height = size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const optimizedDataURL = canvas.toDataURL("image/jpeg", 0.7);
          setNewProfileImage(optimizedDataURL);
          setFormData({ ...formData, profileImage: optimizedDataURL });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearField = (fieldName) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [fieldName]: "",
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error">
        Error loading profile data. Please try again later.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 flex">
          <Sidebar isLoggedIn={true} />
          <div className="w-full ml-8">
            <div className="profile-header">
              {" "}
              {/* Apply the styling wrapper to the div */}
              <img
                src={
                  newProfileImage ||
                  formData?.profileImage ||
                  "https://via.placeholder.com/150"
                }
                alt="Profile"
                className="profile-image"
              />
              <button
                onClick={triggerFileInput}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Change Photo
              </button>
              <div className="profile-info">
                <h2 className="profile-username">
                  {formData.username || "ROHIT KOHLI"}
                </h2>
                <h3 className="profile-title">Web Developer</h3>
              </div>
            </div>

            <div className="profile-content">
              {" "}
              {/* Apply the styling wrapper to the div */}
              <Outlet
                context={{
                  formData,
                  setFormData,
                  editing,
                  handleChange,
                  handleSocialChange,
                  handleContactChange,
                  handleClearField,
                }}
              />
            </div>

            <div className="mt-8 flex justify-end">
              {editing ? (
                <button
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Confirmation Message */}
            {showConfirmation && (
              <div className="mt-4 bg-green-200 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                Profile Saved!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
