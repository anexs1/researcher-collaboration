import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Explore.css";

// Component to display individual research opportunities
function ResearchOpportunity({
  id,
  title,
  description,
  field,
  researcher,
  researcherProfile,
  onRequestJoin,
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleReadMore = () => {
    setShowFullDescription(!showFullDescription);
  };

  const handleShare = () => {
    alert("Share this opportunity with your peers!");
  };

  return (
    <div className="research-opportunity">
      <h2>{title}</h2>
      <p>
        <strong>Field:</strong> {field}
      </p>
      <p>
        <strong>Researcher:</strong> {researcher}
      </p>
      <p>
        <strong>Researcher Profile:</strong>{" "}
        <a href={researcherProfile} target="_blank" rel="noopener noreferrer">
          View Profile
        </a>
      </p>
      <p>
        {showFullDescription
          ? description
          : `${description.substring(0, 100)}...`}
      </p>
      <button onClick={handleReadMore}>
        {showFullDescription ? "Read Less" : "Read More"}
      </button>
      <button onClick={handleShare}>Share</button>
      <button onClick={() => onRequestJoin(id)}>Request to Join</button>
    </div>
  );
}

const Explore = () => {
  const [researchOpportunities, setResearchOpportunities] = useState([]);
  const [userProfile] = useState({
    id: 1, // Example user ID (should be dynamic)
    name: "Dr. Samuel",
    role: "Researcher",
  });

  // Fetch research opportunities from an API
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/research_opportunities"
        );
        setResearchOpportunities(response.data);
      } catch (error) {
        console.error("Error fetching research opportunities:", error);
      }
    };
    fetchOpportunities();
  }, []);

  // Function to send request to admin
  const handleRequestJoin = async (researchId) => {
    try {
      const response = await axios.post("http://localhost:5000/send_request", {
        sender_id: userProfile.id,
        research_id: researchId,
      });
      alert(response.data.message);
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request.");
    }
  };

  return (
    <div className="explore-page">
      <h1>Explore Research Opportunities</h1>
      <p>
        Discover various research projects in fields like AI, IoT, Blockchain,
        and more. Join as a collaborator or start your own research.
      </p>

      <p>
        <strong>
          Welcome, {userProfile.name} ({userProfile.role})
        </strong>
      </p>

      <div className="research-list">
        {researchOpportunities.length > 0 ? (
          researchOpportunities.map((opportunity) => (
            <ResearchOpportunity
              key={opportunity.id}
              id={opportunity.id}
              title={opportunity.title}
              description={opportunity.description}
              field={opportunity.field}
              researcher={opportunity.researcher}
              researcherProfile={opportunity.researcherProfile}
              onRequestJoin={handleRequestJoin}
            />
          ))
        ) : (
          <p>No research opportunities available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default Explore;
