import React, { useState } from "react";
import { Link } from "react-router-dom";
import Notifications from "./Notifications";
import ProfileMenu from "./ProfileMenu";
import "../index.css";

const Navbar = ({ isLoggedIn, isAdmin, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false); // State for Chat Popup

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="relative bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg py-5 px-6 flex items-center justify-between transition-all duration-500 ease-in-out">
      {/* Animated Background Blob */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <Link
        to="/"
        className="relative z-10 text-3xl font-extrabold tracking-tight hover:text-blue-100 transition-colors duration-300"
      >
        Researcher Collaboration Portal
      </Link>

      <nav
        className={`nav-links flex items-center space-x-8 ${
          menuOpen
            ? "block opacity-100 translate-y-0"
            : "hidden opacity-0 -translate-y-4"
        } md:flex md:space-x-8 md:block relative z-10 transition-opacity duration-500 ease-in-out md:opacity-100 md:translate-y-0`}
      >
        <ul className="flex flex-col md:flex-row md:space-x-8 items-center">
          <li>
            <Link
              to="/"
              onClick={closeMenu}
              className="relative group overflow-hidden py-2 px-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors duration-300"
            >
              <span className="relative z-10">🏠 Homes</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
            </Link>
          </li>
          <li>
            <Link
              to="/explore"
              onClick={closeMenu}
              className="relative group overflow-hidden py-2 px-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors duration-300"
            >
              <span className="relative z-10">🔬 Explore</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
            </Link>
          </li>
          <li>
            <Link
              to="/my-projects"
              onClick={closeMenu}
              className="relative group overflow-hidden py-2 px-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors duration-300"
            >
              <span className="relative z-10">📁 My Projects</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
            </Link>
          </li>
          <li>
            <Link
              to="/publications"
              onClick={closeMenu}
              className="relative group overflow-hidden py-2 px-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors duration-300"
            >
              <span className="relative z-10">📰 Publications</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
            </Link>
          </li>
          <li>
            <Link
              to="/messages"
              onClick={closeMenu}
              className="relative group overflow-hidden py-2 px-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors duration-300"
            >
              <span className="relative z-10">💬 Messages</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
            </Link>
          </li>

          {/* Notifications Component */}
          {isLoggedIn && (
            <li>
              <Notifications />
            </li>
          )}

          {/* Admin Panel - Dropdown for Admins */}
          {isAdmin && (
            <li
              className="relative group"
              onMouseEnter={() => setAdminDropdownOpen(true)}
              onMouseLeave={() => setAdminDropdownOpen(false)}
            >
              <button className="relative z-10 bg-purple-400 hover:bg-purple-300 text-white font-semibold py-2 px-4 rounded-full transition-colors duration-300">
                ⚙️ Admin
              </button>
              {adminDropdownOpen && (
                <ul className="dropdown-menu absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl z-20 transform scale-0 group-hover:scale-100 transition-transform duration-300 origin-top-right">
                  <li>
                    <Link
                      to="/admin"
                      onClick={closeMenu}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-300"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/users"
                      onClick={closeMenu}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-300"
                    >
                      Manage Users
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/reports"
                      onClick={closeMenu}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-300"
                    >
                      View Reports
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/settings"
                      onClick={closeMenu}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-300"
                    >
                      Settings
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          {/* Profile Menu Component */}
          <li>
            <ProfileMenu isLoggedIn={isLoggedIn} onLogout={onLogout} />
          </li>
        </ul>
      </nav>

      {/* Hamburger Icon (For Mobile) */}
      <button
        className="md:hidden text-white focus:outline-none relative z-10"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <svg
          className="w-7 h-7 fill-current"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Menu</title>
          <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-6z" />
        </svg>
      </button>
    </header>
  );
};

export default Navbar;
