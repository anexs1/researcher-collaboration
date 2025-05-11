import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types"; // For prop type validation
import { Link, NavLink } from "react-router-dom";

// --- Constants for Navigation Links ---
const mainNavLinks = [
  { path: "/explore", label: "Explore" },
  { path: "/publications", label: "Publications" },
  { path: "/projects", label: "Projects" },
  { path: "/help-center", label: "Help" },
];

const Navbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const profileButtonRef = useRef(null); // Ref for the profile button for ARIA

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target) &&
        profileButtonRef.current && // Ensure button also doesn't contain the click
        !profileButtonRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]); // Re-run only when profileDropdownOpen changes

  // --- Dynamic Profile Dropdown Links ---
  const profileDropdownLinks = currentUser
    ? [
        {
          path: `/profile/${currentUser.id}`,
          label: "Your Profile",
          type: "link",
        },
        { path: "/documents", label: "My Documents", type: "link" },
        {
          path: "/settings/account",
          label: "Settings",
          type: "link",
        },
        {
          action: () => {
            onLogout();
            setProfileDropdownOpen(false); // Close dropdown on logout
          },
          label: "Sign out",
          type: "button",
        },
      ]
    : [];

  // --- Tailwind CSS Classes ---
  const baseLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkClass = "bg-gray-900 text-white";
  const inactiveLinkClass = "text-gray-300 hover:bg-gray-700 hover:text-white";

  const getNavLinkClass = ({ isActive }) =>
    `${baseLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block ${baseLinkClasses} ${isActive ? activeLinkClass : inactiveLinkClass}`;


  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleProfileDropdown = () => setProfileDropdownOpen((prev) => !prev);
  const closeProfileDropdown = () => setProfileDropdownOpen(false);


  return (
    <nav className="bg-gray-800 fixed w-full z-50 top-0 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Mobile toggle (sm only) + Logo */}
          <div className="flex items-center">
            {/* Mobile Menu Toggle Button */}
            <div className="flex sm:hidden mr-2"> {/* Added mr-2 for spacing from logo */}
              <button
                onClick={toggleMobileMenu}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 text-white text-xl font-bold" onClick={closeMobileMenu}>
              CollabResearch
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {mainNavLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={getNavLinkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right Side: Auth or User Profile */}
          <div className="ml-4 flex items-center">
            {isLoggedIn && currentUser ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  ref={profileButtonRef}
                  type="button"
                  onClick={toggleProfileDropdown}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  id="user-menu-button"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full object-cover" // Added object-cover
                    src={
                      currentUser.profilePictureUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        currentUser.fullName || currentUser.username || "User"
                      )}&background=random&color=fff` // Added &color=fff for better contrast
                    }
                    alt={`${currentUser.fullName || currentUser.username || "Current User"}'s profile picture`}
                  />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20" // Increased z-index
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex="-1" // Allows programmatic focus if needed
                  >
                    {profileDropdownLinks.map((item) =>
                      item.type === "link" ? (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          tabIndex="-1"
                          onClick={closeProfileDropdown}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          tabIndex="-1"
                        >
                          {item.label}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex sm:items-center sm:space-x-2">
                <Link
                  to="/login"
                  className={`${baseLinkClasses} ${inactiveLinkClass}`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className={`${baseLinkClasses} bg-indigo-500 text-white hover:bg-indigo-600`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu (Dropdown) */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-gray-800" id="mobile-menu">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {mainNavLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={mobileNavLinkClass}
                onClick={closeMobileMenu} // Close menu on link click
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          {/* Auth Links for Mobile */}
          {!isLoggedIn && (
            <div className="border-t border-gray-700 pt-3 pb-3 px-2 space-y-1">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className={`block ${baseLinkClasses} ${inactiveLinkClass}`}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={closeMobileMenu}
                className="block text-center bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-base font-medium" // Kept distinct style for prominence
              >
                Sign Up
              </Link>
            </div>
          )}
          {/* If logged in, you could optionally show profile links here too, or just rely on the avatar dropdown */}
        </div>
      )}
    </nav>
  );
};

// --- PropTypes ---
Navbar.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fullName: PropTypes.string,
    username: PropTypes.string,
    profilePictureUrl: PropTypes.string,
  }), // Can be null if not logged in, but shape is expected if isLoggedIn is true
  onLogout: PropTypes.func.isRequired,
};

// Default prop for currentUser if not logged in
Navbar.defaultProps = {
  currentUser: null,
};

export default Navbar;