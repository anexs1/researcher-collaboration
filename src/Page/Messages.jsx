// src/pages/Messages.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUserCircle,
  FaSearch,
  FaSpinner,
  FaExclamationTriangle,
  FaProjectDiagram,
  FaUserClock,
  FaUserCheck,
} from "react-icons/fa";

// Adjust paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Messages({ currentUser }) {
  const [groupedContacts, setGroupedContacts] = useState([]); // State holds array of groups
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch Grouped Contacts
  const fetchGroupedContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken"); // Verify this key is correct!
    if (!token) {
      setError("Authentication required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/messaging/grouped-contacts`,
        {
          // Calls the correct endpoint
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success && Array.isArray(response.data.data)) {
        setGroupedContacts(response.data.data);
      } else {
        throw new Error(response.data?.message || "Failed to load contacts.");
      }
    } catch (err) {
      console.error("Error fetching grouped message contacts:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not load contacts.";
      setError(errorMsg);
      setGroupedContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed if fetch is only on mount/retry

  useEffect(() => {
    fetchGroupedContacts();
  }, [fetchGroupedContacts]);

  // Client-side Filtering within Groups
  const filteredGroupedContacts = groupedContacts
    .map((group) => ({
      ...group,
      contacts: group.contacts.filter((contact) =>
        contact.username?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((group) => group.contacts.length > 0); // Keep only groups with matching contacts

  // Navigate to chat page
  const handleContactClick = (userId) => {
    navigate(`/messages/${userId}`); // Ensure this route exists in App.jsx
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 border-b pb-4 border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Messages
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Contacts grouped by project.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sticky top-0 bg-gray-50 py-2 z-10 -mx-4 px-4 border-b">
        <div className="relative max-w-xl mx-auto">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts by username..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            aria-label="Search contacts"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto -mx-4 px-4 pb-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            {" "}
            <LoadingSpinner size="lg" />{" "}
            <span className="ml-3 text-gray-500">Loading Contacts...</span>{" "}
          </div>
        ) : error ? (
          <div className="py-10">
            {" "}
            <ErrorMessage
              message={error}
              onClose={() => {
                setError(null);
                fetchGroupedContacts();
              }}
            />{" "}
          </div> // Allow retry
        ) : filteredGroupedContacts.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              No Contacts Found
            </h3>
            <p className="mt-2 text-gray-600">
              {searchTerm
                ? "No contacts match your search."
                : "Join or create projects and add members/get requests to start messaging!"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-200"
              >
                {" "}
                Clear Search{" "}
              </button>
            )}
          </div>
        ) : (
          // --- Render Grouped List ---
          <div className="space-y-6">
            {filteredGroupedContacts.map((group) => (
              <div
                key={group.projectId}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
              >
                {/* Project Header */}
                <h2 className="text-md font-semibold text-gray-800 mb-3 flex items-center border-b pb-2">
                  <FaProjectDiagram className="mr-2 text-indigo-600 flex-shrink-0" />
                  <span className="truncate" title={group.projectName}>
                    {group.projectName}
                  </span>
                  <Link
                    to={`/projects/${group.projectId}`}
                    className="ml-auto text-xs text-indigo-500 hover:underline flex-shrink-0"
                  >
                    View Project
                  </Link>
                </h2>
                {/* Contacts List within Group */}
                <ul className="space-y-1.5">
                  {group.contacts.map((contact) => (
                    <li key={contact.id || contact.requestId}>
                      <button
                        onClick={() => handleContactClick(contact.id)}
                        className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-left"
                        title={`Message ${contact.username}`}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 mr-2.5 relative">
                          {contact.profilePictureUrl ? (
                            <img
                              src={contact.profilePictureUrl}
                              alt={contact.username}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                                const fb = e.target.nextElementSibling;
                                if (fb) fb.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xs ${
                              contact.profilePictureUrl ? "hidden" : "flex"
                            }`}
                          >
                            {" "}
                            {(contact.username || "?")
                              .charAt(0)
                              .toUpperCase()}{" "}
                          </div>
                        </div>
                        {/* Info */}
                        <div className="flex-grow overflow-hidden">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {" "}
                            {contact.username || `User ${contact.id}`}{" "}
                          </p>
                        </div>
                        {/* Status/Type Indicator */}
                        <div className="flex-shrink-0 ml-2">
                          {contact.type === "requester" && (
                            <span
                              title={`Pending request`}
                              className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full flex items-center"
                            >
                              {" "}
                              <FaUserClock className="mr-1" /> Pending{" "}
                            </span>
                          )}
                          {contact.type === "member" && (
                            <span
                              title={`Member`}
                              className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full flex items-center"
                            >
                              {" "}
                              <FaUserCheck className="mr-1" /> Member{" "}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          // --- End Grouped List ---
        )}
      </div>
    </div>
  );
}

export default Messages;
