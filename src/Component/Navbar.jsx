import { Link } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

const Navbar = ({ isLoggedIn, isAdmin, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  // Ensure smooth navigation before closing the menu
  const closeMenuAndNavigate = () => {
    setTimeout(() => {
      closeMenu();
    }, 100);
  };

  return (
    <header className="navbar">
      <div className="logo">
        <h1>Researcher Collaboration Portal</h1>
      </div>

      {/* Mobile Menu Toggle */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
        <ul>
          <li>
            <Link to="/" onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/researchers" onClick={closeMenu}>
              Researchers
            </Link>
          </li>

          {/* Announcements - Always Visible */}
          <li>
            <Link to="/announcements" onClick={closeMenu}>
              Announcements
            </Link>
          </li>

          <li>
            <Link to="/publication" onClick={closeMenu}>
              Publications
            </Link>
          </li>

          {/* Admin Panel - Only Visible to Admins */}
          {isAdmin && (
            <li>
              <Link to="/admin" onClick={closeMenu}>
                Admin Panel
              </Link>
            </li>
          )}

          {/* User Login/Profile Dropdown */}
          {isLoggedIn ? (
            <li
              className="profile-dropdown"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="profile-btn">👤 Profile</button>
              {dropdownOpen && (
                <ul className="dropdown-menu">
                  <li>
                    <Link to="/profile" onClick={closeMenuAndNavigate}>
                      View Profile
                    </Link>
                  </li>
                  <li>
                    <button onClick={onLogout}>Logout</button>
                  </li>
                </ul>
              )}
            </li>
          ) : (
            <li>
              <Link to="/login" onClick={closeMenu}>
                Login
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
