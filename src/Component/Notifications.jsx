import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext"; // Adjust path if needed
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { FaBell } from "react-icons/fa";
import "./Notifications.css"; // Make sure CSS is imported

const Notifications = () => {
  // Get state/functions from context
  const { notifications, unreadCount, markAsRead, isLoading, error } =
    useNotifications();

  // Component state
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // +++ LOGGING ADDED +++
  console.log(
    "[Notifications Component] Rendering. isLoading:",
    isLoading,
    "Error:",
    error,
    "Unread Count:",
    unreadCount,
    "Notifications Array Length:",
    notifications?.length // Log length instead of full array usually
    // Uncomment below to log full array, but can be verbose:
    // , "Notifications Array:", notifications
  );
  // +++ END LOGGING +++

  // --- Handlers and Effects ---
  const handleToggle = () => {
    // ... (toggle logic remains the same) ...
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState && unreadCount > 0) {
      console.log(
        "[Notifications Component] Dropdown opened, calling markAsRead()."
      ); // Log action
      markAsRead();
    } else {
      console.log(
        `[Notifications Component] Dropdown ${
          newState ? "opened (no unread)" : "closed"
        }.`
      );
    }
  };

  const closeDropdown = () => {
    // console.log("[Notifications Component] closeDropdown called."); // Optional log
    setShowNotifications(false);
  };

  useEffect(() => {
    // ... (click outside handler remains the same) ...
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // console.log("[Notifications Component] Click outside detected."); // Optional log
        closeDropdown();
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // --- Link Resolver ---
  const getNotificationLink = (notification) => {
    // ... (link logic remains the same) ...
    const type = notification?.type;
    const data = notification?.data;
    if (type === "NEW_COLLAB_JOIN_REQUEST" && data?.projectId) {
      return `/profile/activity?filter=received&highlight=${data.requestId}`;
    }
    if (type === "COLLAB_REQUEST_RESPONSE" && data?.projectId) {
      return `/projects/${data.projectId}`;
    }
    return "/profile/activity";
  };

  // --- Timestamp Formatter ---
  const formatTimestamp = (isoString) => {
    // ... (formatter remains the same) ...
    if (!isoString) return "";
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  // --- Render List Items ---
  const renderNotificationItems = () => {
    // +++ LOGGING ADDED +++
    console.log("[Notifications Component] renderNotificationItems called.");
    // +++ END LOGGING +++

    // ... (rest of the rendering logic remains the same) ...
    if (isLoading && notifications.length === 0) {
      return <li className="notification-item loading">Loading...</li>;
    }
    if (error) {
      return <li className="notification-item error">Error: {error}</li>;
    }
    if (!notifications || notifications.length === 0) {
      return <li className="no-notifications">No notifications yet.</li>;
    }

    return notifications.map((notif) => (
      <motion.li
        key={notif.id}
        /* ... animation ... */ className={`notification-item ${
          !notif.readStatus ? "unread" : "read"
        }`}
      >
        <Link
          to={getNotificationLink(notif)}
          onClick={closeDropdown}
          className="notification-link"
        >
          <span className="message">{notif.message}</span>
          {notif.createdAt && (
            <span className="timestamp">
              {" "}
              {formatTimestamp(notif.createdAt)}{" "}
            </span>
          )}
        </Link>
      </motion.li>
    ));
  };

  // --- Component Return ---
  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button
        className="notifications-btn"
        onClick={handleToggle} /* ... aria labels ... */
      >
        <FaBell className="h-6 w-6" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span className="badge" /* ... animation ... */>
              {" "}
              {unreadCount > 9 ? "9+" : unreadCount}{" "}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            className="notifications-dropdown" /* ... animation ... */
          >
            <div className="notifications-header">
              {" "}
              <h3 id="notifications-heading">Notifications</h3>{" "}
            </div>
            <ul className="notifications-list">{renderNotificationItems()}</ul>
            <div className="notifications-footer">
              {" "}
              <Link to="/profile/activity" onClick={closeDropdown}>
                {" "}
                View All Activity{" "}
              </Link>{" "}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
