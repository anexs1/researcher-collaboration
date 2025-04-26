// backend/routes/messagingRoutes.js
import express from "express";
// Import ONLY the controller function(s) you are actually exporting and using
import { getGroupedContacts } from "../controllers/messagingController.js"; // Adjust path if needed
import { protect } from "../middleware/authMiddleware.js"; // Adjust path if needed

const router = express.Router();

// Apply authentication middleware to all routes defined in this file
router.use(protect);

// --- Define Routes ---

// GET /api/messaging/grouped-contacts - Fetches contacts grouped by project
router.get("/grouped-contacts", getGroupedContacts);

// --- Add routes for other messaging actions later ---
// Example:
// GET /api/messaging/history/:userId
// POST /api/messaging/send/:userId

export default router;
