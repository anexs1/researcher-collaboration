import { Link } from "react-router-dom";
import { useState } from "react";
import Notifications from "./Notifications";
import ProfileMenu from "./ProfileMenu";
import SearchBar from "./SearchBar";

import "./Navbar.css";

const Navbar = ({ isLoggedIn, isAdmin, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      {/* Search Bar Component */}
      <SearchBar />

      {/* Mobile Menu Toggle */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
        <ul>
          <li>
            <Link to="/" onClick={closeMenu}>
              🏠 Home
            </Link>
          </li>
          <li>
            <Link to="/explore" onClick={closeMenu}>
              🔬 Explore
            </Link>
          </li>
          <li>
            <Link to="/my-projects" onClick={closeMenu}>
              📁 My Projects
            </Link>
          </li>
          <li>
            <Link to="/messages" onClick={closeMenu}>
              💬 Messages
            </Link>
          </li>
          <li>
            <Link to="/publications" onClick={closeMenu}>
              📰 Publications
            </Link>
          </li>

          {/* Notifications Component */}
          {isLoggedIn && <Notifications />}

          {/* Admin Panel - Dropdown for Admins */}
          {isAdmin && (
            <li
              className="admin-dropdown"
              onMouseEnter={() => setAdminDropdownOpen(true)}
              onMouseLeave={() => setAdminDropdownOpen(false)}
            >
              <button className="admin-btn">⚙️ Admin</button>
              {adminDropdownOpen && (
                <ul className="dropdown-menu">
                  <li>
                    <Link to="/admin" onClick={closeMenu}>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/users" onClick={closeMenu}>
                      Manage Users
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/reports" onClick={closeMenu}>
                      View Reports
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/settings" onClick={closeMenu}>
                      Settings
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          {/* Profile Menu Component */}
          <ProfileMenu isLoggedIn={isLoggedIn} onLogout={onLogout} />
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
