import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // ✅ Added Link import
import axios from "axios";

export default function Sign() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    researchArea: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/register", formData);
      alert("Signup successful! Please log in.");
      navigate("/login");
    } catch (err) {
      alert("Signup failed. Email may already exist.");
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="researchArea"
          placeholder="Research Area"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="field of the research"
          placeholder="Field of the research"
          onChange={handleChange}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}
