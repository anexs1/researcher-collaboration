// src/components/Notifications.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext"; // Adjust path if needed
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion"; // Use Framer Motion for animations
import { FaBell } from "react-icons/fa"; // Assuming you use react-icons

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, isLoading, error } =
    useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null); // Ref for detecting clicks outside

  // --- Dropdown Toggle ---
  const handleToggle = () => {
    /* ... same ... */
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState && unreadCount > 0) {
      markAsRead();
    }
  };

  // --- Close dropdown logic ---
  const closeDropdown = () => {
    /* ... same ... */
    setShowNotifications(false);
  };

  // --- Click outside handler ---
  useEffect(() => {
    /* ... same ... */
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  const getNotificationLink = (notification) => {
    const type = notification?.type;
    const data = notification?.data; // Keep data for potential future use or logging

    console.log(`[getNotificationLink] Processing type: ${type}, data:`, data);

    switch (type) {
      case "NEW_COLLAB_JOIN_REQUEST":
      case "COLLAB_REQUEST_RESPONSE":
        // For both request types, link to the main projects page
        console.log(
          `[getNotificationLink] Linking ${type} to main projects page: /projects`
        );
        return "/projects"; // <<< ALWAYS RETURN /projects FOR THESE TYPES

      default:
        // Fallback for unknown types
        console.warn(
          `[getNotificationLink] Unknown notification type: ${type}. Falling back.`
        );
        return "/profile/activity"; // Or "/" maybe?
    }
    // Note: The try...catch and projectId checks from the previous version
    // are removed as we are now always linking to a static path for these types.
  };

  const formatTimestamp = (isoString) => {
    /* ... same ... */
    if (!isoString) return "";
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  // --- Render List Items (No changes needed here) ---
  const renderNotificationItems = () => {
    /* ... same rendering logic using Link ... */
    console.log("[Notifications Component] renderNotificationItems called.");
    if (isLoading && notifications.length === 0) {
      return (
        <li className="px-4 py-6 text-center text-gray-500 italic">
          Loading...
        </li>
      );
    }
    if (error) {
      return (
        <li className="px-4 py-6 text-center text-red-600 font-medium">
          Error: {error}
        </li>
      );
    }
    if (!notifications || notifications.length === 0) {
      return (
        <li className="px-4 py-6 text-center text-gray-500 italic">
          No notifications yet.
        </li>
      );
    }

    return notifications.map((notif) => (
      <motion.li
        key={notif.id}
        className={`border-b border-gray-100 last:border-b-0 ${
          !notif.readStatus ? "bg-indigo-50" : "bg-white"
        }`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to={getNotificationLink(notif)} // Uses the updated function
          onClick={closeDropdown}
          className="block px-4 py-3 hover:bg-gray-100 transition-colors duration-150"
        >
          <span
            className={`block text-sm mb-1 ${
              !notif.readStatus ? "font-medium text-gray-800" : "text-gray-700"
            }`}
          >
            {notif.message}
          </span>
          {notif.createdAt && (
            <span className="block text-xs text-gray-500 mt-0.5">
              {formatTimestamp(notif.createdAt)}
            </span>
          )}
        </Link>
      </motion.li>
    ));
  };

  return (
    // ... (rest of the component structure using Tailwind classes remains the same) ...
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        className="relative inline-flex items-center p-1 mr-4 text-gray-400 bg-transparent border-none rounded-full hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-150"
        onClick={handleToggle}
        aria-label={`${unreadCount} unread notifications`}
        aria-haspopup="true"
        aria-expanded={showNotifications}
      >
        <FaBell className="h-6 w-6" />
        <AnimatePresence>
          {" "}
          {unreadCount > 0 && (
            <motion.span
              className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 min-w-[1rem] rounded-full bg-red-600 text-[10px] font-bold text-white ring-1 ring-white"
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {" "}
              {unreadCount > 9 ? "9+" : unreadCount}{" "}
            </motion.span>
          )}{" "}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            className="absolute right-0 mt-2 w-80 max-h-[450px] origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden flex flex-col z-50"
            role="region"
            aria-labelledby="notifications-heading"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            <div className="px-4 py-3 border-b border-gray-200">
              {" "}
              <h3
                id="notifications-heading"
                className="text-sm font-semibold text-gray-800"
              >
                {" "}
                Notifications{" "}
              </h3>{" "}
            </div>
            <ul className="flex-1 overflow-y-auto">
              {" "}
              {renderNotificationItems()}{" "}
            </ul>
         
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
