import React, { useState, useEffect } from "react";
import "./Researchers.css"; // Ensure this CSS exists for styling

const Researchers = () => {
  const [researcher, setResearcher] = useState(null);

  useEffect(() => {
    const storedUserDetails = JSON.parse(localStorage.getItem("userDetails"));
    if (storedUserDetails) {
      setResearcher(storedUserDetails); // Store the fetched user details
    }
  }, []);

  return (
    <div className="researcher-page">
      {researcher ? (
        <div className="researcher-profile">
          <h2>Researcher Profile</h2>
          <div className="researcher-details">
            <img
              src={researcher.profileImage || "default-image.jpg"} // Default image if not provided
              alt="Profile"
              className="researcher-image"
            />
            <div className="researcher-info">
              <h3>{researcher.username}</h3>
              <p>
                <strong>Email:</strong> {researcher.email}
              </p>
              <p>
                <strong>Expertise:</strong>{" "}
                {researcher.expertise || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p>No researcher profile found. Please sign up first.</p>
      )}
    </div>
  );
};

export default Researchers;
