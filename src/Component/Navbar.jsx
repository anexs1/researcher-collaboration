// src/Component/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaNetworkWired,
  FaFileAlt, // +++ Added icon for Documents +++
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Notifications from "./Notifications";

const Navbar = ({
  isLoggedIn,
  currentUser,
  onLogout,
  layoutType = "public",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isUserLayout = layoutType === "user";

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
    setIsOpen(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const activeClassName = "text-white bg-indigo-700";
  const inactiveClassName = "text-gray-300 hover:bg-gray-700 hover:text-white";
  const commonClasses =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors block md:inline-block";

  return (
    <nav className="bg-gray-900 fixed w-full z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-white hover:text-indigo-300 flex items-center"
              aria-label="Homepage"
            >
              <FaNetworkWired size={28} />
              {/* <span className="ml-2 text-xl font-bold">CollabApp</span> */}
            </Link>
          </div>

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
                {/* +++ ADDED DOCUMENTS LINK (Desktop - only if logged in) +++
                {isLoggedIn && (
                  <NavLink
                    to="/documents" // Route defined in App.jsx
                    className={({ isActive }) =>
                      `${commonClasses} ${
                        isActive ? activeClassName : inactiveClassName
                      }`
                    }
                  >
                    <FaFileAlt
                      className="inline mr-1 mb-0.5"
                      aria-hidden="true"
                    />
                    Documents
                  </NavLink>
                )} */}
                {/* +++ END +++ */}
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

          <div className="hidden md:flex md:items-center md:ml-6">
            {isLoggedIn && currentUser ? (
              <>
                <Notifications />
                <Link
                  to="/profile"
                  className="flex items-center text-sm rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white mr-4"
                  aria-label="User Profile"
                >
                  <img
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-500"
                    src={currentUser.profilePictureUrl || "/default-avatar.png"}
                    alt="User profile"
                  />
                  <span className="ml-2 hidden lg:block">
                    {currentUser.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogoutClick}
                  className={`${commonClasses} ${inactiveClassName}`}
                  aria-label="Logout"
                >
                  <FaSignOutAlt className="inline mr-1" aria-hidden="true" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`${commonClasses} ${inactiveClassName}`}
                >
                  <FaSignInAlt className="inline mr-1" aria-hidden="true" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                >
                  <FaUserPlus className="inline mr-1" aria-hidden="true" /> Sign
                  Up
                </Link>
              </>
            )}
          </div>

          <div className="-mr-2 flex md:hidden">
            {isLoggedIn && <Notifications />}
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
            id="mobile-menu"
          >
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
                {/* +++ ADDED DOCUMENTS LINK (Mobile - only if logged in) +++ */}
                {isLoggedIn && (
                  <NavLink
                    to="/documents"
                    className={({ isActive }) =>
                      `${commonClasses} ${
                        isActive ? activeClassName : inactiveClassName
                      }`
                    }
                    onClick={toggleMenu}
                  >
                    <FaFileAlt
                      className="inline mr-1 mb-0.5"
                      aria-hidden="true"
                    />
                    Documents
                  </NavLink>
                )}
                {/* +++ END +++ */}
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

            <div className="pt-4 pb-3 border-t border-gray-700">
              {isLoggedIn && currentUser ? (
                <div className="px-2 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={toggleMenu}
                  >
                    Your Profile ({currentUser.username})
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
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
