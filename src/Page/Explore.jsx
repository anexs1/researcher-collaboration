import React, { useState, useEffect } from "react";

// Component to display individual research opportunities
const ResearchOpportunity = ({
  title,
  description,
  field,
  researcher,
  researcherProfile,
  onRequestJoin,
}) => {
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
      <button onClick={onRequestJoin}>Request to Join</button>
    </div>
  );
};

const Explore = () => {
  const [researchOpportunities, setResearchOpportunities] = useState([]);
  const [userProfile, setUserProfile] = useState({
    name: "Dr. Samuel",
    role: "Researcher",
  });

  // Simulated fetch of research opportunities from an API
  useEffect(() => {
    const fetchedOpportunities = [
      {
        title: "Machine Learning in Healthcare",
        description:
          "Explore the application of machine learning techniques in predicting healthcare outcomes, improving diagnostics, and enhancing treatment decisions.",
        field: "Machine Learning",
        researcher: "Dr. John Doe",
        researcherProfile: "https://researcher-profile-link.com/john-doe",
      },
      {
        title: "Blockchain for Supply Chain",
        description:
          "Research on how blockchain technology can improve transparency and efficiency in supply chains, preventing fraud and reducing costs.",
        field: "Blockchain",
        researcher: "Dr. Jane Smith",
        researcherProfile: "https://researcher-profile-link.com/jane-smith",
      },
      {
        title: "IoT in Smart Agriculture",
        description:
          "Investigating the use of IoT devices for optimizing agricultural practices, improving crop yield, and reducing waste in farming.",
        field: "IoT",
        researcher: "Dr. Ahmed Ali",
        researcherProfile: "https://researcher-profile-link.com/ahmed-ali",
      },
    ];

    setResearchOpportunities(fetchedOpportunities);
  }, []);

  const handleRequestJoin = (opportunityTitle) => {
    alert(
      `Request sent to join the research opportunity: "${opportunityTitle}"`
    );
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
          researchOpportunities.map((opportunity, index) => (
            <ResearchOpportunity
              key={index}
              title={opportunity.title}
              description={opportunity.description}
              field={opportunity.field}
              researcher={opportunity.researcher}
              researcherProfile={opportunity.researcherProfile}
              onRequestJoin={() => handleRequestJoin(opportunity.title)}
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
