// backend/routes/messagingRoutes.js
import express from "express";
import {
  getProjectChatList, // Renamed controller for getting available project chats
  getProjectChatHistory, // Renamed controller for getting history of a specific project chat
  uploadProjectFile, // <<< IMPORT the file upload controller
} from "../controllers/messagingController.js"; // Adjust path if needed
import { protect } from "../middleware/authMiddleware.js"; // Assuming correct path
import {
  handleProjectFileUpload, // <<< IMPORT the Multer file handling middleware
  handleMulterError, // <<< IMPORT the Multer error handling middleware
} from "../middleware/uploadMiddleware.js"; // Adjust path if needed

const router = express.Router();

// Apply authentication middleware to all messaging routes as they require a logged-in user
router.use(protect); // Ensures req.user is available for all handlers below

// --- Get List of Project Chats ---
// GET /api/messaging/projects
// Returns a list of projects the current user is a member/owner of
router.get("/projects", getProjectChatList);

// --- Get Message History for a Project ---
// GET /api/messaging/history/project/:projectId
// Returns the message history for a specific project chat
// Authorization (user must be member/owner) is handled within the controller
router.get("/history/project/:projectId", getProjectChatHistory);

// --- ** NEW: Handle File Upload for a Project Chat ** ---
// POST /api/messaging/upload/project/:projectId
// Accepts multipart/form-data with a field named 'file'
router.post(
  "/upload/project/:projectId", // Route path
  handleProjectFileUpload, // 1. Multer middleware attempts to process the 'file' field
  handleMulterError, // 2. Custom middleware handles specific Multer errors (size, type etc.)
  uploadProjectFile // 3. If file is processed ok by Multer, this controller handles logic (auth, response)
);

// Note: Sending the actual message (text or file details) happens via WebSockets after upload success.

export default router;
