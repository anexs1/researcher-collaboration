// publication.js
import React, { useState, useEffect } from "react";
import "./publication.css";

export default function Publication() {
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    qualifications: "",
    deadline: "",
    contact: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [collaborationRequest, setCollaborationRequest] = useState({
    researcherName: "",
    researcherEmail: "",
    announcementIndex: null,
  });

  useEffect(() => {
    fetchAllPublications();
  }, []);

  const fetchAllPublications = async () => {
    const response = await fetch("/api/publications");
    const data = await response.json();
    setAnnouncements(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
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
      const updatedAnnouncement = { ...formData };
      await fetch(`/api/publications/${announcements[editingIndex].id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAnnouncement),
      });
      setAnnouncements((prev) =>
        prev.map((item, index) =>
          index === editingIndex ? updatedAnnouncement : item
        )
      );
      setEditingIndex(null);
    } else {
      // Add new announcement
      const response = await fetch("/api/publications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const newAnnouncement = await response.json();
      setAnnouncements([
        ...announcements,
        { ...formData, id: newAnnouncement.id },
      ]);
    }

    setFormData({
      title: "",
      description: "",
      qualifications: "",
      deadline: "",
      contact: "",
    });
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setFormData(announcements[index]);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      await fetch(`/api/publications/${id}`, {
        method: "DELETE",
      });
      setAnnouncements(
        announcements.filter((announcement) => announcement.id !== id)
      );
    }
  };

  return (
    <div className="announcements-container">
      <h1>
        {editingIndex !== null
          ? "Edit Announcement"
          : "Post a Collaboration Announcement"}
      </h1>

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
          placeholder="Required Qualifications"
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

      <div className="announcement-list">
        <h2>Active Collaboration Announcements</h2>
        {announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-card">
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
                <button
                  className="edit-btn"
                  onClick={() =>
                    handleEdit(
                      announcements.findIndex((a) => a.id === announcement.id)
                    )
                  }
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(announcement.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
