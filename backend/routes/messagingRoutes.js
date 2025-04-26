// backend/routes/messagingRoutes.js
import express from "express";
import { getMessagingContacts } from "../controllers/messagingController.js"; // Adjust path
import { protect } from "../middleware/authMiddleware.js"; // Adjust path

const router = express.Router();

// Apply authentication to all messaging routes
router.use(protect);

// GET /api/messaging/contacts - Fetch users the current user can message
router.get("/contacts", getMessagingContacts);

// Add other routes later (e.g., fetch/send messages)

export default router;
