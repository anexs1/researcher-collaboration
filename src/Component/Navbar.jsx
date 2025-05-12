import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- Optional Icons ---
// import { FaSearch, FaBook, FaProjectDiagram, FaQuestionCircle } from 'react-icons/fa';

const mainNavLinks = [
  { path: "/explore", label: "Explore" /* icon: <FaSearch /> */ },
  { path: "/publications", label: "Publications" /* icon: <FaBook /> */ },
  { path: "/projects", label: "Projects" /* icon: <FaProjectDiagram /> */ },
  { path: "/help-center", label: "Help" /* icon: <FaQuestionCircle /> */ },
];

const Navbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const profileButtonRef = useRef(null);

  // Effects for closing dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setProfileDropdownOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [profileDropdownOpen]);

  const profileDropdownLinks = currentUser
    ? [
        {
          type: "header",
          label: currentUser.fullName || currentUser.username,
          email: currentUser.email,
        },
        { type: "divider" },
        {
          path: `/profile/${currentUser.id}`,
          label: "Your Profile",
          type: "link",
        },
        { path: "/documents", label: "My Documents", type: "link" },
        { path: "/settings/account", label: "Settings", type: "link" },
        { type: "divider" },
        {
          action: () => {
            onLogout();
            setProfileDropdownOpen(false);
          },
          label: "Sign out",
          type: "button",
        },
      ]
    : [];

  // Tailwind CSS Classes
  const baseLinkClasses =
    "relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 group";
  const activeLinkClass = "text-white"; // Active link will have an underline pseudo-element
  const inactiveLinkClass = "text-gray-300 hover:text-white";

  const getNavLinkClass = ({ isActive }) =>
    `${baseLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}
     after:content-[''] after:absolute after:left-1/2 after:right-1/2 after:bottom-0 after:h-0.5 after:bg-sky-400
     after:transition-all after:duration-300 ${
       isActive
         ? "after:left-0 after:right-0"
         : "group-hover:after:left-0 group-hover:after:right-0"
     }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-md text-base font-medium transition-colors
     ${
       isActive
         ? "bg-sky-600 text-white"
         : "text-gray-200 hover:bg-gray-700 hover:text-white"
     }`;

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleProfileDropdown = () => setProfileDropdownOpen((prev) => !prev);
  const closeProfileDropdown = () => setProfileDropdownOpen(false);

  // Animation Variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.15, ease: [0.1, 0.75, 0.5, 1] },
    }, // Custom ease
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.98,
      transition: { duration: 0.1, ease: "easeIn" },
    },
  };
  const mobileMenuVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    closed: {
      opacity: 0,
      x: "-100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };
  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.2 },
    }),
  };

  return (
    <nav className="bg-gray-800 fixed w-full z-50 top-0 shadow-lg select-none backdrop-blur-md bg-opacity-80 border-b border-gray-700/50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        {/* Changed to max-w-screen-xl for wider layout */}
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="flex items-center text-white group"
              onClick={closeMobileMenu}
            >
              {/* Placeholder for a nicer logo */}
              <svg
                className="h-8 w-auto text-sky-400 group-hover:text-sky-300 transition-colors"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="ml-2 text-xl font-bold group-hover:opacity-80 transition-opacity">
                CollabResearch
              </span>
            </Link>
          </div>
          {/* Right Side: Desktop Nav, Auth/Profile, Mobile Toggle */}
          <div className="flex items-center">
            {/* Desktop Navigation Links (Now on the right) */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-2 md:space-x-4">
              {mainNavLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  custom={i}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <NavLink to={link.path} className={getNavLinkClass}>
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>

            {/* Separator before Auth/Profile on Desktop */}
            <div className="hidden sm:block sm:ml-4 sm:border-l sm:border-gray-700 sm:h-6"></div>

            {/* Auth or User Profile Dropdown */}
            <div className="ml-3 sm:ml-4 relative" ref={profileDropdownRef}>
              {isLoggedIn && currentUser ? (
                <>
                  <button
                    ref={profileButtonRef}
                    type="button"
                    onClick={toggleProfileDropdown}
                    className="flex text-sm bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 p-0.5 hover:ring-sky-400 transition-all"
                    id="user-menu-button"
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={
                        currentUser.profilePictureUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          currentUser.fullName || currentUser.username || "U"
                        )}&background=random&color=fff&size=128&font-size=0.5&bold=true`
                      }
                      alt="User profile"
                    />
                  </button>
                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-60 origin-top-right rounded-md bg-white py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-30"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                      >
                        {profileDropdownLinks.map((item, index) => {
                          if (item.type === "header")
                            return (
                              <div
                                key={`header-${index}`}
                                className="px-4 py-3 border-b border-gray-100"
                              >
                                <p
                                  className="text-sm font-semibold text-gray-800 truncate"
                                  title={item.label}
                                >
                                  {item.label}
                                </p>
                                {item.email && (
                                  <p
                                    className="text-xs text-gray-400 truncate"
                                    title={item.email}
                                  >
                                    {item.email}
                                  </p>
                                )}
                              </div>
                            );
                          if (item.type === "divider")
                            return (
                              <hr
                                key={`divider-${index}`}
                                className="border-gray-100 my-1"
                              />
                            );
                          return item.type === "link" ? (
                            <NavLink
                              to={item.path}
                              key={item.path}
                              role="menuitem"
                              tabIndex="-1"
                              onClick={closeProfileDropdown}
                              className={({ isActive }) =>
                                `block px-4 py-2 text-sm rounded-sm mx-1 transition-colors ${
                                  isActive
                                    ? "bg-sky-500 text-white"
                                    : "text-gray-700 hover:bg-sky-100 hover:text-sky-700"
                                }`
                              }
                            >
                              {item.label}
                            </NavLink>
                          ) : (
                            <button
                              onClick={item.action}
                              key={item.label}
                              role="menuitem"
                              tabIndex="-1"
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-sky-100 hover:text-sky-700 rounded-sm mx-1 transition-colors focus:bg-sky-100 focus:outline-none"
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="hidden sm:flex sm:items-center sm:space-x-2">
                  <NavLink
                    to="/login"
                    className={`${baseLinkClasses} ${inactiveLinkClass}`}
                  >
                    Log In
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className={`${baseLinkClasses} bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 active:scale-95 shadow-md`}
                  >
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button (Now part of the right-aligned group) */}
            <div className="flex sm:hidden ml-3">
              <button
                onClick={toggleMobileMenu}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>{" "}
          {/* End Right Side Group */}
        </div>{" "}
        {/* End Main Flex Container */}
      </div>{" "}
      {/* End Max Width Container */}
      {/* Mobile Navigation Menu (Dropdown) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu" // Add a key for AnimatePresence
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="sm:hidden fixed inset-x-0 top-16 bg-gray-800 shadow-xl py-3 z-40 border-t border-gray-700" // Changed to fixed for full-width feel
            id="mobile-menu"
          >
            <div className="space-y-1 px-3">
              {" "}
              {/* Added more padding */}
              {mainNavLinks.map((link) => (
                <NavLink
                  key={`mobile-${link.path}`}
                  to={link.path}
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            {!isLoggedIn && (
              <div className="border-t border-gray-700 pt-4 pb-3 px-3 space-y-2">
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className={`block w-full text-center ${baseLinkClasses} ${inactiveLinkClass}`}
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={closeMobileMenu}
                  className={`block text-center ${baseLinkClasses} bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 active:scale-95 shadow-md`}
                >
                  Sign Up
                </NavLink>
              </div>
            )}
            {isLoggedIn && currentUser && (
              <div className="border-t border-gray-700 pt-4 pb-3 px-3">
                <div className="flex items-center px-2 mb-3">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={
                        currentUser.profilePictureUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          currentUser.fullName || currentUser.username || "U"
                        )}&background=random&color=fff&size=128`
                      }
                      alt="User"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white truncate">
                      {currentUser.fullName || currentUser.username}
                    </p>
                    {currentUser.email && (
                      <p className="text-sm font-medium text-gray-400 truncate">
                        {currentUser.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {profileDropdownLinks
                    .filter(
                      (item) => item.type === "link" || item.type === "button"
                    )
                    .map((item) =>
                      item.type === "link" ? (
                        <NavLink
                          key={`mobile-profile-${item.path}`}
                          to={item.path}
                          className={mobileNavLinkClass}
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </NavLink>
                      ) : (
                        <button
                          key={`mobile-profile-${item.label}`}
                          onClick={() => {
                            item.action();
                            closeMobileMenu();
                          }}
                          className={`block w-full text-left ${mobileNavLinkClass} ${inactiveLinkClass}`}
                        >
                          {item.label}
                        </button>
                      )
                    )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

Navbar.propTypes = {
  isLoggedIn: PropTypes.bool,
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fullName: PropTypes.string,
    username: PropTypes.string,
    email: PropTypes.string,
    profilePictureUrl: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
};

Navbar.defaultProps = {
  isLoggedIn: false,
  currentUser: null,
};

export default Navbar;
