import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation after registration

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate(); // Replaces useHistory()

  const handleSubmit = (e) => {
    e.preventDefault();

    // Your form logic here, such as sending the data to the backend.

    // For now, just redirect to profile
    navigate("/profile"); // Redirects to the profile page
  };

  return (
    <div className="register-form">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Research Area:</label>
          <input
            type="text"
            value={researchArea}
            onChange={(e) => setResearchArea(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
