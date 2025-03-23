import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../index.css";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          User Login
        </h2>
        {errorMessage && (
          <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        )}
        <div className="mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <button
          onClick={handleLogin}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Login
        </button>
        <p className="mt-4 text-center text-gray-600">
          Don't have an account?
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:text-blue-700 focus:outline-none transition-colors ml-1"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
