// src/Page/Admin/AdminSettingsPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminPageHeader from "../../Component/Common/ConfirmationModal";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import Notification from "../../Component/Common/SearchBar";

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Token not found.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get("/api/admin/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSettings(response.data.data || {}); // Adjust based on API response
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const showNotification = (message, type = "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 4000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotification({ message: "", type: "" });
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token not found.");
      setSaving(false);
      return;
    }

    try {
      // *** Replace with your ACTUAL API endpoint ***
      await axios.put("/api/admin/settings", settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Settings saved successfully!", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings.");
      showNotification(
        err.response?.data?.message || "Failed to save settings.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <AdminPageHeader title="System Settings" />

      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
      )}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      <form
        onSubmit={handleSaveSettings}
        className="bg-white p-6 rounded-lg shadow space-y-4"
      >
        {/* Example Setting Field */}
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
            name="siteName" // Should match the key in the settings object from API
            value={settings.siteName || ""}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={saving}
          />
        </div>

        <div>
          <label
            htmlFor="allowPublicSignup"
            className="flex items-center text-sm font-medium text-gray-700"
          >
            <input
              type="checkbox"
              id="allowPublicSignup"
              name="allowPublicSignup" // Should match the key in the settings object
              checked={settings.allowPublicSignup || false}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
              disabled={saving}
            />
            Allow Public User Signup
          </label>
        </div>

        {/* Add more setting fields based on your backend */}

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              saving
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            }`}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
