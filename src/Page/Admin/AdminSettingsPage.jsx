
import React, { useState, useEffect, useCallback } from "react";


import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Verify path
import LoadingSpinner from "../../Component/Common/LoadingSpinner"; 
import ErrorMessage from "../../Component/Common/ErrorMessage"; 
import Notification from "../../Component/Common/Notification"; 
import { motion, AnimatePresence } from "framer-motion"; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminSettingsPage = () => {
  // Default settings structure - these are now the *only* source
  const defaultSettingsState = {
    siteName: "Research Platform (Local)", // Indicate locality
    allowPublicSignup: true,
    maintenanceMode: false,
    defaultUserRole: "user",
    emailNotifications: true,
    itemsPerPage: 10,
    themeColor: "#3b82f6", // Default blue
  };

  // --- State ---
  // Settings state now initialized directly with defaults
  const [settings, setSettings] = useState({ ...defaultSettingsState });
  // Removed initialSettings, loading, saving states
  const [error, setError] = useState(null); // Kept for potential future non-API errors
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [activeTab, setActiveTab] = useState("general");

  // --- Functions ---

  // Notification helper (can still be used for UI feedback if needed)
  const showNotification = (message, type = "info") => {
    // Default type info
    setState((prev) => ({
      ...prev,
      notification: { message, type, show: true },
    }));
    setTimeout(
      () =>
        setState((prev) => ({
          ...prev,
          notification: { ...prev.notification, show: false },
        })),
      4000
    );
  };

  // Handle input changes - updates local state only
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prevSettings) => ({
      // Use functional update for settings
      ...prevSettings,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value, 10) || 0
          : value,
    }));
  };

  // --- Removed fetchSettings and handleSaveSettings ---

  // Apply theme color changes directly via useEffect when state changes
  useEffect(() => {
    console.log("Applying theme color:", settings.themeColor);
    document.documentElement.style.setProperty(
      "--primary-color",
      settings.themeColor
    );
    // Define --primary-color in your CSS: e.g., button { background-color: var(--primary-color); }
  }, [settings.themeColor]);

  // Structure for tabs
  const breadcrumbs = [
    { label: "Settings (Local Preview)", link: "/admin/settings" },
  ]; // Indicate local
  const tabs = [
    { id: "general", label: "General" },
    { id: "appearance", label: "Appearance" },
    { id: "users", label: "User Management" },
    { id: "email", label: "Email Settings" },
  ];

  // --- Render ---
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gray-50 min-h-screen">
      {/* Confirmation Dialog removed as save is removed */}
      <AdminPageHeader
        title="System Settings (Local Preview)"
        breadcrumbs={breadcrumbs}
      />

      {/* Display local errors if any logic introduces them */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Notification display remains useful */}
      <div className="relative h-10 mb-4">
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 z-40"
            >
              <Notification
                message={notification.message}
                type={notification.type}
                show={notification.show}
                onClose={() =>
                  setNotification((prev) => ({ ...prev, show: false }))
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Removed Loading state display */}

      {/* Use a simple div instead of form if no submission */}
      <div className="space-y-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button" // No longer submitting a form
                onClick={() => setActiveTab(tab.id)} // Just change local state
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600 focus:outline-none"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content Panels */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-6 min-h-[300px]">
          <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded border border-orange-200">
            Note: Settings changed here are for **local preview only** and will
            **not be saved** permanently.
          </p>

          {/* General Settings Tab */}
          {activeTab === "general" && (
            <motion.div
              key="general"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                General Settings
              </h3>
              <div>
                <label
                  htmlFor="siteName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Site Name
                </label>
                <input
                  type="text"
                  id="siteName"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full max-w-xl rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Displayed in the browser tab and emails.
                </p>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 block text-sm text-gray-900">
                    Enable Maintenance Mode
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Puts the site offline for non-admins.
                </p>
              </div>
            </motion.div>
          )}

          {/* Appearance Settings Tab */}
          {activeTab === "appearance" && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Appearance
              </h3>
              <div>
                <label
                  htmlFor="itemsPerPage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Items Per Page
                </label>
                <input
                  type="number"
                  id="itemsPerPage"
                  name="itemsPerPage"
                  min="1"
                  max="100"
                  value={settings.itemsPerPage}
                  onChange={handleInputChange}
                  className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Default number of items in lists.
                </p>
              </div>
              <div>
                <label
                  htmlFor="themeColor"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Primary Theme Color
                </label>
                <input
                  type="color"
                  id="themeColor"
                  name="themeColor"
                  value={settings.themeColor}
                  onChange={handleInputChange}
                  className="mt-1 block h-10 w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Main accent color (applied locally).
                </p>
              </div>
            </motion.div>
          )}

          {/* User Management Settings Tab */}
          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                User Management
              </h3>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowPublicSignup"
                    name="allowPublicSignup"
                    checked={settings.allowPublicSignup}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 block text-sm text-gray-900">
                    Allow Public Signups
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Allow users to register accounts.
                </p>
              </div>
              <div>
                <label
                  htmlFor="defaultUserRole"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Default Role for New Users
                </label>
                <select
                  id="defaultUserRole"
                  name="defaultUserRole"
                  value={settings.defaultUserRole}
                  onChange={handleInputChange}
                  className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="user">User</option>
                  <option value="medical">Medical</option>
                  <option value="academic">Academic</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Role assigned upon registration.
                </p>
              </div>
            </motion.div>
          )}

          {/* Email Settings Tab */}
          {activeTab === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Email Notifications
              </h3>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 block text-sm text-gray-900">
                    Enable Email Notifications
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Simulate email preference (no actual emails sent).
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Buttons Removed */}
        {/*
        <div className="pt-5 mt-6 border-t border-gray-200 flex justify-end gap-3">
           <button type="button" onClick={handleDiscardChanges} disabled={!hasChanges} ... > Discard </button>
           <button type="submit" disabled={!hasChanges} ... > Save Changes </button>
        </div>
        */}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
