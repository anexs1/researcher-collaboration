import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const size = 600; // Passport size: 600x600 pixels
          canvas.width = size;
          canvas.height = size;

          // Center and crop image
          const scale = Math.min(img.width / size, img.height / size);
          const sx = (img.width - size * scale) / 2;
          const sy = (img.height - size * scale) / 2;

          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();

          ctx.drawImage(
            img,
            sx,
            sy,
            size * scale,
            size * scale,
            0,
            0,
            size,
            size
          );

          canvas.toBlob(
            (blob) => {
              setProfileImage(blob);
              setPreviewImage(URL.createObjectURL(blob));
            },
            "image/jpeg",
            0.9
          );
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    formData.append("expertise", expertise);
    formData.append("bio", bio);
    formData.append("location", location);
    formData.append("phone", phone);

    if (profileImage) {
      formData.append("profileImage", profileImage, "profile.jpg"); // Add filename
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/signup",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("User signed up successfully", response.data);

      // Remove Local Storage
      //localStorage.removeItem("user")

      // Navigate to the login page
      navigate("/login");

      // Reset form fields (but keep username and email for better UX)
      setPassword("");
      setConfirmPassword("");
      setExpertise("");
      setBio("");
      setLocation("");
      setPhone("");
      setProfileImage(null);
      setPreviewImage(null);
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
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
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
          <input type="file" onChange={handleImageChange} accept="image/*" />
          {previewImage && (
            <img
              src={previewImage}
              alt="Profile Preview"
              className="rounded-full w-24 h-24 mt-4"
            />
          )}
          <button type="submit" className="auth-button">
            Signup
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
