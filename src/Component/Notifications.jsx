import React from "react";
import "./Notifications.css";

const Notifications = () => {
  // Dummy notifications data
  const notifications = ["Notification 1", "Notification 2", "Notification 3"];

  return (
    <div className="notifications">
      <button className="notifications-btn">🔔</button>
      <ul className="notifications-list">
        {notifications.map((notification, index) => (
          <li key={index}>{notification}</li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
