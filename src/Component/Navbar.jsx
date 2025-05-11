import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
// ... other imports you might have (logo, icons, etc.)

const Navbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // ... any other state or refs for dropdowns, etc.

  // Example: If you have a dropdown for user profile
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const activeLinkClass = "bg-gray-900 text-white";
  const inactiveLinkClass = "text-gray-300 hover:bg-gray-700 hover:text-white";
  const linkClasses =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors";

  return (
    <nav className="bg-gray-800 fixed w-full z-50 top-0 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed. */}
              {/* Heroicon name: outline/menu */}
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                // Icon when menu is open.
                // Heroicon name: outline/x
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Logo and Desktop Menu Items */}
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-white text-xl font-bold">
                {/* Replace with your logo if you have one */}
                YourPlatform
              </Link>
            </div>
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                <NavLink
                  to="/explore"
                  className={({ isActive }) =>
                    `${linkClasses} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                >
                  Explore
                </NavLink>
                <NavLink
                  to="/publications"
                  className={({ isActive }) =>
                    `${linkClasses} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                >
                  Publications
                </NavLink>
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `${linkClasses} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                >
                  Projects
                </NavLink>
                {/* +++ ADDED HELP CENTER LINK HERE FOR DESKTOP +++ */}
                <NavLink
                  to="/help-center"
                  className={({ isActive }) =>
                    `${linkClasses} ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`
                  }
                >
                  Help
                </NavLink>
              </div>
            </div>
          </div>

          {/* Right side: Auth buttons / User Profile Dropdown */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {isLoggedIn && currentUser ? (
              <div className="ml-3 relative" ref={profileDropdownRef}>
                <div>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    type="button"
                    className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    id="user-menu-button"
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full"
                      src={
                        currentUser.profilePictureUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          currentUser.fullName || currentUser.username || "User"
                        )}&background=random`
                      }
                      alt="User avatar"
                    />
                  </button>
                </div>
                {/* Profile dropdown */}
                {profileDropdownOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex="-1"
                  >
                    <Link
                      to={`/profile/${currentUser.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/documents"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      My Documents
                    </Link>
                    <Link
                      to="/settings/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        onLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex sm:space-x-2">
                <Link
                  to="/login"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `block ${linkClasses} ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </NavLink>
            <NavLink
              to="/publications"
              className={({ isActive }) =>
                `block ${linkClasses} ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Publications
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `block ${linkClasses} ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Projects
            </NavLink>
            {/* +++ ADDED HELP CENTER LINK HERE FOR MOBILE +++ */}
            <NavLink
              to="/help-center"
              className={({ isActive }) =>
                `block ${linkClasses} ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Help
            </NavLink>

            {/* Mobile Auth Links */}
            {!isLoggedIn && (
              <>
                <hr className="border-gray-700 my-2" />
                <Link
                  to="/login"
                  className={`block ${linkClasses} ${inactiveLinkClass}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className={`block text-center bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
