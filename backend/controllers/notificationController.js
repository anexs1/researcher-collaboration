// backend/controllers/notificationController.js

import asyncHandler from "express-async-handler";
import db from "../models/index.js";
import { Op } from "sequelize";

const { Notification } = db; // Ensure Notification model is loaded via models/index.js

/**
 * @desc    Get notifications for the logged-in user (paginated)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotificationsForUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;

  console.log(
    `[getNotificationsForUser] Fetching for User ${userId}, Page: ${page}, Limit: ${limit}, Status: ${
      status || "all"
    }`
  );

  const offset = (page - 1) * limit;
  const whereClause = { userId: userId };
  if (status === "read") {
    whereClause.readStatus = true; // Keep using boolean true for read status filter
  } else if (status === "unread") {
    whereClause.readStatus = false; // Keep using boolean false for unread status filter
  }
  console.log(
    `[getNotificationsForUser] Executing Notification.findAndCountAll with WHERE:`,
    whereClause
  );

  try {
    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      // If you added extra columns like title/referenceId to the DB and want them:
      // attributes: { include: ['id', 'userId', 'type', 'message', 'data', 'readStatus', 'createdAt', 'updatedAt', 'title', 'referenceId'] } // Explicitly list fields including extras if needed
    });

    const totalPages = Math.ceil(count / limit);
    console.log(
      `[getNotificationsForUser] Found ${rows.length} notifications (Total matching: ${count}) for User ${userId}.`
    );

    res.status(200).json({
      items: rows,
      currentPage: page,
      totalPages: totalPages,
      totalItems: count,
      success: true,
    });
  } catch (error) {
    console.error(
      `[getNotificationsForUser] Error fetching notifications for User ${userId}:`,
      error
    );
    res.status(500).json({
      message: "Server error fetching notifications.",
      success: false,
    });
  }
});

/**
 * @desc    Get the count of unread notifications for the logged-in user
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log(
    `[getUnreadNotificationCount] Fetching unread count for User ${userId}.`
  );

  try {
    // --- MODIFICATION FOR TESTING: Explicitly use 0 instead of false ---
    const whereCondition = {
      userId: userId,
      readStatus: 0, // <<< USING 0 FOR TESTING (MySQL often treats TINYINT(1) 0 as false)
    };
    // --- END MODIFICATION ---
    console.log(
      `[getUnreadNotificationCount] Executing Notification.count with WHERE:`,
      whereCondition
    ); // Log the query condition

    const count = await Notification.count({
      where: whereCondition,
    });

    // Log the result from Sequelize
    console.log(
      `[getUnreadNotificationCount] Sequelize COUNT result for User ${userId} (where readStatus=0): ${count}`
    ); // Adjusted log message

    // Send the response in the expected format
    res.status(200).json({ count: count, success: true });
  } catch (error) {
    console.error(
      `[getUnreadNotificationCount] Error fetching unread count for User ${userId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Server error fetching unread count.", success: false });
  }
});

/**
 * @desc    Mark notifications as read for the logged-in user
 * @route   PATCH /api/notifications/mark-read
 * @access  Private
 */
export const markNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { notificationIds } = req.body;

  console.log(
    `[markNotificationsAsRead] Request received for User ${userId}. Specific IDs:`,
    notificationIds || "All Unread"
  );

  const whereClause = {
    userId: userId,
    readStatus: false, // Keep using boolean false here for targeting which ones to update
  };

  if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    const validIds = notificationIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
    if (validIds.length > 0) {
      whereClause.id = { [Op.in]: validIds };
      console.log(
        `[markNotificationsAsRead] Targeting specific IDs for User ${userId}:`,
        validIds
      );
    } else {
      console.warn(
        `[markNotificationsAsRead] User ${userId} provided invalid IDs:`,
        notificationIds
      );
      return res.status(400).json({
        message: "No valid notification IDs provided.",
        success: false,
      });
    }
  } else {
    console.log(
      `[markNotificationsAsRead] Targeting all unread notifications for User ${userId}.`
    );
  }

  try {
    if (whereClause.id || !notificationIds) {
      console.log(
        `[markNotificationsAsRead] Executing Notification.update with WHERE:`,
        whereClause,
        ` SET readStatus = true`
      ); // Log update condition
      const [affectedCount] = await Notification.update(
        { readStatus: true }, // Set readStatus to boolean true (Sequelize handles conversion)
        { where: whereClause, returning: false }
      );

      console.log(
        `[markNotificationsAsRead] Marked ${affectedCount} notifications as read for User ${userId}.`
      );
      res.status(200).json({
        success: true,
        message: `Successfully marked ${affectedCount} notifications as read.`,
        count: affectedCount,
      });
    } else {
      console.log(
        `[markNotificationsAsRead] No valid specific IDs provided, no update executed for User ${userId}.`
      );
      res.status(200).json({
        success: true,
        message: "No specific valid notifications provided to mark as read.",
        count: 0,
      });
    }
  } catch (error) {
    console.error(
      `[markNotificationsAsRead] Error marking notifications read for User ${userId}:`,
      error
    );
    res.status(500).json({
      message: "Server error marking notifications as read.",
      success: false,
    });
  }
});

/**
 * @desc    Delete a specific notification for the logged-in user
 * @route   DELETE /api/notifications/:notificationId
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationId = parseInt(req.params.notificationId);

  console.log(
    `[deleteNotification] Request received for User ${userId} to delete Notification ID: ${req.params.notificationId}`
  );

  if (isNaN(notificationId)) {
    console.warn(
      `[deleteNotification] Invalid Notification ID format for User ${userId}: ${req.params.notificationId}`
    );
    return res
      .status(400)
      .json({ message: "Invalid notification ID.", success: false });
  }

  try {
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      console.warn(
        `[deleteNotification] Notification ID ${notificationId} not found for User ${userId}.`
      );
      return res
        .status(404)
        .json({ message: "Notification not found.", success: false });
    }
    if (notification.userId !== userId) {
      console.warn(
        `[deleteNotification] Forbidden attempt by User ${userId} to delete Notification ${notificationId} owned by User ${notification.userId}.`
      );
      return res.status(403).json({
        message: "Forbidden: Cannot delete this notification.",
        success: false,
      });
    }

    await notification.destroy();
    console.log(
      `[deleteNotification] Notification ${notificationId} deleted successfully by User ${userId}.`
    );
    res.status(200).json({ success: true, message: "Notification deleted." });
  } catch (error) {
    console.error(
      `[deleteNotification] Error deleting notification ${notificationId} for User ${userId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Server error deleting notification.", success: false });
  }
});
