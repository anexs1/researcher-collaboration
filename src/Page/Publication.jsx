// src/Page/Publication.jsx
// Displays publications publicly, with enhanced styling and conditional controls.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; // Import Link, useLocation
import axios from "axios";
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
  FaPlus,
  FaFilter,
  FaExternalLinkAlt,
  FaBookOpen,
  FaRegBookmark,
  FaBookmark,
  FaEllipsisV,
  FaShare,
  FaRegClone,
  FaRegChartBar,
  FaList,
  FaThLarge,
  FaEye,
  FaUser,
  FaCommentDots,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import Select from "react-select";

// Import shared components (adjust paths as needed)
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
import ShareModal from "../Component/Common/ShareModal";

// --- Configuration ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEBOUNCE_DELAY = 400;
const NOTIFICATION_DURATION = 4000;
const DEFAULT_PAGE_LIMIT = 12;

// --- Helper Functions ---
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    // Handle 'YYYY-MM-DD' format specifically as UTC date
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-");
      const utcDate = new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day))
      );
      if (isNaN(utcDate.getTime())) return "Invalid Date";
      return utcDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC", // Ensure interpretation as UTC
      });
    }
    // Handle full ISO strings or other Date-parsable formats
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      // Optional: Add time if relevant for createdAt/updatedAt
      // hour: '2-digit',
      // minute: '2-digit',
    });
  } catch (error) {
    console.error(`Error formatting date "${dateString}":`, error);
    return "Date Error";
  }
};
// No status filter on public page for now
// const statusOptions = [
//   { value: 'all', label: 'All Statuses' },
//   { value: 'open', label: 'Open for Collaboration' },
// ];
const sortOptions = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
  { value: "views_desc", label: "Most Viewed" }, // Added sorting by views
];
const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "in_progress": // Assuming this might be a status
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "closed": // Assuming this might be a status
      return "bg-rose-100 text-rose-700 border border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
};
const formatStatusText = (status) => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// --- Advanced Styling for React Select ---
const selectStyles = {
  /* ... styles remain the same ... */
  control: (provided) => ({
    ...provided,
    minHeight: "38px",
    height: "38px",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    borderColor: "rgb(209 213 219)",
    "&:hover": { borderColor: "rgb(165 180 252)" },
    borderRadius: "0.5rem",
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "38px",
    padding: "0 12px",
  }),
  input: (provided) => ({ ...provided, margin: "0px", padding: "0px" }),
  indicatorSeparator: () => ({ display: "none" }),
  indicatorsContainer: (provided) => ({ ...provided, height: "38px" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#4f46e5"
      : state.isFocused
      ? "#e0e7ff"
      : "white",
    color: state.isSelected ? "white" : "#1f2937",
    "&:active": { backgroundColor: state.isSelected ? "#4338ca" : "#c7d2fe" },
    fontSize: "0.875rem",
    padding: "8px 12px",
    cursor: "pointer",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    boxShadow:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    marginTop: "4px",
    zIndex: 20,
  }),
};

