// src/context/NotificationContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import axios from "axios"; // Optional: For fetching initial/clearing notifications

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// 1. Create Context
const NotificationContext = createContext(null);

// 2. Create Provider Component
export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]); // Optional: Store full notification list
  const [isLoading, setIsLoading] = useState(false); // Optional: Loading state

  // Optional: Function to fetch initial unread count or notifications
  const fetchInitialNotifications = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return; // Don't fetch if not logged in

    setIsLoading(true);
    try {
      // ** Example API endpoint - Replace with your actual endpoint **
      // This endpoint should return { success: true, unreadCount: 5, notifications: [...] } or similar
      // const response = await axios.get(`${API_BASE_URL}/api/notifications/summary`, {
      //     headers: { Authorization: `Bearer ${token}` }
      // });
      // if (response.data?.success) {
      //     setUnreadCount(response.data.unreadCount || 0);
      //     setNotifications(response.data.notifications || []);
      // }
      // --- Placeholder ---
      console.log(
        "Placeholder: fetchInitialNotifications called. Need API endpoint."
      );
      setUnreadCount(0); // Start with 0 until API is ready
      // --- End Placeholder ---
    } catch (error) {
      console.error("Failed to fetch initial notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial data on component mount (e.g., after login)
  // useEffect(() => {
  //     fetchInitialNotifications();
  // }, [fetchInitialNotifications]); // Re-fetch if needed (e.g., on user change)

  // Function called by App.jsx when a new notification arrives via Socket.IO
  const addNewNotification = useCallback((notificationData) => {
    console.log(
      "NotificationContext: Adding new notification",
      notificationData
    );
    // Increment unread count
    setUnreadCount((prevCount) => prevCount + 1);
    // Optional: Add notification to the list (keep list size manageable)
    // setNotifications(prev => [notificationData, ...prev.slice(0, 19)]); // Keep latest 20
  }, []);

  // Function called by Navbar/NotificationPanel when notifications are viewed/cleared
  const markAsRead = useCallback(async () => {
    console.log("NotificationContext: Marking notifications as read");
    const currentUnread = unreadCount; // Get count before setting to 0
    setUnreadCount(0); // Optimistically update UI

    // Optional: Make API call to backend to mark notifications as read in DB
    const token = localStorage.getItem("authToken");
    if (!token || currentUnread === 0) return; // Don't call API if nothing to mark or not logged in

    try {
      // ** Example API endpoint - Replace with your actual endpoint **
      // await axios.post(`${API_BASE_URL}/api/notifications/mark-read`, {}, {
      //     headers: { Authorization: `Bearer ${token}` }
      // });
      console.log(
        "Placeholder: markAsRead called. Need API endpoint to sync backend."
      );
      // If API fails, potentially revert the unread count (more complex state management)
    } catch (error) {
      console.error("Failed to mark notifications as read on backend:", error);
      // setUnreadCount(currentUnread); // Revert optimistic update on failure?
    }
  }, [unreadCount]); // Depend on unreadCount to know if API call needed

  // Value provided by the context
  const value = {
    unreadCount,
    notifications, // Provide list if needed
    isLoading, // Provide loading state if needed
    addNewNotification,
    markAsRead,
    fetchInitialNotifications, // Allow manual refresh if needed
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// 3. Create Custom Hook to Consume Context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === null) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
