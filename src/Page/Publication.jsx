// src/Page/Publication.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaTimes, FaTrashAlt, FaEdit } from "react-icons/fa";
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Verify path
import ErrorMessage from "../Component/Common/ErrorMessage"; // Verify path
import Notification from "../Component/Common/Notification"; // Verify path

// ** IMPORTANT: Ensure this matches your actual backend URL **
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper to format dates
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    return "Invalid Date";
  }
};

export default function Publication({ currentUser }) {
  // --- State ---
  const [myPublications, setMyPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showAllAbstracts, setShowAllAbstracts] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const navigate = useNavigate();

  // --- Notification Handler ---
  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  // --- Fetch User's Publications ---
  const fetchMyPublications = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      setMyPublications([]);
      // Set error only if component was already loaded (loading=false) and user disappears
      // This avoids showing error on initial load before currentUser is ready
      // if (!loading) setApiError("Login required to view publications."); // This logic might be tricky, simpler to rely on ProtectedRoute
      return;
    }
    setLoading(true);
    setApiError(null);
    console.log(`Publication Page: Fetching for user ${currentUser.id}`);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setApiError("Authentication required.");
      setLoading(false);
      return;
    }

    try {
      // ***** CORRECTED URL *****
      // Use the endpoint defined in the backend router
      const url = `${API_BASE_URL}/api/publications/my-publications`;
      // *************************
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        const sortedData = [...response.data.data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setMyPublications(sortedData);
        console.log(`Fetched ${sortedData.length} publications.`);
      } else {
        console.warn("Unexpected data structure:", response.data);
        setMyPublications([]);
        setApiError(response.data?.message || "Failed to load publications.");
      }
    } catch (error) {
      console.error("Error fetching publications:", error);
      const errMsg =
        error.response?.data?.message ||
        "An error occurred loading publications."; // Keep original fallback
      setApiError(errMsg);
      setMyPublications([]);
    } finally {
      setLoading(false);
    }
    // Removed 'loading' from dependency array - fetch should trigger based on user change, not loading state change
  }, [currentUser]);

  // Re-fetch when component mounts or currentUser changes
  useEffect(() => {
    fetchMyPublications();
  }, [fetchMyPublications]);

  // --- Delete Publication Handler ---
  const handleDelete = useCallback(
    async (id) => {
      const pubToDelete = myPublications.find((p) => p.id === id);
      if (
        !currentUser ||
        !pubToDelete ||
        pubToDelete.userId !== currentUser.id
      ) {
        showNotification(
          "Permission denied or publication not found.",
          "error"
        );
        return;
      }
      if (window.confirm(`Delete "${pubToDelete.title}"?`)) {
        setApiError(null);
        const token = localStorage.getItem("authToken");
        if (!token) {
          showNotification("Authentication required.", "error");
          return;
        }
        try {
          // ***** CORRECTED URL *****
          // Use the publication delete endpoint
          const url = `${API_BASE_URL}/api/publications/${id}`;
          // *************************
          await axios.delete(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMyPublications((prev) => prev.filter((p) => p.id !== id));
          showNotification("Publication deleted.", "success");
        } catch (error) {
          console.error("Error deleting publication:", error);
          const errMsg =
            error.response?.data?.message || "Failed to delete publication.";
          showNotification(errMsg, "error");
          setApiError(errMsg);
        }
      }
    },
    [currentUser, myPublications, showNotification]
  );

  // --- Edit Handler Placeholder ---
  const handleEdit = (publicationId) => {
    alert(
      `Edit button clicked for publication ID: ${publicationId}. Navigation/Modal needed.`
    );
    // navigate(`/publications/${publicationId}/edit`); // Example
  };

  // --- Search/Sort Handlers ---
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

  // --- Processed Publications Memo ---
  const processedPublications = useMemo(() => {
    /* ... filter/sort logic ... */
    let filtered = [...myPublications];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(lower) ||
          p.author?.toLowerCase().includes(lower) ||
          p.abstract?.toLowerCase().includes(lower)
      );
    }
    const sortFn = (a, b) => {
      switch (sortBy) {
        case "title":
          return a.title?.localeCompare(b.title || "") || 0;
        case "author":
          return a.author?.localeCompare(b.author || "") || 0;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    };
    filtered.sort(sortFn);
    return filtered;
  }, [myPublications, searchTerm, sortBy]);

  // --- Toggle Abstracts Handler ---
  const handleToggleAbstracts = useCallback(() => {
    setShowAllAbstracts((prev) => !prev);
  }, []);

  // --- Render ---
  if (!currentUser && !loading) {
    /* ... Login Prompt ... */
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
        My Publications
      </h1>
      <Notification /* ... props ... */ />
      {apiError && (
        <ErrorMessage message={apiError} onClose={() => setApiError(null)} />
      )}

      {/* Controls Section */}
      <div className="flex items-center space-x-4"></div>
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border ...">
        {" "}
        {/* Search/Sort/Toggle */}{" "}
      </div>

      {/* Publication List Section */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        ) : processedPublications.length === 0 ? (
          <div className="text-center py-10 ...">{/* Empty Message */}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedPublications.map((publication) => (
              <div
                key={publication.id}
                className="bg-white rounded-lg shadow border ..."
              >
                {/* Publication Card Content */}
                <div className="pt-3 border-t ... flex justify-end gap-2">
                  <button onClick={() => handleEdit(publication.id)} /* ... */>
                    {" "}
                    <FaEdit /> Edit{" "}
                  </button>
                  <button
                    onClick={() => handleDelete(publication.id)} /* ... */
                  >
                    {" "}
                    <FaTrashAlt /> Delete{" "}
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
