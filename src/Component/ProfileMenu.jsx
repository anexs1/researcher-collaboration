import { Link } from "react-router-dom";
import { useState } from "react";

const ProfileMenu = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <div className="profile-menu">
      {isLoggedIn ? (
        <>
          <button className="profile-btn" onClick={toggleMenu}>
            👤
          </button>
          {menuOpen && (
            <ul className="profile-dropdown">
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <button onClick={onLogout}>Logout</button>
              </li>
            </ul>
          )}
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </div>
  );
};

export default ProfileMenu;
