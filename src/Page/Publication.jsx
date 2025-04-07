import React, { useState, useEffect, useCallback, useMemo } from "react";
const backendURL = "http://localhost:5000"; // Make sure this is correct
import "../index.css"; // Ensure your CSS file is correctly linked and styled

export default function MyPublications({ currentUser }) {
  const [myPublications, setMyPublications] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    author: "", // Pre-fill later if needed
    document_link: "",
  });
  const [editingId, setEditingId] = useState(null); // Use ID for editing state
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date"); // 'date', 'title', 'author'
  const [showAllAbstracts, setShowAllAbstracts] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const options = { year: "numeric", month: "long", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const fetchMyPublications = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      setMyPublications([]); // Ensure list is empty if no user
      return; // Don't fetch if not logged in
    }
    setLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }
      const response = await fetch(`${backendURL}/api/publications/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized. Please log in again.");
      }
      if (!response.ok) {
        throw new Error(
          `Failed to fetch your publications (HTTP ${response.status})`
        );
      }
      const data = await response.json();
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMyPublications(Array.isArray(data) ? data : []); // Ensure data is an array
    } catch (error) {
      console.error("Error fetching user publications:", error);
      setApiError(
        `Failed to load your publications: ${error.message}. Please try refreshing or logging in again.`
      );
      setMyPublications([]); // Clear publications on error
    } finally {
      setLoading(false);
    }
  }, [currentUser]); // Re-fetch if currentUser changes

  // Effect to fetch publications on mount or when currentUser changes
  useEffect(() => {
    fetchMyPublications();
  }, [fetchMyPublications]);

  // Pre-fill author field when currentUser is available and not editing
  useEffect(() => {
    if (currentUser && !editingId) {
      setFormData((prev) => ({
        ...prev,
        author: prev.author || currentUser.name || "",
      }));
    }
  }, [currentUser, editingId]);

  // --- Form Handling ---

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
    // Clear validation error for the field being changed
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  }, []);

  const validateForm = useCallback(() => {
    let errors = {};
    if (!formData.title?.trim()) errors.title = "Title is required";
    if (!formData.abstract?.trim()) errors.abstract = "Abstract is required";
    if (!formData.author?.trim()) errors.author = "Author name is required";
    if (!formData.document_link?.trim()) {
      errors.document_link = "Document link is required";
    } else {
      try {
        new URL(formData.document_link); // Basic URL validation
      } catch (_) {
        errors.document_link = "Please enter a valid URL (e.g., https://...)";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      abstract: "",
      author: currentUser?.name || "", // Reset author to current user's name
      document_link: "",
    });
    setFormErrors({});
    setEditingId(null);
  }, [currentUser]);

  // Handle Create Publication
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentUser || !validateForm()) {
        console.log("Submit validation failed or no user.");
        return;
      }
      setApiError(null);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authentication required.");

        const response = await fetch(`${backendURL}/api/publications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData), // Backend assigns userId based on token
        });

        if (!response.ok) {
          let errorMsg = `Failed to create publication (HTTP ${response.status})`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (_) {}
          throw new Error(errorMsg);
        }

        const newPublication = await response.json();
        // Add to the beginning and resort
        setMyPublications((prev) =>
          [newPublication, ...prev].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
        resetForm();
        alert("Publication posted successfully!");
      } catch (error) {
        console.error("Error creating publication:", error);
        setApiError(`An error occurred: ${error.message}. Please try again.`);
      }
    },
    [currentUser, formData, validateForm, resetForm]
  );

  // Handle Start Editing
  const handleEdit = useCallback(
    (id) => {
      const publicationToEdit = myPublications.find((p) => p.id === id);
      // No need to check userId here if fetchMyPublications worked correctly,
      // but it's good practice. The backend *must* enforce this.
      if (publicationToEdit && publicationToEdit.userId === currentUser?.id) {
        setEditingId(id);
        setFormData({
          title: publicationToEdit.title,
          abstract: publicationToEdit.abstract,
          author: publicationToEdit.author,
          document_link: publicationToEdit.document_link,
        });
        setFormErrors({});
        document
          .querySelector(".publication-form-container")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        console.error(
          `Cannot edit publication ${id}: Not found or not authorized.`
        );
        setApiError("You cannot edit this publication.");
      }
    },
    [myPublications, currentUser?.id]
  ); // Include currentUser.id dependency

  // Handle Update Publication
  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentUser || !editingId || !validateForm()) {
        console.log("Update validation failed or missing user/editingId.");
        return;
      }
      setApiError(null);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authentication required.");

        const response = await fetch(
          `${backendURL}/api/publications/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData), // Send updated data
          }
        );

        if (response.status === 403)
          throw new Error(
            "Forbidden: You do not have permission to edit this publication."
          );
        if (!response.ok) {
          let errorMsg = `Failed to update publication (HTTP ${response.status})`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (_) {}
          throw new Error(errorMsg);
        }

        const updatedPublication = await response.json();
        setMyPublications(
          (prev) =>
            prev.map((p) =>
              p.id === editingId ? { ...p, ...updatedPublication } : p
            ) // Ensure update includes new/correct data
        );
        resetForm(); // Clears form and editingId
        alert("Publication updated successfully!");
      } catch (error) {
        console.error("Error updating publication:", error);
        setApiError(`An error occurred: ${error.message}. Please try again.`);
      }
    },
    [currentUser, editingId, formData, validateForm, resetForm]
  );

  // Handle Delete Publication
  const handleDelete = useCallback(
    async (id) => {
      const publicationToDelete = myPublications.find((p) => p.id === id);
      if (
        !currentUser ||
        !publicationToDelete ||
        publicationToDelete.userId !== currentUser.id
      ) {
        alert("You do not have permission to delete this publication.");
        return;
      }

      if (window.confirm("Are you sure you want to delete this publication?")) {
        setApiError(null);
        try {
          const token = localStorage.getItem("authToken");
          if (!token) throw new Error("Authentication required.");

          const response = await fetch(`${backendURL}/api/publications/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 403)
            throw new Error(
              "Forbidden: You do not have permission to delete this publication."
            );
          if (!response.ok) {
            throw new Error(
              `Failed to delete publication (HTTP ${response.status})`
            );
          }

          setMyPublications((prev) => prev.filter((p) => p.id !== id));
          alert("Publication deleted successfully!");
          if (editingId === id) {
            resetForm(); // Reset form if deleting the item being edited
          }
        } catch (error) {
          console.error("Error deleting publication:", error);
          setApiError(`An error occurred: ${error.message}. Please try again.`);
        }
      }
    },
    [currentUser, myPublications, editingId, resetForm]
  ); // Dependencies

  // Handle Cancel Edit
  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // --- Search and Sort ---

  const handleSearch = useCallback(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchTerm("");
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  // Filtered and Sorted Publications (Memoized)
  const processedPublications = useMemo(() => {
    let filtered = [...myPublications];

    // Filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          p.author.toLowerCase().includes(lowerCaseSearchTerm) ||
          p.abstract.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // Sort
    switch (sortBy) {
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "author":
        filtered.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case "date":
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return filtered;
  }, [myPublications, searchTerm, sortBy]);

  // Toggle abstract display mode
  const handleToggleAbstracts = useCallback(() => {
    setShowAllAbstracts(!showAllAbstracts);
  }, [showAllAbstracts]);

  // --- Render Logic ---

  // If no user is logged in, show a message
  if (!currentUser) {
    return (
      <div className="publication-container">
        <h1 className="publication-title">My Publications</h1>
        <p className="publication-login-message">
          Please log in to view and manage your publications.
        </p>
      </div>
    );
  }

  return (
    <div className="publication-container">
      {/* Use a more specific title */}
      <h1 className="publication-title">My Publications</h1>

      {apiError && (
        <div className="publication-error" role="alert">
          <strong>Error!</strong> {apiError}
          <button
            onClick={() => setApiError(null)}
            className="modal-close-button"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* ====== Publication Form (Create/Edit) ====== */}
      <div className="publication-form-container">
        <h3 className="publication-form-title">
          {editingId ? "Edit Publication" : "Post New Publication"}
        </h3>
        <form
          onSubmit={editingId ? handleUpdate : handleSubmit}
          className="publication-form"
          noValidate
        >
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input /* ... input props ... */
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-control ${formErrors.title ? "is-invalid" : ""}`}
              placeholder="Publication title"
              required
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
            <textarea /* ... textarea props ... */
              id="abstract"
              name="abstract"
              rows={4}
              value={formData.abstract}
              onChange={handleChange}
              className={`form-control ${
                formErrors.abstract ? "is-invalid" : ""
              }`}
              placeholder="Brief summary or abstract"
              required
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
            <label htmlFor="author">Author(s)</label>
            <input /* ... input props ... */
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className={`form-control ${
                formErrors.author ? "is-invalid" : ""
              }`}
              placeholder="Your name or research group"
              required
              aria-invalid={!!formErrors.author}
              aria-describedby={formErrors.author ? "author-error" : undefined}
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
            <input /* ... input props ... */
              type="url"
              id="document_link"
              name="document_link"
              value={formData.document_link}
              onChange={handleChange}
              className={`form-control ${
                formErrors.document_link ? "is-invalid" : ""
              }`}
              placeholder="https://example.com/paper.pdf"
              required
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
          <div className="form-actions">
            {editingId && (
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
              {editingId ? "Update Publication" : "Post Publication"}{" "}
            </button>
          </div>
        </form>
      </div>

      <div className="publication-controls">
        <div className="publication-search-sort">
          {/* Search */}
          <div className="publication-search">
            <input
              type="text"
              placeholder="Search your publications..."
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
          {/* Sort */}
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
        {myPublications.some((p) => p.abstract.length > 150) && ( // Only show if potentially useful
          <button
            onClick={handleToggleAbstracts}
            className="toggle-abstracts-button"
          >
            {showAllAbstracts ? "Collapse Abstracts" : "Expand All Abstracts"}
          </button>
        )}
      </div>

      {/* ====== Display User's Publication List ====== */}
      <div className="publication-list">
        <h2 className="publication-list-title">Your Posted Publications</h2>
        {loading ? (
          <div className="loading-message">Loading your publications...</div>
        ) : !Array.isArray(myPublications) ? ( // Check if it's an array before using .length
          <div className="error-message">
            Could not load publications data correctly.
          </div>
        ) : processedPublications.length === 0 ? (
          <div className="empty-message">
            {searchTerm
              ? `No results found for "${searchTerm}" in your publications.`
              : "You haven't posted any publications yet."}
          </div>
        ) : (
          <div className="grid-container">
            {" "}
            {/* Or list-container */}
            {processedPublications.map((publication) => (
              <div key={publication.id} className="publication-item">
                <h3 className="item-title">{publication.title}</h3>
                <div className="item-details">
                  <p>
                    <strong>Author(s):</strong> {publication.author}
                  </p>
                  <p className="item-date">
                    <strong>Posted:</strong> {formatDate(publication.createdAt)}
                  </p>
                  <p>
                    <strong>Abstract:</strong>{" "}
                    {showAllAbstracts || publication.abstract.length <= 150
                      ? publication.abstract
                      : `${publication.abstract.substring(0, 150)}...`}
                  </p>
                  <p>
                    <strong>Document:</strong>{" "}
                    <a
                      href={publication.document_link}
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
                  {/* Edit/Delete buttons are always relevant here */}
                  <button
                    onClick={() => handleEdit(publication.id)}
                    className="edit-button"
                    disabled={editingId === publication.id}
                  >
                    {" "}
                    Edit{" "}
                  </button>
                  <button
                    onClick={() => handleDelete(publication.id)}
                    className="delete-button"
                    disabled={editingId !== null}
                  >
                    {" "}
                    Delete{" "}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
