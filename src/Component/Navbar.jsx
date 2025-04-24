// src/Component/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaNetworkWired, // Brand Icon
  FaHome, // Home Icon (Optional)
  FaEnvelope, // Messages Icon (Optional)
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- Import Notification Context Hook ---
import { useNotifications } from "../context/NotificationContext"; // Adjust path as needed

const Navbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // --- Use Notification Context ---
  const { unreadCount, markAsRead } = useNotifications(); // Get count and function

  const handleLogoutClick = () => {
    onLogout();
    navigate("/login"); // Redirect after logout
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // --- Handle clicking the notification icon ---
  const handleNotificationClick = () => {
    console.log("Notification icon clicked");
    markAsRead(); // Reset the count via context
    // TODO: Implement navigation to a notification page or show a dropdown
    alert(
      `Placeholder: Notifications viewed. Count reset. Implement dropdown/page view.`
    ); // Placeholder
    setIsOpen(false); // Close mobile menu
  };

  // --- NavLink Styling Classes ---
  const activeClassName = "text-white bg-indigo-700";
  const inactiveClassName = "text-gray-300 hover:bg-gray-700 hover:text-white"; // Adjusted hover for better contrast
  const commonClasses =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors block md:inline-block"; // Added block for mobile

  return (
    // Use Fragment shorthand <>
    // Corrected: Removed extra closing tags/parentheses from the end
    <nav className="bg-gray-900 fixed w-full z-50 shadow-lg">
      {" "}
      {/* Darker background, more shadow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-white hover:text-indigo-300 transition-colors flex items-center"
              aria-label="Researcher Collaboration Portal Home" // Accessibility
            >
              <FaNetworkWired size={28} />
              {/* <span className="font-bold text-xl ml-2">Portal</span> */}
            </Link>
          </div>

          {/* Desktop Menu Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {" "}
              {/* items-baseline for alignment */}
              <NavLink
                to="/"
                end // Use 'end' for exact match on root path
                className={({ isActive }) =>
                  `${commonClasses} ${
                    isActive ? activeClassName : inactiveClassName
                  }`
                }
              >
                {/* <FaHome className="inline mr-1 mb-0.5" /> */}
                Home
              </NavLink>
              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  `${commonClasses} ${
                    isActive ? activeClassName : inactiveClassName
                  }`
                }
              >
                Explore
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `${commonClasses} ${
                    isActive ? activeClassName : inactiveClassName
                  }`
                }
              >
                Projects
              </NavLink>
              <NavLink
                to="/publications"
                className={({ isActive }) =>
                  `${commonClasses} ${
                    isActive ? activeClassName : inactiveClassName
                  }`
                }
              >
                Publications
              </NavLink>
              {isLoggedIn && (
                <NavLink
                  to="/messages"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                >
                  {/* <FaEnvelope className="inline mr-1 mb-0.5" /> */}
                  Messages
                </NavLink>
              )}
            </div>
          </div>

          {/* Right Side - Notifications, Profile/Auth */}
          <div className="hidden md:flex md:items-center md:ml-6">
            {isLoggedIn && currentUser ? (
              <>
                {/* Notification Bell */}
                <button
                  onClick={handleNotificationClick}
                  className="relative p-1 mr-4 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors"
                  aria-label="View notifications"
                >
                  <span className="sr-only">View notifications</span>
                  <FaBell className="h-6 w-6" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 block h-4 w-4 rounded-full text-white bg-red-600 text-[10px] font-bold flex items-center justify-center ring-1 ring-white"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* Profile Area */}
                <div className="ml-3 relative flex items-center">
                  <Link
                    to="/profile"
                    className="flex items-center text-sm rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white mr-4"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-500"
                      src={
                        currentUser.profilePictureUrl || "/default-avatar.png"
                      }
                      alt=""
                    />
                    <span className="ml-2 hidden lg:block hover:text-indigo-300">
                      {currentUser.username}
                    </span>
                  </Link>
                </div>
                {/* Logout Button */}
                <button
                  onClick={handleLogoutClick}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${inactiveClassName}`}
                >
                  <FaSignOutAlt className="inline mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                {" "}
                {/* Login/Signup Buttons */}
                <Link
                  to="/login"
                  className={`${commonClasses} ${inactiveClassName}`}
                >
                  {" "}
                  <FaSignInAlt className="inline mr-1" /> Login{" "}
                </Link>
                <Link
                  to="/signup"
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {" "}
                  <FaUserPlus className="inline mr-1" /> Sign Up{" "}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            {isLoggedIn && (
              <button
                onClick={handleNotificationClick}
                className="relative p-1 mr-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-white"
                aria-label="View notifications"
              >
                <FaBell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 block h-4 w-4 transform rounded-full text-white bg-red-600 text-[10px] font-bold flex items-center justify-center ring-1 ring-gray-900">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            id="mobile-menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${commonClasses} ${
                    isActive ? activeClassName : inactiveClassName
                  }`
                }
                onClick={toggleMenu}
              >
                Home
              </NavLink>
              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  `${commonClasses} ${
                    isActive ? activeClassName : inactiveClassName
                  }`
                }
                onClick={toggleMenu}
              >
                Explore
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `${commonClasses} ${
                    isActive ? activeClassName : inactiveClassName
                  }`
                }
                onClick={toggleMenu}
              >
                Projects
              </NavLink>
              <NavLink
                to="/publications"
                className={({ isActive }) =>
                  `${commonClasses} ${
                    isActive ? activeClassName : inactiveClassName
                  }`
                }
                onClick={toggleMenu}
              >
                Publications
              </NavLink>
              {isLoggedIn && (
                <NavLink
                  to="/messages"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                  onClick={toggleMenu}
                >
                  Messages
                </NavLink>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700">
              {isLoggedIn && currentUser ? (
                <>
                  {" "}
                  {/* Logged In Mobile View */}
                  <div className="flex items-center px-5 mb-3">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-500"
                        src={
                          currentUser.profilePictureUrl || "/default-avatar.png"
                        }
                        alt=""
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">
                        {currentUser.username}
                      </div>
                      <div className="text-sm font-medium leading-none text-gray-400 mt-1">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `${commonClasses} ${
                          isActive ? activeClassName : inactiveClassName
                        }`
                      }
                      onClick={toggleMenu}
                    >
                      Your Profile
                    </NavLink>
                    <NavLink
                      to="/settings/account"
                      className={({ isActive }) =>
                        `${commonClasses} ${
                          isActive ? activeClassName : inactiveClassName
                        }`
                      }
                      onClick={toggleMenu}
                    >
                      Settings
                    </NavLink>
                    <button
                      onClick={handleLogoutClick}
                      className={`block w-full text-left ${commonClasses} ${inactiveClassName}`}
                    >
                      {" "}
                      Logout{" "}
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-2 space-y-1">
                  {" "}
                  {/* Logged Out Mobile View */}
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `${commonClasses} ${
                        isActive ? activeClassName : inactiveClassName
                      }`
                    }
                    onClick={toggleMenu}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className={({ isActive }) =>
                      `${commonClasses} ${
                        isActive ? activeClassName : inactiveClassName
                      }`
                    }
                    onClick={toggleMenu}
                  >
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  ); // <<< CORRECTED: Removed extra parenthesis and semicolon here
}; // <<< CORRECTED: Removed extra parenthesis here

export default Navbar;
