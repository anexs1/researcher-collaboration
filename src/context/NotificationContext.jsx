// src/context/NotificationContext.jsx

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import axios from "axios";

// Use environment variable for API URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // Ensure this matches backend port

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthToken = () => localStorage.getItem("authToken");

  // Fetch initial unread count AND latest notifications
  const fetchInitialNotifications = useCallback(async () => {
    // +++ LOGGING +++
    console.log("[NotificationContext] fetchInitialNotifications CALLED.");
    const token = getAuthToken();
    if (!token) {
      console.log(
        "[NotificationContext] fetchInitialNotifications: No token found, resetting state."
      );
      setUnreadCount(0);
      setNotifications([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    if (isLoading) {
      console.log(
        "[NotificationContext] fetchInitialNotifications: Fetch already in progress, skipping."
      );
      return;
    }

    console.log(
      "[NotificationContext] fetchInitialNotifications: Starting fetch..."
    );
    setIsLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const countUrl = `${API_BASE_URL}/api/notifications/unread-count`;
      const listUrl = `${API_BASE_URL}/api/notifications?limit=20`;

      console.log(
        `[NotificationContext] fetchInitialNotifications: Fetching count from ${countUrl}`
      );
      console.log(
        `[NotificationContext] fetchInitialNotifications: Fetching list from ${listUrl}`
      );

      // Use Promise.allSettled to see results even if one fails
      const [countResult, listResult] = await Promise.allSettled([
        axios.get(countUrl, { headers }),
        axios.get(listUrl, { headers }),
      ]);

      // --- Process Count Response ---
      let fetchedCount = 0;
      if (countResult.status === "fulfilled") {
        console.log(
          "[NotificationContext] fetchInitialNotifications: Count Request fulfilled. Status:",
          countResult.value.status,
          "Data:",
          countResult.value.data
        );
        // Check if data and data.count exist before accessing
        if (
          countResult.value.data &&
          typeof countResult.value.data.count === "number"
        ) {
          fetchedCount = countResult.value.data.count;
          console.log(
            `[NotificationContext] fetchInitialNotifications: Successfully extracted count: ${fetchedCount}`
          );
        } else {
          console.warn(
            "[NotificationContext] fetchInitialNotifications: Count Response data missing 'count' property or is not a number. Received:",
            countResult.value.data
          );
          // If structure is wrong, maybe set an error? Or just keep count 0.
          setError((prev) => prev || "Invalid count data received."); // Set specific error
        }
      } else {
        // +++ IMPORTANT LOGGING FOR THE ERROR +++
        console.error(
          "[NotificationContext] fetchInitialNotifications: Count Request rejected. Reason:",
          countResult.reason?.response?.data ||
            countResult.reason?.message ||
            countResult.reason
        );
        // Also log the full reason object if helpful
        console.error(
          "[NotificationContext] Full Count Rejection Reason:",
          countResult.reason
        );
        // +++ END IMPORTANT LOGGING +++
        setError((prev) => prev || "Could not load unread count."); // Set error state
        // Keep fetchedCount = 0
      }

      // --- Process List Response ---
      let fetchedItems = [];
      if (listResult.status === "fulfilled") {
        console.log(
          "[NotificationContext] fetchInitialNotifications: List Request fulfilled. Status:",
          listResult.value.status,
          "Data Preview:",
          JSON.stringify(listResult.value.data).substring(0, 150) + "..."
        );
        if (
          listResult.value.data &&
          Array.isArray(listResult.value.data.items)
        ) {
          fetchedItems = listResult.value.data.items;
          console.log(
            `[NotificationContext] fetchInitialNotifications: Successfully extracted ${fetchedItems.length} items.`
          );
        } else {
          console.warn(
            "[NotificationContext] fetchInitialNotifications: List Response data missing 'items' property or is not an array. Received:",
            listResult.value.data
          );
          setError((prev) => prev || "Invalid list data received."); // Set specific error
        }
      } else {
        console.error(
          "[NotificationContext] fetchInitialNotifications: List Request rejected. Reason:",
          listResult.reason?.response?.data ||
            listResult.reason?.message ||
            listResult.reason
        );
        console.error(
          "[NotificationContext] Full List Rejection Reason:",
          listResult.reason
        );
        setError((prev) => prev || "Could not load notification list.");
      }

      // --- Update State ---
      // Only update if there wasn't a critical error preventing count/list loading
      // Or maybe update anyway with potentially partial data? Updating seems reasonable.
      setUnreadCount(fetchedCount);
      setNotifications(fetchedItems);
      console.log(
        `[NotificationContext] fetchInitialNotifications: Final State Update -> Count=${fetchedCount}, Items=${fetchedItems.length}, Error='${error}'`
      ); // Log final state set
    } catch (err) {
      // Catch unexpected errors outside Promise.allSettled
      console.error(
        "[NotificationContext] fetchInitialNotifications: Unexpected error during fetch process:",
        err
      );
      setError(
        (prev) => prev || "An unexpected error occurred loading notifications."
      );
      setUnreadCount(0);
      setNotifications([]);
    } finally {
      console.log(
        "[NotificationContext] fetchInitialNotifications: Fetch process finished (finally block)."
      );
      setIsLoading(false);
    }
  }, [isLoading]);

  // Add new notification received via WebSocket
  const addNewNotification = useCallback((notificationData) => {
    console.log(
      "[NotificationContext] addNewNotification CALLED with data:",
      notificationData
    );
    if (!notificationData || !notificationData.id) {
      console.warn(
        "[NotificationContext] addNewNotification: Invalid data received.",
        notificationData
      );
      return;
    }
    setUnreadCount((prevCount) => prevCount + 1);
    setNotifications((prev) => [notificationData, ...prev.slice(0, 19)]);
    setError(null); // Clear error on new notification
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(
    async (notificationIds = null) => {
      console.log(
        `[NotificationContext] markAsRead CALLED. Specific IDs: ${
          notificationIds ? notificationIds.join(",") : "All Unread"
        }`
      );
      const token = getAuthToken();
      const currentUnread = unreadCount; // Capture before optimistic update
      if (!token || currentUnread === 0) {
        console.log(
          "[NotificationContext] markAsRead: No token or no unread. Aborting."
        );
        return;
      }

      // Optimistic Update
      const previousState = { unreadCount, notifications }; // Store previous state for potential revert
      if (!notificationIds) {
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readStatus: true }))
        );
      } else {
        const idsToMark = new Set(notificationIds);
        let markedCount = 0;
        setNotifications((prev) =>
          prev.map((n) => {
            if (!n.readStatus && idsToMark.has(n.id)) {
              markedCount++;
              return { ...n, readStatus: true };
            }
            return n;
          })
        );
        setUnreadCount((prev) => Math.max(0, prev - markedCount));
      }
      setError(null);

      try {
        const apiUrl = `${API_BASE_URL}/api/notifications/mark-read`;
        console.log(
          `[NotificationContext] markAsRead: Sending PATCH to ${apiUrl}`
        );
        await axios.patch(
          apiUrl,
          { notificationIds: notificationIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(
          "[NotificationContext] markAsRead: Backend PATCH successful."
        );
      } catch (err) {
        console.error(
          "[NotificationContext] markAsRead: PATCH failed:",
          err.message
        );
        if (err.response) {
          console.error(
            "[NotificationContext] markAsRead Error Response:",
            err.response.data
          );
        }
        setError("Failed to update read status.");
        console.log(
          "[NotificationContext] markAsRead failed, REVERTING optimistic update..."
        );
        // Revert optimistic update
        setUnreadCount(previousState.unreadCount);
        setNotifications(previousState.notifications);
        // fetchInitialNotifications(); // Re-fetch could also work but revert is immediate
      }
    },
    [unreadCount, notifications, fetchInitialNotifications] // Added notifications to dependency for revert state capture
  );

  const value = {
    unreadCount,
    notifications,
    isLoading,
    error,
    addNewNotification,
    markAsRead,
    fetchInitialNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === null) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
