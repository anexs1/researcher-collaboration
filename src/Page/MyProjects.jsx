import React, { useState, useEffect } from "react";
import { FaUserPlus, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import "./MyProjects.css"; // Import CSS file

const MyProjects = () => {
  // Mock project data (replace with API call later)
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: "AI-Powered Research Assistant",
      description:
        "A collaborative project to build an AI system for research analysis.",
      status: "Ongoing",
      collaborators: ["Dr. Alice", "Prof. Bob"],
    },
    {
      id: 2,
      title: "Quantum Computing Applications",
      description:
        "Exploring advanced quantum algorithms and real-world applications.",
      status: "Completed",
      collaborators: ["Dr. Eve", "Dr. Charlie"],
    },
  ]);

  const [activeTab, setActiveTab] = useState("ongoing");

  // Filter projects by status
  const filteredProjects = projects.filter((project) =>
    activeTab === "ongoing"
      ? project.status === "Ongoing"
      : project.status === "Completed"
  );

  return (
    <div className="container">
      <h2 className="title">My Research Projects</h2>

      {/* Tabs for Ongoing and Completed Projects */}
      <div className="tabs">
        <button
          className={activeTab === "ongoing" ? "tab active" : "tab"}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing Projects
        </button>
        <button
          className={activeTab === "completed" ? "tab active" : "tab"}
          onClick={() => setActiveTab("completed")}
        >
          Completed Projects
        </button>
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <p className="empty-message">No projects found in this category.</p>
      ) : (
        <div className="project-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>

              <p className="collaborators">
                <strong>Collaborators:</strong>{" "}
                {project.collaborators.join(", ")}
              </p>

              <div className="button-group">
                <button className="btn view">
                  <FaEye /> View
                </button>
                <button className="btn invite">
                  <FaUserPlus /> Invite
                </button>
                <button className="btn edit">
                  <FaEdit /> Edit
                </button>
                <button className="btn delete">
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProjects;
