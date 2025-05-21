import React, { useState, useEffect, useCallback, useMemo } from "react";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Verify path
import LoadingSpinner from "../../Component/Common/LoadingSpinner"; // Kept for simulating load
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Kept for UI demo
import Notification from "../../Component/Common/Notification"; // Verify path
import { motion, AnimatePresence } from "framer-motion";
import { FaSave, FaUndo, FaCog, FaPalette, FaUsers, FaEnvelope, FaExclamationTriangle, FaRedo, FaEye, FaLock, FaServer } from "react-icons/fa";

// Define outside component so it's not recreated on every render
const INITIAL_DEFAULT_SETTINGS = Object.freeze({
  siteName: "My Research Platform",
  siteDescription: "A collaborative space for innovative research.",
  allowPublicSignup: true,
  maintenanceMode: false,
  defaultUserRole: "user",
  sessionTimeout: 30, // in minutes
  emailNotifications: true,
  adminEmail: "admin@example.com",
  itemsPerPage: 12,
  themeColor: "#4f46e5", // Indigo
  darkMode: "system", // system, light, dark
  logoUrl: "/img/default-logo.png", // Placeholder
  faviconUrl: "/img/default-favicon.ico", // Placeholder
  // New placeholders for advanced settings
  apiRateLimit: 100, // requests per minute
  storageQuotaPerUser: 500, // MB
  enableTwoFactorAuth: false,
  customCSS: "/* Custom CSS styles here */\nbody {\n  font-family: 'Inter', sans-serif;\n}",
});

