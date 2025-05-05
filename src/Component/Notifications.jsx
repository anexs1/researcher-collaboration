// src/Component/Notifications.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom"; // Or useNavigate if preferred for actions
import { useNotifications } from "../context/NotificationContext"; // Adjust path as needed
import "../index.css"; // Ensure CSS classes like .notifications, .notifications-btn, .badge, .notifications-list etc. are defined

const Notifications = () => {
  // Get state and functions from the Notification Context
  const {
    notifications, // The array of notification objects from the context
    unreadCount, // The count of unread notifications from the context
    markAsRead, // Function from context to mark notifications as read
    isLoading, // Loading state from the context
    error, // Error state from the context
  } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);

  // Function to toggle the dropdown visibility
  const handleToggle = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    // If opening the dropdown and there are unread notifications, mark them as read
    if (newState && unreadCount > 0) {
      markAsRead(); // Call the function from the context
    }
  };

  // Function to close the dropdown (e.g., when clicking overlay or a link)
  const closeDropdown = () => {
    setShowNotifications(false);
  };

  // Helper function to determine where a notification click should navigate
  // Adapt this based on your actual notification data structure and desired links
  const getNotificationLink = (notification) => {
    // Use optional chaining ?. just in case properties are missing
    if (
      notification?.type === "NEW_COLLABORATION_REQUEST" &&
      notification?.projectId
    ) {
      // Example: Link to a specific section or page for handling requests
      // Could link directly to the project or a requests management view
      return `/profile/activity?filter=received&highlight=${notification?.requestId}`;
    }
    if (
      notification?.type === "COLLABORATION_REQUEST_RESPONSE" &&
      notification?.projectId
    ) {
      // Example: Link to the project page or the sent requests list
      return `/projects/${notification.projectId}`; // Or /profile/activity?filter=sent
    }
    // Add more cases for other notification types (e.g., new message, project update)
    // Default fallback link
    return "/profile/activity";
  };

  // Function to render the list items based on the context state
  const renderNotificationItems = () => {
    if (isLoading) {
      return <li className="notification-item loading">Loading...</li>;
    }
    // Display error from context if there is one
    if (error) {
      return <li className="notification-item error">Error: {error}</li>;
    }
    // Check if the notifications array (from context) is empty
    if (!notifications || notifications.length === 0) {
      return <li className="no-notifications">No notifications</li>;
    }
    // Map over the notifications array from the context
    return notifications.map((notif) => (
      // *** Use a stable, unique key from your notification data (e.g., notif.id) ***
      <li key={notif.id || notif.timestamp} className="notification-item">
        {/* Make the notification text a link */}
        <Link to={getNotificationLink(notif)} onClick={closeDropdown}>
          {notif.message}
          {/* Optionally display a timestamp or other relevant info */}
          {notif.timestamp && (
            <span className="timestamp">
              {" "}
              - {new Date(notif.timestamp).toLocaleRelativeTime()}{" "}
              {/* Example formatting */}
            </span>
          )}
        </Link>
        {/* You could add action buttons here too (e.g., dismiss) */}
      </li>
    ));
  };

  // Helper for relative time (or use a library like date-fns) - add this outside the component or in a utils file
  // Simple example, enhance as needed
  Date.prototype.toLocaleRelativeTime = function () {
    const diff = (new Date() - this) / 1000; // difference in seconds
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return this.toLocaleDateString();
  };

  return (
    <div className="notifications">
      {/* Button displays the unreadCount from the context */}
      <button className="notifications-btn" onClick={handleToggle}>
        🔔 {/* Bell Icon */}
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Overlay element to close the dropdown when clicked */}
      {showNotifications && (
        <div className="notifications-overlay" onClick={closeDropdown} />
      )}

      {/* The actual dropdown list, rendered conditionally */}
      {showNotifications && (
        <ul className="notifications-list">
          {renderNotificationItems()} {/* Render the list items */}
        </ul>
      )}
    </div>
  );
};

// Export with the original name
export default Notifications;
