// src/controllers/adminSettingsController.js
const fs = require("fs");
const path = require("path");

// Path to store settings (you might want to use a database in production)
const SETTINGS_PATH = path.join(__dirname, "../data/settings.json");

// Initialize default settings
const DEFAULT_SETTINGS = {
  siteName: "My App",
  allowPublicSignup: false,
  maintenanceMode: false,
  defaultUserRole: "user",
  emailNotifications: true,
  itemsPerPage: 10,
  themeColor: "#3b82f6",
};

// Ensure settings file exists
const ensureSettingsFile = () => {
  if (!fs.existsSync(SETTINGS_PATH)) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
};

// Get current settings
exports.getSettings = async (req, res) => {
  try {
    ensureSettingsFile();
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH));
    res.json(settings);
  } catch (err) {
    console.error("Error getting settings:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    ensureSettingsFile();
    const currentSettings = JSON.parse(fs.readFileSync(SETTINGS_PATH));
    const updatedSettings = { ...currentSettings, ...req.body };

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updatedSettings, null, 2));
    res.json(updatedSettings);
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
};
