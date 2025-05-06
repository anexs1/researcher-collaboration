// src/Component/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  // FaBell, // No longer needed directly
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaNetworkWired,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
// import { useNotifications } from "../context/NotificationContext"; // No longer needed directly

// +++ IMPORT THE NEW COMPONENT +++
import Notifications from "./Notifications"; // Adjust path if needed

const Navbar = ({
  isLoggedIn,
  currentUser,
  onLogout,
  layoutType = "public", // Default to public layout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  // const { unreadCount, markAsRead } = useNotifications(); // No longer needed directly

  const isUserLayout = layoutType === "user"; // Check if it's the user-specific layout

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout(); // Call the logout function passed from props
    }
    navigate("/login"); // Navigate to login after logout
    setIsOpen(false); // Close mobile menu
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  // --- REMOVE handleNotificationClick ---
  // const handleNotificationClick = () => { /* ... */ };

  // Define styles for NavLink active/inactive states
  const activeClassName = "text-white bg-indigo-700";
  const inactiveClassName = "text-gray-300 hover:bg-gray-700 hover:text-white";
  const commonClasses =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors block md:inline-block"; // Base classes for links

  return (
    <nav className="bg-gray-900 fixed w-full z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* --- Logo --- */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-white hover:text-indigo-300 flex items-center"
              aria-label="Homepage"
            >
              <FaNetworkWired size={28} /> {/* Example Logo Icon */}
              {/* Optional: Add text logo */}
              {/* <span className="ml-2 text-xl font-bold">CollabApp</span> */}
            </Link>
          </div>

          {/* --- Main Navigation Links (Desktop - shown if NOT user layout) --- */}
          {!isUserLayout && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink
                  to="/"
                  end // Use 'end' for exact match on root path
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                >
                  Home
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
                <NavLink
                  to="/aboutus"
                  className={({ isActive }) =>
                    `${commonClasses} ${
                      isActive ? activeClassName : inactiveClassName
                    }`
                  }
                >
                  About Us
                </NavLink>
                {/* Conditionally show Messages link if logged in */}
                {isLoggedIn && (
                  <NavLink
                    to="/messages"
                    className={({ isActive }) =>
                      `${commonClasses} ${
                        isActive ? activeClassName : inactiveClassName
                      }`
                    }
                  >
                    Messages
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {/* --- Right Side Actions (Desktop) --- */}
          <div className="hidden md:flex md:items-center md:ml-6">
            {isLoggedIn && currentUser ? (
              // --- Logged In State ---
              <>
                {/* +++ RENDER NOTIFICATIONS COMPONENT +++ */}
                <Notifications />

                {/* --- Profile Link --- */}
                <Link
                  to="/profile"
                  className="flex items-center text-sm rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white mr-4" // Added margin right
                  aria-label="User Profile"
                >
                  <img
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-500"
                    src={currentUser.profilePictureUrl || "/default-avatar.png"} // Use default if no picture
                    alt="User profile picture"
                  />
                  {/* Show username on larger screens */}
                  <span className="ml-2 hidden lg:block">
                    {currentUser.username}
                  </span>
                </Link>

                {/* --- Logout Button --- */}
                <button
                  onClick={handleLogoutClick}
                  className={`${commonClasses} ${inactiveClassName}`}
                  aria-label="Logout"
                >
                  <FaSignOutAlt className="inline mr-1" aria-hidden="true" />{" "}
                  Logout
                </button>
              </>
            ) : (
              // --- Logged Out State ---
              <>
                <Link
                  to="/login"
                  className={`${commonClasses} ${inactiveClassName}`}
                >
                  <FaSignInAlt className="inline mr-1" aria-hidden="true" />{" "}
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500" // Added focus styles
                >
                  <FaUserPlus className="inline mr-1" aria-hidden="true" /> Sign
                  Up
                </Link>
              </>
            )}
          </div>

          {/* --- Mobile Menu Button Area --- */}
          <div className="-mr-2 flex md:hidden">
            {/* --- RENDER NOTIFICATIONS COMPONENT (Mobile) --- */}
            {isLoggedIn && (
              <Notifications /> // Renders button + dropdown
            )}
            {/* --- Hamburger Button --- */}
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              aria-label="Open main menu"
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

      {/* --- Mobile Menu Dropdown Panel --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden" // Hide on medium screens and up
            id="mobile-menu"
          >
            {/* --- Main Nav Links (Mobile - shown if NOT user layout) --- */}
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
                  About Us
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

            {/* --- Auth/Profile Links (Mobile) --- */}
            <div className="pt-4 pb-3 border-t border-gray-700">
              {isLoggedIn && currentUser ? (
                // --- Logged In State (Mobile) ---
                <div className="px-2 space-y-1">
                  {/* Mobile Profile Link */}
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={toggleMenu}
                  >
                    Your Profile ({currentUser.username})
                  </Link>
                  {/* Mobile Logout Button */}
                  <button
                    onClick={handleLogoutClick} // Uses the same handler
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                // --- Logged Out State (Mobile) ---
                <div className="px-2 space-y-1">
                  <Link
                    to="/login"
                    className={`${commonClasses} ${inactiveClassName}`}
                    onClick={toggleMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className={`${commonClasses} ${inactiveClassName}`}
                    onClick={toggleMenu}
                  >
                    Sign Up
                  </Link>
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
