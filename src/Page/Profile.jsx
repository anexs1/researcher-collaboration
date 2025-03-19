import React, { useEffect, useState } from "react";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUpdatedUser(parsedUser);
    }
    setLoading(false); // Stop loading once user is fetched
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
    setErrors({});
  };

  const handleChange = (e) => {
    setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!updatedUser.username) newErrors.username = "Username is required.";
    if (!updatedUser.bio) newErrors.bio = "Bio is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProfileImage(reader.result);
        setUpdatedUser({ ...updatedUser, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login"; // Adjust this path as needed
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/"; // Adjust this path as needed
    }
  };

  const handleChangePassword = () => {
    if (newPassword) {
      // Simulate a password change
      alert("Password changed successfully!");
      setNewPassword("");
      setShowChangePassword(false);
    } else {
      alert("Please enter a new password.");
    }
  };

  if (loading) {
    return <p>Loading...</p>; // Show loading state
  }

  return (
    <div className="profile-container">
      {user && (
        <>
          <div className="profile-image-section">
            <div className="image-wrapper">
              <img
                src={
                  newProfileImage ||
                  user.profileImage ||
                  "https://via.placeholder.com/150"
                }
                alt="Profile"
                className="profile-image"
              />
              <input
                type="file"
                className="hidden"
                id="fileUpload"
                onChange={handleImageChange}
              />
              <label htmlFor="fileUpload" className="upload-button">
                📷
              </label>
            </div>
          </div>

          <div className="profile-details">
            <h2 className="profile-title">Profile</h2>
            <p className="profile-bio">
              {user.bio ||
                "Write an enticing performance summary that impresses the recruiter."}
            </p>

            <h3 className="education-title">Education</h3>
            <div className="education-item">
              <h4 className="degree">Masters of Arts</h4>
              <p>University of ABC (2013-2015)</p>
              <p>Lorem ipsum is simply dummy text of the printing industry.</p>
            </div>
            <div className="education-item">
              <h4 className="degree">Bachelors of Arts</h4>
              <p>ABC State University (2010-2013)</p>
              <p>Lorem ipsum is simply dummy text of the printing industry.</p>
            </div>

            <h3 className="contact-title">Contact</h3>
            <p>📞 +123456789</p>
            <p>📧 emailaddress@gmail.com</p>
            <p>📍 #Street number, city, state</p>
            <p>🔗 www.yourwebsite.com</p>

            {editing ? (
              <div className="edit-section">
                <input
                  type="text"
                  name="username"
                  value={updatedUser.username || ""}
                  onChange={handleChange}
                  className={`input-field ${errors.username ? "error" : ""}`}
                  placeholder="Username"
                />
                {errors.username && (
                  <p className="error-message">{errors.username}</p>
                )}

                <input
                  type="text"
                  name="expertise"
                  value={updatedUser.expertise || ""}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Expertise"
                />
                <textarea
                  name="bio"
                  value={updatedUser.bio || ""}
                  onChange={handleChange}
                  className={`input-field ${errors.bio ? "error" : ""}`}
                  placeholder="Bio"
                />
                {errors.bio && <p className="error-message">{errors.bio}</p>}

                <button onClick={handleSave} className="save-button">
                  Save
                </button>
              </div>
            ) : (
              <button onClick={handleEditToggle} className="edit-button">
                Edit
              </button>
            )}

            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="change-password-button"
            >
              Change Password
            </button>
            {showChangePassword && (
              <div className="change-password-section">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="New Password"
                />
                <button onClick={handleChangePassword} className="save-button">
                  Save Password
                </button>
              </div>
            )}

            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
            <button
              onClick={handleDeleteAccount}
              className="delete-account-button"
            >
              Delete Account
            </button>
          </div>
        </>
      )}
    </div>
  );
}
