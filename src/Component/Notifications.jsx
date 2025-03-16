import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Notifications.css";

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/notifications/${userId}`
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  return (
    <div className="notifications">
      <button
        className="notifications-btn"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        🔔{" "}
        {notifications.length > 0 && (
          <span className="badge">{notifications.length}</span>
        )}
      </button>
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
