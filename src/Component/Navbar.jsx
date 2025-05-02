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
  FaNetworkWired,
  FaCog, // Added Cog for settings link example
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../context/NotificationContext";

// ADD layoutType PROP
const Navbar = ({
  isLoggedIn,
  currentUser,
  onLogout,
  layoutType = "public",
}) => {
  // Default to 'public'
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { unreadCount, markAsRead } = useNotifications();

  const isUserLayout = layoutType === "user"; // Check if used in UserLayout

  const handleLogoutClick = () => {
    onLogout();
    navigate("/login");
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = () => {
    // ... (notification logic)
    markAsRead();
    navigate("/profile/activity"); // Example: navigate to activity or notifications page
    setIsOpen(false);
  };

  const activeClassName = "text-white bg-indigo-700";
  const inactiveClassName = "text-gray-300 hover:bg-gray-700 hover:text-white";
  const commonClasses =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors block md:inline-block";

  return (
    <nav className="bg-gray-900 fixed w-full z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - Always visible */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-white hover:text-indigo-300 transition-colors flex items-center"
              aria-label="Home"
            >
              <FaNetworkWired size={28} />
              {/* <span className="font-bold text-xl ml-2">Portal</span> */}
            </Link>
          </div>

          {/* Desktop Menu Links - Conditionally Rendered */}
          {/* Show full nav only if NOT in UserLayout */}
          {!isUserLayout && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                >
                  {" "}
                  Home{" "}
                </NavLink>
                {/* <NavLink
                  to="/explore"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                >
                  {" "}
                  Explore{" "}
                </NavLink> */}
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                >
                  {" "}
                  Projects{" "}
                </NavLink>
                <NavLink
                  to="/publications"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                >
                  {" "}
                  Publications{" "}
                </NavLink>
                <NavLink
                  to="/AboutUS"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                >
                  {" "}
                  AboutUS{" "}
                </NavLink>
                {/* Messages only shown if logged in, but still hidden in UserLayout */}
                {isLoggedIn && (
                  <NavLink
                    to="/messages"
                    className={({ isActive }) =>
                      `${commonClasses} ${
                        isActive ? activeClassName : inactiveClassName
                      }`
                    }
                  >
                    {" "}
                    Messages{" "}
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {/* Right Side - Notifications, Profile/Auth - Always visible */}
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
                        aria-hidden="true"
                      >
                        {" "}
                        {unreadCount > 9 ? "9+" : unreadCount}{" "}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* Profile Area */}
                <div className="ml-3 relative flex items-center">
                  <Link
                    to="/profile"
                    className="flex items-center text-sm rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white mr-4 group"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-500"
                      src={
                        currentUser.profilePictureUrl || "/default-avatar.png"
                      }
                      alt="User profile picture"
                    />
                    <span className="ml-2 hidden lg:block text-white group-hover:text-indigo-300 transition-colors">
                      {" "}
                      {currentUser.username}{" "}
                    </span>
                  </Link>
                  {/* Optional: Settings Icon Link */}
                  {/* <Link to="/settings/account" className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-white mr-3" aria-label="Account Settings"><FaCog className="h-5 w-5" /></Link> */}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogoutClick}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${inactiveClassName}`}
                >
                  <FaSignOutAlt className="inline mr-1" aria-hidden="true" />{" "}
                  Logout
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
                  <FaSignInAlt
                    className="inline mr-1"
                    aria-hidden="true"
                  />{" "}
                  Login{" "}
                </Link>
                <Link
                  to="/signup"
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  {" "}
                  <FaUserPlus className="inline mr-1" aria-hidden="true" /> Sign
                  Up{" "}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            {/* Mobile Notifications (if logged in) */}
            {isLoggedIn && (
              <button
                onClick={handleNotificationClick}
                className="relative p-1 mr-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-white"
                aria-label="View notifications"
              >
                {" "}
                <FaBell className="h-6 w-6" />{" "}
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 block h-4 w-4 transform rounded-full text-white bg-red-600 text-[10px] font-bold flex items-center justify-center ring-1 ring-gray-900"
                    aria-hidden="true"
                  >
                    {" "}
                    {unreadCount > 9 ? "9+" : unreadCount}{" "}
                  </span>
                )}{" "}
              </button>
            )}
            {/* Hamburger Button */}
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <FaTimes className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FaBars className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel - Conditionally Render Links */}
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
            {/* Core Links (Show only if not in UserLayout) */}
            {!isUserLayout && (
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
                {/* <NavLink
                  to="/explore"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                  onClick={toggleMenu}
                >
                  Explore
                </NavLink> */}
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
                <NavLink
                  to="/aboutus"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                  onClick={toggleMenu}
                >
                  AboutUS
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
            )}
            {/* User/Auth Section (Always shown based on login status) */}
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
                        alt="User profile picture"
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">
                        {currentUser.username}
                      </div>
                      {currentUser.email && (
                        <div className="text-sm font-medium leading-none text-gray-400 mt-1">
                          {currentUser.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    {/* If in UserLayout, these links might be redundant if also in sidebar, but okay to keep */}
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
  );
};

export default Navbar;
