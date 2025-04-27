// backend/routes/messagingRoutes.js
import express from "express";
import {
  getGroupedContacts,
  getChatHistory, // <<< Ensure both are imported
} from "../controllers/messagingController.js"; // Adjust path if needed
import { protect } from "../middleware/authMiddleware.js"; // Adjust path if needed

const router = express.Router();
router.use(protect); // Protect all routes in this file

// GET /api/messaging/grouped-contacts - For Messages.jsx contact list
router.get("/grouped-contacts", getGroupedContacts);

// GET /api/messaging/history/:otherUserId - For ChatPage.jsx history
router.get("/history/:otherUserId", getChatHistory); // <<< Ensure this route exists

export default router;
