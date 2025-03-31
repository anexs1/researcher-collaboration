import React, { useEffect, useState, useRef } from "react";
import "../index.css";
import Sidebar from "../Component/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { FaBell, FaEnvelope, FaFileUpload } from "react-icons/fa";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notificationCount] = useState(3);
  const [messageCount] = useState(2);
  const navigate = useNavigate();

  // Initialize formData with default values
  const [formData, setFormData] = useState({
    username: "ROHIT KOHLI", // Default value
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
    contactInfo: {
      email: "",
      phone: "",
    },
    profileImage: "https://via.placeholder.com/150", // Default image
    // ... other fields
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log("Fetching user data..."); // Debug log
    try {
      const storedUser = localStorage.getItem("user");
      console.log("Stored user data:", storedUser); // Debug log

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("Parsed user data:", parsedUser); // Debug log

        setUser(parsedUser);
        setFormData((prev) => ({
          ...prev,
          ...parsedUser,
          socialLinks: {
            ...prev.socialLinks,
            ...(parsedUser.socialLinks || {}),
          },
          contactInfo: {
            ...prev.contactInfo,
            ...(parsedUser.contactInfo || {}),
          },
          profileImage: parsedUser.profileImage || prev.profileImage,
          username: parsedUser.username || prev.username,
        }));
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  }, []);

  // Debug current formData
  useEffect(() => {
    console.log("Current formData:", formData);
  }, [formData]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewProfileImage(event.target.result);
        setFormData((prev) => ({
          ...prev,
          profileImage: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ... keep other handler functions ...

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 flex">
          <Sidebar isLoggedIn={true} />
          <div className="w-full ml-8">
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mb-6">
              <button
                onClick={() => navigate("/publications/new")}
                className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg"
              >
                <FaFileUpload className="mr-2" />
                Post Publication
              </button>
              <button
                onClick={() => navigate("/messages")}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg relative"
              >
                <FaEnvelope className="mr-2" />
                Messages
                {messageCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {messageCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/notifications")}
                className="flex items-center bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg relative"
              >
                <FaBell className="mr-2" />
                Notifications
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center mb-8">
              <div className="relative mr-6">
                <img
                  src={newProfileImage || formData.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={triggerFileInput}
                  className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                >
                  ✏️
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {formData.username}
                </h1>
                <p className="text-gray-600">Researcher </p>
              </div>
            </div>

            {/* Profile Content */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <Outlet context={{ formData, setFormData, editing }} />
            </div>

            {/* Edit/Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setEditing(!editing)}
                className={`px-4 py-2 rounded-md text-white ${
                  editing
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {editing ? "Save Profile" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
