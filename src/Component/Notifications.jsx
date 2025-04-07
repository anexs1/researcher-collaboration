import React, { useState, useEffect } from "react";
import axios from "axios";
import "../index.css"; // Import your CSS file

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState(null); // State to track errors

  useEffect(() => {
    fetchNotifications();
  }, [userId]); // Refetch notifications when userId changes

  const fetchNotifications = async () => {
    if (!userId) {
      console.warn(
        "Notifications: userId is undefined. Not fetching notifications."
      );
      return; // Don't fetch if userId is missing
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/notifications/${userId}`
      );

      if (response.status !== 200) {
        throw new Error(
          `Failed to fetch notifications: HTTP ${response.status}`
        );
      }

      setNotifications(response.data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(`Failed to load notifications.  ${error.message}`);
      setNotifications([]);
    }
  };
  return (
    <div className="notifications">
      <button
        className="notifications-btn"
        onClick={() => setShowNotifications(!showNotifications)}
        disabled={!userId} // Disable the button if userId is missing
      >
        🔔
        {notifications.length > 0 && (
          <span className="badge">{notifications.length}</span>
        )}
      </button>

      {error && <div className="error-message">{error}</div>}
      {showNotifications && (
        <div
          className="notifications-overlay"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {showNotifications && (
        <ul className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <li key={index} className="notification-item">
                {notif.message}
              </li>
            ))
          ) : (
            <li className="no-notifications">No new notifications</li>
          )}
        </ul>
      )}
    </div>
  );
};
export default Notifications;
