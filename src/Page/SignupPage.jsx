import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const SignupPage = () => {
  // State management for form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); // To store error messages
  const navigate = useNavigate(); // For navigation after successful signup

  const handleSignup = async (event) => {
    event.preventDefault();

    // Check if the username field is empty
    if (!username) {
      setErrorMessage("Username is required");
      return;
    }

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Reset error message
    setErrorMessage("");

    const formData = new FormData();
    formData.append("username", username); // Ensure the username is appended
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    formData.append("expertise", expertise);
    formData.append("bio", bio);
    formData.append("location", location);
    formData.append("phone", phone);

    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    console.log("Form data being sent:", formData); // Log to check if 'username' is present

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/signup",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Ensure the correct content type for file uploads
          },
        }
      );
      console.log("User signed up successfully", response);

      // Redirect to login page
      navigate("/login");

      // Optionally, clear the form after successful submission
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setExpertise("");
      setBio("");
      setLocation("");
      setPhone("");
      setProfileImage(null);
    } catch (error) {
      console.error("Signup Error:", error.response?.data || error);
      setErrorMessage(
        error.response?.data?.message || "An error occurred during signup"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-title">User Signup</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form onSubmit={handleSignup}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
          />
          <input
            type="text"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="Expertise"
          />
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
          />
          <input
            type="file"
            onChange={(e) => setProfileImage(e.target.files[0])}
          />
          <button type="submit" className="auth-button">
            Signup
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
