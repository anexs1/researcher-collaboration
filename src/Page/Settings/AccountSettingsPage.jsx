// src/Page/Settings/AccountSettingsPage.jsx
import React, { useState, useCallback } from "react";
import {
  FaUserCog,
  FaEnvelope,
  FaLock,
  FaTrashAlt,
  FaSave,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios"; // Or your configured apiClient

// Import shared components (adjust paths as needed)
import Notification from "../../Component/Common/Notification";
import ErrorMessage from "../../Component/Common/ErrorMessage";

// API Client Setup (or use imported apiClient)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AccountSettingsPage = ({ currentUser }) => {
  // --- State for Forms ---
  const [emailData, setEmailData] = useState({
    newEmail: "",
    currentPasswordForEmail: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Notification State
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  // --- Handlers ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification({ message: "", type: "", show: false }),
      5000
    );
  }, []);

  const handleEmailChange = (e) => {
    setEmailData({ ...emailData, [e.target.name]: e.target.value });
    setEmailError(""); // Clear error on change
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordError(""); // Clear error on change
  };

  // --- Form Submissions ---
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    if (!emailData.newEmail || !emailData.currentPasswordForEmail) {
      setEmailError("Please fill in both fields.");
      return;
    }
    // Basic email format validation (consider a more robust library)
    if (!/\S+@\S+\.\S+/.test(emailData.newEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      // *** ADJUST API ENDPOINT AS NEEDED ***
      // Backend needs to verify currentPasswordForEmail before updating email
      await apiClient.put("/api/users/me/email", {
        newEmail: emailData.newEmail,
        currentPassword: emailData.currentPasswordForEmail,
      });
      showNotification("Email updated successfully!", "success");
      setEmailData({ newEmail: "", currentPasswordForEmail: "" }); // Reset form
      // Optionally update currentUser context/state if email changes affect it
    } catch (err) {
      console.error("Email update error:", err);
      const errMsg =
        err.response?.data?.message || err.message || "Failed to update email.";
      setEmailError(errMsg);
      showNotification(errMsg, "error");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    // Add password strength validation if desired
    if (passwordData.newPassword.length < 6) {
      // Example minimum length
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // *** ADJUST API ENDPOINT AS NEEDED ***
      // Backend needs to verify currentPassword before setting newPassword
      await apiClient.put("/api/users/me/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showNotification("Password updated successfully!", "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }); // Reset form
    } catch (err) {
      console.error("Password update error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to update password.";
      setPasswordError(errMsg);
      showNotification(errMsg, "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Placeholder for delete account
  const handleDeleteAccount = () => {
    // Implement confirmation modal first!
    alert(
      "Account deletion functionality not yet implemented. Requires confirmation!"
    );
    // TODO: Show confirmation modal
    // TODO: If confirmed, call DELETE /api/users/me endpoint
    // TODO: Handle logout and redirect after successful deletion
  };

  // --- Common Input/Button Styling ---
  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const buttonClasses =
    "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const deleteButtonClasses =
    "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500";

  return (
    <div className="max-w-3xl mx-auto">
      {" "}
      {/* Limit width */}
      {/* Notification Area */}
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="bg-white shadow-xl rounded-lg border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaUserCog className="mr-3 text-gray-500" /> Account Settings
          </h1>
        </div>

        {/* Content Sections */}
        <div className="p-6 md:p-8 space-y-8">
          {/* --- Change Email Section --- */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              Change Email
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Update the email address associated with your account.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="current-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Email
                </label>
                <input
                  type="email"
                  id="current-email"
                  value={currentUser?.email || "Loading..."}
                  className={`${inputClasses} bg-gray-100`}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label
                  htmlFor="newEmail"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Email Address
                </label>
                <input
                  type="email"
                  id="newEmail"
                  name="newEmail"
                  value={emailData.newEmail}
                  onChange={handleEmailChange}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="currentPasswordForEmail"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Password (for verification)
                </label>
                <input
                  type="password"
                  id="currentPasswordForEmail"
                  name="currentPasswordForEmail"
                  value={emailData.currentPasswordForEmail}
                  onChange={handleEmailChange}
                  required
                  className={inputClasses}
                />
              </div>
              {emailError && (
                <ErrorMessage
                  message={emailError}
                  onClose={() => setEmailError("")}
                />
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className={buttonClasses}
                >
                  {isUpdatingEmail && (
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  )}
                  Update Email
                </button>
              </div>
            </form>
          </section>

          <hr className="border-gray-200" />

          {/* --- Change Password Section --- */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              Change Password
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose a strong new password.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className={inputClasses}
                />
              </div>
              {passwordError && (
                <ErrorMessage
                  message={passwordError}
                  onClose={() => setPasswordError("")}
                />
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className={buttonClasses}
                >
                  {isUpdatingPassword && (
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </section>

          <hr className="border-gray-200" />

          {/* --- Delete Account Section --- */}
          <section>
            <h2 className="text-lg font-medium text-red-700 mb-1">
              Delete Account
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <div className="flex justify-start">
              <button
                onClick={handleDeleteAccount}
                className={deleteButtonClasses}
              >
                <FaTrashAlt className="-ml-1 mr-2 h-4 w-4" />
                Delete My Account
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
