import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Import your Notifications component
// MAKE SURE this file exists and exports a valid React component.
// e.g., in Notifications.jsx:
// const Notifications = () => { /* ... your component ... */ }; export default Notifications;
import Notifications from "./Notifications";

// --- SVG Icon for Logo/Brand ---
const BrandIcon = ({
  className = "h-8 w-auto text-sky-400 group-hover:text-sky-300 transition-colors group-hover:scale-105",
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

// --- Placeholder SVG Icons for Main Navigation (Replace with actual icons) ---
const ExploreIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5"
    />
  </svg>
);
const PublicationsIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H5.625a2.25 2.25 0 01-2.25-2.25V10.875c0-.621.504-1.125 1.125-1.125H8.25m3.75 9v6m0-6h2.25m-2.25 0h-2.25"
    />
  </svg>
);
const ProjectsIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-.813 2.846a4.5 4.5 0 00-3.09 3.09zM18.25 12L18 14.25l-.25-2.25a3.375 3.375 0 00-2.401-2.401L13.5 9.25l2.25-.25a3.375 3.375 0 002.401-2.401L18.25 4.5l.25 2.25a3.375 3.375 0 002.401 2.401L23.25 9.25l-2.25.25a3.375 3.375 0 00-2.401 2.401z"
    />
  </svg>
);
const HelpIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
    />
  </svg>
);

// --- Main Navigation Links Data ---
const mainNavLinks = [
  { path: "/explore", label: "Explore", icon: <ExploreIcon /> },
  { path: "/publications", label: "Publications", icon: <PublicationsIcon /> },
  { path: "/projects", label: "Projects", icon: <ProjectsIcon /> },
  { path: "/help-center", label: "Help", icon: <HelpIcon /> },
];

const Navbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const profileDropdownRef = useRef(null);
  const profileButtonRef = useRef(null);

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
        if (profileButtonRef.current) {
          profileButtonRef.current.focus();
        }
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
        { path: "/settings/account", label: "Settings", type: "link" },
        { type: "divider" },
        {
          action: () => {
            if (typeof onLogout === "function") {
              onLogout();
            } else {
              console.error("onLogout prop is not a function");
            }
            setProfileDropdownOpen(false);
          },
          label: "Sign out",
          type: "button",
          isDestructive: true,
        },
      ]
    : [];

  const baseLinkClasses =
    "relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 group flex items-center";
  const activeLinkClass = "text-sky-300 font-semibold bg-white/10";
  const inactiveLinkClass =
    "text-slate-300 hover:text-sky-300 hover:bg-white/5";

  const getNavLinkClass = ({ isActive }) =>
    `${baseLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}
     after:content-[''] after:absolute after:left-1/2 after:right-1/2 after:bottom-0 after:h-0.5 
     after:bg-gradient-to-r after:from-sky-400 after:to-pink-500
     after:transition-all after:duration-300 ${
       isActive
         ? "after:left-0 after:right-0"
         : "group-hover:after:left-[25%] group-hover:after:right-[25%] group-focus-visible:after:left-[25%] group-focus-visible:after:right-[25%]"
     }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-md text-base font-medium transition-colors flex items-center
     ${
       isActive
         ? "bg-sky-600 text-white shadow-md"
         : "text-slate-200 hover:bg-purple-700 hover:text-white"
     }`;

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleProfileDropdown = () => setProfileDropdownOpen((prev) => !prev);
  const closeProfileDropdown = () => setProfileDropdownOpen(false);

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
    <nav className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 fixed w-full z-50 top-0 shadow-xl select-none backdrop-blur-md border-b border-purple-800/50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex sm:hidden mr-2">
              <button
                onClick={toggleMobileMenu}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-purple-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
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
              <span className="ml-2 text-xl font-bold text-slate-200 group-hover:text-sky-300 transition-colors"></span>
            </Link>
          </div>

          <div className="flex items-center">
            <div className="hidden sm:flex sm:items-center sm:space-x-1 md:space-x-2">
              {mainNavLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  custom={i}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <NavLink to={link.path} className={getNavLinkClass}>
                    {link.icon &&
                      React.isValidElement(link.icon) &&
                      React.cloneElement(link.icon, {
                        className:
                          `w-5 h-5 mr-1.5 group-hover:text-sky-300 transition-colors ${
                            link.icon.props.className || ""
                          }`.trim(),
                      })}
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>

            {mainNavLinks.length > 0 && (
              <div className="hidden sm:block sm:ml-3 sm:mr-1 sm:border-l sm:border-purple-700/60 sm:h-6"></div>
            )}

            <div className="flex items-center ml-2">
              {isLoggedIn && currentUser && (
                <>
                  {Notifications && typeof Notifications === "function" ? (
                    <div className="mr-3">
                      <Notifications />
                    </div>
                  ) : process.env.NODE_ENV === "development" ? (
                    <div className="mr-3 text-xs text-red-400">
                      Notifications component missing or invalid.
                    </div>
                  ) : null}

                  <div className="relative" ref={profileDropdownRef}>
                    <motion.button
                      ref={profileButtonRef}
                      type="button"
                      onClick={toggleProfileDropdown}
                      className="flex text-sm bg-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-900 p-0.5 hover:ring-2 hover:ring-sky-400 transition-all"
                      id="user-menu-button"
                      aria-expanded={profileDropdownOpen}
                      aria-haspopup="true"
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0px 0px 12px rgb(56, 189, 248, 0.7)",
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
                          )}&background=6366f1&color=fff&size=128&font-size=0.5&bold=true`
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
                          className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-lg bg-slate-800/95 backdrop-blur-sm py-1 shadow-2xl ring-1 ring-purple-700/50 focus:outline-none z-30 border border-purple-700/30"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="user-menu-button"
                        >
                          {profileDropdownLinks.map((item, index) => {
                            if (item.type === "header")
                              return (
                                <div
                                  key={`header-${index}`}
                                  className="px-4 py-3 border-b border-slate-700"
                                >
                                  <p
                                    className="text-sm font-semibold text-slate-100 truncate"
                                    title={item.label}
                                  >
                                    {item.label}
                                  </p>
                                  {item.email && (
                                    <p
                                      className="text-xs text-slate-400 truncate"
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
                                  className="border-slate-700 my-1"
                                />
                              );

                            const itemBaseClass =
                              "block w-full text-left px-4 py-2.5 text-sm rounded-md mx-1 my-0.5 transition-colors focus:outline-none";

                            if (item.type === "link") {
                              return (
                                <NavLink
                                  to={item.path}
                                  key={item.path || `profile-link-${index}`} // Fallback key
                                  role="menuitem"
                                  tabIndex={-1}
                                  onClick={closeProfileDropdown}
                                  className={({ isActive }) =>
                                    `${itemBaseClass} ${
                                      isActive
                                        ? "bg-sky-500 text-white font-semibold shadow-md"
                                        : "text-slate-300 hover:bg-sky-600/70 hover:text-white focus-visible:bg-sky-600/70 focus-visible:text-white"
                                    }`
                                  }
                                >
                                  {item.label}
                                </NavLink>
                              );
                            } else if (item.type === "button") {
                              const itemSpecificClass = item.isDestructive
                                ? "text-rose-400 hover:bg-rose-600/70 hover:text-white focus-visible:bg-rose-600/70 focus-visible:text-white"
                                : "text-slate-300 hover:bg-sky-600/70 hover:text-white focus-visible:bg-sky-600/70 focus-visible:text-white";
                              return (
                                <button
                                  onClick={item.action}
                                  key={item.label || `profile-button-${index}`} // Fallback key
                                  role="menuitem"
                                  tabIndex={-1}
                                  className={`${itemBaseClass} ${itemSpecificClass}`}
                                >
                                  {item.label}
                                </button>
                              );
                            }
                            return null;
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
                    className={`${baseLinkClasses} ${inactiveLinkClass} hover:!bg-purple-600/30`}
                  >
                    Log In
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className={`${baseLinkClasses} bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 active:scale-95 shadow-lg hover:shadow-pink-500/40`}
                  >
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu-panel"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="sm:hidden absolute inset-x-0 top-16 bg-slate-900/95 shadow-xl py-3 z-40 border-t border-purple-800/60 backdrop-blur-md overflow-y-auto max-h-[calc(100vh-4rem)]"
            id="mobile-menu"
          >
            <div className="space-y-1 px-3 pt-2 pb-3">
              {mainNavLinks.map((link) => (
                <NavLink
                  key={`mobile-${link.path}`}
                  to={link.path}
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  {link.icon &&
                    React.isValidElement(link.icon) &&
                    React.cloneElement(link.icon, {
                      className: `w-5 h-5 mr-3 ${
                        link.icon.props.className || ""
                      }`.trim(),
                    })}
                  {link.label}
                </NavLink>
              ))}
            </div>
            {!isLoggedIn && (
              <div className="border-t border-purple-700/50 pt-4 pb-3 px-3 space-y-2">
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className={`block w-full text-center ${baseLinkClasses} ${inactiveLinkClass} hover:!bg-purple-700`}
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={closeMobileMenu}
                  className={`block text-center ${baseLinkClasses} bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 active:scale-95 shadow-md`}
                >
                  Sign Up
                </NavLink>
              </div>
            )}
            {isLoggedIn && currentUser && (
              <div className="border-t border-purple-700/50 pt-4 pb-3 px-3">
                <div className="flex items-center px-2 mb-3">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-purple-500/70"
                      src={
                        currentUser.profilePictureUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          currentUser.fullName || currentUser.username || "U"
                        )}&background=818cf8&color=fff&size=128`
                      }
                      alt="User"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-slate-100 truncate">
                      {currentUser.fullName || currentUser.username}
                    </p>
                    {currentUser.email && (
                      <p className="text-sm font-medium text-slate-400 truncate">
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
                    .map((item, index) => {
                      // Added index for fallback key
                      const mobileItemBaseClass =
                        "block w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors flex items-center";

                      if (item.type === "link") {
                        return (
                          <NavLink
                            key={`mobile-profile-link-${item.path || index}`} // Fallback key
                            to={item.path}
                            className={({ isActive }) =>
                              `${mobileItemBaseClass} ${
                                isActive
                                  ? "bg-sky-600 text-white"
                                  : "text-slate-200 hover:bg-purple-700 hover:text-white"
                              }`
                            }
                            onClick={closeMobileMenu}
                          >
                            {item.label}
                          </NavLink>
                        );
                      } else if (item.type === "button") {
                        const mobileItemSpecificClass = item.isDestructive
                          ? "text-rose-400 hover:bg-rose-600/80 hover:text-white"
                          : "text-slate-200 hover:bg-purple-700 hover:text-white";
                        return (
                          <button
                            key={`mobile-profile-button-${item.label || index}`} // Fallback key
                            onClick={() => {
                              item.action();
                              closeMobileMenu();
                            }}
                            className={`${mobileItemBaseClass} ${mobileItemSpecificClass}`}
                          >
                            {item.label}
                          </button>
                        );
                      }
                      return null;
                    })}
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
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // .isRequired removed as a test, though ideally ID is required
    fullName: PropTypes.string,
    username: PropTypes.string,
    email: PropTypes.string,
    profilePictureUrl: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired, // This IS required. Ensure it's a function.
};

Navbar.defaultProps = {
  isLoggedIn: false,
  currentUser: null, // If currentUser is null, properties like .id will not be accessed due to `isLoggedIn && currentUser` check
};

export default Navbar;
