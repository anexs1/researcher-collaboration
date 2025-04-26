// src/pages/Messages.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUserCircle,
  FaSearch,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

// Adjust paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Messages({ currentUser }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required to view messages.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/messaging/contacts`,
        {
          headers: { Authorization: `Bearer ${token}` },
          // params: { search: searchTerm || undefined } // Optional backend search
        }
      );

      if (response.data?.success && Array.isArray(response.data.data)) {
        setContacts(response.data.data);
      } else {
        throw new Error(response.data?.message || "Failed to load contacts.");
      }
    } catch (err) {
      console.error("Error fetching message contacts:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not load contacts.";
      setError(errorMsg);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Add searchTerm if using backend search

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filteredContacts = contacts.filter(
    (contact) =>
      (contact.username?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (contact.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleContactClick = (userId) => {
    navigate(`/messages/${userId}`); // Example route
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {" "}
      {/* Centered layout */}
      <div className="mb-6 border-b pb-4 border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Messages
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Start a conversation with your collaborators.
        </p>
      </div>
      <div className="mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts by name or username..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            aria-label="Search contacts"
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto -mx-4 px-4">
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
                fetchContacts();
              }}
            />{" "}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              No Contacts Found
            </h3>
            <p className="mt-2 text-gray-600">
              {" "}
              {searchTerm
                ? "No contacts match your search."
                : "Join or create projects to find collaborators to message!"}{" "}
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
          <ul className="space-y-2">
            {filteredContacts.map((contact) => (
              <li key={contact.id}>
                <button
                  onClick={() => handleContactClick(contact.id)}
                  className="w-full flex items-center p-3 rounded-lg bg-white hover:bg-indigo-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 border border-gray-200 hover:border-indigo-200 shadow-sm text-left"
                >
                  <div className="flex-shrink-0 mr-3 relative">
                    {contact.profilePictureUrl ? (
                      <img
                        src={contact.profilePictureUrl}
                        alt={contact.username}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center text-indigo-700 font-semibold ${
                        contact.profilePictureUrl ? "hidden" : "flex"
                      }`}
                    >
                      {" "}
                      {(contact.name || contact.username || "?")
                        .charAt(0)
                        .toUpperCase()}{" "}
                    </div>
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p
                      className="text-sm font-medium text-gray-800 truncate"
                      title={contact.name || contact.username}
                    >
                      {" "}
                      {contact.name ||
                        contact.username ||
                        `User ${contact.id}`}{" "}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {" "}
                      {contact.lastMessageSnippet ||
                        "Start a conversation..."}{" "}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3 text-right">
                    {contact.lastMessageTimestamp && (
                      <p className="text-xs text-gray-400 mb-1">
                        {" "}
                        {new Date(
                          contact.lastMessageTimestamp
                        ).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                      </p>
                    )}
                    {contact.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {" "}
                        {contact.unreadCount > 9
                          ? "9+"
                          : contact.unreadCount}{" "}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Messages;
