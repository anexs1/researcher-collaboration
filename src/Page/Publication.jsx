import React, { useState, useEffect, useCallback } from "react";

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
  const [sortBy, setSortBy] = useState("title");
  const [searchTerm, setSearchTerm] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showAllAbstracts, setShowAllAbstracts] = useState(false); // New state

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
      setEditingIndex(id);
      setFormData(announcement);
    } else {
      console.error(`Announcement with ID ${id} not found for editing.`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
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

  // New functions for button functionalities

  const handleToggleAbstracts = () => {
    setShowAllAbstracts(!showAllAbstracts);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
  };

  const handleSortByDate = () => {
    setSortBy("date"); // This will trigger a re-sort in the sortedAnnouncements logic
    const sortedByDate = [...filteredAnnouncements].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt); //Sort by date created, most recent first
    });
    setAnnouncements(sortedByDate); // Update the announcements state to reflect the sorted order
  };
  // Conditional rendering based on isLoggedIn
  let showForm = false;
  if (typeof isLoggedIn === "boolean") {
    showForm = isLoggedIn; // Use the prop directly
  } else {
    // If 'isLoggedIn' prop is not provided, simulate a logged-in state for development.
    showForm = true;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
          {editingIndex !== null
            ? "Edit Announcement"
            : "Collaboration Announcements"}
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

        {/* Announcement Form */}
        {showForm ? (
          <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingIndex !== null
                  ? "Edit Announcement"
                  : "Create New Announcement"}
              </h3>
              <form
                onSubmit={editingIndex !== null ? handleUpdate : handleSubmit}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter announcement title"
                    />
                    {formErrors.title && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors.title}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="abstract"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Abstract
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="abstract"
                      name="abstract"
                      rows={3}
                      value={formData.abstract}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter abstract"
                    />
                    {formErrors.abstract && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors.abstract}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="author"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Author
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter author name"
                    />
                    {formErrors.author && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors.author}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="document_link"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Document Link
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="document_link"
                      name="document_link"
                      value={formData.document_link}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter document link"
                    />
                    {formErrors.document_link && (
                      <p className="mt-2 text-sm text-red-500">
                        {formErrors.document_link}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
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
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded mr-2"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {editingIndex !== null
                      ? "Update Announcement"
                      : "Post Announcement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600">
            Please log in to create announcements.
          </p>
        )}

        {/* Search and Sort Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <div className="flex flex-col md:flex-row items-center mb-2 md:mb-0">
            <input
              type="text"
              placeholder="Search by title, author, or abstract"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full md:w-64 sm:text-sm border-gray-300 rounded-md mr-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={handleSearch}
              className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Search
            </button>
            <button
              onClick={handleClearSearch}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center">
            <label
              htmlFor="sort"
              className="mr-2 text-sm font-medium text-gray-700"
            >
              Sort By:
            </label>
            <select
              id="sort"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
            </select>
            <button
              onClick={handleSortByDate}
              className="bg-blue-300 hover:bg-blue-400 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
            >
              Sort by Date
            </button>
          </div>
        </div>
        <button
          onClick={handleToggleAbstracts}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
        >
          {showAllAbstracts ? "Hide All Abstracts" : "Show All Abstracts"}
        </button>

        {/* Announcement List */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Active Collaboration Announcements
          </h2>
          {loading ? (
            <p className="text-gray-600">Loading announcements...</p>
          ) : !Array.isArray(announcements) ? (
            <p className="text-red-500">Error: Could not load announcements.</p>
          ) : sortedAnnouncements.length === 0 ? (
            <p className="text-gray-600">No publications available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white shadow overflow-hidden rounded-lg"
                >
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {announcement.title}
                    </h3>
                    <div className="text-sm text-gray-500">
                      <p className="mb-2">
                        <strong>Abstract:</strong>{" "}
                        {showAllAbstracts
                          ? announcement.abstract
                          : announcement.abstract.substring(0, 100) + "..."}
                        {!showAllAbstracts &&
                          announcement.abstract.length > 100 && (
                            <button
                              className="text-blue-500 hover:text-blue-700 ml-1 focus:outline-none"
                              onClick={() => setShowAllAbstracts(true)} // Show all abstracts when "Read More" is clicked
                            >
                              Read More
                            </button>
                          )}
                      </p>
                      <p className="mb-2">
                        <strong>Author:</strong> {announcement.author}
                      </p>
                      <p className="mb-2">
                        <strong>Document Link:</strong>{" "}
                        <a
                          href={announcement.document_link}
                          className="text-indigo-600 hover:text-indigo-800"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Document
                        </a>
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() =>
                          handleCollaborationRequestOpen(announcement.id)
                        }
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      >
                        Request Collaboration
                      </button>
                      {showForm && (
                        <>
                          <button
                            onClick={() => handleEdit(announcement.id)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collaboration Request Modal */}
        {showCollaborationModal && (
          <div
            className="fixed z-10 inset-0 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
              ></div>
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                ​
              </span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    Request Collaboration
                  </h3>
                  <div className="mt-2">
                    <form
                      onSubmit={handleCollaborationRequestSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="researcherName"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Your Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="researcherName"
                            name="researcherName"
                            value={collaborationRequest.researcherName}
                            onChange={handleCollaborationRequestChange}
                            required
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Enter your name"
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="researcherEmail"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Your Email
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            id="researcherEmail"
                            name="researcherEmail"
                            value={collaborationRequest.researcherEmail}
                            onChange={handleCollaborationRequestChange}
                            required
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Enter your email"
                          />
                        </div>
                      </div>
                      <div className="sm:flex sm:items-center sm:justify-between">
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                          onClick={handleCollaborationRequestClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          Submit Request
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
