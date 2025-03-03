import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
function Researcher() {
  const { id } = useParams(); // Get the researcher ID from the URL
  const [researcher, setResearcher] = useState(null); // Store researcher data
  const [status, setStatus] = useState(""); // For status messages like success or error

  // Fetch a specific researcher by ID
  const fetchResearcher = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/researchers/${id}`
      );
      setResearcher(response.data);
    } catch (error) {
      console.error("Error fetching researcher:", error);
      setStatus("Error fetching researcher data.");
    }
  };

  useEffect(() => {
    if (id) {
      fetchResearcher();
    }
  }, [id]);

  if (!researcher) {
    return <div>Loading...</div>; // Display loading text if researcher data is not fetched
  }

  return (
    <div className="container mt-4">
      <h2>{researcher.name}'s Profile</h2>
      {status && <p>{status}</p>}

      {/* Researcher Profile Details */}
      <div className="profile-card">
        <div className="row">
          <div className="col-md-4">
            {researcher.image && (
              <img
                src={researcher.image}
                alt={researcher.name}
                className="img-fluid rounded-circle"
                style={{ width: "200px", height: "200px" }}
              />
            )}
          </div>

          <div className="col-md-8">
            <h3>{researcher.name}</h3>
            <p>
              <strong>Field of Research:</strong> {researcher.field}
            </p>
            <p>
              <strong>Bio:</strong> {researcher.bio}
            </p>
          </div>
        </div>
      </div>
      {/* Option to edit the profile if the user is authorized */}
      <div className="mt-3">
        <button
          className="btn btn-warning"
          onClick={() => alert("Edit functionality coming soon.")}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
export default Researcher;