const LOCAL_STORAGE_KEY = "adminPlatformSettings";

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    try {
      return savedSettings ? { ...INITIAL_DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : { ...INITIAL_DEFAULT_SETTINGS };
    } catch (e) {
      console.error("Failed to parse saved settings from localStorage", e);
      return { ...INITIAL_DEFAULT_SETTINGS };
    }
  });

  const [initialSettingsOnLoad, setInitialSettingsOnLoad] = useState({ ...settings }); // Settings as they were when "saved" or page loaded
  const [isLoading, setIsLoading] = useState(true); // Simulate initial load
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null); // For any UI-level errors
  const [notification, setNotification] = useState({ message: "", type: "", show: false });
  const [activeTab, setActiveTab] = useState("general");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const showNotification = useCallback((message, type = "info", duration = 3000) => {
    setNotification({ message, type, show: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, show: false })), duration);
  }, []);

  // Simulate fetching settings on mount
  useEffect(() => {
    setIsLoading(true);
    // In a real app, this would be an API call. Here, we just use localStorage or defaults.
    const loadedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (loadedSettings) {
      try {
        const parsed = JSON.parse(loadedSettings);
        setSettings(prev => ({ ...INITIAL_DEFAULT_SETTINGS, ...parsed })); // Merge with defaults to ensure all keys
        setInitialSettingsOnLoad(prev => ({ ...INITIAL_DEFAULT_SETTINGS, ...parsed }));
      } catch (e) {
        console.error("Error loading settings from localStorage:", e);
        setSettings({ ...INITIAL_DEFAULT_SETTINGS });
        setInitialSettingsOnLoad({ ...INITIAL_DEFAULT_SETTINGS });
      }
    } else {
      setSettings({ ...INITIAL_DEFAULT_SETTINGS });
      setInitialSettingsOnLoad({ ...INITIAL_DEFAULT_SETTINGS });
    }
    setTimeout(() => setIsLoading(false), 500); // Simulate load time
  }, []);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value, 10) || (name === 'sessionTimeout' ? 1 : 0) : value,
    }));
  };

  // Simulate saving settings (to localStorage)
  const handleSaveSettings = (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setError(null);
    console.log("Simulating save with settings:", settings);
    setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        setInitialSettingsOnLoad({ ...settings }); // Update the "saved" state
        showNotification("Settings 'saved' to local storage!", "success");
      } catch (saveError) {
        console.error("Error saving to localStorage:", saveError);
        setError("Could not save settings to local storage. Browser might be in private mode or storage full.");
        showNotification("Failed to 'save' settings locally.", "error");
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Simulate save time
  };

  const handleDiscardChanges = () => {
    setShowDiscardConfirm(true);
  };

  const confirmDiscard = () => {
    setSettings({ ...initialSettingsOnLoad });
    showNotification("Changes discarded.", "info");
    setShowDiscardConfirm(false);
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to their original defaults? This will also clear any locally 'saved' settings.")) {
      setSettings({ ...INITIAL_DEFAULT_SETTINGS });
      setInitialSettingsOnLoad({ ...INITIAL_DEFAULT_SETTINGS}); // Also reset the "saved" state to defaults
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      showNotification("All settings reset to application defaults.", "success");
    }
  };

  const hasChanges = useMemo(() => JSON.stringify(settings) !== JSON.stringify(initialSettingsOnLoad), [settings, initialSettingsOnLoad]);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary-theme-color", settings.themeColor);
    document.documentElement.setAttribute('data-theme-mode', settings.darkMode); // For body[data-theme-mode="dark"] {}
    // Example of how custom CSS could be applied (DANGEROUS IF USER INPUT ISN'T SANITIZED)
    // For demo, assume it's safe:
    const styleTagId = "custom-admin-styles";
    let styleTag = document.getElementById(styleTagId);
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleTagId;
        document.head.appendChild(styleTag);
    }
    // Basic attempt to prevent very harmful CSS; real sanitization is complex
    const sanitizedCSS = settings.customCSS.replace(/<\s*script\s*>/gi, ''); // VERY basic
    styleTag.textContent = sanitizedCSS;

  }, [settings.themeColor, settings.darkMode, settings.customCSS]);

  const breadcrumbs = [{ label: "Settings (Local Preview)", link: "/admin/settings" }];
  const tabs = [
    { id: "general", label: "General", icon: <FaCog /> },
    { id: "appearance", label: "Appearance", icon: <FaPalette /> },
    { id: "security", label: "Security", icon: <FaLock /> },
    { id: "users", label: "Users & Access", icon: <FaUsers /> },
    { id: "email", label: "Email & Notifications", icon: <FaEnvelope /> },
    { id: "advanced", label: "Advanced", icon: <FaServer /> },
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8"><AdminPageHeader title="System Settings (Local Preview)" breadcrumbs={breadcrumbs} /><LoadingSpinner message="Loading settings..." /></div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gray-100 min-h-screen">
      {/* Confirmation Dialog for Discard */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-300 text-center">
              <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Discard Changes?</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to discard all unsaved changes? This cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowDiscardConfirm(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
                <button onClick={confirmDiscard} className="px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600">Discard</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminPageHeader title="System Settings (Local Preview)" breadcrumbs={breadcrumbs}>
        {hasChanges && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="ml-3 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full animate-pulse">
            Changes pending
          </motion.span>
        )}
      </AdminPageHeader>

      {error && (<ErrorMessage message={error} onClose={() => setError(null)} isDismissible={true} /> )}

      <div className="relative h-12 mb-4">
        <AnimatePresence>
          {notification.show && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="absolute top-0 left-0 right-0 z-50">
              <Notification message={notification.message} type={notification.type} onClose={() => setNotification((prev) => ({ ...prev, show: false }))} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Preview Section (Simple Example) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><FaEye className="mr-2 text-[var(--primary-theme-color)]"/>Live Preview Snippet</h3>
        <div className="space-y-4">
            <p className="text-sm text-gray-600">Site Name: <span className="font-bold text-gray-900">{settings.siteName}</span></p>
            <p className="text-sm text-gray-600">Description: <em className="text-gray-700">{settings.siteDescription}</em></p>
            <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">Theme Color:</p>
                <div className="w-8 h-8 rounded-full border-2 border-gray-300" style={{ backgroundColor: settings.themeColor }}></div>
                <span className="text-sm font-mono">{settings.themeColor}</span>
            </div>
            <button type="button" className="px-4 py-2 text-sm font-medium rounded-md text-white" style={{ backgroundColor: settings.themeColor }}>
                Example Button
            </button>
        </div>
      </motion.div>


      <form onSubmit={handleSaveSettings} className="space-y-8">
        <div className="border-b border-gray-200 sticky top-0 bg-gray-100 py-2 z-10 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"> {/* Sticky tabs */}
          <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto pb-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap py-3 px-2 sm:px-3 md:px-4 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--primary-theme-color)] rounded-t-md ${
                  activeTab === tab.id
                    ? "border-[var(--primary-theme-color)] text-[var(--primary-theme-color)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                aria-current={activeTab === tab.id ? "page" : undefined}>
                <span className="w-5 h-5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl border border-gray-200 space-y-6 min-h-[350px]">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            <FaExclamationTriangle className="inline mr-2 mb-0.5" />
            Settings are 'saved' to your browser's local storage for this demo. They do not affect a live server.
          </div>

          {activeTab === "general" && (
            <motion.div key="general" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">General Settings</h3>
              {/* Site Name, Description, Maintenance Mode */}
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input type="text" id="siteName" name="siteName" value={settings.siteName} onChange={handleInputChange} className="admin-input max-w-lg"/>
              </div>
              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-1">Site Description (Meta Tag)</label>
                <textarea id="siteDescription" name="siteDescription" value={settings.siteDescription} onChange={handleInputChange} rows="3" className="admin-input max-w-lg"></textarea>
              </div>
              <div className="flex items-center">
                  <input type="checkbox" id="maintenanceMode" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleInputChange} className="admin-checkbox"/>
                  <label htmlFor="maintenanceMode" className="ml-2 text-sm text-gray-700">Enable Maintenance Mode</label>
              </div>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div key="appearance" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Appearance & Layout</h3>
              {/* Items Per Page, Theme Color, Dark Mode, Logo, Favicon */}
              <div>
                <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 mb-1">Items Per Page (Pagination)</label>
                <input type="number" id="itemsPerPage" name="itemsPerPage" min="1" max="100" value={settings.itemsPerPage} onChange={handleInputChange} className="admin-input w-28"/>
              </div>
              <div className="flex items-center gap-4">
                <label htmlFor="themeColor" className="text-sm font-medium text-gray-700">Primary Theme Color</label>
                <input type="color" id="themeColor" name="themeColor" value={settings.themeColor} onChange={handleInputChange} className="h-10 w-16 rounded-md border-gray-300 p-1"/>
              </div>
              <div>
                <label htmlFor="darkMode" className="block text-sm font-medium text-gray-700 mb-1">Dark Mode Preference</label>
                <select id="darkMode" name="darkMode" value={settings.darkMode} onChange={handleInputChange} className="admin-select max-w-xs">
                    <option value="system">System Preference</option>
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                </select>
              </div>
              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Header)</label>
                <input type="text" id="logoUrl" name="logoUrl" value={settings.logoUrl} onChange={handleInputChange} placeholder="e.g., /path/to/your/logo.png" className="admin-input max-w-lg"/>
                <p className="text-xs text-gray-500 mt-1">Enter a URL or path to your site logo. Clear to use default.</p>
              </div>
               <div>
                <label htmlFor="faviconUrl" className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
                <input type="text" id="faviconUrl" name="faviconUrl" value={settings.faviconUrl} onChange={handleInputChange} placeholder="e.g., /path/to/your/favicon.ico" className="admin-input max-w-lg"/>
              </div>
            </motion.div>
          )}
          
          {activeTab === "security" && (
            <motion.div key="security" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Security & Access</h3>
              {/* Session Timeout, 2FA */}
              <div>
                <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                <input type="number" id="sessionTimeout" name="sessionTimeout" min="5" max="240" value={settings.sessionTimeout} onChange={handleInputChange} className="admin-input w-28"/>
                 <p className="text-xs text-gray-500 mt-1">Time before inactive users are logged out (requires backend logic).</p>
              </div>
              <div className="flex items-center">
                  <input type="checkbox" id="enableTwoFactorAuth" name="enableTwoFactorAuth" checked={settings.enableTwoFactorAuth} onChange={handleInputChange} className="admin-checkbox"/>
                  <label htmlFor="enableTwoFactorAuth" className="ml-2 text-sm text-gray-700">Enable Two-Factor Authentication (2FA) Globally</label>
              </div>
               <p className="text-xs text-gray-500">Requires backend 2FA system integration.</p>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">User Registration & Roles</h3>
              {/* Allow Public Signup, Default User Role */}
              <div className="flex items-center">
                  <input type="checkbox" id="allowPublicSignup" name="allowPublicSignup" checked={settings.allowPublicSignup} onChange={handleInputChange} className="admin-checkbox"/>
                  <label htmlFor="allowPublicSignup" className="ml-2 text-sm text-gray-700">Allow Public User Registration</label>
              </div>
              <div>
                <label htmlFor="defaultUserRole" className="block text-sm font-medium text-gray-700 mb-1">Default Role for New Users</label>
                <select id="defaultUserRole" name="defaultUserRole" value={settings.defaultUserRole} onChange={handleInputChange} className="admin-select max-w-xs">
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  <option value="contributor">Contributor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </motion.div>
          )}

          {activeTab === "email" && (
            <motion.div key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Email & Notifications</h3>
              {/* Enable Email Notifications, Admin Email */}
              <div className="flex items-center">
                  <input type="checkbox" id="emailNotifications" name="emailNotifications" checked={settings.emailNotifications} onChange={handleInputChange} className="admin-checkbox"/>
                  <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">Enable System Email Notifications</label>
              </div>
              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">Administrator Email Address</label>
                <input type="email" id="adminEmail" name="adminEmail" value={settings.adminEmail} onChange={handleInputChange} className="admin-input max-w-lg"/>
                <p className="text-xs text-gray-500 mt-1">Used as the 'from' address for system emails (requires backend setup).</p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  Actual email sending requires backend configuration of an SMTP server or email service (e.g., SendGrid, Mailgun).
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "advanced" && (
            <motion.div key="advanced" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Advanced Configuration</h3>
              <div>
                <label htmlFor="apiRateLimit" className="block text-sm font-medium text-gray-700 mb-1">API Rate Limit (requests/minute)</label>
                <input type="number" id="apiRateLimit" name="apiRateLimit" min="10" max="1000" value={settings.apiRateLimit} onChange={handleInputChange} className="admin-input w-28"/>
                 <p className="text-xs text-gray-500 mt-1">Global rate limit for API access (requires backend rate-limiting middleware).</p>
              </div>
              <div>
                <label htmlFor="storageQuotaPerUser" className="block text-sm font-medium text-gray-700 mb-1">Storage Quota Per User (MB)</label>
                <input type="number" id="storageQuotaPerUser" name="storageQuotaPerUser" min="10" max="10240" value={settings.storageQuotaPerUser} onChange={handleInputChange} className="admin-input w-28"/>
                 <p className="text-xs text-gray-500 mt-1">Default cloud storage allocation for each user (requires backend integration).</p>
              </div>
               <div>
                <label htmlFor="customCSS" className="block text-sm font-medium text-gray-700 mb-1">Custom CSS Override</label>
                <textarea id="customCSS" name="customCSS" value={settings.customCSS} onChange={handleInputChange} rows="6" className="admin-input font-mono text-xs" placeholder="/* e.g., .my-custom-class { color: red; } */"></textarea>
                 <p className="text-xs text-gray-500 mt-1">Inject custom CSS styles globally. Use with extreme caution. Changes apply live.</p>
              </div>
            </motion.div>
          )}

        </div>

        <div className="pt-6 mt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleResetToDefaults}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <FaRedo className="mr-2 h-4 w-4" />
            Reset to Defaults
          </button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={!hasChanges || isSaving}
              className="w-full sm:w-auto order-2 sm:order-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-theme-color)] disabled:opacity-50"
            >
              <FaUndo className="mr-2 h-4 w-4" />
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="w-full sm:w-auto order-1 sm:order-2 inline-flex justify-center items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[var(--primary-theme-color)] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-theme-color)] disabled:opacity-50"
              style={{ backgroundColor: hasChanges && !isSaving ? settings.themeColor : undefined }}
            >
              {isSaving ? (<FaSpinner className="animate-spin mr-2 h-4 w-4" />) : (<FaSave className="mr-2 h-4 w-4" />)}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;