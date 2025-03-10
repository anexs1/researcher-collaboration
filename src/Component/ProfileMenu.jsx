import React from "react";
import { Link } from "react-router-dom";
import "./ProfileMenu.css";

const ProfileMenu = ({ isLoggedIn, onLogout }) => {
  return (
    <div className="profile-menu">
      {isLoggedIn ? (
        <>
          <button className="profile-btn">👤</button>
          <ul className="profile-dropdown">
            <li>
              <Link to="/profile">Profile</Link>
            </li>
            <li>
              <button onClick={onLogout}>Logout</button>
            </li>
          </ul>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </div>
  );
};

export default ProfileMenu;
