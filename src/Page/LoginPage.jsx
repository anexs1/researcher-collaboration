import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom

export default function AdminLogin({ setIsLoggedIn, setIsAdmin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedInState] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate hook

  const handleLogin = () => {
    // Hardcoded credentials for admin login
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true); // This will set the admin as logged in
      setIsAdmin(true); // Set user as admin
      setIsLoggedInState(true); // Update the local state for logged-in status
      navigate("/admin"); // Redirect to the admin page after successful login
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Admin Login</h2>

        {/* If already logged in, display a success message */}
        {isLoggedIn ? (
          <div className="success-message">
            <p>You are logged in as admin.</p>
          </div>
        ) : (
          <>
            <div className="input-group">
              <label htmlFor="username" className="input-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                disabled={isLoggedIn} // Disable input when logged in
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                disabled={isLoggedIn} // Disable input when logged in
              />
            </div>

            <button
              onClick={handleLogin}
              className="login-button"
              disabled={isLoggedIn}
            >
              Login
            </button>
          </>
        )}

        {!isLoggedIn && (
          <div className="footer-text">
            <p>
              If you don't have an account, please{" "}
              <a href="/signup">sign up here</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
