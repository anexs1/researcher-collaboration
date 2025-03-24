import React, { useEffect, useState, useRef } from "react";
import "../index.css";
import Publication from "./Publication"; // Import Publication component

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPublicationForm, setShowPublicationForm] = useState(false); // New state

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

        // Initialize form with user data, handling missing values
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

          const size = 300; // Reduce size for better performance and smaller data URLs
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

          const optimizedDataURL = canvas.toDataURL("image/jpeg", 0.7); // Reduce quality for smaller size
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

  const handleTogglePublicationForm = () => {
    setShowPublicationForm(!showPublicationForm);
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
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          {/* New Header Section */}
          <div className="flex items-center space-x-4">
            <img
              src={
                newProfileImage ||
                formData?.profileImage ||
                "https://via.placeholder.com/150"
              }
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
            />
            <button
              onClick={triggerFileInput}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Change Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
              accept="image/*"
            />

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {formData.username || "ROHIT KOHLI"}
              </h2>
              <h3 className="text-gray-600">Web Developer</h3>
            </div>
          </div>

          <div className="mt-8">
            {/* Account Information Section */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Account Information
            </h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Username:
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button onClick={() => handleClearField("username")}>
                    Clear
                  </button>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button onClick={() => handleClearField("email")}>
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  <strong>Username:</strong>{" "}
                  {formData.username || "Not provided"}
                </p>
                <p>
                  <strong>Email:</strong> {formData.email || "Not provided"}
                </p>
              </div>
            )}

            {/* About Me Section */}
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">
              About Me
            </h2>
            {editing ? (
              <div className="space-y-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  About Me:
                </label>
                <textarea
                  name="aboutMe"
                  value={formData.aboutMe}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button onClick={() => handleClearField("aboutMe")}>
                  Clear
                </button>
              </div>
            ) : (
              <p className="text-gray-700">
                {formData.aboutMe ||
                  "Write an enticing performance summary that impresses the recruiter. Showcase your uniqueness through your skills and accomplishments."}
              </p>
            )}

            {/* Education Section */}
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">
              Education
            </h2>
            {editing ? (
              <div className="space-y-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Education:
                </label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button onClick={() => handleClearField("education")}>
                  Clear
                </button>
              </div>
            ) : (
              <div className="profile-item">
                <strong>Education:</strong>{" "}
                {formData.education || "Not provided"}
              </div>
            )}

            {/* Skills Section */}
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">
              Skills & Technologies
            </h2>
            {editing ? (
              <div className="space-y-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Skills:
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button onClick={() => handleClearField("skills")}>
                  Clear
                </button>
              </div>
            ) : (
              <div className="profile-item">
                <strong>Skills:</strong> {formData.skills || "Not provided"}
              </div>
            )}

            {/* Research Interests Section */}
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">
              Research Interests
            </h2>
            {editing ? (
              <div className="space-y-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Research Interests:
                </label>
                <input
                  type="text"
                  name="researchInterests"
                  value={formData.researchInterests}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button onClick={() => handleClearField("researchInterests")}>
                  Clear
                </button>
              </div>
            ) : (
              <div className="profile-item">
                <strong>Research Interests:</strong>{" "}
                {formData.researchInterests || "Not provided"}
              </div>
            )}
            {/* Post Publication Button */}
            <button
              onClick={handleTogglePublicationForm}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
            >
              Post Publication
            </button>

            {/* Render Publication Component if the button is clicked */}
            {showPublicationForm && (
              <div className="mt-4">
                <Publication isLoggedIn={true} /> {/* Pass isLoggedIn prop */}
              </div>
            )}
            {/* Edit/Save Buttons */}
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
