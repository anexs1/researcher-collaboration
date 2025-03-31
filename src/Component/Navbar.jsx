// src/Component/Navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Notifications from "./Notifications";
import ProfileMenu from "./ProfileMenu";
import "../index.css"; // Or your specific Navbar CSS

const Navbar = ({ isLoggedIn, isAdmin, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="relative bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg py-5 px-6 flex items-center justify-between transition-all duration-500 ease-in-out">
      {/* ... (Animated Background Blob - keep as is) ... */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {" "}
        ...{" "}
      </div>

      <Link
        to="/"
        className="relative z-10 text-3xl font-extrabold tracking-tight hover:text-blue-100 transition-colors duration-300"
      >
        Researcher Collaboration Portal
      </Link>

      {/* --- Hamburger Icon (For Mobile - keep as is) --- */}
      <button
        className="md:hidden text-white focus:outline-none relative z-10"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {/* ... (SVG Icon - keep as is) ... */}
        <svg
          className="w-7 h-7 fill-current"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {" "}
          ...{" "}
        </svg>
      </button>

      {/* --- Navigation Links --- */}
      {/* Apply mobile visibility logic here */}
      <nav
        className={`absolute md:relative top-full left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 md:bg-none md:top-auto md:left-auto md:right-auto p-4 md:p-0 transition-all duration-300 ease-in-out ${
          menuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        } md:opacity-100 md:translate-y-0 md:pointer-events-auto flex-grow md:flex-grow-0 md:block z-10 md:z-auto`}
      >
        <ul className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 lg:space-x-6">
          {" "}
          {/* Adjusted spacing */}
          {/* --- Common Links --- */}
          <li>
            <Link to="/" onClick={closeMenu} className="navbar-link-style">
              🏠 Home
            </Link>
          </li>
          <li>
            <Link
              to="/explore"
              onClick={closeMenu}
              className="navbar-link-style"
            >
              🔬 Explore
            </Link>
          </li>
          {/* --- Logged In User Links --- */}
          {isLoggedIn && (
            <>
              <li>
                <Link
                  to="/my-projects"
                  onClick={closeMenu}
                  className="navbar-link-style"
                >
                  📁 My Projects
                </Link>
              </li>
              <li>
                <Link
                  to="/publications"
                  onClick={closeMenu}
                  className="navbar-link-style"
                >
                  📰 Publications
                </Link>
              </li>
              <li>
                <Link
                  to="/messages"
                  onClick={closeMenu}
                  className="navbar-link-style"
                >
                  💬 Messages
                </Link>
              </li>
              <li>
                <Notifications />
              </li>
            </>
          )}
          {/* --- ADMIN SECTION --- */}
          {/* 1. Link to Admin Login Page (Visible only when LOGGED OUT) */}
          {!isLoggedIn && (
            <li>
              <Link
                to="/admin-login" // Points to the new route
                onClick={closeMenu}
                className="navbar-link-style font-semibold text-yellow-200 hover:text-white" // Example distinct style
              >
                👑 Admin
              </Link>
            </li>
          )}
          <li>
            <ProfileMenu
              isLoggedIn={isLoggedIn}
              onLogout={() => {
                closeMenu();
                onLogout();
              }}
            />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
