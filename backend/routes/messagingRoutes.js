// backend/routes/messagingRoutes.js
import express from "express";
import {
  getGroupedContacts,
  getChatHistory, // <<< Make sure both are imported
} from "../controllers/messagingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// GET /api/messaging/grouped-contacts
router.get("/grouped-contacts", getGroupedContacts);

// GET /api/messaging/history/:otherUserId
router.get("/history/:otherUserId", getChatHistory); // <<< Route added

export default router;
