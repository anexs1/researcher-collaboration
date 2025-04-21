// src/Component/Navbar.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import ProfileMenu from "./ProfileMenu"; // Make sure this component exists and is working

const Navbar = ({ isLoggedIn, currentUser, onLogout }) => {
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

        {/* Mobile Menu Button (optional to implement later) */}
        <div className="md:hidden">{/* Menu button logic */}</div>

        <nav
          className={`absolute md:relative top-full left-0 right-0 w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 md:bg-none md:top-auto transition-transform duration-300 ease-in-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:flex md:items-center md:space-x-4 lg:space-x-6`}
          id="mobile-menu"
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
                    to="/announcements"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    Announcements
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/my-projects"
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
                    to="/publications"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    Publications
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
                <li>
                  <NavLink
                    to="/activity"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    Activity
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/dashboard"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/projects/new"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    Create Project
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/settings"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `${linkStyle} ${isActive ? activeLinkStyle : ""}`
                    }
                  >
                    Settings
                  </NavLink>
                </li>
              </>
            )}

            {/* Profile Dropdown Menu */}
            <li className="relative pt-2 md:pt-0 md:ml-4">
              <ProfileMenu
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onLogout={() => {
                  closeMenu();
                  onLogout();
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
