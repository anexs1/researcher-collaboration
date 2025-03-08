import React, { useState } from "react";
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

  const handleLogin = () => {
    // Fetch stored user details from localStorage
    const storedUserDetails = JSON.parse(localStorage.getItem("userDetails"));

    if (
      storedUserDetails &&
      storedUserDetails.username === username &&
      storedUserDetails.password === password
    ) {
      setIsLoggedIn(true);
      setIsAdmin(storedUserDetails.username === "admin"); // Assuming 'admin' is the admin user
      navigate("/home"); // Redirect to the home page after successful login
    } else {
      setErrorMessage("Invalid credentials");
    }
  };

  const handleSignup = () => {
    // Basic validation for required fields
    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !expertise ||
      !profileImage ||
      !bio ||
      !location ||
      !phone
    ) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage(
        "Password must be at least 8 characters long and include letters, numbers, and special characters."
      );
      return;
    }

    // Profile Image URL validation (basic check)
    try {
      new URL(profileImage); // Validate the URL
    } catch (_) {
      setErrorMessage("Please enter a valid URL for the profile image.");
      return;
    }

    // Save the user details to localStorage (encrypt password in real-world scenarios)
    const userDetails = {
      username,
      email,
      password,
      expertise,
      profileImage,
      bio,
      location,
      phone,
    };

    localStorage.setItem("userDetails", JSON.stringify(userDetails));

    alert("Account created successfully! You can now log in.");
    setIsSignup(false); // After successful signup, show the login form
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {isSignup ? (
          <>
            <h2 className="auth-title">Sign Up</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                className="input-field"
              />
            </div>
            {!isPasswordValid && (
              <p className="password-validation">
                Password must be at least 8 characters long and include letters,
                numbers, and special characters.
              </p>
            )}
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
            <div className="input-group">
              <label className="input-label">Expertise</label>
              <input
                type="text"
                placeholder="Enter your expertise"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Profile Image URL</label>
              <input
                type="text"
                placeholder="Enter profile image URL"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Bio</label>
              <textarea
                placeholder="Write a short bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Location</label>
              <input
                type="text"
                placeholder="Enter your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input
                type="text"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)} // Login uses username
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
