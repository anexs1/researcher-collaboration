import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ isAdmin, setIsLoggedIn }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Handle login form submission
  const handleLogin = (e) => {
    e.preventDefault();

    // Simulate login logic (replace with actual authentication)
    if (username === "admin" && password === "password") {
      setIsLoggedIn(true); // Set logged-in state
      setShowLoginForm(false); // Hide login form after login
      navigate("/admin"); // Navigate to Admin page
    } else {
      alert("Invalid credentials!");
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">Researcher Collaboration Portal</Link>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/researcher">Researchers</Link>
        </li>
        <li>
          <Link to="/publication">Publications</Link>
        </li>
        <li>
          <Link to="/admin">Admin</Link>
        </li>
        <li>
          <Link to="/profile">Profile</Link>
        </li>
      </ul>

      <div className="auth-buttons">
        <button className="login-btn" onClick={() => setShowLoginForm(true)}>
          Login
        </button>
        <Link to="/register">
          <button className="register-btn">Register</button>
        </Link>
      </div>

      {/* Login Form */}
      {showLoginForm && (
        <div className="login-form-overlay">
          <div className="login-form">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Login</button>
              <button type="button" onClick={() => setShowLoginForm(false)}>
                Close
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
// Compare this snippet from src/Page/Profile.jsx:  import { useEffect, useState } from "react";
