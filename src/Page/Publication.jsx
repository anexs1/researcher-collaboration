import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
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
    announcementId: null, // Changed to announcementId
  });
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [formErrors, setFormErrors] = useState({}); // State for form errors
  const [apiError, setApiError] = useState(null); // State for general API errors

  // Inline formatDate function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const options = { year: "numeric", month: "long", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date"; // Or some other fallback
    }
  };

  useEffect(() => {
    fetchAllPublications();
  }, []);

  const fetchAllPublications = async () => {
    setLoading(true); // Start loading
    setApiError(null); // Clear any previous errors
    try {
      const response = await fetch("/api/publications");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch announcements (HTTP ${response.status})`
        );
      }
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error fetching publications:", error);
      setApiError(
        "Failed to load announcements. Please check your network and try again."
      );
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Debounced handleChange function
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  }, []); // useCallback to prevent unnecessary re-renders

  const validateForm = () => {
    let errors = {};
    if (!formData.title) errors.title = "Title is required";
    if (!formData.description) errors.description = "Description is required";
    if (!formData.qualifications)
      errors.qualifications = "Qualifications are required";
    if (!formData.deadline) errors.deadline = "Deadline is required";
    if (!formData.contact) errors.contact = "Contact email is required";
    if (
      formData.contact &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact)
    ) {
      errors.contact = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null); // Clear any previous errors

    if (!validateForm()) {
      return; // Stop submission if there are errors
    }

    try {
      if (editingIndex !== null) {
        // Optimistic Update
        const updatedAnnouncement = {
          ...formData,
          id: announcements[editingIndex].id,
        };
        setAnnouncements((prev) =>
          prev.map((item, index) =>
            index === editingIndex ? updatedAnnouncement : item
          )
        );

        const response = await fetch(
          `/api/publications/${announcements[editingIndex].id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          // Revert Optimistic Update
          setAnnouncements((prev) => {
            const original = prev.find((item, index) => index === editingIndex); // Keep original one
            return prev.map((item, index) =>
              index === editingIndex ? original : item
            );
          });
          throw new Error(
            `Failed to update announcement (HTTP ${response.status})`
          );
        }

        setEditingIndex(null);
        alert("Announcement updated successfully!");
      } else {
        // Add new announcement
        const response = await fetch("/api/publications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to create announcement (HTTP ${response.status})`
          );
        }

        const newAnnouncement = await response.json();
        setAnnouncements((prev) => [...prev, newAnnouncement]);
        alert("Announcement created successfully!");
      }

      setFormData({
        title: "",
        description: "",
        qualifications: "",
        deadline: "",
        contact: "",
      });
      setFormErrors({}); // Clear any previous errors
    } catch (error) {
      console.error("Error during submission:", error);
      setApiError(
        `An error occurred: ${error.message}. Please try again. If the problem persists, contact support.`
      );
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setFormData(announcements[index]);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      // Optimistic Delete
      const originalAnnouncements = [...announcements]; // Store a copy for potential rollback
      setAnnouncements((prev) =>
        prev.filter((announcement) => announcement.id !== id)
      );

      try {
        const response = await fetch(`/api/publications/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // Revert Optimistic Delete
          setAnnouncements(originalAnnouncements);
          throw new Error(
            `Failed to delete announcement (HTTP ${response.status})`
          );
        }

        alert("Announcement deleted successfully!");
      } catch (error) {
        console.error("Error deleting announcement:", error);
        //Revert Optimistic Delete
        setAnnouncements(originalAnnouncements);
        setApiError(
          `An error occurred: ${error.message}. Please try again. If the problem persists, contact support.`
        );
      }
    }
  };

  const handleCollaborationRequestOpen = (announcementId) => {
    setCollaborationRequest({
      ...collaborationRequest,
      announcementId: announcementId,
    });
    setShowCollaborationModal(true);
  };

  const handleCollaborationRequestClose = () => {
    setShowCollaborationModal(false);
    setCollaborationRequest({
      researcherName: "",
      researcherEmail: "",
      announcementId: null,
    });
  };

  const handleCollaborationRequestChange = (e) => {
    const { name, value } = e.target;
    setCollaborationRequest((prev) => ({ ...prev, [name]: value }));
  };

  const handleCollaborationRequestSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    try {
      // Basic client-side validation
      if (
        !collaborationRequest.researcherName ||
        !collaborationRequest.researcherEmail
      ) {
        alert("Please fill in all fields for the collaboration request.");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(collaborationRequest.researcherEmail)) {
        alert("Please enter a valid email address.");
        return;
      }

      const response = await fetch("/api/collaboration-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(collaborationRequest),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to submit collaboration request (HTTP ${response.status})`
        );
      }

      alert("Collaboration request submitted successfully!");
      handleCollaborationRequestClose();
    } catch (error) {
      console.error("Error submitting collaboration request:", error);
      setApiError(
        `Failed to submit collaboration request: ${error.message}. Please try again.`
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

      {apiError && <div className="error-message">{apiError}</div>}

      <form className="announcement-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Announcement Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Announcement Title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          {formErrors.title && (
            <div className="error-message">{formErrors.title}</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="description">Brief Description:</label>
          <textarea
            id="description"
            name="description"
            placeholder="Brief Description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          {formErrors.description && (
            <div className="error-message">{formErrors.description}</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="qualifications">Required Qualifications:</label>
          <textarea
            id="qualifications"
            name="qualifications"
            placeholder="Required Qualifications"
            value={formData.qualifications}
            onChange={handleChange}
            required
          />
          {formErrors.qualifications && (
            <div className="error-message">{formErrors.qualifications}</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="deadline">Deadline:</label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
          />
          {formErrors.deadline && (
            <div className="error-message">{formErrors.deadline}</div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="contact">Your Contact Email:</label>
          <input
            type="email"
            id="contact"
            name="contact"
            placeholder="Your Contact Email"
            value={formData.contact}
            onChange={handleChange}
            required
          />
          {formErrors.contact && (
            <div className="error-message">{formErrors.contact}</div>
          )}
        </div>
        <button type="submit" className="submit-button">
          {editingIndex !== null ? "Update Announcement" : "Post Announcement"}
        </button>
      </form>

      <div className="announcement-list">
        <h2>Active Collaboration Announcements</h2>
        {loading ? (
          <p>Loading announcements...</p>
        ) : !Array.isArray(announcements) ? (
          <p>Error: Could not load announcements.</p>
        ) : announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-card">
              <h3>{announcement.title}</h3>
              <div className="announcement-content">
                <p>
                  <strong>Description:</strong>
                  <div>{announcement.description}</div>{" "}
                  {/* Display as plain text */}
                </p>
                <p>
                  <strong>Required Qualifications:</strong>
                  <div>{announcement.qualifications}</div>{" "}
                  {/* Display as plain text */}
                </p>
                <p>
                  <strong>Deadline:</strong> {formatDate(announcement.deadline)}
                </p>
                <p>
                  <strong>Contact:</strong>
                  <a href={`mailto:${announcement.contact}`}>
                    {announcement.contact}
                  </a>
                </p>
              </div>
              <div className="button-group">
                <button
                  className="request-btn"
                  onClick={() =>
                    handleCollaborationRequestOpen(announcement.id)
                  }
                  aria-label={`Request collaboration for ${announcement.title}`} // Accessibility
                >
                  Request Collaboration
                </button>
                <button
                  className="edit-btn"
                  onClick={() =>
                    handleEdit(
                      announcements.findIndex((a) => a.id === announcement.id)
                    )
                  }
                  aria-label={`Edit announcement ${announcement.title}`}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(announcement.id)}
                  aria-label={`Delete announcement ${announcement.title}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCollaborationModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCollaborationRequestClose}>
              ×
            </span>
            <h2>Request Collaboration</h2>
            <form
              onSubmit={handleCollaborationRequestSubmit}
              className="collaboration-form"
            >
              <div className="form-group">
                <label htmlFor="researcherName">Your Name:</label>
                <input
                  type="text"
                  id="researcherName"
                  name="researcherName"
                  value={collaborationRequest.researcherName}
                  onChange={handleCollaborationRequestChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="researcherEmail">Your Email:</label>
                <input
                  type="email"
                  id="researcherEmail"
                  name="researcherEmail"
                  value={collaborationRequest.researcherEmail}
                  onChange={handleCollaborationRequestChange}
                  required
                />
              </div>
              <button type="submit" className="submit-button">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
