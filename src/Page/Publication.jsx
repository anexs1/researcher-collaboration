// src/Page/Publication.jsx
// Displays publications publicly, with enhanced styling and conditional controls.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
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
  FaUser, // <<< --- Correctly Imported --- >>>
  FaCommentDots, // Example: New icon for a 'Comment' button
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
        timeZone: "UTC",
      });
    }
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error(`Error formatting date "${dateString}":`, error);
    return "Date Error";
  }
};
const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open for Collaboration" },
]; // Simplified for public view
const sortOptions = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
];
const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "in_progress":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "closed":
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
    onAddComment, // ** NEW: Handler for adding comments **
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
      views = 0,
      citations = 0,
      isBookmarked = false,
      thumbnail,
      doi,
      ownerId,
      commentCount = 0, // Assume comment count comes from API
    } = publication;

    const isSummaryExpanded = showFullSummary[id] || false;
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
                {" "}
                <img
                  src={thumbnail}
                  alt={`Thumbnail for ${title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = "none";
                    console.warn(`Failed to load thumbnail: ${thumbnail}`);
                  }}
                />{" "}
              </div>
            ) : (
              <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 rounded-t-xl">
                {" "}
                <FaBookOpen className="w-12 h-12 opacity-70" />{" "}
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
              {" "}
              <h2 className="text-lg font-semibold text-gray-900 leading-tight hover:text-indigo-700 transition-colors line-clamp-2">
                {" "}
                {title}{" "}
              </h2>{" "}
            </Link>
            {isOwner && (
              <div className="relative flex-shrink-0">
                {" "}
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
                  {" "}
                  <FaEllipsisV className="w-4 h-4" />{" "}
                </button>{" "}
                <AnimatePresence>
                  {" "}
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-xl z-20 border border-gray-200/80 py-1"
                      onMouseLeave={() => setIsMenuOpen(false)}
                    >
                      {" "}
                      <button
                        onClick={() => {
                          onClone(id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors"
                      >
                        {" "}
                        <FaRegClone className="w-3.5 h-3.5 text-gray-500" />{" "}
                        Duplicate{" "}
                      </button>{" "}
                      <div className="my-1 border-t border-gray-100"></div>{" "}
                      <button
                        onClick={() => {
                          onDelete(id, title);
                          setIsMenuOpen(false);
                        }}
                        disabled={deletingId === id}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                      >
                        {" "}
                        {deletingId === id ? (
                          <LoadingSpinner size="xs" />
                        ) : (
                          <FaTrashAlt className="w-3.5 h-3.5" />
                        )}{" "}
                        Delete{" "}
                      </button>{" "}
                    </motion.div>
                  )}{" "}
                </AnimatePresence>{" "}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
            {" "}
            <FaUser className="w-3 h-3 text-gray-400" /> <span>{author}</span>{" "}
          </p>
          <div className="relative mb-4 flex-grow min-h-[60px]">
            {" "}
            <p
              className={`text-sm text-gray-700 transition-all duration-300 ${
                isSummaryExpanded ? "" : "line-clamp-3"
              }`}
            >
              {" "}
              {summary}{" "}
            </p>{" "}
            {(summary?.length > 120 || isSummaryExpanded) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSummary(id);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 inline-block"
              >
                {" "}
                {isSummaryExpanded ? "Show less" : "Show more"}{" "}
              </button>
            )}{" "}
          </div>
          {safeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 items-center">
              {" "}
              <FaTag className="h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0" />{" "}
              {safeTags.slice(0, 3).map((tag, index) => (
                <span
                  key={`${tag}-${index}-${id}`}
                  className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium border border-indigo-100"
                >
                  {" "}
                  {tag}{" "}
                </span>
              ))}{" "}
              {safeTags.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">
                  {" "}
                  +{safeTags.length - 3} more{" "}
                </span>
              )}{" "}
            </div>
          )}

          {/* Footer Area */}
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
              {" "}
              <div className="flex items-center gap-1.5" title="Research Area">
                {" "}
                <FaFlask className="h-3.5 w-3.5 flex-shrink-0 text-teal-500" />{" "}
                <span className="truncate">{area}</span>{" "}
              </div>{" "}
              <div
                className="flex items-center gap-1.5"
                title="Publication/Creation Date"
              >
                {" "}
                <FaCalendarAlt className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />{" "}
                <span>{displayDate}</span>{" "}
              </div>{" "}
            </div>
            <div className="flex justify-between items-center mb-3">
              {" "}
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusClass}`}
                title="Collaboration Status"
              >
                {" "}
                {formattedStatus}{" "}
              </span>{" "}
              <div className="flex gap-3 text-xs text-gray-500">
                {" "}
                <span className="flex items-center gap-1" title="Views">
                  {" "}
                  <FaEye className="h-3.5 w-3.5" /> {views}{" "}
                </span>{" "}
              </div>{" "}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <Link
                to={`/publications/${id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                title="View Details"
              >
                {" "}
                <FaEye /> View Details{" "}
              </Link>
              <div className="flex items-center gap-1">
                {/* Comment Button */}
                <button
                  onClick={() => onAddComment(publication)}
                  className={iconButtonClass}
                  title="View/Add Comments"
                  data-tooltip-id={`comment-btn-${id}`}
                  data-tooltip-content="Comments"
                >
                  {" "}
                  <FaCommentDots />{" "}
                  <span className="ml-1 text-xs">{commentCount || 0}</span>{" "}
                  {/* Show count */}{" "}
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
                    {" "}
                    {isBookmarked ? (
                      <FaBookmark className="text-blue-500" />
                    ) : (
                      <FaRegBookmark />
                    )}{" "}
                  </button>
                )}
                <Tooltip id={`bookmark-btn-${id}`} />
                {/* Share Button */}
                <button
                  onClick={() => onShare(publication)}
                  className={iconButtonClass}
                  title="Share"
                  data-tooltip-id={`share-btn-${id}`}
                  data-tooltip-content="Share this publication"
                >
                  {" "}
                  <FaShare />{" "}
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
                    {" "}
                    <FaEdit />{" "}
                  </button>
                )}
                <Tooltip id={`edit-btn-${id}`} />
              </div>
            </div>
            {/* Collaboration button removed */}
          </div>
        </div>
        {doi && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
            {" "}
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5"
              title={`View on doi.org: ${doi}`}
            >
              {" "}
              <FaExternalLinkAlt className="h-3 w-3" /> View DOI{" "}
            </a>{" "}
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
  const [sortBy, setSortBy] = useState(sortOptions[0].value);
  const [showFullSummary, setShowFullSummary] = useState({});
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [deletingId, setDeletingId] = useState(null);
  const [selectedPublication, setSelectedPublication] = useState(null); // For Share/Comment Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  // const [isCommentModalOpen, setIsCommentModalOpen] = useState(false); // State for comment modal
  const [viewMode, setViewMode] = useState("grid");

  const navigate = useNavigate();

  // --- Handlers ---
  const showNotification = useCallback((message, type = "success") => {
    console.log(`Notification: [${type}] ${message}`);
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      NOTIFICATION_DURATION
    );
  }, []);

  // --- Data Fetching ---
  const fetchPublications = useCallback(
    async (page = 1) => {
      console.log("fetchPublications called. currentUser:", currentUser);
      console.log(
        `Fetching page ${page}. Sort: ${sortBy}, Search: ${searchTerm}`
      );
      setLoading(true);
      setApiError(null);
      try {
        const url = `${API_BASE_URL}/api/publications/explore`;
        const headers = getAuthHeaders();
        const params = {
          page,
          limit: pagination.limit,
          sortBy,
          search: searchTerm || undefined,
        };
        console.log(`Sending GET request to: ${url} with params:`, params);
        const response = await axios.get(url, { headers, params });
        console.log("API Response Data:", response.data);
        if (
          response.data &&
          response.data.success === true &&
          Array.isArray(response.data.data)
        ) {
          setPublications(response.data.data);
          setPagination((prev) => ({
            ...prev,
            currentPage: response.data.pagination?.currentPage || page,
            totalPages: response.data.pagination?.totalPages || 1,
            totalItems: response.data.pagination?.totalItems || 0,
          }));
          const initialSummaryState = response.data.data.reduce((acc, pub) => {
            acc[pub.id] = false;
            return acc;
          }, {});
          setShowFullSummary(initialSummaryState);
        } else {
          throw new Error(
            response.data?.message || "Received invalid data structure"
          );
        }
      } catch (error) {
        console.error("Error fetching publications:", error);
        if (error.response) {
          console.error("Error Status:", error.response.status);
          console.error("Error Data:", error.response.data);
        } else if (error.request) {
          console.error("No response received.");
        } else {
          console.error("Error Message:", error.message);
        }
        const errMsg =
          error.response?.data?.message ||
          error.message ||
          "Failed to load publications.";
        setApiError(errMsg);
        setPublications([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: DEFAULT_PAGE_LIMIT,
        });
      } finally {
        setLoading(false);
      }
    },
    [sortBy, searchTerm, pagination.limit, pagination.currentPage, currentUser]
  );

  // Fetch on mount & dependency change
  useEffect(() => {
    fetchPublications(pagination.currentPage);
  }, [fetchPublications]);

  // --- Action Handlers ---
  const handleDelete = useCallback(
    async (id, title) => {
      if (!currentUser) {
        showNotification("Log in required", "error");
        return;
      }
      if (!window.confirm(`Delete "${title}"?`)) return;
      setDeletingId(id);
      try {
        await axios.delete(`${API_BASE_URL}/api/publications/${id}`, {
          headers: getAuthHeaders(),
        });
        setPublications((prev) => prev.filter((p) => p.id !== id));
        showNotification(`Deleted "${title}"`);
      } catch (e) {
        showNotification(e.response?.data?.message || "Delete failed", "error");
      } finally {
        setDeletingId(null);
      }
    },
    [showNotification, currentUser]
  );
  const handleEdit = useCallback(
    (publicationId) => {
      if (!currentUser) {
        showNotification("Log in required", "error");
        return;
      }
      navigate(`/publications/edit/${publicationId}`);
    },
    [navigate, currentUser, showNotification]
  );
  const handleAddNew = useCallback(() => {
    if (currentUser) navigate("/publications/new");
    else {
      showNotification("Please log in first", "info");
      navigate("/login");
    }
  }, [navigate, currentUser, showNotification]);
  const handleBookmark = useCallback(
    async (id, bookmark) => {
      if (!currentUser) {
        showNotification("Please log in to bookmark.", "info");
        return;
      }
      try {
        await axios.patch(
          `${API_BASE_URL}/api/publications/${id}/bookmark`,
          { bookmark },
          { headers: getAuthHeaders() }
        );
        setPublications((prev) =>
          prev.map((pub) =>
            pub.id === id ? { ...pub, isBookmarked: bookmark } : pub
          )
        );
        showNotification(bookmark ? "Bookmarked" : "Bookmark removed", "info");
      } catch (e) {
        showNotification(
          e.response?.data?.message || "Bookmark failed",
          "error"
        );
      }
    },
    [showNotification, currentUser]
  );
  const handleClone = useCallback(
    async (id) => {
      if (!currentUser) {
        showNotification("Log in required", "error");
        return;
      }
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/publications/${id}/clone`,
          {},
          { headers: getAuthHeaders() }
        );
        if (response.data?.success) {
          setPublications((prev) => [response.data.data, ...prev]);
          showNotification("Duplicated");
        } else {
          throw new Error(response.data?.message);
        }
      } catch (e) {
        showNotification(
          e.response?.data?.message || "Duplicate failed",
          "error"
        );
      }
    },
    [showNotification, currentUser]
  );
  const handleShare = useCallback((publication) => {
    setSelectedPublication(publication);
    setIsShareModalOpen(true);
  }, []);
  // --- ** NEW Comment Handler ** ---
  const handleAddComment = useCallback(
    (publication) => {
      if (!currentUser) {
        showNotification("Please log in to comment.", "info");
        navigate("/login");
        return;
      }
      console.log(
        `TODO: Open comment modal/section for Pub ID: ${publication.id}`
      );
      // Example: Open a dedicated comment modal
      // setSelectedPublication(publication);
      // setIsCommentModalOpen(true);
      // Or navigate to detail page with comment section focused
      navigate(`/publications/${publication.id}?focus=comments`); // Example query param
      showNotification("Comment feature not fully implemented.", "info");
    },
    [currentUser, navigate, showNotification]
  );

  // --- Search/Filter/Sort/Toggle handlers ---
  const debouncedSetSearchTerm = useCallback(
    debounce(setSearchTerm, DEBOUNCE_DELAY),
    []
  );
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchTerm(value);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchTerm("");
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, []);
  const handleSortChange = (selectedOption) => {
    setSortBy(selectedOption.value);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };
  const handleToggleSummary = useCallback((id) => {
    setShowFullSummary((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);
  const handleToggleAllSummaries = useCallback(
    (expand) => {
      setShowFullSummary((prev) => {
        const newState = {};
        publications.forEach((p) => (newState[p.id] = expand));
        return newState;
      });
    },
    [publications]
  );
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  }, []);

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
      setPagination((p) => ({ ...p, currentPage: newPage }));
      window.scrollTo(0, 0);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-blue-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            {" "}
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Explore Publications
            </h1>{" "}
            <p className="text-base text-gray-500 mt-1">
              Discover research and collaborations in the community
            </p>{" "}
          </div>
          <div className="flex gap-3 w-full md:w-auto flex-shrink-0">
            {" "}
            <button
              onClick={toggleViewMode}
              title={
                viewMode === "grid"
                  ? "Switch to List View"
                  : "Switch to Grid View"
              }
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              {" "}
              {viewMode === "grid" ? (
                <FaList className="h-4 w-4" />
              ) : (
                <FaThLarge className="h-4 w-4" />
              )}{" "}
              <span>{viewMode === "grid" ? "List" : "Grid"} View</span>{" "}
            </button>{" "}
            {currentUser && (
              <button
                onClick={handleAddNew}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {" "}
                <FaPlus className="h-4 w-4" /> Post New{" "}
              </button>
            )}{" "}
          </div>
        </div>

        {/* Notification */}
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md">
          {" "}
          <AnimatePresence>
            {" "}
            {notification.show && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                {" "}
                <Notification
                  message={notification.message}
                  type={notification.type}
                  show={notification.show}
                  onClose={() =>
                    setNotification((prev) => ({ ...prev, show: false }))
                  }
                />{" "}
              </motion.div>
            )}{" "}
          </AnimatePresence>{" "}
        </div>

        {/* API Error */}
        {apiError && !loading && (
          <ErrorMessage message={apiError} onClose={() => setApiError(null)} />
        )}

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="relative md:col-span-2">
            {" "}
            <label htmlFor="search-pubs" className="sr-only">
              Search Publications
            </label>{" "}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {" "}
              <FaSearch className="h-5 w-5 text-gray-400" />{" "}
            </div>{" "}
            <input
              id="search-pubs"
              type="search"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search title, author, summary..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm"
            />{" "}
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-600"
                aria-label="Clear search"
                title="Clear search"
              >
                {" "}
                <FaTimes className="h-4 w-4" />{" "}
              </button>
            )}{" "}
          </div>
          <div className="flex items-center gap-2">
            {" "}
            <label
              htmlFor="sort-by"
              className="text-sm font-medium text-gray-500 flex-shrink-0"
            >
              Sort By:
            </label>{" "}
            <Select
              inputId="sort-by"
              options={sortOptions}
              value={sortOptions.find((opt) => opt.value === sortBy)}
              onChange={handleSortChange}
              className="flex-grow text-sm react-select-container"
              classNamePrefix="react-select"
              isSearchable={false}
              styles={selectStyles}
            />{" "}
          </div>
        </div>

        {/* Summary Toggles */}
        {displayedPublications.length > 0 && !loading && (
          <div className="flex justify-end gap-2">
            {" "}
            <button
              onClick={() => handleToggleAllSummaries(true)}
              disabled={isAnySummaryExpanded}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <FaExpandArrowsAlt /> Expand All{" "}
            </button>{" "}
            <button
              onClick={() => handleToggleAllSummaries(false)}
              disabled={!isAnySummaryExpanded}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <FaCompressArrowsAlt /> Collapse All{" "}
            </button>{" "}
          </div>
        )}

        {/* Main Content Area */}
        <div>
          {loading && (
            <div
              className={`grid ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              } gap-6`}
            >
              {" "}
              {[...Array(pagination.limit)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse flex flex-col h-[380px]"
                >
                  {" "}
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>{" "}
                  <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>{" "}
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>{" "}
                  <div className="space-y-2 flex-grow mb-4">
                    {" "}
                    <div className="h-4 bg-gray-200 rounded"></div>{" "}
                    <div className="h-4 bg-gray-200 rounded"></div>{" "}
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>{" "}
                  </div>{" "}
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
                    {" "}
                    <div className="h-6 w-24 bg-gray-300 rounded-full"></div>{" "}
                    <div className="h-4 w-20 bg-gray-300 rounded"></div>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          )}
          {!loading && !apiError && displayedPublications.length === 0 && (
            <div className="text-center py-20 px-6 bg-white rounded-xl shadow border border-gray-200">
              {" "}
              <FaInfoCircle className="mx-auto text-6xl text-gray-300 mb-4" />{" "}
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {" "}
                {searchTerm
                  ? "No Matching Publications Found"
                  : "No Publications Yet"}{" "}
              </p>{" "}
              <p className="text-base text-gray-500 mb-6 max-w-md mx-auto">
                {" "}
                {searchTerm
                  ? "Try adjusting your search or filters."
                  : "Be the first to share research or check back soon!"}{" "}
              </p>{" "}
              {currentUser && !searchTerm && (
                <button
                  onClick={handleAddNew}
                  className="px-5 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 flex items-center gap-2 mx-auto transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {" "}
                  <FaPlus /> Add Your Publication{" "}
                </button>
              )}{" "}
            </div>
          )}
          {!loading &&
            !apiError &&
            displayedPublications.length > 0 &&
            (viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {" "}
                <AnimatePresence>
                  {" "}
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
                      onAddComment={handleAddComment} /* Pass new handler */
                    />
                  ))}{" "}
                </AnimatePresence>{" "}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {" "}
                <AnimatePresence>
                  {" "}
                  {displayedPublications.map((publication) => {
                    const isOwner = currentUser?.id === publication.ownerId;
                    return (
                      <motion.div
                        key={publication.id}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 p-5 flex flex-col sm:flex-row gap-5 items-start"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        layout
                      >
                        {" "}
                        {publication.thumbnail && (
                          <Link
                            to={`/publications/${publication.id}`}
                            className="block w-full sm:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 group/thumb"
                          >
                            {" "}
                            <img
                              src={publication.thumbnail}
                              alt={publication.title}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />{" "}
                          </Link>
                        )}{" "}
                        <div className="flex-grow min-w-0">
                          {" "}
                          <div className="flex justify-between items-start mb-1.5">
                            {" "}
                            <Link
                              to={`/publications/${publication.id}`}
                              className="flex-1 mr-2"
                              title={`View details for "${publication.title}"`}
                            >
                              {" "}
                              <h3 className="text-lg font-semibold text-gray-800 hover:text-indigo-700 transition-colors line-clamp-2">
                                {" "}
                                {publication.title}{" "}
                              </h3>{" "}
                            </Link>{" "}
                            <div className="flex gap-1.5 flex-shrink-0">
                              {" "}
                              {isOwner && (
                                <button
                                  onClick={() => handleEdit(publication.id)}
                                  title="Edit"
                                  className={iconButtonClass}
                                >
                                  <FaEdit />
                                </button>
                              )}{" "}
                              <button
                                onClick={() => handleShare(publication)}
                                title="Share"
                                className={iconButtonClass}
                              >
                                <FaShare />
                              </button>{" "}
                              {currentUser && (
                                <button
                                  onClick={() =>
                                    handleBookmark(
                                      publication.id,
                                      !publication.isBookmarked
                                    )
                                  }
                                  title="Bookmark"
                                  className={iconButtonClass}
                                >
                                  {" "}
                                  {publication.isBookmarked ? (
                                    <FaBookmark className="text-blue-500" />
                                  ) : (
                                    <FaRegBookmark />
                                  )}{" "}
                                </button>
                              )}{" "}
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
                                    <FaTrashAlt />
                                  )}
                                </button>
                              )}{" "}
                            </div>{" "}
                          </div>{" "}
                          <p className="text-sm text-gray-500 mb-2">
                            {" "}
                            By: {publication.author} ·{" "}
                            {formatDate(
                              publication.publicationDate ||
                                publication.createdAt
                            )}{" "}
                          </p>{" "}
                          {/* ... rest of list card content ... */}{" "}
                          {/* Comment Button in List View */}{" "}
                          <button
                            onClick={() => onAddComment(publication)}
                            className={`mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1.5 ${
                              !currentUser
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={!currentUser}
                            title={
                              currentUser
                                ? "Add/View Comments"
                                : "Log in to comment"
                            }
                          >
                            {" "}
                            <FaCommentDots />{" "}
                            <span>
                              {publication.commentCount || 0} Comments
                            </span>{" "}
                          </button>{" "}
                        </div>{" "}
                      </motion.div>
                    );
                  })}{" "}
                </AnimatePresence>{" "}
              </div>
            ))}
        </div>

        {/* Pagination Controls */}
        {!loading && !apiError && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center pt-8 mt-8 border-t border-gray-200">
            {" "}
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-4 py-2 mx-1 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {" "}
              Previous{" "}
            </button>{" "}
            <div className="flex items-center gap-1 mx-2">
              {" "}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((pageNumber) => {
                  const total = pagination.totalPages;
                  const current = pagination.currentPage;
                  const range = 2;
                  if (total <= 7) return true;
                  if (
                    pageNumber <= range + 1 ||
                    pageNumber >= total - range ||
                    Math.abs(pageNumber - current) <= range
                  )
                    return true;
                  if (
                    pageNumber === range + 2 ||
                    pageNumber === total - range - 1
                  )
                    return "...";
                  return false;
                })
                .map((pageNumber, index) =>
                  pageNumber === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 py-1 text-sm text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={pageNumber === pagination.currentPage}
                      className={`h-9 w-9 rounded-md text-sm flex items-center justify-center transition-colors ${
                        pageNumber === pagination.currentPage
                          ? "bg-indigo-600 text-white font-semibold shadow-sm scale-110"
                          : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400"
                      }`}
                    >
                      {" "}
                      {pageNumber}{" "}
                    </button>
                  )
                )}{" "}
            </div>{" "}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-4 py-2 mx-1 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {" "}
              Next{" "}
            </button>{" "}
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
      {/* Add Comment Modal placeholder if needed */}
      {/* {isCommentModalOpen && selectedPublication && <CommentModal publication={selectedPublication} onClose={() => setIsCommentModalOpen(false)} />} */}
    </div> // End Page Wrapper
  );
}
