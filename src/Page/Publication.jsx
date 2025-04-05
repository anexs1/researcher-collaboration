import React, { useState, useEffect, useCallback } from "react";
const backendURL = "http://localhost:5000";
import "../index.css";

// Assume currentUser prop is passed, e.g., { id: 1, name: 'John Doe', ... } or null/undefined if not logged in
export default function Publication({ currentUser }) {
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    author: "", // Consider pre-filling this from currentUser if applicable
    document_link: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [collaborationRequest, setCollaborationRequest] = useState({
    researcherName: "", // Consider pre-filling from currentUser
    researcherEmail: "", // Consider pre-filling from currentUser
    announcementId: null,
    researcherMessage: "", // Added field for optional message
  });
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showAllAbstracts, setShowAllAbstracts] = useState(false);
  const [sortBy, setSortBy] = useState("date");

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
      // Sort initial data by date descending
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
  }, [fetchAllPublications]);

  // Handle change for main form inputs
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log(`handleChange -> Field: ${name}, Value: ${value}`);
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  }, []);

  // Handle change for collaboration modal inputs
  const handleCollaborationRequestChange = useCallback((e) => {
    const { name, value } = e.target;
    setCollaborationRequest((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Validate main form
  const validateForm = useCallback(() => {
    let errors = {};
    console.log("validateForm -> Checking formData:", formData);
    if (!formData.title?.trim()) errors.title = "Title is required";
    if (!formData.abstract?.trim()) errors.abstract = "Abstract is required";
    if (!formData.author?.trim()) errors.author = "Author is required";
    if (!formData.document_link?.trim()) {
      errors.document_link = "Document link is required";
    } else {
      try {
        new URL(formData.document_link);
      } catch (_) {
        errors.document_link = "Please enter a valid URL (e.g., https://...)";
      }
    }
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log("validateForm -> Errors:", errors, "Is Valid:", isValid);
    return isValid;
  }, [formData]);

  // Handle submit (Create)
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentUser) {
        setApiError("You must be logged in to post an announcement.");
        return;
      }
      setApiError(null);
      if (!validateForm()) {
        console.log("Form validation failed.");
        return;
      }
      console.log("Form validation passed. Submitting:", formData);
      try {
        // Include Authorization header if your backend requires it
        const token = localStorage.getItem("authToken");
        const headers = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${backendURL}/api/publications`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          let errorMsg = `Failed to create announcement (HTTP ${response.status})`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (_) {}
          throw new Error(errorMsg);
        }
        const newAnnouncement = await response.json();
        // Ensure new announcement has necessary fields (like createdAt, userId if returned)
        // Add to the beginning of the list and re-sort based on current sort state
        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        alert("Announcement created successfully!");
        setFormData({ title: "", abstract: "", author: "", document_link: "" });
        setFormErrors({});
      } catch (error) {
        console.error("Error during submission:", error);
        setApiError(`An error occurred: ${error.message}. Please try again.`);
      }
    },
    [formData, validateForm, currentUser]
  );

  // Handle update
  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentUser || !editingIndex) {
        setApiError(
          "Cannot update: Not logged in or no item selected for editing."
        );
        return;
      }
      setApiError(null);
      if (!validateForm()) {
        console.log("Update form validation failed.");
        return;
      }
      console.log("Update validation passed. Submitting:", formData);
      try {
        const token = localStorage.getItem("authToken");
        const headers = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${backendURL}/api/publications/${editingIndex}`,
          {
            method: "PUT",
            headers: headers,
            body: JSON.stringify(formData),
          }
        );
        if (response.status === 403) {
          throw new Error(
            `Forbidden: You do not have permission to edit this announcement (HTTP 403)`
          );
        }
        if (!response.ok) {
          let errorMsg = `Failed to update announcement (HTTP ${response.status})`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (_) {}
          throw new Error(errorMsg);
        }
        const updatedAnnouncementData = await response.json();
        setAnnouncements((prev) =>
          prev.map(
            (announcement) =>
              announcement.id === editingIndex
                ? { ...announcement, ...updatedAnnouncementData }
                : announcement // Merge update, keep existing userId/createdAt if not returned
          )
        );
        setEditingIndex(null);
        alert("Announcement updated successfully!");
        setFormData({ title: "", abstract: "", author: "", document_link: "" });
        setFormErrors({});
      } catch (error) {
        console.error("Error updating announcement:", error);
        setApiError(`An error occurred: ${error.message}. Please try again.`);
      }
    },
    [editingIndex, formData, validateForm, currentUser]
  );

  // Handle edit
  const handleEdit = useCallback(
    (id) => {
      const announcement = announcements.find((a) => a.id === id);
      if (
        announcement &&
        currentUser &&
        announcement.userId === currentUser.id
      ) {
        setEditingIndex(id);
        setFormData({
          // Populate form with existing data
          title: announcement.title,
          abstract: announcement.abstract,
          author: announcement.author,
          document_link: announcement.document_link,
        });
        setFormErrors({});
        // Scroll form into view for better UX
        document
          .querySelector(".publication-form-container")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        console.error(
          `Cannot edit announcement ${id}: Not found or not authorized.`
        );
        setApiError("You do not have permission to edit this announcement.");
      }
    },
    [announcements, currentUser]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (id) => {
      const announcementToDelete = announcements.find((a) => a.id === id);
      if (
        !currentUser ||
        !announcementToDelete ||
        announcementToDelete.userId !== currentUser.id
      ) {
        alert("You do not have permission to delete this announcement.");
        return;
      }
      if (
        window.confirm("Are you sure you want to delete this announcement?")
      ) {
        setApiError(null);
        try {
          const token = localStorage.getItem("authToken");
          const headers = {}; // No content type needed for DELETE usually
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const response = await fetch(`${backendURL}/api/publications/${id}`, {
            method: "DELETE",
            headers: headers,
          });
          if (response.status === 403) {
            throw new Error(
              `Forbidden: You do not have permission to delete this announcement (HTTP 403)`
            );
          }
          if (!response.ok) {
            throw new Error(
              `Failed to delete announcement (HTTP ${response.status})`
            );
          }

          setAnnouncements((prev) =>
            prev.filter((announcement) => announcement.id !== id)
          );
          alert("Announcement deleted successfully!");
          if (editingIndex === id) {
            // Reset form if deleting the item being edited
            setEditingIndex(null);
            setFormData({
              title: "",
              abstract: "",
              author: "",
              document_link: "",
            });
            setFormErrors({});
          }
        } catch (error) {
          console.error("Error deleting announcement:", error);
          setApiError(`An error occurred: ${error.message}. Please try again.`);
        }
      }
    },
    [announcements, currentUser, editingIndex]
  );

  // Handle open collaboration modal
  const handleCollaborationRequestOpen = useCallback(
    (announcementId) => {
      // Pre-fill name/email from logged-in user if available
      setCollaborationRequest({
        researcherName: currentUser?.name || "",
        researcherEmail: currentUser?.email || "",
        researcherMessage: "", // Clear message field
        announcementId: announcementId,
      });
      setShowCollaborationModal(true);
    },
    [currentUser] // Depend on currentUser
  );

  // Handle close collaboration modal
  const handleCollaborationRequestClose = useCallback(() => {
    setShowCollaborationModal(false);
    // No need to reset state here, handleCollaborationRequestOpen does it
  }, []);

  // Handle submit collaboration request
  const handleCollaborationRequestSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setApiError(null); // Clear previous errors
      // Basic validation for collab form
      if (
        !collaborationRequest.researcherName?.trim() ||
        !collaborationRequest.researcherEmail?.trim()
      ) {
        // You might want a more specific error state for the modal
        alert("Please enter your name and email.");
        return;
      }
      try {
        // Add token if collab requests need authentication
        const token = localStorage.getItem("authToken");
        const headers = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${backendURL}/api/collaboration-requests`,
          {
            method: "POST",
            headers: headers,
            body: JSON.stringify(collaborationRequest), // Send name, email, message, annId
          }
        );
        if (!response.ok) {
          let errorMsg = `Failed to submit collaboration request (HTTP ${response.status})`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (_) {}
          throw new Error(errorMsg);
        }
        alert("Collaboration request submitted successfully!");
        handleCollaborationRequestClose(); // Close modal on success
      } catch (error) {
        console.error("Error submitting collaboration request:", error);
        // Show error within the modal? Or use the main apiError state?
        setApiError(
          `Failed to submit request: ${error.message}. Please try again.`
        );
        // alert(`Failed to submit request: ${error.message}. Please try again.`); // Simple alert fallback
      }
    },
    [collaborationRequest, handleCollaborationRequestClose] // Dependencies
  );

  // Handle search trigger
  const handleSearch = useCallback(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  // Handle sort selection
  // This state change will trigger the useMemo recalculation
  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  // Toggle abstract display mode
  const handleToggleAbstracts = useCallback(() => {
    setShowAllAbstracts(!showAllAbstracts);
  }, [showAllAbstracts]);

  // Clear search term
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchTerm("");
  }, []);

  // Filter announcements based on search term
  const filteredAnnouncements = React.useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) {
      return announcements; // No search term, return all
    }
    return announcements.filter(
      (announcement) =>
        announcement.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        announcement.author.toLowerCase().includes(lowerCaseSearchTerm) ||
        announcement.abstract.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [announcements, searchTerm]);

  // Sort the filtered announcements
  const sortedAnnouncements = React.useMemo(() => {
    let sorted = [...filteredAnnouncements]; // Create a new array to sort
    switch (sortBy) {
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "author":
        sorted.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case "date": // Default case
      default:
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return sorted;
  }, [filteredAnnouncements, sortBy]);

  // Determine if the form should be shown
  const showForm = !!currentUser;

  // --- Cancel Edit Function ---
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setFormData({ title: "", abstract: "", author: "", document_link: "" });
    setFormErrors({});
  }, []);

  // ========================
  // === RENDER COMPONENT ===
  // ========================
  return (
    <div className="publication-container">
      <h1 className="publication-title">Collaboration Announcements</h1>

      {/* --- API Error Display --- */}
      {apiError && (
        <div className="publication-error" role="alert">
          <strong>Error!</strong>
          <span className="block sm:inline"> {apiError}</span>
          <button
            onClick={() => setApiError(null)}
            className="modal-close-button"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* ====== Announcement Form ====== */}
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
            noValidate
          >
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`form-control ${
                  formErrors.title ? "is-invalid" : ""
                }`}
                placeholder="Enter announcement title"
                aria-invalid={!!formErrors.title}
                aria-describedby={formErrors.title ? "title-error" : undefined}
              />
              {formErrors.title && (
                <p id="title-error" className="form-error">
                  {formErrors.title}
                </p>
              )}
            </div>
            {/* Abstract */}
            <div className="form-group">
              <label htmlFor="abstract">Abstract</label>
              <textarea
                id="abstract"
                name="abstract"
                rows={3}
                value={formData.abstract}
                onChange={handleChange}
                className={`form-control ${
                  formErrors.abstract ? "is-invalid" : ""
                }`}
                placeholder="Enter abstract"
                aria-invalid={!!formErrors.abstract}
                aria-describedby={
                  formErrors.abstract ? "abstract-error" : undefined
                }
              />
              {formErrors.abstract && (
                <p id="abstract-error" className="form-error">
                  {formErrors.abstract}
                </p>
              )}
            </div>
            {/* Author */}
            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className={`form-control ${
                  formErrors.author ? "is-invalid" : ""
                }`}
                placeholder="Enter author name (e.g., your name or group)"
                aria-invalid={!!formErrors.author}
                aria-describedby={
                  formErrors.author ? "author-error" : undefined
                }
              />
              {formErrors.author && (
                <p id="author-error" className="form-error">
                  {formErrors.author}
                </p>
              )}
            </div>
            {/* Document Link */}
            <div className="form-group">
              <label htmlFor="document_link">Document Link (URL)</label>
              <input
                type="url"
                id="document_link"
                name="document_link"
                value={formData.document_link}
                onChange={handleChange}
                className={`form-control ${
                  formErrors.document_link ? "is-invalid" : ""
                }`}
                placeholder="e.g., https://example.com/document.pdf"
                aria-invalid={!!formErrors.document_link}
                aria-describedby={
                  formErrors.document_link ? "link-error" : undefined
                }
              />
              {formErrors.document_link && (
                <p id="link-error" className="form-error">
                  {formErrors.document_link}
                </p>
              )}
            </div>
            {/* Actions */}
            <div className="form-actions">
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                >
                  {" "}
                  Cancel{" "}
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                {" "}
                {editingIndex !== null
                  ? "Update Announcement"
                  : "Post Announcement"}{" "}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="publication-login-message">
          {" "}
          Please log in to create or manage announcements.{" "}
        </p>
      )}

      {/* ====== Search, Sort, Toggle Area ====== */}
      <div className="publication-controls">
        <div className="publication-search-sort">
          <div className="publication-search">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="search-button"
              aria-label="Search"
            >
              Search
            </button>
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="clear-button"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>
          <div className="publication-sort">
            <label htmlFor="sort">Sort By:</label>
            <select
              id="sort"
              className="sort-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="date">Date (Newest)</option>
              <option value="title">Title (A-Z)</option>
              <option value="author">Author (A-Z)</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleToggleAbstracts}
          className="toggle-abstracts-button"
        >
          {showAllAbstracts ? "Collapse Abstracts" : "Expand All Abstracts"}
        </button>
      </div>

      {/* ====== Display Publication List ====== */}
      <div className="publication-list">
        <h2 className="publication-list-title">
          {" "}
          Active Collaboration Announcements{" "}
        </h2>
        {loading ? (
          <div className="loading-message">Loading...</div>
        ) : !Array.isArray(announcements) ? (
          <div className="error-message">Error loading announcements.</div>
        ) : sortedAnnouncements.length === 0 ? (
          <div className="empty-message">
            {" "}
            {searchTerm
              ? `No results for "${searchTerm}".`
              : "No publications yet."}{" "}
          </div>
        ) : (
          <div className="grid-container">
            {sortedAnnouncements.map((announcement) => (
              // --- Publication Item ---
              <div key={announcement.id} className="publication-item">
                <h3 className="item-title">{announcement.title}</h3>
                <div className="item-details">
                  <p>
                    <strong>Author:</strong> {announcement.author}
                  </p>
                  <p className="item-date">
                    <strong>Posted:</strong>{" "}
                    {formatDate(announcement.createdAt)}
                  </p>
                  <p>
                    <strong>Abstract:</strong>{" "}
                    {showAllAbstracts || announcement.abstract.length <= 150
                      ? announcement.abstract
                      : `${announcement.abstract.substring(0, 150)}...`}
                  </p>
                  <p>
                    <strong>Document:</strong>{" "}
                    <a
                      href={announcement.document_link}
                      className="document-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Document{" "}
                      <span aria-label="(opens in new tab)">↗</span>
                    </a>
                  </p>
                </div>
                <div className="item-actions">
                  {/* Collab Button: Show unless user is owner? Or always show? */}
                  <button
                    onClick={() =>
                      handleCollaborationRequestOpen(announcement.id)
                    }
                    className="request-button"
                  >
                    {" "}
                    Request Collaboration{" "}
                  </button>
                  {/* Edit/Delete Buttons: Show only if user is owner */}
                  {currentUser && announcement.userId === currentUser.id && (
                    <>
                      <button
                        onClick={() => handleEdit(announcement.id)}
                        className="edit-button"
                        disabled={editingIndex === announcement.id}
                      >
                        {" "}
                        Edit{" "}
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="delete-button"
                        disabled={editingIndex !== null}
                      >
                        {" "}
                        Delete{" "}
                      </button>
                    </>
                  )}
                </div>
              </div>
              // --- End Publication Item ---
            ))}
          </div>
        )}
      </div>

      {/* ====== Collaboration Modal ====== */}
      {showCollaborationModal && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="collab-modal-title"
        >
          <div className="modal-content">
            <h3 id="collab-modal-title" className="modal-title">
              {" "}
              Request Collaboration{" "}
            </h3>
            <button
              onClick={handleCollaborationRequestClose}
              className="modal-close-button"
              aria-label="Close"
            >
              ×
            </button>
            <div className="modal-body">
              <form onSubmit={handleCollaborationRequestSubmit}>
                {/* Optional: Display title of item being requested */}
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
                <div className="form-group">
                  <label htmlFor="researcherMessage">Message (Optional)</label>
                  <textarea
                    id="researcherMessage"
                    name="researcherMessage"
                    rows="3"
                    value={collaborationRequest.researcherMessage}
                    onChange={handleCollaborationRequestChange}
                    className="form-control"
                    placeholder="Briefly explain your interest..."
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCollaborationRequestClose}
                  >
                    {" "}
                    Cancel{" "}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {" "}
                    Submit Request{" "}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div> // End publication-container
  );
} // End Publication component function
