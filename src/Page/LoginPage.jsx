import React, { useState } from "react";

export default function AdminLogin({ setIsLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Hardcoded credentials for admin login
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true); // This will set the admin as logged in
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Admin Login</h2>
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
          />
        </div>
        <button onClick={handleLogin} className="login-button">
          Login
        </button>
        <div className="footer-text">
          <p>If you don't have an account, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
