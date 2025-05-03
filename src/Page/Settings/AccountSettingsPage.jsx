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
import Notification from "../../Component/Common/Notification"; // Assuming path is correct
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Assuming path is correct

// API Client Setup (or use imported apiClient)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken"); // Ensure this key matches your storage
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
      // API Call sends 'newEmail' and 'currentPassword'
      await apiClient.put("/api/users/me/email", {
        newEmail: emailData.newEmail,
        currentPassword: emailData.currentPasswordForEmail, // Ensure backend expects 'currentPassword' here
      });
      showNotification("Email updated successfully!", "success");
      setEmailData({ newEmail: "", currentPasswordForEmail: "" }); // Reset form
      // Optionally update currentUser context/state if email changes affect it
      // e.g., refetchUser(); or setCurrentUser({...currentUser, email: emailData.newEmail });
    } catch (err) {
      console.error("Email update error:", err);
      // Prefer backend error message if available
      const errMsg =
        err.response?.data?.message || err.message || "Failed to update email.";
      setEmailError(errMsg);
      showNotification(errMsg, "error"); // Show error notification
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
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError(
        "New password cannot be the same as the current password."
      );
      return;
    }

    setIsUpdatingPassword(true);
    try {
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
      showNotification(errMsg, "error"); // Show error notification
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Placeholder for delete account
  const handleDeleteAccount = () => {
    // !!! IMPLEMENT CONFIRMATION MODAL FIRST !!!
    const isConfirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    if (isConfirmed) {
      console.warn(
        "Account deletion confirmed, but API call not implemented yet."
      );
      showNotification(
        "Account deletion feature not yet fully implemented.",
        "warning"
      );
      // TODO: Make the API call:
      // try {
      //   setIsDeleting(true); // Add state for this if needed
      //   await apiClient.delete('/api/users/me'); // Assuming this is the endpoint
      //   showNotification('Account deleted successfully.', 'success');
      //   // Handle logout and redirect
      //   logoutFunction(); // Call your logout function
      //   navigate('/login'); // Redirect user
      // } catch (err) {
      //   console.error("Delete account error:", err);
      //   const errMsg = err.response?.data?.message || err.message || "Failed to delete account.";
      //   showNotification(errMsg, 'error');
      // } finally {
      //   setIsDeleting(false);
      // }
    } else {
      console.log("Account deletion cancelled.");
    }
  };

  // --- Common Input/Button Styling ---
  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100";
  const buttonClasses =
    "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const deleteButtonClasses =
    "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500";

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      {" "}
      {/* Added padding */}
      {/* Notification Area */}
      {notification.show && (
        <div className="mb-4">
          {" "}
          {/* Added margin below notification */}
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification({ ...notification, show: false })} // Correct close handler
          />
        </div>
      )}
      <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaUserCog className="mr-3 text-gray-500" /> Account Settings
          </h1>
        </div>

        {/* Content Sections */}
        <div className="p-6 md:p-8 space-y-8">
          {/* --- Change Email Section --- */}
          <section aria-labelledby="change-email-heading">
            <h2
              id="change-email-heading"
              className="text-lg font-medium text-gray-900 mb-1"
            >
              Change Email
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Update the email address associated with your account. Your
              current password is required for verification.
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
                  value={currentUser?.email || "Loading..."} // Display current user email
                  className={inputClasses} // Apply disabled style via className
                  disabled
                  readOnly
                  aria-label="Current Email Address (read-only)"
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
                  autoComplete="email"
                  className={inputClasses}
                  aria-describedby="email-error-message"
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
                  autoComplete="current-password"
                  className={inputClasses}
                  aria-describedby="email-error-message"
                />
              </div>
              {emailError && (
                <div id="email-error-message">
                  <ErrorMessage
                    message={emailError}
                    onClose={() => setEmailError("")}
                  />
                </div>
              )}
              <div className="flex justify-end pt-2">
                {" "}
                {/* Added padding top */}
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className={buttonClasses}
                >
                  {isUpdatingEmail ? (
                    <>
                      <FaSpinner
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaSave
                        className="-ml-1 mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Update Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <hr className="border-gray-200" />

          {/* --- Change Password Section --- */}
          <section aria-labelledby="change-password-heading">
            <h2
              id="change-password-heading"
              className="text-lg font-medium text-gray-900 mb-1"
            >
              Change Password
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose a strong new password. You'll need your current password to
              make this change.
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
                  autoComplete="current-password"
                  className={inputClasses}
                  aria-describedby="password-error-message"
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
                  autoComplete="new-password"
                  className={inputClasses}
                  aria-describedby="password-error-message"
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
                  autoComplete="new-password"
                  className={inputClasses}
                  aria-describedby="password-error-message"
                />
              </div>
              {passwordError && (
                <div id="password-error-message">
                  <ErrorMessage
                    message={passwordError}
                    onClose={() => setPasswordError("")}
                  />
                </div>
              )}
              <div className="flex justify-end pt-2">
                {" "}
                {/* Added padding top */}
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className={buttonClasses}
                >
                  {isUpdatingPassword ? (
                    <>
                      <FaSpinner
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaLock
                        className="-ml-1 mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <hr className="border-gray-200" />

          {/* --- Delete Account Section --- */}
          <section aria-labelledby="delete-account-heading">
            <h2
              id="delete-account-heading"
              className="text-lg font-medium text-red-700 mb-1"
            >
              Delete Account
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Permanently delete your account and all associated data. This
              action cannot be undone. Please be absolutely sure before
              proceeding.
            </p>
            <div className="flex justify-start">
              <button
                onClick={handleDeleteAccount}
                className={deleteButtonClasses}
                aria-label="Permanently delete my account"
              >
                <FaTrashAlt className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
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
