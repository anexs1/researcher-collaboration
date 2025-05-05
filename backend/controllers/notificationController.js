// backend/controllers/notificationController.js
import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";

const { Notification } = db; // Make sure Notification model is loaded in models/index.js

/**
 * @desc    Get notifications for the logged-in user (paginated)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotificationsForUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Adjust limit as needed
  const status = req.query.status; // Optional filter: 'read' or 'unread'

  const offset = (page - 1) * limit;

  const whereClause = { userId: userId };
  if (status === "read") {
    whereClause.readStatus = true;
  } else if (status === "unread") {
    whereClause.readStatus = false;
  }
  // If no status query param, fetch all

  try {
    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]], // Show newest first
      // You might want to include associated data if needed, e.g.,
      // include: [{ model: models.User, as: 'sender', attributes: ['id', 'username'] }]
      // (Requires defining senderId and association in Notification model)
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      items: rows,
      currentPage: page,
      totalPages: totalPages,
      totalItems: count,
    });
  } catch (error) {
    console.error(`Error fetching notifications for User ${userId}:`, error);
    res.status(500).json({ message: "Server error fetching notifications." });
  }
});

/**
 * @desc    Get the count of unread notifications for the logged-in user
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const count = await Notification.count({
      where: {
        userId: userId,
        readStatus: false,
      },
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error(`Error fetching unread count for User ${userId}:`, error);
    res.status(500).json({ message: "Server error fetching unread count." });
  }
});

/**
 * @desc    Mark notifications as read for the logged-in user
 * @route   PATCH /api/notifications/mark-read
 * @access  Private
 */
export const markNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  // Expect an array of IDs, or nothing (to mark all unread)
  const { notificationIds } = req.body;

  const whereClause = {
    userId: userId,
    readStatus: false, // Only mark unread ones as read
  };

  // If specific IDs are provided, only mark those
  if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    // Ensure IDs are integers
    const validIds = notificationIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
    if (validIds.length > 0) {
      whereClause.id = { [Op.in]: validIds };
    } else {
      // No valid IDs provided in the array
      return res
        .status(400)
        .json({ message: "No valid notification IDs provided." });
    }
  }
  // If no notificationIds array, the whereClause marks ALL unread for the user

  try {
    const [affectedCount] = await Notification.update(
      { readStatus: true },
      { where: whereClause }
    );

    console.log(
      `Marked ${affectedCount} notifications as read for User ${userId}.`
    );
    res.status(200).json({
      success: true,
      message: `Successfully marked ${affectedCount} notifications as read.`,
      count: affectedCount,
    });
  } catch (error) {
    console.error(
      `Error marking notifications read for User ${userId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Server error marking notifications as read." });
  }
});

/**
 * @desc    Delete a specific notification for the logged-in user
 * @route   DELETE /api/notifications/:notificationId
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationId = parseInt(req.params.notificationId, 10);

  if (isNaN(notificationId)) {
    return res.status(400).json({ message: "Invalid notification ID." });
  }

  try {
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    // Authorization check: Ensure the user owns this notification
    if (notification.userId !== userId) {
      console.warn(
        `User ${userId} attempted to delete notification ${notificationId} owned by User ${notification.userId}`
      );
      return res
        .status(403)
        .json({ message: "Forbidden: Cannot delete this notification." });
    }

    await notification.destroy();

    console.log(`User ${userId} deleted notification ${notificationId}.`);
    res
      .status(200)
      .json({ success: true, message: "Notification deleted successfully." });
  } catch (error) {
    console.error(
      `Error deleting notification ${notificationId} for User ${userId}:`,
      error
    );
    res.status(500).json({ message: "Server error deleting notification." });
  }
});
