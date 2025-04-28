// backend/routes/messagingRoutes.js
import express from "express";
import {
  getProjectChatList, // Renamed controller for getting available project chats
  getProjectChatHistory, // Renamed controller for getting history of a specific project chat
} from "../controllers/messagingController.js";
import { protect } from "../middleware/authMiddleware.js"; // Assuming correct path

const router = express.Router();

// Apply authentication middleware to all messaging routes
router.use(protect);

// GET /api/messaging/projects
// Returns a list of projects the current user is a member of (for the chat list)
router.get("/projects", getProjectChatList);

// GET /api/messaging/history/project/:projectId
// Returns the message history for a specific project chat
// Authorization (user must be member/owner) handled in controller
router.get("/history/project/:projectId", getProjectChatHistory);

// Note: Sending messages is typically handled via WebSockets, not a REST POST route.
// If you have a REST endpoint for sending, it would go here, but websockets are preferred.

export default router;
