// src/Component/Publication.jsx
import React, { useState, useEffect, useCallback } from "react";

const backendURL = "http://localhost:5000";

export default function Publication({ isLoggedIn }) {
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    author: "",
    document_link: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [collaborationRequest, setCollaborationRequest] = useState({
    researcherName: "",
    researcherEmail: "",
    announcementId: null,
  });
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showAllAbstracts, setShowAllAbstracts] = useState(false); // New state
  const [sortBy, setSortBy] = useState("date"); // Default sort by date

  // Function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const options = { year: "numeric", month: "long", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };
  // Function to fetch all publications
  const fetchAllPublications = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`${backendURL}/api/publications`);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPublications();
  }, [fetchAllPublications]); // Dependency array includes fetchAllPublications

  //Handle change for input
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  }, []);
  //Validate Input
  const validateForm = useCallback(() => {
    let errors = {};
    if (!formData.title) errors.title = "Title is required";
    if (!formData.abstract) errors.abstract = "Abstract is required";
    if (!formData.author) errors.author = "Author is required";
    if (!formData.document_link)
      errors.document_link = "Required document link is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);
  //Handle submit
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setApiError(null);
      if (!validateForm()) {
        return;
      }
      try {
        const response = await fetch(`${backendURL}/api/publications`, {
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
      } catch (error) {
        console.error("Error during submission:", error);
        setApiError(`An error occurred: ${error.message}. Please try again.`);
      } finally {
        setFormData({
          title: "",
          abstract: "",
          author: "",
          document_link: "",
        });
        setFormErrors({});
      }
    },
    [formData, validateForm]
  );

  //Handle update
  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      setApiError(null);
      if (!validateForm()) {
        return;
      }
      try {
        const response = await fetch(
          `${backendURL}/api/publications/${editingIndex}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );
        if (!response.ok) {
          throw new Error(
            `Failed to update announcement (HTTP ${response.status})`
          );
        }
        const updatedAnnouncement = await response.json();
        setAnnouncements((prev) =>
          prev.map((announcement) =>
            announcement.id === editingIndex
              ? updatedAnnouncement
              : announcement
          )
        );
        setEditingIndex(null);
        alert("Announcement updated successfully!");
      } catch (error) {
        console.error("Error updating announcement:", error);
        setApiError(`An error occurred: ${error.message}. Please try again.`);
      } finally {
        setFormData({
          title: "",
          abstract: "",
          author: "",
          document_link: "",
        });
        setFormErrors({});
      }
    },
    [editingIndex, formData, validateForm]
  );

  //Handle edit
  const handleEdit = useCallback(
    (id) => {
      const announcement = announcements.find((a) => a.id === id);
      if (announcement) {
        setEditingIndex(id);
        setFormData(announcement);
      } else {
        console.error(`Announcement with ID ${id} not found for editing.`);
      }
    },
    [announcements]
  );

  //Handle delete
  const handleDelete = useCallback(
    async (id) => {
      if (
        window.confirm("Are you sure you want to delete this announcement?")
      ) {
        setAnnouncements((prev) =>
          prev.filter((announcement) => announcement.id !== id)
        );

        try {
          const response = await fetch(`${backendURL}/api/publications/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            fetchAllPublications();
            throw new Error(
              `Failed to delete announcement (HTTP ${response.status})`
            );
          }

          alert("Announcement deleted successfully!");
        } catch (error) {
          fetchAllPublications();
          console.error("Error deleting announcement:", error);
          setApiError(`An error occurred: ${error.message}. Please try again.`);
        }
      }
    },
    [fetchAllPublications]
  );

  //Handle collaboration open
  const handleCollaborationRequestOpen = useCallback(
    (announcementId) => {
      setCollaborationRequest({
        ...collaborationRequest,
        announcementId: announcementId,
      });
      setShowCollaborationModal(true);
    },
    [collaborationRequest]
  );
  //handle collaboaration close
  const handleCollaborationRequestClose = useCallback(() => {
    setShowCollaborationModal(false);
    setCollaborationRequest({
      researcherName: "",
      researcherEmail: "",
      announcementId: null,
    });
  }, []);
  //Handle change in input for collab
  const handleCollaborationRequestChange = useCallback((e) => {
    const { name, value } = e.target;
    setCollaborationRequest((prev) => ({ ...prev, [name]: value }));
  }, []);
  //Handle submit collab
  const handleCollaborationRequestSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setApiError(null);
      try {
        const response = await fetch(
          `${backendURL}/api/collaboration-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(collaborationRequest),
          }
        );
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
    },
    [collaborationRequest, handleCollaborationRequestClose]
  );
  //Handle search
  const handleSearch = useCallback(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  //Handle Sort By Date
  const handleSortByDate = useCallback(() => {
    setSortBy("date"); // This will trigger a re-sort in the sortedAnnouncements logic
  }, []);
  //Handle toggle abstract
  const handleToggleAbstracts = useCallback(() => {
    setShowAllAbstracts(!showAllAbstracts);
  }, [showAllAbstracts]);

  //Handle Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchTerm("");
  }, []);

  //UseMemo for sorted and filtererd
  const filteredAnnouncements = React.useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    return announcements.filter((announcement) => {
      return (
        announcement.title.toLowerCase().includes(searchTermLower) ||
        announcement.author.toLowerCase().includes(searchTermLower) ||
        announcement.abstract.toLowerCase().includes(searchTermLower)
      );
    });
  }, [announcements, searchTerm]);
  //
  const sortedAnnouncements = React.useMemo(() => {
    let sorted = [...filteredAnnouncements];
    if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "author") {
      sorted.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sortBy === "date") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return sorted;
  }, [filteredAnnouncements, sortBy]);

  // Determine if the form should be shown
  const showForm = typeof isLoggedIn === "boolean" ? isLoggedIn : true;

  return (
    <div className="publication-container">
      <h1 className="publication-title">
        {editingIndex !== null
          ? "Edit Announcement"
          : "Collaboration Announcements"}
      </h1>
      {/* Display apiError */}
      {apiError && (
        <div className="publication-error" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline">{apiError}</span>
        </div>
      )}
      {/* Announcement Form */}
      {showForm ? (
        <div className="publication-form-container">
          <h3 className="publication-form-title">
            {editingIndex !== null
              ? "Edit Announcement"
              : "Create New Announcement"}
          </h3>
          <form
            onSubmit={editingIndex !== null ? handleUpdate : handleSubmit}
            className="publication-form"
          >
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter announcement title"
              />
              {formErrors.title && (
                <p className="form-error">{formErrors.title}</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="abstract">Abstract</label>
              <textarea
                id="abstract"
                name="abstract"
                rows={3}
                value={formData.abstract}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter abstract"
              />
              {formErrors.abstract && (
                <p className="form-error">{formErrors.abstract}</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter author name"
              />
              {formErrors.author && (
                <p className="form-error">{formErrors.author}</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="document_link">Document Link</label>
              <input
                type="text"
                id="document_link"
                name="document_link"
                value={formData.document_link}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter document link"
              />
              {formErrors.document_link && (
                <p className="form-error">{formErrors.document_link}</p>
              )}
            </div>
            <div className="form-actions">
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null);
                    setFormData({
                      title: "",
                      abstract: "",
                      author: "",
                      document_link: "",
                    }); // Clear form
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                {editingIndex !== null
                  ? "Update Announcement"
                  : "Post Announcement"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="publication-login-message">
          Please log in to create announcements.
        </p>
      )}
      {/* Search bar */}
      <div className="publication-search-sort">
        <div className="publication-search">
          <input
            type="text"
            placeholder="Search by title, author, or abstract"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
          <button onClick={handleClearSearch} className="clear-button">
            Clear
          </button>
        </div>
        {/* Sort bar */}
        <div className="publication-sort">
          <label htmlFor="sort">Sort By:</label>
          <select
            id="sort"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="date">Date</option>
          </select>
        </div>
      </div>
      {/* Toggle abstract  */}
      <button
        onClick={handleToggleAbstracts}
        className="toggle-abstracts-button"
      >
        {showAllAbstracts ? "Hide All Abstracts" : "Show All Abstracts"}
      </button>
      {/* Display publication table */}
      <div className="publication-list">
        <h2 className="publication-list-title">
          Active Collaboration Announcements
        </h2>
        {loading ? (
          <p className="loading-message">Loading announcements...</p>
        ) : !Array.isArray(announcements) ? (
          <p className="error-message">Error: Could not load announcements.</p>
        ) : sortedAnnouncements.length === 0 ? (
          <p className="empty-message">No publications available.</p>
        ) : (
          <div className="grid-container">
            {sortedAnnouncements.map((announcement) => (
              <div key={announcement.id} className="publication-item">
                <h3 className="item-title">{announcement.title}</h3>
                <div className="item-details">
                  <p>
                    <strong>Abstract:</strong>{" "}
                    {showAllAbstracts
                      ? announcement.abstract
                      : announcement.abstract.substring(0, 100) + "..."}
                    {!showAllAbstracts &&
                      announcement.abstract.length > 100 && (
                        <button
                          className="read-more-button"
                          onClick={handleToggleAbstracts} // Show all abstracts when "Read More" is clicked
                        >
                          Read More
                        </button>
                      )}
                  </p>
                  <p>
                    <strong>Author:</strong> {announcement.author}
                  </p>
                  <p>
                    <strong>Document Link:</strong>{" "}
                    <a
                      href={announcement.document_link}
                      className="document-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Document
                    </a>
                  </p>
                </div>
                <div className="item-actions">
                  <button
                    onClick={() =>
                      handleCollaborationRequestOpen(announcement.id)
                    }
                    className="request-button"
                  >
                    Request Collaboration
                  </button>
                  {showForm && (
                    <>
                      <button
                        onClick={() => handleEdit(announcement.id)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal for collab */}
      {showCollaborationModal && (
        <div className="modal">
          <div className="modal-content">
            <h3 className="modal-title">Request Collaboration</h3>
            <div className="modal-body">
              <form onSubmit={handleCollaborationRequestSubmit}>
                <div className="form-group">
                  <label htmlFor="researcherName">Your Name</label>
                  <input
                    type="text"
                    id="researcherName"
                    name="researcherName"
                    value={collaborationRequest.researcherName}
                    onChange={handleCollaborationRequestChange}
                    required
                    className="form-control"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="researcherEmail">Your Email</label>
                  <input
                    type="email"
                    id="researcherEmail"
                    name="researcherEmail"
                    value={collaborationRequest.researcherEmail}
                    onChange={handleCollaborationRequestChange}
                    required
                    className="form-control"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCollaborationRequestClose}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
