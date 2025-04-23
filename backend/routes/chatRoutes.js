import express from "express";
import {
  getMessages,
  sendMessage,
  createChatRoom,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   GET /api/chat/:projectId/messages
// @desc    Get all messages for a project
router.get("/:projectId/messages", protect, getMessages);

// @route   POST /api/chat/:projectId/messages
// @desc    Send a message in a project chat
router.post("/:projectId/messages", protect, sendMessage);

// @route   POST /api/chat/:projectId/init
// @desc    Create a chat room (for project owner only)
router.post("/:projectId/init", protect, createChatRoom);

export default router;
