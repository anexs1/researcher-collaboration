// backend/routes/adminMessageRoutes.js
import express from "express";
import {
  adminGetProjectMessages,
  adminDeleteMessage,
} from "../controllers/adminMessagingController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // CORRECTED IMPORT

const router = express.Router();

// GET messages for a specific project (admin view)
router.get(
  "/project/:projectId",
  protect,
  adminOnly, // USE THE CORRECT FUNCTION NAME HERE
  adminGetProjectMessages
);

// DELETE a specific message (admin action)
router.delete(
  "/:messageId",
  protect,
  adminOnly, // AND HERE
  adminDeleteMessage
);

export default router;
