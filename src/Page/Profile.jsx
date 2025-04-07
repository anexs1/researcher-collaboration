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
// import "../index.css"; // Ensure Tailwind is configured

// --- Helper: Default Empty User Data ---
// This structure is used when no data is found or as a base
const defaultUserData = {
  username: "", // Often set during signup, might be non-editable later
  firstName: "",
  lastName: "",
  email: "", // Usually set during signup and is often a key identifier
  affiliation: "",
  role: "", // e.g., Student, Professor, Researcher
  aboutMe: "",
  skills: "", // Consider storing as an array ["skill1", "skill2"]
  researchInterests: "", // Consider storing as an array
  achievements: "",
  socialLinks: {
    github: "",
    linkedin: "",
    twitter: "",
  },
  contactInfo: {
    phone: "",
  },
  profileImage: "https://via.placeholder.com/150", // Default placeholder
};

export default function Profile() {
  // 'user' state holds the last *saved* or *loaded* data from storage/API
  const [user, setUser] = useState(null);
  // 'formData' state holds the data currently being displayed or edited in the form
  const [formData, setFormData] = useState(defaultUserData);
  // 'editing' state controls whether the form is in view or edit mode
  const [editing, setEditing] = useState(false); // Start in view mode by default
  const [newProfileImage, setNewProfileImage] = useState(null); // For previewing image changes
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [notificationCount] = useState(3); // Example static count
  const [messageCount] = useState(2); // Example static count

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- Effect to Load User Data ---
  // This runs once when the component mounts.
  // It attempts to load user data stored by the Signup or Login process.
  useEffect(() => {
    setIsLoading(true);
    console.log(
      "Profile component mounted. Attempting to load user data from localStorage..."
    );
    try {
      // **ASSUMPTION:** Your Signup and Login components save user data here.
      const storedUserJson = localStorage.getItem("user");

      if (storedUserJson) {
        console.log("User data found in localStorage:", storedUserJson);
        const parsedUser = JSON.parse(storedUserJson);

        // Set the 'user' state with the loaded data (represents the saved state)
        setUser(parsedUser);

        // Initialize 'formData' by merging stored data with defaults.
        // This ensures all expected fields exist in formData, even if not in localStorage.
        setFormData((prev) => ({
          ...defaultUserData, // Start with defaults
          ...parsedUser, // Override with stored data
          // Ensure nested objects are also merged correctly
          socialLinks: {
            ...defaultUserData.socialLinks,
            ...(parsedUser.socialLinks || {}),
          },
          contactInfo: {
            ...defaultUserData.contactInfo,
            ...(parsedUser.contactInfo || {}),
          },
          // Use the stored profile image if available
          profileImage: parsedUser.profileImage || defaultUserData.profileImage,
        }));

        setEditing(false); // User data found, start in view mode.
        console.log("Profile loaded successfully. Displaying data.");
      } else {
        // --- Scenario: No User Data Found ---
        // This happens if it's the user's first time after signup (if signup didn't save),
        // or if localStorage was cleared, or if login didn't save the data yet.
        console.warn(
          "No user data found in localStorage. Entering initial profile setup mode."
        );
        setUser(null); // No base user data exists
        setFormData(defaultUserData); // Use empty defaults for the form
        setEditing(true); // Start in editing mode to force profile creation/completion.
      }
    } catch (error) {
      console.error(
        "Error loading or parsing user data from localStorage:",
        error
      );
      // Handle error: Fallback to default state and allow editing.
      setUser(null);
      setFormData(defaultUserData);
      setEditing(true); // Allow user to create profile even if loading failed
    } finally {
      setIsLoading(false); // Finish loading indicator
    }
  }, []); // Empty dependency array ensures this runs only once on mount

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
        // Update formData immediately so it gets saved
        setFormData((prev) => ({
          ...prev,
          profileImage: imageDataUrl, // Store the base64 string or prepare for upload
        }));
      };
      reader.readAsDataURL(file);
      // In a real app, you'd likely upload the 'file' object directly on save,
      // not just store the base64 string in localStorage long-term.
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log("Attempting to save profile data:", formData);

    // **TODO: Replace with actual API call to your backend**
    // Example:
    // try {
    //   const response = await fetch('/api/user/profile', {
    //     method: 'PUT', // or POST if creating
    //     headers: {
    //       'Content-Type': 'application/json',
    //       // Include authorization token if needed
    //       // 'Authorization': `Bearer ${yourAuthToken}`
    //     },
    //     body: JSON.stringify(formData),
    //   });
    //   if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`);
    //   }
    //   const updatedUser = await response.json();
    //   // Update local state *after* successful API call
    //   localStorage.setItem("user", JSON.stringify(updatedUser)); // Use data from response if it differs
    //   setUser(updatedUser);
    //   setFormData(updatedUser); // Sync form with saved data
    //   setNewProfileImage(null);
    //   setEditing(false);
    //   console.log("Profile saved successfully via API.");
    //   // Show success message/toast
    // } catch (error) {
    //   console.error("Failed to save profile via API:", error);
    //   // Show error message/toast
    // } finally {
    //   setIsSaving(false);
    // }

    // **Simulated Save (using localStorage only for demo)**
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

      // Update localStorage with the current form data
      localStorage.setItem("user", JSON.stringify(formData));

      // Update the 'user' state to reflect the newly saved data
      setUser(formData);

      // If the image was changed via preview, it's already in formData.
      // Clear the separate preview state.
      setNewProfileImage(null);

      // Exit editing mode
      setEditing(false);
      console.log("Profile saved successfully (simulated to localStorage).");
      // Optionally: Show a success message/toast
    } catch (error) {
      console.error("Failed to save profile (simulation error):", error);
      // Optionally: Show an error message/toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancelling edit...");
    // Reset formData back to the *last saved state* (stored in the 'user' state)
    // If 'user' is null (meaning initial setup was cancelled), reset to defaults.
    if (user) {
      // Restore from the 'user' state, ensuring nested structures are copied correctly
      setFormData({
        ...defaultUserData, // Start with defaults
        ...user, // Override with saved data
        socialLinks: {
          ...defaultUserData.socialLinks,
          ...(user.socialLinks || {}),
        },
        contactInfo: {
          ...defaultUserData.contactInfo,
          ...(user.contactInfo || {}),
        },
        profileImage: user.profileImage || defaultUserData.profileImage,
      });
    } else {
      // If cancelling the very first profile creation, just reset to empty defaults
      setFormData(defaultUserData);
    }

    setNewProfileImage(null); // Clear any temporary image preview
    setEditing(false); // Exit editing mode

    if (!user) {
      // Optional: If cancelling initial setup, maybe navigate away or show a specific message
      console.log("Initial profile setup cancelled. Form reset to defaults.");
      // navigate('/'); // Example: navigate back home if initial setup is mandatory and cancelled
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
  // (This function remains the same as it correctly handles view/edit modes)
  const renderField = (
    label,
    name,
    value,
    placeholder = "",
    type = "text",
    isNested = false,
    section = ""
  ) => {
    // Special handling for identifier fields if needed (e.g., make email/username read-only after creation)
    // const isIdentifier = name === 'email' || name === 'username';
    // const disableField = isSaving || (!editing && isIdentifier && user); // Example: disable email/username even in edit mode if user exists

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
        // disabled: disableField, // Use this if you want certain fields non-editable
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
    // --- View Mode ---
    // Displaying data when not editing
    return (
      <div className="mb-3">
        <span className="text-sm font-medium text-gray-500">
          {label}
          {label ? ":" : ""}
        </span>{" "}
        {/* Add colon only if label exists */}
        <p className="text-gray-800 whitespace-pre-wrap break-words mt-1">
          {/* Display value or a placeholder if empty */}
          {value || <span className="text-gray-400 italic">Not set</span>}
        </p>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isLoggedIn={true} />{" "}
      {/* Pass login status if Sidebar needs it */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {/* Header and Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {/* Title changes based on whether it's initial setup or viewing/editing existing */}
            {user ? "Your Profile" : "Create Your Profile"}
          </h1>
          {/* Action buttons (remain the same) */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/publications/new")}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition duration-150 ease-in-out"
              title="Post New Publication"
            >
              <FaFileUpload className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Post Publication</span>
            </button>
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
          <div className="flex flex-col sm:flex-row items-center mb-8 pb-6 border-b border-gray-200 gap-4">
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              <img
                // Display preview if available, otherwise formData image, fallback to placeholder
                src={
                  newProfileImage ||
                  formData.profileImage ||
                  defaultUserData.profileImage // Use default if others fail
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

            {/* Name, Role, Affiliation */}
            <div className="text-center sm:text-left flex-grow">
              {/* Display Name: Edit mode shows inputs, View mode shows formatted name */}
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mb-2">
                  {renderField("First Name", "firstName", formData.firstName)}
                  {renderField("Last Name", "lastName", formData.lastName)}
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {/* Display full name if available, otherwise username, otherwise placeholder */}
                  {formData.firstName || formData.lastName
                    ? `${formData.firstName || ""} ${
                        formData.lastName || ""
                      }`.trim()
                    : formData.username || (
                        <span className="text-gray-400 italic">
                          User Name Not Set
                        </span>
                      )}
                </h2>
              )}
              {/* Role and Affiliation: Rendered using helper */}
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

            {/* Edit/Save Buttons (only show Edit when not editing) */}
            {!editing &&
              user && ( // Only show Edit if user data exists
                <button
                  onClick={() => {
                    console.log("Entering edit mode.");
                    setEditing(true);
                  }}
                  className="mt-4 sm:mt-0 sm:ml-auto flex-shrink-0 self-start sm:self-center items-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-150 ease-in-out"
                >
                  <FaEdit className="mr-2" /> Edit Profile
                </button>
              )}
          </div>

          {/* Profile Body Sections (remain largely the same, using renderField) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* About Me Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                About Me
              </h3>
              {renderField(
                "", // No label above the field itself when editing
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
              {/* Email might be non-editable depending on your app's logic */}
              {renderField(
                "Primary Email",
                "email",
                formData.email,
                "your.email@example.com",
                "email" // Set type="email" for validation
              )}
              {renderField(
                "Phone (Optional)",
                "phone",
                formData.contactInfo.phone,
                "e.g., +1 123 456 7890",
                "tel", // Set type="tel"
                true, // isNested = true
                "contactInfo" // section = contactInfo
              )}
            </div>

            {/* Social Links Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                Social & Professional Links
              </h3>
              {/* GitHub */}
              <div className={`flex items-center ${editing ? "mb-4" : "mb-2"}`}>
                {" "}
                {/* Adjust spacing for edit/view */}
                {!editing && formData.socialLinks.github && (
                  <FaGithub
                    className="text-gray-600 mr-2 flex-shrink-0"
                    size={20}
                  />
                )}
                {editing && (
                  <FaGithub
                    className="text-gray-600 mr-2 flex-shrink-0 mt-1"
                    size={20}
                  />
                )}{" "}
                {/* Add icon in edit mode too */}
                {renderField(
                  editing ? "GitHub URL" : "", // Label only in edit mode for clarity
                  "github",
                  formData.socialLinks.github,
                  "https://github.com/username",
                  "url", // Set type="url"
                  true,
                  "socialLinks"
                )}
              </div>
              {/* LinkedIn */}
              <div className={`flex items-center ${editing ? "mb-4" : "mb-2"}`}>
                {!editing && formData.socialLinks.linkedin && (
                  <FaLinkedin
                    className="text-blue-700 mr-2 flex-shrink-0"
                    size={20}
                  />
                )}
                {editing && (
                  <FaLinkedin
                    className="text-blue-700 mr-2 flex-shrink-0 mt-1"
                    size={20}
                  />
                )}
                {renderField(
                  editing ? "LinkedIn URL" : "",
                  "linkedin",
                  formData.socialLinks.linkedin,
                  "https://linkedin.com/in/username",
                  "url",
                  true,
                  "socialLinks"
                )}
              </div>
              {/* Twitter */}
              <div className={`flex items-center ${editing ? "mb-4" : "mb-2"}`}>
                {!editing && formData.socialLinks.twitter && (
                  <FaTwitter
                    className="text-blue-400 mr-2 flex-shrink-0"
                    size={20}
                  />
                )}
                {editing && (
                  <FaTwitter
                    className="text-blue-400 mr-2 flex-shrink-0 mt-1"
                    size={20}
                  />
                )}
                {renderField(
                  editing ? "Twitter URL" : "",
                  "twitter",
                  formData.socialLinks.twitter,
                  "https://twitter.com/username",
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
              {!editing && !formData.skills && (
                <p className="text-gray-400 italic mt-1">No skills listed.</p>
              )}
              {/* Consider using a tag input component here for better UX */}
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
              {!editing && !formData.researchInterests && (
                <p className="text-gray-400 italic mt-1">
                  No research interests listed.
                </p>
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
              {!editing && !formData.achievements && (
                <p className="text-gray-400 italic mt-1">
                  No achievements listed.
                </p>
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons (only show when editing) */}
          {editing && (
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button" // Explicitly type="button" to prevent form submission if wrapped in <form>
                onClick={handleCancel}
                disabled={isSaving}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button" // Explicitly type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : // Button text depends on whether we are creating or updating
                user ? ( // If 'user' exists, we are updating
                  <>
                    <FaSave className="mr-2" /> Save Changes
                  </>
                ) : (
                  // If 'user' is null, we are creating the profile initially
                  <>
                    <FaSave className="mr-2" /> Create Profile
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        {/* Optional: Add other sections below profile card, e.g., list of user's publications */}
        {/* <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">My Publications</h3>
          {/* Fetch and display publications here */}
        {/* </div> */}
      </main>
    </div>
  );
}
