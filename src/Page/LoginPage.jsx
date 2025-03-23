import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ setIsLoggedIn, setIsAdmin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    axios
      .post("http://localhost:5000/api/auth/login", { username, password })
      .then((response) => {
        setIsLoggedIn(true);
        localStorage.setItem("authToken", response.data.token);
        setIsAdmin(username === "admin");
        navigate("/"); // Changed from navigate("/profile") to navigate("/")
      })
      .catch(() => setErrorMessage("Invalid credentials"));
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-title">User Login</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button onClick={handleLogin} className="auth-button">
          Login
        </button>
        <p className="footer-text">
          Don't have an account?{" "}
          <span className="link" onClick={() => navigate("/signup")}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
