import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SignupPage.css"; // Import external CSS

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    expertise: "",
    profileImage: null,
    bio: "",
    location: "",
    phone: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, profileImage: file });
  };

  const handleSignup = () => {
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const signupData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      signupData.append(key, value);
    });

    axios
      .post("http://localhost:5000/signup", signupData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        alert("Account created successfully!");
        navigate("/login");
      })
      .catch((error) =>
        setErrorMessage(error.response?.data?.error || "Signup failed.")
      )
      .finally(() => setLoading(false));
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Sign Up</h2>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          className="input-field"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="input-field"
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          className="input-field"
        />
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          className="input-field"
        />
        <input
          type="text"
          name="expertise"
          value={formData.expertise}
          onChange={handleChange}
          placeholder="Expertise"
          className="input-field"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="input-field"
        />
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Short Bio"
          className="input-field"
        ></textarea>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location (optional)"
          className="input-field"
        />
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone Number"
          className="input-field"
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="signup-button"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <p className="login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className="login-text">
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}
