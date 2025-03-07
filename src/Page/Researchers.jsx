import React, { useState, useEffect } from "react";
import "./Researchers.css";

// Update the path to the correct location of Researchers.css

// Sample data for researchers (replace with real data)
const sampleResearchers = [
  {
    id: 1,
    name: "Dr. John Doe",
    field: "Computer Science",
    qualifications: "Ph.D. in AI",
    contact: "johndoe@university.edu",
  },
  {
    id: 2,
    name: "Dr. Jane Smith",
    field: "Environmental Science",
    qualifications: "MSc in Environmental Engineering",
    contact: "janesmith@university.edu",
  },
];

export default function Researchers() {
  const [researchers, setResearchers] = useState([]);

  // Simulate fetching data from an API or database
  useEffect(() => {
    // In a real-world scenario, you'd fetch this data from an API
    setResearchers(sampleResearchers);
  }, []);

  return (
    <div className="researchers-container">
      <h1>Welcome to the Researcher Collaboration Portal</h1>
      <p>Connect with other researchers based on your field of interest.</p>

      <div className="researcher-list">
        <h2>Researchers Available for Collaboration</h2>
        <div className="researchers-grid">
          {researchers.map((researcher) => (
            <div className="researcher-card" key={researcher.id}>
              <h3>{researcher.name}</h3>
              <p>
                <strong>Field:</strong> {researcher.field}
              </p>
              <p>
                <strong>Qualifications:</strong> {researcher.qualifications}
              </p>
              <p>
                <strong>Contact:</strong>{" "}
                <a href={`mailto:${researcher.contact}`}>
                  {researcher.contact}
                </a>
              </p>
              <button
                onClick={() =>
                  alert(
                    `You have requested collaboration with ${researcher.name}`
                  )
                }
              >
                Send Collaboration Request
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
