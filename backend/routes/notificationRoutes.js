// backend/routes/notificationRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Assuming you have this auth middleware
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// Apply protect middleware to all notification routes
router.use(protect);

// Define routes
router.get("/", getNotificationsForUser);
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/mark-read", markNotificationsAsRead); // Use PATCH for updating status
router.delete("/:notificationId", deleteNotification);

export default router;
