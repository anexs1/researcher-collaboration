import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Adjust path
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js"; // Adjust path

const router = express.Router();

router.use(protect); // Apply auth middleware to all routes below

router.get("/", getNotificationsForUser); // GET /api/notifications?limit=10&page=1&status=unread
router.get("/unread-count", getUnreadNotificationCount); // GET /api/notifications/unread-count
router.patch("/mark-read", markNotificationsAsRead); // PATCH /api/notifications/mark-read (body: { notificationIds: [1, 2] } or empty for all)
router.delete("/:notificationId", deleteNotification); // DELETE /api/notifications/123

export default router;
