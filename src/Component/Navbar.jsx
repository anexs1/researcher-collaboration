import { Link } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

const Navbar = ({ isLoggedIn, isAdmin, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="logo">
        <h1>Researcher Collaboration</h1>
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
          <li>
            <Link to="/publication" onClick={closeMenu}>
              Publications
            </Link>
          </li>

          {/* Show Admin Panel only for Admin Users */}
          {isAdmin && (
            <li>
              <Link to="/admin" onClick={closeMenu}>
                Admin Panel
              </Link>
            </li>
          )}

          {/* Show Login if not logged in, otherwise show Profile/Logout */}
          {isLoggedIn ? (
            <li className="profile-dropdown">
              <button className="profile-btn">Profile ▼</button>
              <ul className="dropdown-menu">
                <li>
                  <Link to="/profile" onClick={closeMenu}>
                    View Profile
                  </Link>
                </li>
                <li>
                  <button onClick={onLogout}>Logout</button>
                </li>
              </ul>
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
