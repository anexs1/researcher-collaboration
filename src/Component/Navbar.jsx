import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ isLoggedIn, setIsLoggedIn, setIsAdmin }) {
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
      setIsAdmin(true); // Set user as admin
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
        {!isLoggedIn ? (
          <button className="login-btn" onClick={() => setShowLoginForm(true)}>
            Login
          </button>
        ) : (
          <button
            className="logout-btn"
            onClick={() => {
              setIsLoggedIn(false); // Set logged-out state
              setIsAdmin(false); // Clear admin status
              navigate("/"); // Redirect to home page
            }}
          >
            Logout
          </button>
        )}
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
