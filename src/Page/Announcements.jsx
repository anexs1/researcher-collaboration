import React, { useState, useEffect } from "react";
import "./Announcements.css";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState(
    JSON.parse(localStorage.getItem("announcements")) || []
  );

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    qualifications: "",
    deadline: "",
    contact: "",
  });

  const [editingIndex, setEditingIndex] = useState(null);

  // New state to handle collaboration request form
  const [collaborationRequest, setCollaborationRequest] = useState({
    researcherName: "",
    researcherEmail: "",
    announcementIndex: null,
  });

  useEffect(() => {
    localStorage.setItem("announcements", JSON.stringify(announcements));
  }, [announcements]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCollaborationChange = (e) => {
    const { name, value } = e.target;
    setCollaborationRequest({ ...collaborationRequest, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.qualifications ||
      !formData.deadline ||
      !formData.contact
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (editingIndex !== null) {
      // Update existing announcement
      const updatedAnnouncements = [...announcements];
      updatedAnnouncements[editingIndex] = formData;
      setAnnouncements(updatedAnnouncements);
      setEditingIndex(null);
    } else {
      // Add new announcement
      setAnnouncements([...announcements, formData]);
    }

    setFormData({
      title: "",
      description: "",
      qualifications: "",
      deadline: "",
      contact: "",
    });
  };

  const handleCollaborationSubmit = (e) => {
    e.preventDefault();
    if (
      !collaborationRequest.researcherName ||
      !collaborationRequest.researcherEmail ||
      collaborationRequest.announcementIndex === null
    ) {
      alert("Please fill in all fields and select an announcement.");
      return;
    }

    alert("Collaboration request submitted successfully!");

    // Clear the collaboration request form
    setCollaborationRequest({
      researcherName: "",
      researcherEmail: "",
      announcementIndex: null,
    });
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setFormData(announcements[index]);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      const updatedAnnouncements = announcements.filter((_, i) => i !== index);
      setAnnouncements(updatedAnnouncements);
    }
  };

  return (
    <div className="announcements-container">
      <h1>
        {editingIndex !== null
          ? "Edit Announcement"
          : "Post a Collaboration Announcement"}
      </h1>

      {/* Collaboration Announcement Form */}
      <form className="announcement-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Announcement Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Brief Description"
          value={formData.description}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="qualifications"
          placeholder="Required Qualifications (e.g., MSc in AI)"
          value={formData.qualifications}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="contact"
          placeholder="Your Contact Email"
          value={formData.contact}
          onChange={handleChange}
          required
        />
        <button type="submit">
          {editingIndex !== null ? "Update Announcement" : "Post Announcement"}
        </button>
      </form>

      {/* Display Posted Announcements */}
      <div className="announcement-list">
        <h2>Active Collaboration Announcements</h2>
        {announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          announcements.map((announcement, index) => (
            <div key={index} className="announcement-card">
              <h3>{announcement.title}</h3>
              <p>
                <strong>Description:</strong> {announcement.description}
              </p>
              <p>
                <strong>Required Qualifications:</strong>{" "}
                {announcement.qualifications}
              </p>
              <p>
                <strong>Deadline:</strong> {announcement.deadline}
              </p>
              <p>
                <strong>Contact:</strong>{" "}
                <a href={`mailto:${announcement.contact}`}>
                  {announcement.contact}
                </a>
              </p>
              <div className="button-group">
                <button className="edit-btn" onClick={() => handleEdit(index)}>
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(index)}
                >
                  Delete
                </button>
              </div>

              {/* Collaboration Request Form */}
              <form
                className="collaboration-request-form"
                onSubmit={handleCollaborationSubmit}
              >
                <h4>Interested in Collaborating?</h4>
                <input
                  type="text"
                  name="researcherName"
                  placeholder="Your Name"
                  value={collaborationRequest.researcherName}
                  onChange={handleCollaborationChange}
                  required
                />
                <input
                  type="email"
                  name="researcherEmail"
                  placeholder="Your Email"
                  value={collaborationRequest.researcherEmail}
                  onChange={handleCollaborationChange}
                  required
                />
                {/* Add a selection for the researcher to choose which announcement */}
                <select
                  name="announcementIndex"
                  value={collaborationRequest.announcementIndex || ""}
                  onChange={handleCollaborationChange}
                  required
                >
                  <option value="" disabled>
                    Select an Announcement
                  </option>
                  {announcements.map((announcement, index) => (
                    <option key={index} value={index}>
                      {announcement.title}
                    </option>
                  ))}
                </select>
                <button type="submit">Submit Collaboration Request</button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
