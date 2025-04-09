import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Ensure axios is installed
import {
  FaSearch,
  FaTimes,
  FaTrashAlt,
  FaEdit,
  FaSortAmountDown,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaTag,
  FaFlask,
  FaCalendarAlt,
  FaInfoCircle,
  FaPlus, // Added for Post New button
} from "react-icons/fa";

// Verify paths to your custom components
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";

// Ensure this matches your actual backend configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Helper Functions ---

// Function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Robust Date Formatting (keeping the robust version)
const formatDate = (dateString) => {
  // ... (keep the existing robust formatDate function) ...
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    // Handle YYYY-MM-DD as UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-");
      const utcDate = new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day))
      );
      if (isNaN(utcDate.getTime())) return "Invalid Date";
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      };
      return utcDate.toLocaleDateString(undefined, options);
    }
    // Handle full datetime strings
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error(`Error formatting date "${dateString}":`, error);
    return "Date Error";
  }
};

// Collaboration Status Badge Styling (improved contrast/padding)
const getStatusBadgeClass = (status) => {
  switch (
    status?.toLowerCase() // Normalize status
  ) {
    case "open":
      return "bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20";
    case "closed":
      return "bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20";
    default:
      return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/10";
  }
};
const formatStatusText = (status) => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()); // e.g., "in_progress" -> "In Progress"
};

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// --- Component ---
export default function Publication({ currentUser }) {
  // --- State ---
  const [myPublications, setMyPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Debounced value
  const [sortBy, setSortBy] = useState("date_desc");
  const [showFullSummary, setShowFullSummary] = useState({}); // Use object for individual card toggle
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  // --- Notification Handler ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    // Auto-hide after 4 seconds
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // --- Data Fetching ---
  const fetchMyPublications = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      setMyPublications([]);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const url = `${API_BASE_URL}/api/publications/my-publications`;
      const response = await axios.get(url, { headers: getAuthHeaders() });

      if (response.data?.success && Array.isArray(response.data.data)) {
        setMyPublications(response.data.data || []);
        // Initialize summary visibility state
        const initialSummaryState = (response.data.data || []).reduce(
          (acc, pub) => {
            acc[pub.id] = false; // Default to collapsed
            return acc;
          },
          {}
        );
        setShowFullSummary(initialSummaryState);
      } else {
        throw new Error(
          response.data?.message ||
            "Failed to load publications: Invalid data structure."
        );
      }
    } catch (error) {
      console.error("Error fetching publications:", error);
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "An error occurred loading your publications.";
      setApiError(errMsg);
      setMyPublications([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]); // Depend only on currentUser.id

  useEffect(() => {
    fetchMyPublications();
  }, [fetchMyPublications]); // fetchMyPublications includes currentUser.id dependency

  // --- Action Handlers ---
  const handleDelete = useCallback(
    async (id, title) => {
      if (
        window.confirm(
          `Are you sure you want to permanently delete "${
            title || "this publication"
          }"? This cannot be undone.`
        )
      ) {
        setDeletingId(id);
        setApiError(null); // Clear previous API errors before new action
        try {
          const url = `${API_BASE_URL}/api/publications/${id}`;
          await axios.delete(url, { headers: getAuthHeaders() });
          setMyPublications((prev) => prev.filter((p) => p.id !== id));
          // Also remove from summary state
          setShowFullSummary((prev) => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
          });
          showNotification(
            `Publication "${title || id}" deleted successfully.`,
            "success"
          );
        } catch (error) {
          console.error("Error deleting publication:", error);
          const errMsg =
            error.response?.data?.message || "Failed to delete publication.";
          showNotification(errMsg, "error");
          setApiError(errMsg); // Optionally display a persistent error if needed
        } finally {
          setDeletingId(null);
        }
      }
    },
    [showNotification]
  ); // Removed myPublications dependency

  const handleEdit = (publicationId) => {
    if (!publicationId) return;
    navigate(`/publications/edit/${publicationId}`); // Ensure this route exists
  };

  const handleAddNew = () => {
    navigate("/publications/new"); // Navigate to a dedicated creation page
  };

  // --- Search/Sort/Toggle Handlers ---
  const debouncedSetSearchTerm = useCallback(debounce(setSearchTerm, 400), []); // Debounce update

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchTerm(value);
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchTerm("");
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  // Toggles summary for a SPECIFIC card
  const handleToggleSummary = useCallback((id) => {
    setShowFullSummary((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Toggle ALL summaries (new button)
  const handleToggleAllSummaries = useCallback((expand) => {
    setShowFullSummary((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((id) => {
        newState[id] = expand;
      });
      return newState;
    });
  }, []);

  // --- Memoized Data Processing (Filtering & Sorting) ---
  const processedPublications = useMemo(() => {
    if (!Array.isArray(myPublications)) return [];

    let filtered = [...myPublications];

    // Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => {
        const titleMatch = p?.title?.toLowerCase().includes(lower);
        const authorMatch = p?.author?.toLowerCase().includes(lower);
        const summaryMatch = p?.summary?.toLowerCase().includes(lower);
        const areaMatch = p?.area?.toLowerCase().includes(lower);
        const tagsArray = Array.isArray(p?.tags) ? p.tags : [];
        const tagsMatch = tagsArray.some((tag) =>
          tag?.toLowerCase().includes(lower)
        );

        return (
          titleMatch || authorMatch || summaryMatch || areaMatch || tagsMatch
        );
      });
    }

    // Sort
    const sortFn = (a, b) => {
      // ... (keep existing robust sort logic) ...
      switch (sortBy) {
        case "title_asc":
          return (a?.title ?? "").localeCompare(b?.title ?? "");
        case "date_asc":
          const dateA = a?.publicationDate || a?.createdAt;
          const dateB = b?.publicationDate || b?.createdAt;
          const timeA = dateA ? new Date(dateA).getTime() : -Infinity;
          const timeB = dateB ? new Date(dateB).getTime() : -Infinity;
          return (
            (isNaN(timeA) ? -Infinity : timeA) -
            (isNaN(timeB) ? -Infinity : timeB)
          );
        case "date_desc":
        default:
          const dateDescA = a?.publicationDate || a?.createdAt;
          const dateDescB = b?.publicationDate || b?.createdAt;
          const timeDescA = dateDescA
            ? new Date(dateDescA).getTime()
            : -Infinity;
          const timeDescB = dateDescB
            ? new Date(dateDescB).getTime()
            : -Infinity;
          return (
            (isNaN(timeDescB) ? -Infinity : timeDescB) -
            (isNaN(timeDescA) ? -Infinity : timeDescA)
          );
      }
    };
    try {
      filtered.sort(sortFn);
    } catch (e) {
      console.error("Error during sort:", e);
      // Return unsorted if sort crashes
    }
    return filtered;
  }, [myPublications, searchTerm, sortBy]);

  // Check if any summary is currently expanded
  const isAnySummaryExpanded = useMemo(() => {
    return Object.values(showFullSummary).some((isExpanded) => isExpanded);
  }, [showFullSummary]);

  // --- Base Button Styles --- (Can be extracted to a separate file/component later)
  const baseButtonClass =
    "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
  const primaryButtonClass = `${baseButtonClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent`;
  const secondaryButtonClass = `${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-indigo-500`;
  const dangerButtonClass = `${baseButtonClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent`;
  const dangerGhostButtonClass = `${baseButtonClass} bg-transparent text-red-600 hover:bg-red-100 focus:ring-red-500 border border-red-300 hover:border-red-400`; // Example alternative

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
            My Publications
          </h1>
          <button
            onClick={handleAddNew} // Updated function
            className={primaryButtonClass + " px-4 py-2 text-sm"} // Slightly larger primary button
          >
            <FaPlus className="-ml-1 h-4 w-4" /> Post New Publication
          </button>
        </div>
        {/* Notification Area - Positioned Fixed */}
        <div className="fixed top-5 right-5 z-50 w-auto max-w-sm">
          <Notification
            message={notification.message}
            type={notification.type}
            show={notification.show}
            onClose={() =>
              setNotification((prev) => ({ ...prev, show: false }))
            }
          />
        </div>
        {/* Global API Error (Below Header, Above Controls) */}
        {apiError && !loading && (
          <ErrorMessage message={apiError} onClose={() => setApiError(null)} />
        )}
        {/* Controls Section */}
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-md border border-gray-200/80 flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search by title, author, summary, area, tags..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition duration-150"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-600 transition-colors"
                aria-label="Clear search"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <FaSortAmountDown
              className="h-5 w-5 text-gray-500"
              title="Sort by"
            />
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition duration-150 appearance-none" // Added appearance-none for custom arrow maybe later
              aria-label="Sort publications"
            >
              <option value="date_desc">Date (Newest)</option>
              <option value="date_asc">Date (Oldest)</option>
              <option value="title_asc">Title (A-Z)</option>
              {/* Add more sort options if needed */}
            </select>
          </div>

          {/* Toggle All Summaries Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleToggleAllSummaries(true)}
              disabled={
                !processedPublications.length ||
                Object.values(showFullSummary).every(Boolean)
              }
              className={secondaryButtonClass + " px-2.5"}
              title="Expand all summaries"
            >
              <FaExpandArrowsAlt className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Expand All</span>
            </button>
            <button
              onClick={() => handleToggleAllSummaries(false)}
              disabled={
                !processedPublications.length ||
                Object.values(showFullSummary).every((v) => !v)
              }
              className={secondaryButtonClass + " px-2.5"}
              title="Collapse all summaries"
            >
              <FaCompressArrowsAlt className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Collapse All</span>
            </button>
          </div>
        </div>
        {/* Publication List Area */}
        <div className="space-y-6">
          {loading ? (
            // --- Enhanced Skeleton Loader ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map(
                (
                  _,
                  index // Show more skeletons
                ) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-md border border-gray-200/80 p-5 animate-pulse flex flex-col"
                  >
                    <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2 mb-4 flex-grow">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="h-5 w-16 bg-gray-300 rounded-full"></div>
                      <div className="h-5 w-20 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-4">
                      <div className="h-4 w-24 bg-gray-300 rounded"></div>
                      <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="pt-3 border-t border-gray-200/80 flex justify-end gap-3">
                      <div className="h-7 w-16 bg-gray-300 rounded-md"></div>
                      <div className="h-7 w-16 bg-gray-300 rounded-md"></div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : processedPublications.length === 0 ? (
            // --- Enhanced Empty State ---
            <div className="text-center py-16 px-6 bg-white rounded-xl shadow-md border border-gray-200/80">
              <FaInfoCircle className="mx-auto text-5xl text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                No Publications Found
              </p>
              {searchTerm ? (
                <p className="text-sm text-gray-500">
                  Try adjusting your search query or clearing the search.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mb-6">
                  It looks like you haven't posted any publications yet. Get
                  started now!
                </p>
              )}
              {!searchTerm && (
                <button
                  onClick={handleAddNew}
                  className={primaryButtonClass + " px-4 py-2 text-sm"} // Consistent primary button
                >
                  <FaPlus className="-ml-1 h-4 w-4" /> Post Your First
                  Publication
                </button>
              )}
            </div>
          ) : (
            // --- Display Publications Grid ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedPublications.map((publication) => {
                // Defensive Destructuring
                const {
                  id,
                  title = "Untitled Publication",
                  author = "Unknown Author",
                  summary = "No summary available.",
                  tags = [],
                  area = "N/A",
                  publicationDate,
                  createdAt,
                  collaborationStatus = "unknown",
                } = publication || {};

                if (!id) return null; // Skip rendering if essential ID is missing

                const safeTags = Array.isArray(tags) ? tags : [];
                const displayDate = formatDate(publicationDate || createdAt);
                const statusClass = getStatusBadgeClass(collaborationStatus);
                const formattedStatus = formatStatusText(collaborationStatus);
                const isSummaryExpanded = showFullSummary[id] || false;

                return (
                  <div
                    key={id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/80 flex flex-col overflow-hidden group" // Added group for potential group-hover effects
                  >
                    {/* Card Content */}
                    <div className="p-5 flex-grow flex flex-col">
                      <h2
                        className="text-lg font-semibold text-gray-800 mb-1 leading-tight group-hover:text-blue-700 transition-colors cursor-pointer"
                        onClick={() => handleEdit(id)}
                        title={`Edit: ${title}`} // Tooltip for edit on title click
                      >
                        {title}
                      </h2>
                      <p className="text-sm text-gray-500 mb-4">By: {author}</p>

                      {/* Summary with Toggle */}
                      <div className="relative mb-4 flex-grow">
                        <p
                          className={`text-sm text-gray-700 ${
                            isSummaryExpanded ? "" : "line-clamp-4"
                          }`}
                        >
                          {summary}
                        </p>
                        {/* Show toggle only if summary might be clamped */}
                        {(summary?.length > 150 || isSummaryExpanded) && ( // Heuristic: only show toggle for longer summaries or if expanded
                          <button
                            onClick={() => handleToggleSummary(id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
                            title={
                              isSummaryExpanded ? "Show less" : "Show more"
                            }
                          >
                            {isSummaryExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>

                      {/* Tags */}
                      {safeTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4 items-center">
                          <FaTag
                            className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0"
                            title="Tags"
                          />
                          {safeTags.slice(0, 5).map(
                            (
                              tag,
                              index // Limit initial visible tags
                            ) => (
                              <span
                                key={`${tag}-${index}-${id}`}
                                className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-medium"
                              >
                                {tag ?? "N/A"}
                              </span>
                            )
                          )}
                          {safeTags.length > 5 && (
                            <span
                              className="text-xs text-gray-500"
                              title={safeTags.slice(5).join(", ")}
                            >
                              +{safeTags.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4 mt-auto pt-4 border-t border-gray-200/60">
                        {area && area !== "N/A" && (
                          <div className="flex items-center gap-2">
                            <FaFlask
                              className="h-4 w-4 text-gray-400 flex-shrink-0"
                              title="Research Area"
                            />
                            <span>{area}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt
                            className="h-4 w-4 text-gray-400 flex-shrink-0"
                            title="Publication Date"
                          />
                          <span>{displayDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${statusClass}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                collaborationStatus === "open"
                                  ? "bg-green-500"
                                  : collaborationStatus === "in_progress"
                                  ? "bg-yellow-500"
                                  : collaborationStatus === "closed"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                              }`}
                            ></span>
                            {formattedStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="bg-gray-50/70 px-5 py-3 border-t border-gray-200/80 flex justify-end items-center gap-3">
                      <button
                        onClick={() => handleEdit(id)}
                        className={secondaryButtonClass} // Use secondary style
                        title="Edit Publication"
                      >
                        <FaEdit className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(id, title)}
                        disabled={deletingId === id}
                        className={dangerGhostButtonClass} // Use danger ghost style
                        title="Delete Publication"
                      >
                        {deletingId === id ? (
                          <LoadingSpinner
                            size="xs"
                            color="text-red-600"
                            className="h-3.5 w-3.5"
                          />
                        ) : (
                          <FaTrashAlt className="h-3.5 w-3.5" />
                        )}
                        {deletingId === id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>{" "}
        {/* End Publication List Area */}
      </div>{" "}
      {/* End Container */}
    </div> /* End Page Wrapper */
  );
}
