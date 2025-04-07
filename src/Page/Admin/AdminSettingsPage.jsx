import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Correct path
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import Notification from "../../Component/Common/Notification"; // Create or import this

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({}); // To track changes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get("/api/admin/settings", {
        // Verify endpoint
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedSettings = response.data.data || {};
      setSettings(fetchedSettings);
      setInitialSettings(fetchedSettings); // Store initial state
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const showNotification = (message, type = "success") => {
    // Default to success
    setNotification({ message, type, show: true });
    // Auto-hide after 4 seconds
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null); // Clear previous errors on save attempt
    setNotification((prev) => ({ ...prev, show: false })); // Hide previous notification

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required.");
      setSaving(false);
      return;
    }

    // Find changed settings (optional, depends on API)
    const changedSettings = {};
    for (const key in settings) {
      if (settings[key] !== initialSettings[key]) {
        changedSettings[key] = settings[key];
      }
    }
    if (Object.keys(changedSettings).length === 0) {
      showNotification("No changes to save.", "info");
      setSaving(false);
      return;
    }

    try {
      // *** Replace with your ACTUAL API endpoint ***
      // Send only changed settings if API supports partial updates, otherwise send all 'settings'
      const response = await axios.put("/api/admin/settings", changedSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInitialSettings(settings); // Update initial settings upon successful save
      showNotification("Settings saved successfully!", "success");
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to save settings.";
      setError(errMsg); // Keep error persistent until resolved or next save attempt
      showNotification(errMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  // Determine if form has changes
  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const breadcrumbs = [{ label: "Settings", link: "/admin/settings" }];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gray-50 min-h-screen">
      <AdminPageHeader title="System Settings" breadcrumbs={breadcrumbs} />

      {/* Persistent error display */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Floating Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : (
        <form onSubmit={handleSaveSettings}>
          <fieldset className="bg-white p-6 rounded-lg shadow space-y-6 divide-y divide-gray-200">
            <legend className="text-lg font-medium text-gray-900 mb-4">
              General
            </legend>

            {/* Site Name Setting */}
            <div className="pt-6">
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
                value={settings.siteName || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-500">
                The public name of the application.
              </p>
            </div>

            {/* Signup Setting */}
            <div className="pt-6">
              <label htmlFor="allowPublicSignup" className="flex items-center">
                <input
                  type="checkbox"
                  id="allowPublicSignup"
                  name="allowPublicSignup"
                  checked={settings.allowPublicSignup || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2 disabled:bg-gray-100"
                  disabled={saving}
                />
                <span className="text-sm font-medium text-gray-700">
                  Allow Public Signup
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Enable or disable new user registration.
              </p>
            </div>

            {/* Add more setting fields based on your backend, potentially grouped */}
            {/* Example: Email Settings Section
             <div className="pt-6">
                 <h3 className="text-md font-medium text-gray-800">Email Configuration</h3>
                  ... email setting fields ...
             </div>
             */}
          </fieldset>

          {/* Save Button Area */}
          <div className="pt-5 mt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !hasChanges} // Disable if saving or no changes
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettingsPage;
