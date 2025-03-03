import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/register");
          return;
        }
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        const response = await axios.get("http://localhost:5000/api/profile", {
          headers,
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        navigate("/register");
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/register");
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h2 className="profile-title">Researcher Profile</h2>
      <div className="profile-card">
        {user.profileImage && (
          <img
            src={user.profileImage}
            alt="Profile"
            className="profile-image"
          />
        )}
        <h3>Name: {user.name}</h3>
        <p>Email: {user.email}</p>
        <p>Research Area: {user.researchArea}</p>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;
