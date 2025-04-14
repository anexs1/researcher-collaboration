// src/routes/adminSettingsRoutes.js
const express = require("express");
const router = express.Router();
const adminSettingsController = require("../controllers/adminSettingsController");
const { authenticate, authorize } = require("../middleware/auth");

// Admin settings routes
router.get(
  "/admin/settings",
  authenticate,
  authorize("admin"),
  adminSettingsController.getSettings
);

router.put(
  "/admin/settings",
  authenticate,
  authorize("admin"),
  adminSettingsController.updateSettings
);

module.exports = router;
