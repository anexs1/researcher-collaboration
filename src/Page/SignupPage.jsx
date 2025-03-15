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

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Image size must be under 2MB.");
      return;
    }

    setFormData({ ...formData, profileImage: file });
  };

  const handleSignup = () => {
    const { username, email, password, confirmPassword, phone } = formData;

    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      setErrorMessage("Phone number must be 10 digits.");
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
        setTimeout(() => navigate("/login"), 1000);
      })
      .catch((error) => {
        console.error("Signup Error:", error);
        const errorMsg =
          error.response?.data?.error || "Signup failed. Please try again.";
        setErrorMessage(errorMsg);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Sign Up</h2>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <label htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          className="input-field"
        />

        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="input-field"
        />

        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          className="input-field"
        />

        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          className="input-field"
        />

        <label htmlFor="expertise">Expertise:</label>
        <input
          id="expertise"
          type="text"
          name="expertise"
          value={formData.expertise}
          onChange={handleChange}
          placeholder="Expertise"
          className="input-field"
        />

        <label htmlFor="profileImage">Profile Image:</label>
        <input
          id="profileImage"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="input-field"
        />

        <label htmlFor="bio">Short Bio:</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Short Bio"
          className="input-field"
        ></textarea>

        <label htmlFor="location">Location (Optional):</label>
        <input
          id="location"
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location"
          className="input-field"
        />

        <label htmlFor="phone">Phone Number:</label>
        <input
          id="phone"
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
          className={`signup-button ${loading ? "loading" : ""}`}
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
