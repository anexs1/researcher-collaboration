import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import Notification from "../../Component/Common/Notification";
import useConfirm from "../../hooks/useConfirm";

const AdminSettingsPage = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const [state, setState] = useState({
    settings: {
      siteName: "",
      allowPublicSignup: false,
      maintenanceMode: false,
      defaultUserRole: "user",
      emailNotifications: true,
      itemsPerPage: 10,
      themeColor: "#3b82f6",
    },
    initialSettings: {},
    loading: true,
    saving: false,
    error: null,
    notification: { message: "", type: "", show: false },
    activeTab: "general",
  });

  const { confirm, ConfirmDialog } = useConfirm();

  const apiCall = async (method, endpoint, data = null) => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Authentication required");

    try {
      const response = await axios({
        method,
        url: `${API_URL}${endpoint}`,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (err) {
      console.error(`API Error [${method} ${endpoint}]:`, {
        message: err.message,
        response: err.response?.data,
        config: err.config,
      });
      throw err;
    }
  };

  const fetchSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiCall("get", "/admin/settings");
      setState((prev) => ({
        ...prev,
        settings: data,
        initialSettings: JSON.parse(JSON.stringify(data)),
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.response?.data?.message || "Failed to load settings",
        loading: false,
      }));
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showNotification = (message, type = "success") => {
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    try {
      const shouldProceed = await confirm(
        "Save Settings",
        "Are you sure you want to save these changes?"
      );
      if (!shouldProceed) return;

      setState((prev) => ({ ...prev, saving: true, error: null }));

      const changedSettings = Object.keys(state.settings).reduce((acc, key) => {
        if (
          JSON.stringify(state.settings[key]) !==
          JSON.stringify(state.initialSettings[key])
        ) {
          acc[key] = state.settings[key];
        }
        return acc;
      }, {});

      if (Object.keys(changedSettings).length === 0) {
        showNotification("No changes to save", "info");
        return;
      }

      await apiCall("put", "/admin/settings", changedSettings);

      setState((prev) => ({
        ...prev,
        initialSettings: JSON.parse(JSON.stringify(prev.settings)),
        saving: false,
      }));
      showNotification("Settings saved successfully!");

      if (changedSettings.themeColor) {
        document.documentElement.style.setProperty(
          "--primary-color",
          changedSettings.themeColor
        );
      }
    } catch (err) {
      setState((prev) => ({ ...prev, saving: false }));
      showNotification(
        err.response?.data?.message || "Failed to save settings",
        "error"
      );
    }
  };

  const hasChanges =
    JSON.stringify(state.settings) !== JSON.stringify(state.initialSettings);
  const breadcrumbs = [{ label: "Settings", link: "/admin/settings" }];
  const tabs = [
    { id: "general", label: "General" },
    { id: "appearance", label: "Appearance" },
    { id: "users", label: "User Management" },
    { id: "email", label: "Email Settings" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gray-50 min-h-screen">
      <ConfirmDialog />
      <AdminPageHeader title="System Settings" breadcrumbs={breadcrumbs} />

      {state.error && (
        <ErrorMessage
          message={state.error}
          onClose={() => setState((prev) => ({ ...prev, error: null }))}
        />
      )}

      <Notification
        message={state.notification.message}
        type={state.notification.type}
        show={state.notification.show}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            notification: { ...prev.notification, show: false },
          }))
        }
      />

      {state.loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : (
        <form onSubmit={handleSaveSettings}>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setState((prev) => ({ ...prev, activeTab: tab.id }))
                  }
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    state.activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            {state.activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="siteName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Site Name
                  </label>
                  <input
                    type="text"
                    id="siteName"
                    name="siteName"
                    value={state.settings.siteName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={state.saving}
                  />
                </div>
                {/* Add more fields as needed */}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-5 mt-6 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  settings: JSON.parse(JSON.stringify(prev.initialSettings)),
                }))
              }
              disabled={state.saving || !hasChanges}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={state.saving || !hasChanges}
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettingsPage;
