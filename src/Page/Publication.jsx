import React, { useState, useEffect, useCallback } from "react";

export default function Publication({ isLoggedIn }) {
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    author: "",
    document_link: "",
  });
  const [editingIndex, setEditingIndex] = useState(null); // Store id of the editing.
  const [collaborationRequest, setCollaborationRequest] = useState({
    researcherName: "",
    researcherEmail: "",
    announcementId: null,
  });
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [searchTerm, setSearchTerm] = useState("");

  const backendURL = "http://localhost:5000";

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

  useEffect(() => {
    fetchAllPublications();
  }, []);

  const fetchAllPublications = async () => {
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
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  }, []);

  const validateForm = () => {
    let errors = {};
    if (!formData.title) errors.title = "Title is required";
    if (!formData.abstract) errors.abstract = "Abstract is required";
    if (!formData.author) errors.author = "Author is required";
    if (!formData.document_link)
      errors.document_link = "Required document link is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
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
  };
  // New
  const handleUpdate = async (e) => {
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
          announcement.id === editingIndex ? updatedAnnouncement : announcement
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
  };

  const handleEdit = (id) => {
    const announcement = announcements.find((a) => a.id === id);
    if (announcement) {
      setEditingIndex(id); // Set the editing index to the announcement ID
      setFormData(announcement); // Load the announcement data into the form
    } else {
      console.error(`Announcement with ID ${id} not found for editing.`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      // Remove the original delete to load data from backend if it doesnt delete
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
      const response = await fetch(`${backendURL}/api/collaboration-requests`, {
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

  const handleSearch = () => {
    setSearchTerm(searchQuery);
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      announcement.title.toLowerCase().includes(searchTermLower) ||
      announcement.author.toLowerCase().includes(searchTermLower) ||
      announcement.abstract.toLowerCase().includes(searchTermLower)
    );
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "author") {
      return a.author.localeCompare(b.author);
    }
    return 0;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">
        {editingIndex !== null
          ? "Edit Announcement"
          : "Post a Collaboration Announcement"}
      </h1>

      {apiError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline">{apiError}</span>
        </div>
      )}

      {isLoggedIn ? (
        <form
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          onSubmit={editingIndex !== null ? handleUpdate : handleSubmit}
        >
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="title"
            >
              Announcement Title:
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              id="title"
              name="title"
              placeholder="Announcement Title"
              value={formData.title}
              onChange={handleChange}
              required
            />
            {formErrors.title && (
              <p className="text-red-500 text-xs italic">{formErrors.title}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="abstract"
            >
              Abstract
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="abstract"
              name="abstract"
              placeholder="abstract"
              value={formData.abstract}
              onChange={handleChange}
              required
            />
            {formErrors.abstract && (
              <p className="text-red-500 text-xs italic">
                {formErrors.description}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="author"
            >
              author
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="author"
              name="author"
              placeholder="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
            {formErrors.author && (
              <p className="text-red-500 text-xs italic">
                {formErrors.qualifications}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="document_link"
            >
              document_link:
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              id="document_link"
              name="document_link"
              value={formData.document_link}
              onChange={handleChange}
              required
            />
            {formErrors.document_link && (
              <p className="text-red-500 text-xs italic">
                {formErrors.deadline}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              {editingIndex !== null
                ? "Update Announcement"
                : "Post Announcement"}
            </button>
            {editingIndex !== null && (
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={() => setEditingIndex(null)}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="text-gray-600">Please log in to create announcements.</p>
      )}

      {/* Search and Sort Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search by title, author, or abstract"
            className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
          >
            Search
          </button>
        </div>
        <select
          className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="title">Sort by Title</option>
          <option value="author">Sort by Author</option>
        </select>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Active Collaboration Announcements
        </h2>
        {loading ? (
          <p className="text-gray-600">Loading announcements...</p>
        ) : !Array.isArray(announcements) ? (
          <p className="text-red-500">Error: Could not load announcements.</p>
        ) : sortedAnnouncements.length === 0 ? (
          <p className="text-gray-600">No publications available.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {announcement.title}
                  </h3>
                  <div className="text-gray-700">
                    <p className="mb-2">
                      <strong>Abstract:</strong>
                      <div>{announcement.abstract}</div>
                    </p>
                    <p className="mb-2">
                      <strong>Author:</strong>
                      <div>{announcement.author}</div>
                    </p>
                    <p className="mb-2">
                      <strong>Document Link:</strong>
                      <a
                        href={announcement.document_link}
                        className="text-blue-500 hover:underline"
                      >
                        {announcement.title}
                      </a>
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={() =>
                        handleCollaborationRequestOpen(announcement.id)
                      }
                      aria-label={`Request collaboration for ${announcement.title}`}
                    >
                      Request
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={() => handleEdit(announcement.id)}
                      aria-label={`Edit announcement ${announcement.title}`}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={() => handleDelete(announcement.id)}
                      aria-label={`Delete announcement ${announcement.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCollaborationModal && (
        <div
          className="fixed z-10 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Code */}
        </div>
      )}
    </div>
  );
}
