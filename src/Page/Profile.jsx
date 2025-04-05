import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaEnvelope,
  FaFileUpload,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaSave,
  FaEdit,
  FaSpinner,
} from "react-icons/fa";
import Sidebar from "../Component/Sidebar"; // Assuming Sidebar exists
// import "../index.css"; // Make sure your Tailwind setup is correct

// --- Helper: Default Empty User Data ---
const defaultUserData = {
  username: "", // Will be derived or set during signup/initial save
  firstName: "",
  lastName: "",
  email: "", // Usually set during signup
  affiliation: "",
  role: "", // e.g., Student, Professor, Researcher
  aboutMe: "",
  skills: "", // Consider making this an array later
  researchInterests: "", // Consider making this an array later
  achievements: "",
  socialLinks: {
    github: "",
    linkedin: "",
    twitter: "",
  },
  contactInfo: {
    // Keep primary email separate or sync with top-level email
    phone: "",
  },
  profileImage: "https://via.placeholder.com/150", // Default placeholder
};

export default function Profile() {
  const [user, setUser] = useState(null); // Stores the original loaded user data
  const [formData, setFormData] = useState(defaultUserData);
  const [editing, setEditing] = useState(false); // Start in view mode by default
  const [newProfileImage, setNewProfileImage] = useState(null); // For previewing image changes
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [notificationCount] = useState(3); // Example static count
  const [messageCount] = useState(2); // Example static count

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- Effect to Load User Data ---
  useEffect(() => {
    setIsLoading(true);
    console.log("Attempting to load user data from localStorage...");
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        console.log("User data found:", storedUser);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Merge stored data with defaults to ensure all fields exist
        setFormData((prev) => ({
          ...defaultUserData, // Start with defaults
          ...parsedUser, // Override with stored data
          socialLinks: {
            ...defaultUserData.socialLinks,
            ...(parsedUser.socialLinks || {}),
          },
          contactInfo: {
            ...defaultUserData.contactInfo,
            ...(parsedUser.contactInfo || {}),
          },
        }));
        setEditing(false); // Found user, start in view mode
      } else {
        console.log(
          "No user data found in localStorage. Entering initial setup mode."
        );
        // No user found, treat as initial profile setup
        setFormData(defaultUserData); // Use empty defaults
        setEditing(true); // Start in editing mode to force profile creation
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Handle error, maybe set default state and allow editing
      setFormData(defaultUserData);
      setEditing(true);
    } finally {
      setIsLoading(false);
    }
  }, []); // Run only once on mount

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedInputChange = (e, section) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target.result;
        setNewProfileImage(imageDataUrl); // Show preview immediately
        // Optionally update formData immediately or wait until save
        setFormData((prev) => ({
          ...prev,
          profileImage: imageDataUrl,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log("Saving profile data:", formData);

    // **Replace with actual API call**
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update localStorage (for demo purposes)
      localStorage.setItem("user", JSON.stringify(formData));
      setUser(formData); // Update the 'user' state as well
      setNewProfileImage(null); // Clear temporary image preview
      setEditing(false); // Exit editing mode
      console.log("Profile saved successfully.");
      // Optionally: Show a success message/toast
    } catch (error) {
      console.error("Failed to save profile:", error);
      // Optionally: Show an error message/toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset formData to original user data if available, else to defaults
    setFormData(
      user
        ? {
            ...defaultUserData,
            ...user,
            socialLinks: {
              ...defaultUserData.socialLinks,
              ...(user.socialLinks || {}),
            },
            contactInfo: {
              ...defaultUserData.contactInfo,
              ...(user.contactInfo || {}),
            },
          }
        : defaultUserData
    );
    setNewProfileImage(null); // Reset image preview
    setEditing(false); // Exit editing mode
    if (!user) {
      // If cancelling initial setup, maybe navigate away or show message
      console.log("Initial profile setup cancelled.");
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3 text-xl text-gray-600">Loading Profile...</span>
      </div>
    );
  }

  // --- Render Helper for Fields ---
  const renderField = (
    label,
    name,
    value,
    placeholder = "",
    type = "text",
    isNested = false,
    section = ""
  ) => {
    if (editing) {
      const commonProps = {
        id: name,
        name: name,
        value: value || "", // Ensure value is not null/undefined for controlled input
        onChange: isNested
          ? (e) => handleNestedInputChange(e, section)
          : handleInputChange,
        placeholder: placeholder || `Enter ${label}`,
        className:
          "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100",
        disabled: isSaving,
      };
      return (
        <div className="mb-4">
          <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          {type === "textarea" ? (
            <textarea {...commonProps} rows="4" />
          ) : (
            <input {...commonProps} type={type} />
          )}
        </div>
      );
    }
    return (
      <div className="mb-3">
        <span className="text-sm font-medium text-gray-500">{label}:</span>
        <p className="text-gray-800 whitespace-pre-wrap break-words">
          {value || <span className="text-gray-400 italic">Not set</span>}
        </p>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isLoggedIn={true} />{" "}
      {/* Assuming Sidebar handles its own state/logic */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {/* Header and Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {user ? "Your Profile" : "Create Your Profile"}
          </h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/publications/new")}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition duration-150 ease-in-out"
              title="Post New Publication"
            >
              <FaFileUpload className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Post Publication</span>
            </button>
            {/* Add Message/Notification buttons if needed */}
            <button
              onClick={() => navigate("/messages")} // Example navigation
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition duration-150 ease-in-out relative"
              title="Messages"
            >
              <FaEnvelope className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Messages</span>
              {messageCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {messageCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/notifications")} // Example navigation
              className="flex items-center bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition duration-150 ease-in-out relative"
              title="Notifications"
            >
              <FaBell className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Notifications</span>
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
          {/* Profile Header Section */}
          <div className="flex flex-col sm:flex-row items-center mb-8 pb-6 border-b border-gray-200">
            <div className="relative mb-4 sm:mb-0 sm:mr-6">
              <img
                src={
                  newProfileImage ||
                  formData.profileImage ||
                  "https://via.placeholder.com/150"
                }
                alt="Profile"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md"
              />
              {editing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isSaving}
                  />
                  <button
                    onClick={triggerFileInput}
                    disabled={isSaving}
                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition duration-150 ease-in-out disabled:opacity-50"
                    title="Change Profile Picture"
                  >
                    <FaEdit size={16} />
                  </button>
                </>
              )}
            </div>
            <div className="text-center sm:text-left flex-grow">
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {renderField("First Name", "firstName", formData.firstName)}
                  {renderField("Last Name", "lastName", formData.lastName)}
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">
                  {formData.firstName || formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`
                    : formData.username || "User Name"}
                </h2>
              )}
              {renderField(
                "Role / Title",
                "role",
                formData.role,
                "e.g., PhD Student, Assistant Professor"
              )}
              {renderField(
                "Affiliation",
                "affiliation",
                formData.affiliation,
                "e.g., University Name, Company"
              )}
            </div>
            {/* Edit/Save Buttons (moved near header for visibility) */}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="mt-4 sm:mt-0 sm:ml-auto flex items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <FaEdit className="mr-2" /> Edit Profile
              </button>
            )}
          </div>

          {/* Profile Body Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* About Me Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                About Me
              </h3>
              {renderField(
                "",
                "aboutMe",
                formData.aboutMe,
                "Tell us about yourself...",
                "textarea"
              )}
            </div>

            {/* Contact Info Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                Contact Information
              </h3>
              {renderField(
                "Primary Email",
                "email",
                formData.email,
                "your.email@example.com",
                "email"
              )}
              {renderField(
                "Phone (Optional)",
                "phone",
                formData.contactInfo.phone,
                "e.g., +1 123 456 7890",
                "tel",
                true,
                "contactInfo"
              )}
            </div>

            {/* Social Links Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                Social & Professional Links
              </h3>
              <div className="flex items-center mb-2">
                <FaGithub className="text-gray-600 mr-2" size={20} />
                {renderField(
                  "",
                  "github",
                  formData.socialLinks.github,
                  "GitHub Profile URL",
                  "url",
                  true,
                  "socialLinks"
                )}
              </div>
              <div className="flex items-center mb-2">
                <FaLinkedin className="text-blue-700 mr-2" size={20} />
                {renderField(
                  "",
                  "linkedin",
                  formData.socialLinks.linkedin,
                  "LinkedIn Profile URL",
                  "url",
                  true,
                  "socialLinks"
                )}
              </div>
              <div className="flex items-center mb-2">
                <FaTwitter className="text-blue-400 mr-2" size={20} />
                {renderField(
                  "",
                  "twitter",
                  formData.socialLinks.twitter,
                  "Twitter Profile URL",
                  "url",
                  true,
                  "socialLinks"
                )}
              </div>
            </div>

            {/* Skills Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                Skills
              </h3>
              {renderField(
                "",
                "skills",
                formData.skills,
                "Comma-separated skills (e.g., Python, Data Analysis, React)",
                "textarea"
              )}
              {/* Consider using a tag input component for better UX */}
            </div>

            {/* Research Interests Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                Research Interests
              </h3>
              {renderField(
                "",
                "researchInterests",
                formData.researchInterests,
                "Comma-separated interests (e.g., Machine Learning, NLP)",
                "textarea"
              )}
            </div>

            {/* Achievements Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                Achievements / Awards
              </h3>
              {renderField(
                "",
                "achievements",
                formData.achievements,
                "List significant achievements or awards",
                "textarea"
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons (only show when editing) */}
          {editing && (
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : user ? (
                  <>
                    {" "}
                    <FaSave className="mr-2" /> Save Changes{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <FaSave className="mr-2" /> Create Profile{" "}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        {/* You could add other sections below the main profile card, e.g., Publications list */}
      </main>
    </div>
  );
}
