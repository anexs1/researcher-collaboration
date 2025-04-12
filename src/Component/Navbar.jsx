// src/Component/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom"; // Use NavLink for active styling
import ProfileMenu from "./ProfileMenu"; // Assuming this component exists and works

const Navbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Helper to close the mobile menu
  const closeMenu = () => setMenuOpen(false);

  // Reusable link styles for consistency
  const linkStyle =
    "block py-2 px-3 md:p-0 text-white rounded hover:bg-pink-600 md:hover:bg-transparent md:hover:text-pink-100 transition-colors duration-200";
  // Example active style - adjust as needed for your design
  const activeLinkStyle =
    "bg-pink-700 md:bg-transparent md:text-pink-100 md:font-semibold";

  return (
    // Sticky header with gradient background
    <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        {/* Site Title/Logo */}
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold tracking-tight hover:text-purple-100 transition-colors"
          onClick={closeMenu} // Close mobile menu on title click too
        >
          Researcher Collaboration Portal
        </Link>

        {/* Mobile Menu Button (Hamburger) */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)} // Toggle menu state
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-purple-100 hover:text-white hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen} // Accessibility attribute
          >
            <span className="sr-only">Open main menu</span>
            {/* Conditional rendering of burger/close icons */}
            {menuOpen ? (
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
            ) : (
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
            )}
          </button>
        </div>

        {/* Navigation Links Container */}
        {/* Handles mobile slide-in and desktop flex display */}
        <nav
          className={`absolute md:relative top-full left-0 right-0 w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 md:bg-none md:top-auto transition-transform duration-300 ease-in-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full" // Mobile slide effect
          } md:translate-x-0 md:flex md:items-center md:space-x-4 lg:space-x-6`}
          id="mobile-menu" // ID linked by aria-controls
        >
          <ul className="flex flex-col p-4 md:p-0 md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 lg:space-x-6 text-sm font-medium">
            {/* Standard Links */}
            <li>
              <NavLink
                to="/"
                end
                onClick={closeMenu}
                className={({ isActive }) =>
                  `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/explore"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                }
              >
                Explore
              </NavLink>
            </li>

            {/* Logged-in User Links */}
            {isLoggedIn && (
              <>
                <li>
                  <NavLink
                    to="/publications"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    My Publications
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/messages"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    Messages
                  </NavLink>
                </li>
                {/* Potential Placeholder for Notifications */}
                {/* <li className="relative"> <Notifications /> </li> */}
              </>
            )}

            {/* Profile Menu / Login/Signup (Always shown, ProfileMenu handles internal logic) */}
            <li className="relative pt-2 md:pt-0 md:ml-4">
              {" "}
              {/* Added margin for desktop separation */}
              <ProfileMenu
                isLoggedIn={isLoggedIn}
                currentUser={currentUser} // Pass user info
                onLogout={() => {
                  closeMenu(); // Close mobile menu if open
                  onLogout(); // Call the passed logout function
                }}
              />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
