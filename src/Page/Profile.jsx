import React, { useEffect, useState } from "react";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));

    if (userData) {
      setUser(userData); // Set user data if found
    }
  }, []);

  // Show loading message if user data is still null
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h2>Researcher Profile</h2>
      <div className="profile-card">
        <h3>Name: {user.name}</h3>
        <p>Email: {user.email}</p>
        <p>Research Area: {user.researchArea}</p>
      </div>
    </div>
  );
}

export default Profile;