// --- Publication Card Sub-Component ---
const PublicationCard = React.memo(
  ({
    publication,
    onEdit,
    onDelete,
    onToggleSummary,
    onBookmark,
    onShare,
    onClone,
    showFullSummary,
    deletingId,
    currentUser,
    onAddComment, // Handler to navigate to detail page for commenting
  }) => {
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
      views = 0, // Displayed from API
      // citations = 0, // Not currently used in card display
      isBookmarked = false, // Fetched from API (user-specific)
      thumbnail,
      doi,
      ownerId,
      commentCount = 0, // Fetched from API
    } = publication;

    const isSummaryExpanded = showFullSummary[id] || false;
    // Prefer publicationDate, fallback to createdAt
    const displayDate = formatDate(publicationDate || createdAt);
    const statusClass = getStatusBadgeClass(collaborationStatus);
    const formattedStatus = formatStatusText(collaborationStatus);
    const safeTags = Array.isArray(tags) ? tags : [];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isOwner = currentUser?.id === ownerId;

    // Button Style Constants
    const iconButtonClass =
      "p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-150";
    const dangerIconButtonClass =
      "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150";

    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/80 flex flex-col overflow-hidden group"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        layout
      >
        {/* Thumbnail */}
        <div className="relative">
          <Link
            to={`/publications/${id}`}
            className="block"
            title={`View details for "${title}"`}
          >
            {thumbnail ? (
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 overflow-hidden rounded-t-xl">
                <img
                  src={thumbnail}
                  alt={`Thumbnail for ${title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.svg"; // Fallback image
                    console.warn(`Failed to load thumbnail: ${thumbnail}`);
                  }}
                />
              </div>
            ) : (
              <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 rounded-t-xl">
                <FaBookOpen className="w-12 h-12 opacity-70" />
              </div>
            )}
          </Link>
        </div>

        {/* Card Content */}
        <div className="p-5 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-2 gap-2">
            <Link
              to={`/publications/${id}`}
              className="flex-1 mr-1"
              title={`View details for "${title}"`}
            >
              <h2 className="text-lg font-semibold text-gray-900 leading-tight hover:text-indigo-700 transition-colors line-clamp-2">
                {title}
              </h2>
            </Link>
            {isOwner && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen((prev) => !prev);
                  }}
                  className={iconButtonClass}
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                  title="More owner actions"
                >
                  <FaEllipsisV className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-xl z-20 border border-gray-200/80 py-1"
                      onMouseLeave={() => setIsMenuOpen(false)}
                    >
                      <button
                        onClick={() => {
                          onClone(id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors"
                      >
                        <FaRegClone className="w-3.5 h-3.5 text-gray-500" />
                        Duplicate
                      </button>
                      <div className="my-1 border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          onDelete(id, title);
                          setIsMenuOpen(false);
                        }}
                        disabled={deletingId === id}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                      >
                        {deletingId === id ? (
                          <LoadingSpinner size="xs" />
                        ) : (
                          <FaTrashAlt className="w-3.5 h-3.5" />
                        )}
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
            <FaUser className="w-3 h-3 text-gray-400" /> <span>{author}</span>
          </p>
          <div className="relative mb-4 flex-grow min-h-[60px]">
            <p
              className={`text-sm text-gray-700 transition-all duration-300 ${
                isSummaryExpanded ? "" : "line-clamp-3"
              }`}
            >
              {summary}
            </p>
            {/* Show 'Show more' only if summary is actually longer than clamp allows */}
            {(summary?.length > 150 || isSummaryExpanded) && ( // Adjusted length estimate
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSummary(id);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 inline-block"
              >
                {isSummaryExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
          {safeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 items-center">
              <FaTag className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0" />
              {safeTags.slice(0, 3).map((tag, index) => (
                <span
                  key={`${tag}-${index}-${id}`}
                  className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium border border-indigo-100"
                >
                  {tag}
                </span>
              ))}
              {safeTags.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">
                  +{safeTags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Footer Area */}
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-1.5" title="Research Area">
                <FaFlask className="h-3.5 w-3.5 flex-shrink-0 text-teal-500" />
                <span className="truncate">{area || "N/A"}</span>
              </div>
              <div
                className="flex items-center gap-1.5"
                title={publicationDate ? "Publication Date" : "Creation Date"}
              >
                <FaCalendarAlt className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
                <span>{displayDate}</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusClass}`}
                title="Collaboration Status"
              >
                {formattedStatus}
              </span>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1" title="Views">
                  <FaEye className="h-3.5 w-3.5" /> {views ?? 0}
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <Link
                to={`/publications/${id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                title="View Details"
              >
                <FaEye /> View Details
              </Link>
              <div className="flex items-center gap-1">
                {/* Comment Button (Navigates to Detail Page) */}
                <button
                  onClick={() => onAddComment(publication)}
                  className={iconButtonClass}
                  title="View/Add Comments"
                  data-tooltip-id={`comment-btn-${id}`}
                  data-tooltip-content={`${
                    commentCount || 0
                  } Comment(s) - Click to view/add`}
                >
                  <FaCommentDots />
                  <span className="ml-1 text-xs">{commentCount || 0}</span>
                </button>
                <Tooltip id={`comment-btn-${id}`} />

                {/* Bookmark Button */}
                {currentUser && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmark(id, !isBookmarked);
                    }}
                    className={iconButtonClass}
                    data-tooltip-id={`bookmark-btn-${id}`}
                    data-tooltip-content={
                      isBookmarked ? "Remove bookmark" : "Bookmark"
                    }
                  >
                    {isBookmarked ? (
                      <FaBookmark className="text-blue-500" />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>
                )}
                {/* Show placeholder if not logged in? Or just hide? Hiding for now. */}
                {/* {!currentUser && <div className="w-[30px]"></div>} Commenting out placeholder */}
                <Tooltip id={`bookmark-btn-${id}`} />

                {/* Share Button */}
                <button
                  onClick={() => onShare(publication)}
                  className={iconButtonClass}
                  title="Share"
                  data-tooltip-id={`share-btn-${id}`}
                  data-tooltip-content="Share this publication"
                >
                  <FaShare />
                </button>
                <Tooltip id={`share-btn-${id}`} />

                {/* Edit Button (Owner Only) */}
                {isOwner && (
                  <button
                    onClick={() => onEdit(id)}
                    className={iconButtonClass}
                    title="Edit"
                    data-tooltip-id={`edit-btn-${id}`}
                    data-tooltip-content="Edit this publication"
                  >
                    <FaEdit />
                  </button>
                )}
                <Tooltip id={`edit-btn-${id}`} />
              </div>
            </div>
          </div>
        </div>
        {doi && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5"
              title={`View on doi.org: ${doi}`}
            >
              <FaExternalLinkAlt className="h-3 w-3" /> View DOI
            </a>
          </div>
        )}
      </motion.div>
    );
  }
);

// --- Main Page Component (Exported) ---
export default function PublicationPage({ currentUser }) {
  // State
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: DEFAULT_PAGE_LIMIT,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(sortOptions[0].value); // Default sort
  const [showFullSummary, setShowFullSummary] = useState({});
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [deletingId, setDeletingId] = useState(null);
  const [selectedPublication, setSelectedPublication] = useState(null); // For Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // Default view mode

  const navigate = useNavigate();
  const location = useLocation(); // Needed if we want to read state from navigation

  // --- Handlers ---
  const showNotification = useCallback((message, type = "success") => {
    console.log(`Notification: [${type}] ${message}`); // Keep for debug or replace with logger
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      NOTIFICATION_DURATION
    );
  }, []);

  // --- Data Fetching ---
  const fetchPublications = useCallback(
    async (page = 1) => {
      console.log("Fetching publications. currentUser ID:", currentUser?.id); // Log user ID safely
      console.log(
        `Fetching page ${page}. Sort: ${sortBy}, Search: ${searchTerm}, Limit: ${pagination.limit}`
      );
      setLoading(true);
      setApiError(null);
      try {
        // Use the '/explore' endpoint which should be designed for public/logged-in browsing
        // It should return `isBookmarked` (user-specific) and `commentCount`
        const url = `${API_BASE_URL}/api/publications/explore`;
        const headers = getAuthHeaders(); // Send auth token if available (for isBookmarked)
        const params = {
          page,
          limit: pagination.limit,
          sortBy,
          search: searchTerm || undefined, // Only send search if not empty
        };
        console.log(`Sending GET request to: ${url} with params:`, params);
        const response = await axios.get(url, { headers, params });

        console.log("API Response Data:", response.data); // Log the raw response

        // **Crucially, adapt this check based on your actual API response structure**
        if (response.data && Array.isArray(response.data.data)) {
          // Assuming your API wraps the data array and pagination info
          setPublications(response.data.data); // Expect `isBookmarked` and `commentCount` here
          setPagination((prev) => ({
            ...prev,
            currentPage: response.data.pagination?.currentPage || page,
            totalPages: response.data.pagination?.totalPages || 1,
            totalItems: response.data.pagination?.totalItems || 0,
            // Update limit from response if backend controls it, otherwise keep current
            limit: response.data.pagination?.limit || prev.limit,
          }));
          // Initialize summary state for new publications
          const initialSummaryState = response.data.data.reduce((acc, pub) => {
            acc[pub.id] = false;
            return acc;
          }, {});
          setShowFullSummary(initialSummaryState);
        } else {
          // If the structure is just the array (less likely with pagination)
          // } else if (Array.isArray(response.data)) {
          //   setPublications(response.data);
          //   // Need to handle pagination differently if not provided by API
          //   console.warn("API did not return pagination info.");
          //   setPagination(prev => ({ ...prev, totalPages: 1, totalItems: response.data.length }));
          // }
          throw new Error(
            response.data?.message || "Received unexpected data structure"
          );
        }
      } catch (error) {
        console.error("Error fetching publications:", error);
        const errMsg =
          error.response?.data?.message || // Message from backend
          error.message || // Network or other errors
          "Failed to load publications.";
        setApiError(errMsg);
        setPublications([]); // Clear data on error
        setPagination((prev) => ({
          // Reset pagination on error
          ...prev,
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        }));
      } finally {
        setLoading(false);
      }
    },
    [
      sortBy,
      searchTerm,
      pagination.limit,
      currentUser?.id, // Re-fetch if user logs in/out
    ]
  ); // Removed pagination.currentPage from dependencies - managed by handlePageChange

  // Fetch on mount & dependency change (sortBy, searchTerm, user change)
  useEffect(() => {
    fetchPublications(1); // Always fetch page 1 when filters/sort change
    // Reset current page state when filters change too
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, [sortBy, searchTerm, currentUser?.id, pagination.limit]); // Dependencies that trigger a *new* fetch from page 1

  // Fetch specific page when currentPage changes
  useEffect(() => {
    // Don't fetch on initial mount if already fetched by the effect above
    if (!loading) {
      fetchPublications(pagination.currentPage);
    }
  }, [pagination.currentPage]); // Dependency only on the page number

  // --- Action Handlers ---
  const handleDelete = useCallback(
    async (id, title) => {
      if (!currentUser) {
        showNotification("Log in required to delete.", "error");
        navigate("/login", { state: { from: location } }); // Redirect to login, remember where from
        return;
      }
      // Add confirmation
      if (
        !window.confirm(
          `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`
        )
      ) {
        return;
      }
      setDeletingId(id);
      try {
        await axios.delete(`${API_BASE_URL}/api/publications/${id}`, {
          headers: getAuthHeaders(),
        });
        // Optimistic UI update or re-fetch recommended
        // Option 1: Filter out locally
        setPublications((prev) => prev.filter((p) => p.id !== id));
        setPagination((prev) => ({ ...prev, totalItems: prev.totalItems - 1 })); // Adjust count
        // Option 2: Re-fetch current page (handles edge cases like deleting last item on page)
        // fetchPublications(pagination.currentPage);
        showNotification(`Successfully deleted "${title}"`);
      } catch (e) {
        console.error("Delete error:", e);
        showNotification(
          e.response?.data?.message || "Delete failed. Please try again.",
          "error"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [showNotification, currentUser, navigate, location, fetchPublications]
  );

  const handleEdit = useCallback(
    (publicationId) => {
      if (!currentUser) {
        showNotification("Log in required to edit.", "error");
        navigate("/login", { state: { from: location } });
        return;
      }
      navigate(`/publications/edit/${publicationId}`);
    },
    [navigate, currentUser, showNotification, location]
  );

  const handleAddNew = useCallback(() => {
    if (currentUser) {
      navigate("/publications/new");
    } else {
      showNotification("Please log in to add a new publication.", "info");
      navigate("/login", { state: { from: location } });
    }
  }, [navigate, currentUser, showNotification, location]);

  const handleBookmark = useCallback(
    async (id, bookmark) => {
      if (!currentUser) {
        showNotification("Please log in to bookmark publications.", "info");
        navigate("/login", { state: { from: location } });
        return;
      }
      // Optimistic UI update
      const originalPublications = [...publications];
      setPublications((prev) =>
        prev.map((pub) =>
          pub.id === id ? { ...pub, isBookmarked: bookmark } : pub
        )
      );

      try {
        // **Ensure backend endpoint exists: PATCH /api/publications/:id/bookmark**
        await axios.patch(
          `${API_BASE_URL}/api/publications/${id}/bookmark`,
          { bookmark }, // Send boolean in request body
          { headers: getAuthHeaders() }
        );
        showNotification(
          bookmark ? "Publication bookmarked!" : "Bookmark removed.",
          "success" // Use success type
        );
        // No need to update state again if API call succeeds with optimistic update
      } catch (e) {
        console.error("Bookmark error:", e);
        showNotification(
          e.response?.data?.message ||
            "Bookmark action failed. Please try again.",
          "error"
        );
        // Revert optimistic update on error
        setPublications(originalPublications);
      }
    },
    [showNotification, currentUser, navigate, location, publications]
  );

  const handleClone = useCallback(
    async (id) => {
      if (!currentUser) {
        showNotification("Log in required to duplicate.", "error");
        navigate("/login", { state: { from: location } });
        return;
      }
      // Add confirmation? Maybe not necessary for clone.
      showNotification("Duplicating publication...", "info"); // Indicate action start
      try {
        // **Ensure backend endpoint exists: POST /api/publications/:id/clone**
        const response = await axios.post(
          `${API_BASE_URL}/api/publications/${id}/clone`,
          {}, // No body needed usually for clone
          { headers: getAuthHeaders() }
        );
        if (response.data?.success && response.data.data) {
          // Add the new publication to the start of the list
          setPublications((prev) => [response.data.data, ...prev]);
          setPagination((prev) => ({
            ...prev,
            totalItems: prev.totalItems + 1,
          }));
          showNotification("Publication duplicated successfully!");
          // Optional: Navigate to the new publication's edit page?
          // navigate(`/publications/edit/${response.data.data.id}`);
        } else {
          throw new Error(response.data?.message || "Clone operation failed");
        }
      } catch (e) {
        console.error("Clone error:", e);
        showNotification(
          e.response?.data?.message || "Duplication failed. Please try again.",
          "error"
        );
      }
    },
    [showNotification, currentUser, navigate, location]
  );

  const handleShare = useCallback((publication) => {
    setSelectedPublication(publication);
    setIsShareModalOpen(true);
  }, []);

  // --- Comment Handler (Navigates to Detail Page) ---
  const handleAddComment = useCallback(
    (publication) => {
      // No login check needed here, as the button is disabled/hidden if not logged in.
      // Navigation allows anyone to view, detail page handles login requirement for posting.
      console.log(
        `Navigating to details/comments for Pub ID: ${publication.id}`
      );
      // Navigate to the publication's detail page, signaling focus on comments
      navigate(`/publications/${publication.id}?focus=comments`);
      // No notification here, as the action is just navigation.
    },
    [navigate]
  );

  // --- Search/Filter/Sort/Toggle handlers ---
  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      // No need to set page here, the useEffect watching searchTerm handles it
    }, DEBOUNCE_DELAY),
    [] // Empty dependency array is correct for debounce definition
  );

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchTerm(value);
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchTerm(""); // This will trigger the useEffect to re-fetch page 1
  }, []);

  const handleSortChange = (selectedOption) => {
    setSortBy(selectedOption.value);
    // No need to set page here, the useEffect watching sortBy handles it
  };

  const handleToggleSummary = useCallback((id) => {
    setShowFullSummary((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleToggleAllSummaries = useCallback(
    (expand) => {
      setShowFullSummary((prev) => {
        const newState = {};
        // Use the current publications in state
        publications.forEach((p) => (newState[p.id] = expand));
        return newState;
      });
    },
    [publications] // Depend on publications array
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
    // Persist view mode preference? (Optional: use localStorage)
    // localStorage.setItem('publicationViewMode', prev === 'grid' ? 'list' : 'grid');
  }, []);

  // // Optional: Load view mode preference on mount
  // useEffect(() => {
  //   const savedViewMode = localStorage.getItem('publicationViewMode');
  //   if (savedViewMode === 'list' || savedViewMode === 'grid') {
  //     setViewMode(savedViewMode);
  //   }
  // }, []);

  // --- Memoized Data for Display ---
  const displayedPublications = useMemo(() => publications, [publications]);
  const isAnySummaryExpanded = useMemo(
    () => Object.values(showFullSummary).some(Boolean),
    [showFullSummary]
  );

  // --- Pagination Handler ---
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== pagination.currentPage
    ) {
      // Update page state, which triggers the fetch useEffect
      setPagination((p) => ({ ...p, currentPage: newPage }));
      window.scrollTo(0, 0); // Scroll to top on page change
    }
  };

  // Icon Button Class (moved from Card for use in List View directly)
  const iconButtonClass =
    "p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-150";
  const dangerIconButtonClass =
    "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150";

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-blue-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Explore Publications
            </h1>
            <p className="text-base text-gray-500 mt-1">
              Discover research and collaborations in the community
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto flex-shrink-0">
            <button
              onClick={toggleViewMode}
              title={
                viewMode === "grid"
                  ? "Switch to List View"
                  : "Switch to Grid View"
              }
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              {viewMode === "grid" ? (
                <FaList className="h-4 w-4" />
              ) : (
                <FaThLarge className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {viewMode === "grid" ? "List" : "Grid"} View
              </span>
            </button>
            {currentUser && (
              <button
                onClick={handleAddNew}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaPlus className="h-4 w-4" /> Post New
              </button>
            )}
          </div>
        </div>

        {/* Notification Area */}
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md">
          <AnimatePresence>
            {notification.show && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <Notification
                  message={notification.message}
                  type={notification.type}
                  show={notification.show}
                  onClose={() =>
                    setNotification((prev) => ({ ...prev, show: false }))
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* API Error Display */}
        {apiError && !loading && (
          <ErrorMessage
            message={`Error: ${apiError}. Please try refreshing the page.`}
            onClose={() => setApiError(null)}
          />
        )}

        {/* Controls: Search and Sort */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="relative md:col-span-2">
            <label htmlFor="search-pubs" className="sr-only">
              Search Publications
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="search-pubs"
              type="search" // Use type="search" for potential browser features like clear button
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search title, author, summary, tags..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-600"
                aria-label="Clear search"
                title="Clear search"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-by"
              className="text-sm font-medium text-gray-500 flex-shrink-0"
            >
              Sort By:
            </label>
            <Select
              inputId="sort-by"
              options={sortOptions}
              value={sortOptions.find((opt) => opt.value === sortBy)}
              onChange={handleSortChange}
              className="flex-grow text-sm react-select-container"
              classNamePrefix="react-select"
              isSearchable={false}
              styles={selectStyles}
              aria-label="Sort publications"
            />
          </div>
        </div>

        {/* Summary Toggles (only if grid view and publications exist) */}
        {viewMode === "grid" &&
          displayedPublications.length > 0 &&
          !loading && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleToggleAllSummaries(true)}
                disabled={isAnySummaryExpanded}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaExpandArrowsAlt /> Expand All
              </button>
              <button
                onClick={() => handleToggleAllSummaries(false)}
                disabled={!isAnySummaryExpanded}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCompressArrowsAlt /> Collapse All
              </button>
            </div>
          )}

        {/* Main Content Area: Loading, Empty, or Results */}
        <div>
          {loading && (
            <div
              className={`grid ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3" // Adjust grid columns
                  : "grid-cols-1"
              } gap-6`}
            >
              {[...Array(pagination.limit)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse flex flex-col h-[420px]" // Increased height for skeleton
                >
                  {/* Skeleton Structure */}
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2 flex-grow mb-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100 mt-auto">
                    <div className="h-6 w-24 bg-gray-300 rounded-full"></div>
                    <div className="flex gap-2">
                      <div className="h-5 w-8 bg-gray-300 rounded"></div>
                      <div className="h-5 w-8 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !apiError && displayedPublications.length === 0 && (
            <div className="text-center py-20 px-6 bg-white rounded-xl shadow border border-gray-200">
              <FaInfoCircle className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm
                  ? "No Matching Publications Found"
                  : "No Publications Yet"}
              </p>
              <p className="text-base text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms or clearing the search."
                  : "Be the first to share research, or check back soon!"}
              </p>
              {currentUser && !searchTerm && (
                <button
                  onClick={handleAddNew}
                  className="px-5 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 flex items-center gap-2 mx-auto transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaPlus /> Add Your Publication
                </button>
              )}
            </div>
          )}

          {!loading &&
            !apiError &&
            displayedPublications.length > 0 &&
            // Conditional Rendering based on viewMode
            (viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {displayedPublications.map((publication) => (
                    <PublicationCard
                      key={publication.id}
                      publication={publication}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleSummary={handleToggleSummary}
                      onBookmark={handleBookmark}
                      onShare={handleShare}
                      onClone={handleClone}
                      showFullSummary={showFullSummary}
                      deletingId={deletingId}
                      currentUser={currentUser}
                      onAddComment={handleAddComment} // Pass handler
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              // List View Implementation
              <div className="space-y-4">
                <AnimatePresence>
                  {displayedPublications.map((publication) => {
                    const isOwner = currentUser?.id === publication.ownerId;
                    const displayDate = formatDate(
                      publication.publicationDate || publication.createdAt
                    );
                    const statusClass = getStatusBadgeClass(
                      publication.collaborationStatus
                    );
                    const formattedStatus = formatStatusText(
                      publication.collaborationStatus
                    );

                    return (
                      <motion.div
                        key={publication.id}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 p-5 flex flex-col sm:flex-row gap-5 items-start"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        layout
                      >
                        {/* Thumbnail (Optional in List view) */}
                        {publication.thumbnail && (
                          <Link
                            to={`/publications/${publication.id}`}
                            className="block w-full sm:w-32 md:w-40 h-32 md:h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 group/thumb"
                          >
                            <img
                              src={publication.thumbnail}
                              alt={`Thumbnail for ${publication.title}`}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = "/placeholder-image.svg";
                              }} // Fallback
                            />
                          </Link>
                        )}
                        {!publication.thumbnail && (
                          <Link
                            to={`/publications/${publication.id}`}
                            className="block w-full sm:w-32 md:w-40 h-32 md:h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400"
                          >
                            <FaBookOpen className="w-10 h-10 opacity-70" />
                          </Link>
                        )}

                        {/* List Item Content */}
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <Link
                              to={`/publications/${publication.id}`}
                              className="flex-1 mr-2"
                              title={`View details for "${publication.title}"`}
                            >
                              <h3 className="text-lg font-semibold text-gray-800 hover:text-indigo-700 transition-colors line-clamp-2">
                                {publication.title || "Untitled Publication"}
                              </h3>
                            </Link>
                            {/* Action Icons Group */}
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {isOwner && (
                                <button
                                  onClick={() => handleEdit(publication.id)}
                                  title="Edit"
                                  className={iconButtonClass}
                                >
                                  <FaEdit size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleShare(publication)}
                                title="Share"
                                className={iconButtonClass}
                              >
                                <FaShare size={16} />
                              </button>
                              {currentUser && (
                                <button
                                  onClick={() =>
                                    handleBookmark(
                                      publication.id,
                                      !publication.isBookmarked
                                    )
                                  }
                                  title={
                                    publication.isBookmarked
                                      ? "Remove bookmark"
                                      : "Bookmark"
                                  }
                                  className={iconButtonClass}
                                >
                                  {publication.isBookmarked ? (
                                    <FaBookmark
                                      className="text-blue-500"
                                      size={16}
                                    />
                                  ) : (
                                    <FaRegBookmark size={16} />
                                  )}
                                </button>
                              )}
                              {isOwner && (
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      publication.id,
                                      publication.title
                                    )
                                  }
                                  title="Delete"
                                  disabled={deletingId === publication.id}
                                  className={dangerIconButtonClass}
                                >
                                  {deletingId === publication.id ? (
                                    <LoadingSpinner size="xs" />
                                  ) : (
                                    <FaTrashAlt size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1.5">
                            <FaUser className="w-3 h-3 text-gray-400" />
                            <span>
                              {publication.author || "Unknown Author"}
                            </span>
                            <span className="mx-1">·</span>
                            <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                            <span>{displayDate}</span>
                          </p>

                          {/* Optional: Short Summary for List View */}
                          {publication.summary && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {publication.summary}
                            </p>
                          )}

                          {/* Tags (simplified) */}
                          {Array.isArray(publication.tags) &&
                            publication.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3 items-center">
                                <FaTag className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0" />
                                {publication.tags
                                  .slice(0, 4)
                                  .map((tag, index) => (
                                    <span
                                      key={`${tag}-${index}-${publication.id}-list`}
                                      className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-100"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                {publication.tags.length > 4 && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    +{publication.tags.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}

                          {/* Footer Row: Status, Views, Comments Button */}
                          <div className="flex flex-wrap justify-between items-center gap-3 mt-auto pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusClass}`}
                                title="Collaboration Status"
                              >
                                {formattedStatus}
                              </span>
                              <span
                                className="flex items-center gap-1 text-xs text-gray-500"
                                title="Views"
                              >
                                <FaEye className="h-3.5 w-3.5" />{" "}
                                {publication.views ?? 0}
                              </span>
                            </div>
                            {/* Comment Button (Corrected onClick) */}
                            <button
                              onClick={() => handleAddComment(publication)} // *** CORRECTED ***
                              className={`text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors`}
                              title="View/Add Comments"
                            >
                              <FaCommentDots />
                              <span>
                                {publication.commentCount || 0} Comment(s)
                              </span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
        </div>

        {/* Pagination Controls */}
        {!loading && !apiError && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 mt-8 border-t border-gray-200 gap-4">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold">
                {(pagination.currentPage - 1) * pagination.limit + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold">
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalItems
                )}
              </span>{" "}
              of <span className="font-semibold">{pagination.totalItems}</span>{" "}
              results
            </p>
            <div className="flex justify-center items-center">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1.5 mx-1 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Previous
              </button>
              {/* Pagination Number Logic */}
              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((pageNumber) => {
                    // Logic to show limited page numbers (e.g., first, last, current +/- range)
                    const total = pagination.totalPages;
                    const current = pagination.currentPage;
                    const range = 1; // How many pages around current to show
                    const showEllipsis = total > 7; // Condition to show ellipsis

                    if (!showEllipsis) return true; // Show all if few pages

                    // Always show first and last page
                    if (pageNumber === 1 || pageNumber === total) return true;
                    // Show pages around current
                    if (
                      pageNumber >= current - range &&
                      pageNumber <= current + range
                    )
                      return true;
                    // Show ellipsis markers (represented by rendering '...')
                    if (
                      (pageNumber === current - range - 1 &&
                        current - range > 2) ||
                      (pageNumber === current + range + 1 &&
                        current + range < total - 1)
                    )
                      return "...";

                    return false;
                  })
                  .map((pageNumber, index, arr) =>
                    pageNumber === "..." ? (
                      // Ensure ellipsis doesn't repeat if consecutive
                      arr[index - 1] !== "..." && (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1 py-1 text-sm text-gray-500"
                        >
                          ...
                        </span>
                      )
                    ) : (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        aria-current={
                          pageNumber === pagination.currentPage
                            ? "page"
                            : undefined
                        }
                        className={`h-9 w-9 rounded-md text-sm flex items-center justify-center transition-colors ${
                          pageNumber === pagination.currentPage
                            ? "bg-indigo-600 text-white font-semibold shadow-sm scale-105"
                            : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-3 py-1.5 mx-1 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>{" "}
      {/* End Container */}
      {/* Share Modal */}
      {isShareModalOpen && selectedPublication && (
        <ShareModal
          item={selectedPublication}
          itemType="publication"
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
      {/* No Comment Modal here - commenting happens on the detail page */}
    </div> // End Page Wrapper
  );
}
