import React, { useState } from "react";
import "./LoginPage.css";

export default function UserAuth({ setIsLoggedIn, setIsAdmin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState(""); // For both login and signup
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // Only for signup
  const [confirmPassword, setConfirmPassword] = useState(""); // Only for signup

  const handleLogin = () => {
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true);
      setIsAdmin(true); // Admin user
    } else if (username === "user" && password === "password") {
      setIsLoggedIn(true);
      setIsAdmin(false); // Regular user
    } else {
      alert("Invalid credentials");
    }
  };

  const handleSignup = () => {
    if (!username || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    alert("Account created successfully! You can now log in.");
    setIsSignup(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {isSignup ? (
          <>
            <h2 className="auth-title">Sign Up</h2>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <button onClick={handleSignup} className="auth-button">
              Sign Up
            </button>
            <p className="footer-text">
              Already have an account?{" "}
              <span className="link" onClick={() => setIsSignup(false)}>
                Log in
              </span>
            </p>
          </>
        ) : (
          <>
            <h2 className="auth-title">User Login</h2>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={username}
                onChange={(e) => setUsername(e.target.value)} // Login uses full name
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <button onClick={handleLogin} className="auth-button">
              Login
            </button>
            <p className="footer-text">
              Don't have an account?{" "}
              <span className="link" onClick={() => setIsSignup(true)}>
                Create an Account
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
