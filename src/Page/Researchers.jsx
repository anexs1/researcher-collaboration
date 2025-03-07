import React, { useState } from "react";
import "./Researchers.css";

// Sample researcher data
const sampleResearchers = [
  {
    id: 1,
    name: "Dr. John Doe",
    field: "Computer Science",
    qualifications: "Ph.D. in AI",
    contact: "johndoe@university.edu",
    profilePic: "https://via.placeholder.com/150", // Placeholder image
  },
  {
    id: 2,
    name: "Dr. Jane Smith",
    field: "Environmental Science",
    qualifications: "MSc in Environmental Engineering",
    contact: "janesmith@university.edu",
    profilePic: "https://via.placeholder.com/150", // Placeholder image
  },
];

export default function Researchers() {
  const [researchers, setResearchers] = useState(sampleResearchers);
  const [activeChat, setActiveChat] = useState(null); // Track active chat
  const [message, setMessage] = useState(""); // State for the message input

  const handleCollaborationRequest = (researcherId) => {
    alert(`You have sent a collaboration request to ${researcherId}`);
  };

  const handleSendMessage = (message) => {
    if (message.trim()) {
      alert(`Message sent: ${message}`);
      setMessage(""); // Clear message input after sending
    } else {
      alert("Please type a message before sending.");
    }
  };

  return (
    <div className="researchers-container">
      <h1>Welcome to the Researcher Collaboration Portal</h1>
      <p>Connect with researchers based on your field of interest.</p>

      {/* List of researchers */}
      <div className="researcher-list">
        <h2>Researchers Available for Collaboration</h2>
        <div className="researchers-grid">
          {researchers.map((researcher) => (
            <div className="researcher-card" key={researcher.id}>
              <div className="profile-header">
                <img
                  src={researcher.profilePic}
                  alt={`${researcher.name} profile`}
                  className="profile-pic"
                />
                <div className="profile-info">
                  <h3>{researcher.name}</h3>
                  <p>
                    <strong>Field:</strong> {researcher.field}
                  </p>
                  <p>
                    <strong>Qualifications:</strong> {researcher.qualifications}
                  </p>
                </div>
              </div>

              <div className="collaboration-section">
                <button
                  className="collab-button"
                  onClick={() => handleCollaborationRequest(researcher.id)}
                >
                  Request Collaboration
                </button>
              </div>

              {activeChat === researcher.id && (
                <div className="chat-section">
                  <textarea
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)} // Update message on input
                  />
                  <button onClick={() => handleSendMessage(message)}>
                    Send Message
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
