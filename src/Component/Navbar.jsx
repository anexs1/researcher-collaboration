import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Import your Notifications component
import Notifications from "./Notifications"; // Adjust path if Notifications.jsx is elsewhere

// --- SVG Icon for Logo/Brand ---
const BrandIcon = ({
  className = "h-8 w-auto text-sky-400 group-hover:text-sky-300 transition-colors",
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
  </svg>
);

// --- Main Navigation Links Data ---
const mainNavLinks = [
  { path: "/explore", label: "Explore" },
  { path: "/publications", label: "Publications" },
  { path: "/projects", label: "Projects" },
  { path: "/help-center", label: "Help" },
];

const Navbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  // Notification state and refs are now handled by the Notifications.jsx component

  const profileDropdownRef = useRef(null);
  const profileButtonRef = useRef(null);

  // Effect for closing profile dropdown
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

  // Dynamic Profile Dropdown Links
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
        // { path: "/documents", label: "My Documents", type: "link" }, // REMOVED THIS LINE
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

  const baseLinkClasses =
    "relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 group flex items-center";
  const activeLinkClass = "text-white";
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
    `block px-4 py-3 rounded-md text-base font-medium transition-colors flex items-center
     ${
       isActive
         ? "bg-sky-600 text-white"
         : "text-gray-200 hover:bg-gray-700 hover:text-white"
     }`;

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleProfileDropdown = () => setProfileDropdownOpen((prev) => !prev);
  const closeProfileDropdown = () => setProfileDropdownOpen(false);
  // Notification toggles are handled by Notifications.jsx

  // Framer Motion Animation Variants (only for profile dropdown and mobile menu now)
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.15, ease: [0.1, 0.75, 0.5, 1] },
    },
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
      transition: { type: "spring", stiffness: 300, damping: 30, delay: 0.05 },
    },
  };
  const navItemVariants = {
    hidden: { opacity: 0, y: -15 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 + i * 0.07,
        type: "spring",
        stiffness: 120,
        damping: 14,
      },
    }),
  };

  return (
    <nav className="bg-gray-800/90 fixed w-full z-50 top-0 shadow-lg select-none backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Mobile toggle + Logo */}
          <div className="flex items-center">
            <div className="flex sm:hidden mr-2">
              <button
                onClick={toggleMobileMenu}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close-icon"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{
                        rotate: -90,
                        opacity: 0,
                        transition: { duration: 0.15 },
                      }}
                      transition={{ duration: 0.2 }}
                    >
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
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu-icon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{
                        rotate: 90,
                        opacity: 0,
                        transition: { duration: 0.15 },
                      }}
                      transition={{ duration: 0.2 }}
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <Link
              to="/"
              className="flex-shrink-0 flex items-center group"
              onClick={closeMobileMenu}
              aria-label="Homepage"
            >
              <BrandIcon />
            </Link>
          </div>

          {/* Right Side: Desktop Nav & Icons/Auth/Profile */}
          <div className="flex items-center">
            <div className="hidden sm:flex sm:items-center sm:space-x-1 md:space-x-3">
              {mainNavLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  custom={i}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <NavLink to={link.path} className={getNavLinkClass}>
                    {link.icon} {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>

            {mainNavLinks.length > 0 && (
              <div className="hidden sm:block sm:ml-3 sm:mr-1 sm:border-l sm:border-gray-700 sm:h-6"></div>
            )}

            {/* Icons (Notifications) and Auth/Profile Section */}
            <div className="flex items-center ml-2">
              {" "}
              {/* Ensure `ml-2` or similar spacing if needed */}
              {isLoggedIn && currentUser && (
                <>
                  {/* Use your Notifications component here */}
                  <Notifications />

                  {/* Profile Dropdown */}
                  <div className="relative ml-3" ref={profileDropdownRef}>
                    {" "}
                    {/* Added ml-3 for spacing from Notifications */}
                    <motion.button
                      ref={profileButtonRef}
                      type="button"
                      onClick={toggleProfileDropdown}
                      className="flex text-sm bg-gray-700/50 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 p-0.5 hover:ring-sky-400 transition-all"
                      id="user-menu-button"
                      aria-expanded={profileDropdownOpen}
                      aria-haspopup="true"
                      whileHover={{
                        scale: 1.1,
                        boxShadow: "0px 0px 8px rgb(56, 189, 248)",
                      }}
                      whileTap={{ scale: 0.95 }}
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
                    </motion.button>
                    <AnimatePresence>
                      {profileDropdownOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-lg bg-white py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-30"
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
                                      className="text-xs text-gray-500 truncate"
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
                                tabIndex={-1}
                                onClick={closeProfileDropdown}
                                className={({ isActive }) =>
                                  `block px-4 py-2.5 text-sm rounded-md mx-1 my-0.5 transition-colors ${
                                    isActive
                                      ? "bg-sky-500 text-white font-semibold"
                                      : "text-gray-700 hover:bg-sky-50 hover:text-sky-600"
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
                                tabIndex={-1}
                                className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded-md mx-1 my-0.5 transition-colors focus:bg-sky-100 focus:outline-none"
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
              {!isLoggedIn && (
                <div className="hidden sm:flex sm:items-center sm:space-x-2 ml-3">
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
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu-panel"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="sm:hidden absolute inset-x-0 top-16 bg-gray-800/95 shadow-xl py-3 z-40 border-t border-gray-700/50 backdrop-blur-sm overflow-y-auto max-h-[calc(100vh-4rem)]"
            id="mobile-menu"
          >
            {/* Navigation links for mobile */}
            <div className="space-y-1 px-3 pt-2 pb-3">
              {mainNavLinks.map((link) => (
                <NavLink
                  key={`mobile-${link.path}`}
                  to={link.path}
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {link.icon} {link.label}
                </NavLink>
              ))}
            </div>
            {/* Auth links for mobile if not logged in */}
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
            {/* Profile section for mobile if logged in */}
            {isLoggedIn && currentUser && (
              <div className="border-t border-gray-700 pt-4 pb-3 px-3">
                <div className="flex items-center px-2 mb-3">
                  {/* Mobile Notifications could also go here if you want them separate from the header icon */}
                  {/* For now, Notifications component is in the main header, visible on mobile too */}
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
