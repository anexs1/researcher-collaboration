// src/components/Notifications.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell } from "react-icons/fa";
// No separate CSS import needed: import './Notifications.css';

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, isLoading, error } =
    useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // --- Dropdown Toggle ---
  const handleToggle = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState && unreadCount > 0) {
      markAsRead();
    }
  };

  // --- Close dropdown logic ---
  const closeDropdown = () => {
    setShowNotifications(false);
  };

  // --- Click outside handler ---
  useEffect(() => {
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

  // --- Link Resolver ---
  const getNotificationLink = (notification) => {
    // ... (getNotificationLink logic remains the same as previous version) ...
    const type = notification?.type;
    const data = notification?.data;
    console.log(`[getNotificationLink] Processing type: ${type}, data:`, data);
    try {
      switch (type) {
        case "NEW_COLLAB_JOIN_REQUEST":
          if (data?.requestId) {
            return `/profile/activity?filter=received&highlight=${data.requestId}`;
          }
          break;
        case "COLLAB_REQUEST_RESPONSE":
          if (data?.projectId) {
            return `/projects/${data.projectId}`;
          }
          break;
        default:
          console.warn(
            `[getNotificationLink] Unknown notification type or missing data for link: ${type}`
          );
          return "/profile/activity";
      }
    } catch (linkError) {
      console.error(
        `[getNotificationLink] Error constructing link for type ${type}:`,
        linkError
      );
      return "/profile/activity";
    }
    return "/profile/activity";
  };

  // --- Timestamp Formatter ---
  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  // --- Render List Items ---
  const renderNotificationItems = () => {
    console.log("[Notifications Component] renderNotificationItems called.");
    if (isLoading && notifications.length === 0) {
      return (
        <li className="px-4 py-6 text-center text-gray-500 italic">
          Loading...
        </li>
      );
    } // Tailwind classes for loading/empty/error
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
        // Apply base border, conditional background for unread
        className={`border-b border-gray-100 last:border-b-0 ${
          !notif.readStatus ? "bg-indigo-50" : "bg-white"
        }`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to={getNotificationLink(notif)}
          onClick={closeDropdown}
          // Apply padding, block display, hover effect
          className="block px-4 py-3 hover:bg-gray-100 transition-colors duration-150"
        >
          {/* Message styling */}
          <span
            className={`block text-sm mb-1 ${
              !notif.readStatus ? "font-medium text-gray-800" : "text-gray-700"
            }`}
          >
            {notif.message}
          </span>
          {/* Timestamp styling */}
          {notif.createdAt && (
            <span className="block text-xs text-gray-500 mt-0.5">
              {formatTimestamp(notif.createdAt)}
            </span>
          )}
        </Link>
      </motion.li>
    ));
  };

  // --- Component Return ---
  return (
    // Container: relative position for dropdown, inline-block for alignment
    <div className="relative inline-block" ref={dropdownRef}>
      {/* --- Notification Button --- */}
      <button
        // Basic button styling, relative for badge, padding, margin, text color, hover effect
        className="relative inline-flex items-center p-1 mr-4 text-gray-400 bg-transparent border-none rounded-full hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-150"
        onClick={handleToggle}
        aria-label={`${unreadCount} unread notifications`}
        aria-haspopup="true"
        aria-expanded={showNotifications}
      >
        <FaBell className="h-6 w-6" /> {/* Icon size */}
        {/* --- Badge with Animation --- */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              // Positioning, size, background, text, shape, font, centering, ring
              className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 min-w-[1rem] rounded-full bg-red-600 text-[10px] font-bold text-white ring-1 ring-white"
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* --- Dropdown with Animation --- */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            // Positioning, margin-top, background, border, rounded, shadow, width, max-height, overflow, layout, z-index
            className="absolute right-0 mt-2 w-80 max-h-[450px] origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden flex flex-col z-50"
            role="region"
            aria-labelledby="notifications-heading"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.1, ease: "easeOut" }} // Faster transition
          >
            {/* Dropdown Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3
                id="notifications-heading"
                className="text-sm font-semibold text-gray-800"
              >
                Notifications
              </h3>
            </div>
            {/* Scrollable List Area */}
            <ul className="flex-1 overflow-y-auto">
              {" "}
              {/* flex-1 allows it to grow and scroll */}
              {renderNotificationItems()}
            </ul>
            {/* Dropdown Footer */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
              <Link
                to="/profile/activity" // Link to your activity page
                onClick={closeDropdown}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                View All Activity
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
