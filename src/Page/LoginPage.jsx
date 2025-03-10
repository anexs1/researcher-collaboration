import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage({ setIsLoggedIn, setIsAdmin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState(""); // For both login and signup
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // Only for signup
  const [confirmPassword, setConfirmPassword] = useState(""); // Only for signup
  const [expertise, setExpertise] = useState(""); // Only for signup
  const [profileImage, setProfileImage] = useState(""); // Only for signup
  const [bio, setBio] = useState(""); // Bio for the user
  const [location, setLocation] = useState(""); // User's location (optional)
  const [phone, setPhone] = useState(""); // Phone number for the user
  const [errorMessage, setErrorMessage] = useState(""); // To show error messages
  const [isPasswordValid, setIsPasswordValid] = useState(true); // For password validation

  const navigate = useNavigate(); // To handle redirection after login/signup

  // Password validation for signup
  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/; // 8+ characters, letters, numbers, special chars
    setIsPasswordValid(passwordRegex.test(password));
  };

  // Handle login
  const handleLogin = () => {
    axios
      .post("http://localhost:5000/login", { username, password })
      .then((response) => {
        setIsLoggedIn(true);
        // Save JWT token and other user info if needed
        localStorage.setItem("authToken", response.data.token);
        setIsAdmin(username === "admin"); // Assuming 'admin' is the admin user
        navigate("/profile"); // Redirect to the profile page after successful login
      })
      .catch((error) => {
        setErrorMessage("Invalid credentials");
      });
  };

  // Handle signup
  const handleSignup = () => {
    // Ensure passwords match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    // Send signup request to the backend
    axios
      .post("http://localhost:5000/signup", {
        username,
        email,
        password,
        expertise,
        profileImage,
        bio,
        location,
        phone,
      })
      .then((response) => {
        alert("Account created successfully! You can now log in.");
        setIsSignup(false); // After successful signup, show the login form
      })
      .catch((error) => {
        setErrorMessage(error.response.data.error);
      });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {isSignup ? (
          <>
            <h2 className="auth-title">Sign Up</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                placeholder="Enter your password"
              />
            </div>
            {!isPasswordValid && (
              <p className="error-message">
                Password must be at least 8 characters long and include letters,
                numbers, and special characters.
              </p>
            )}
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>
            <div className="input-group">
              <label>Expertise</label>
              <input
                type="text"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="Enter your area of expertise"
              />
            </div>
            <div className="input-group">
              <label>Profile Image URL</label>
              <input
                type="text"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="Enter profile image URL"
              />
            </div>
            <div className="input-group">
              <label>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio"
              />
            </div>
            <div className="input-group">
              <label>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your location (optional)"
              />
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            <button
              onClick={handleSignup}
              className="auth-button"
              disabled={!isPasswordValid}
            >
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
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
