import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setIsAdmin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Handle login form submission
  const handleLogin = (e) => {
    e.preventDefault(); // Prevent page reload

    // Simulate login logic (replace with actual authentication)
    if (username === "admin" && password === "password") {
      setIsAdmin(true); // Set the admin state to true
      navigate("/admin"); // Navigate to Admin page
    } else {
      alert("Invalid credentials!");
    }
  };

  return (
    <div>
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
      </form>
    </div>
  );
}
