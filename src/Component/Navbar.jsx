import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

const Navbar = ({ isLoggedIn, currentUser }) => {
  // Removed onLogout prop
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const linkStyle =
    "block py-2 px-3 md:p-0 text-white rounded hover:bg-pink-600 md:hover:bg-transparent md:hover:text-pink-100 transition-colors duration-200";
  const activeLinkStyle =
    "bg-pink-700 md:bg-transparent md:text-pink-100 md:font-semibold";

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold tracking-tight hover:text-purple-100 transition-colors"
          onClick={closeMenu}
        >
          Researcher Collaboration Portal
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md text-white hover:bg-pink-700 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>

        <nav
          className={`absolute md:relative top-full left-0 right-0 w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 md:bg-none md:top-auto transition-transform duration-300 ease-in-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:flex md:items-center md:space-x-4 lg:space-x-6`}
        >
          <ul className="flex flex-col p-4 md:p-0 md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 lg:space-x-6 text-sm font-medium">
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
            {isLoggedIn && (
              <>
                <li>
                  <NavLink
                    to="/projects"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    Projects
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
              </>
            )}

            {/* Profile Dropdown Menu - without any logout functionality */}
            <li className="relative pt-2 md:pt-0 md:ml-4">
              <ProfileMenu
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                // No onLogout prop passed at all
              />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
