// src/Page/Publication.jsx
// Displays publications publicly, with owner controls shown only to the owner.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  {
    value: "open",
    label: "Open for Collaboration",
  } /* { value: "in_progress", label: "In Progress" }, { value: "closed", label: "Closed" }, */,
];
const sortOptions = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
];
const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "in_progress":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "closed":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
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
    } = publication;
    const isSummaryExpanded = showFullSummary[id] || false;
    const displayDate = formatDate(publicationDate || createdAt);
    const statusClass = getStatusBadgeClass(collaborationStatus);
    const formattedStatus = formatStatusText(collaborationStatus);
    const safeTags = Array.isArray(tags) ? tags : [];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isOwner = currentUser?.id === ownerId;

    return (
      <motion.div
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        layout
      >
        {thumbnail ? (
          <div className="h-40 bg-gray-200 overflow-hidden relative">
            {" "}
            <img
              src={thumbnail}
              alt={`Thumbnail for ${title}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
                console.warn(`Failed to load thumbnail: ${thumbnail}`);
              }}
            />{" "}
            {currentUser && (
              <div className="absolute top-2 right-2">
                {" "}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(id, !isBookmarked);
                  }}
                  className="p-2 bg-white/80 rounded-full backdrop-blur-sm hover:bg-white transition-colors shadow"
                  data-tooltip-id={`bookmark-${id}`}
                  data-tooltip-content={
                    isBookmarked ? "Remove bookmark" : "Bookmark"
                  }
                >
                  {" "}
                  {isBookmarked ? (
                    <FaBookmark className="text-blue-500" />
                  ) : (
                    <FaRegBookmark className="text-gray-500 hover:text-blue-500" />
                  )}{" "}
                </button>{" "}
                <Tooltip id={`bookmark-${id}`} place="left" />{" "}
              </div>
            )}{" "}
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
            {" "}
            <FaBookOpen className="w-12 h-12" />{" "}
          </div>
        )}
        <div className="p-5 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h2
              className={`text-lg font-semibold text-gray-800 leading-tight flex-1 mr-2 ${
                isOwner
                  ? "cursor-pointer hover:text-blue-600 transition-colors"
                  : ""
              }`}
              onClick={isOwner ? () => onEdit(id) : undefined}
              title={isOwner ? `Edit "${title}"` : title}
            >
              {" "}
              {title}{" "}
            </h2>
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                title="More actions"
              >
                {" "}
                <FaEllipsisV className="w-4 h-4" />{" "}
              </button>
              <AnimatePresence>
                {" "}
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200 py-1"
                    onMouseLeave={() => setIsMenuOpen(false)}
                  >
                    <button
                      onClick={() => {
                        onShare(publication);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                    >
                      {" "}
                      <FaShare className="w-3.5 h-3.5 text-gray-500" /> Share{" "}
                    </button>
                    {isOwner && (
                      <>
                        {" "}
                        <button
                          onClick={() => {
                            onClone(id);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        >
                          {" "}
                          <FaRegClone className="w-3.5 h-3.5 text-gray-500" />{" "}
                          Duplicate{" "}
                        </button>{" "}
                        <button
                          onClick={() => {
                            onEdit(id);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        >
                          {" "}
                          <FaEdit className="w-3.5 h-3.5 text-gray-500" /> Edit{" "}
                        </button>{" "}
                        <div className="my-1 border-t border-gray-100"></div>{" "}
                        <button
                          onClick={() => {
                            onDelete(id, title);
                            setIsMenuOpen(false);
                          }}
                          disabled={deletingId === id}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                          {" "}
                          {deletingId === id ? (
                            <LoadingSpinner size="xs" />
                          ) : (
                            <FaTrashAlt className="w-3.5 h-3.5" />
                          )}{" "}
                          Delete{" "}
                        </button>{" "}
                      </>
                    )}
                  </motion.div>
                )}{" "}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">By: {author}</p>
          <div className="relative mb-4 flex-grow min-h-[60px]">
            {" "}
            <p
              className={`text-sm text-gray-700 transition-all duration-300 ${
                isSummaryExpanded ? "" : "line-clamp-4"
              }`}
            >
              {" "}
              {summary}{" "}
            </p>{" "}
            {(summary?.length > 150 || isSummaryExpanded) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSummary(id);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
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
                  className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium border border-blue-100"
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
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
            {" "}
            <div className="flex justify-between items-center text-xs text-gray-500">
              {" "}
              <div className="flex items-center gap-2" title="Research Area">
                {" "}
                <FaFlask className="h-3.5 w-3.5 flex-shrink-0" />{" "}
                <span className="truncate">{area}</span>{" "}
              </div>{" "}
              <div
                className="flex items-center gap-2"
                title="Publication/Creation Date"
              >
                {" "}
                <FaCalendarAlt className="h-3.5 w-3.5 flex-shrink-0" />{" "}
                <span>{displayDate}</span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex justify-between items-center">
              {" "}
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusClass}`}
                title="Collaboration Status"
              >
                {" "}
                {formattedStatus}{" "}
              </span>{" "}
              <div className="flex gap-3 text-xs text-gray-500">
                {" "}
                <span className="flex items-center gap-1" title="Views">
                  {" "}
                  <FaBookOpen className="h-3 w-3" /> {views}{" "}
                </span>{" "}
                <span className="flex items-center gap-1" title="Citations">
                  {" "}
                  <FaRegChartBar className="h-3 w-3" /> {citations}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        </div>
        {doi && (
          <div className="px-5 pb-4 pt-1 border-t border-gray-100 mt-3">
            {" "}
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
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
  const [statusFilter, setStatusFilter] = useState(statusOptions[0].value);
  const [showFullSummary, setShowFullSummary] = useState({});
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [deletingId, setDeletingId] = useState(null);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
        `Fetching page ${page}. Filter: ${statusFilter}, Sort: ${sortBy}, Search: ${searchTerm}`
      );
      setLoading(true);
      setApiError(null);
      try {
        const url = `${API_BASE_URL}/api/publications/explore`; // Using public endpoint
        const headers = getAuthHeaders();
        const params = {
          page,
          limit: pagination.limit,
          sortBy,
          search:
            searchTerm ||
            undefined /* status: statusFilter !== "all" ? statusFilter : undefined */,
        }; // Include relevant params
        console.log(`Sending GET request to: ${url}`);
        console.log("Request Params:", params);
        console.log("Request Headers:", headers);

        const response = await axios.get(url, { headers, params });

        console.log("API Response Received:", response);
        console.log("API Response Data:", response.data);

        if (
          response.data &&
          response.data.success === true &&
          Array.isArray(response.data.data)
        ) {
          console.log(
            `Successfully fetched ${response.data.data.length} publications for page ${page}. Total items: ${response.data.totalItems}`
          );
          setPublications(response.data.data);
          setPagination((prev) => ({
            ...prev,
            currentPage: response.data.currentPage || page,
            totalPages: response.data.totalPages || 1,
            totalItems: response.data.totalItems || 0,
          }));
          const initialSummaryState = response.data.data.reduce((acc, pub) => {
            acc[pub.id] = false;
            return acc;
          }, {});
          setShowFullSummary(initialSummaryState);
        } else {
          console.error(
            "Invalid data structure received from API:",
            response.data
          );
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
    [
      statusFilter,
      sortBy,
      searchTerm,
      pagination.limit,
      pagination.currentPage,
      currentUser,
    ]
  ); // Dependencies for fetch

  // Fetch on mount & dependency change
  useEffect(() => {
    console.log("useEffect triggered for fetchPublications");
    fetchPublications(pagination.currentPage);
  }, [fetchPublications]); // useEffect depends on the memoized fetch function

  // --- ** CORRECTED Action Handlers ** ---

  // Delete Publication
  const handleDelete = useCallback(
    async (id, title) => {
      // 1. Check Login
      if (!currentUser) {
        showNotification("Please log in to delete publications.", "error");
        return; // Should not happen if button is hidden, but safety check
      }
      // 2. Confirm
      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete "${
          title || "this publication"
        }"? This cannot be undone.`
      );
      if (!confirmDelete) {
        console.log("Delete cancelled by user.");
        return;
      }
      // 3. Set Loading State
      setDeletingId(id);
      // 4. API Call
      try {
        const url = `${API_BASE_URL}/api/publications/${id}`; // Use standard DELETE endpoint
        console.log(`Sending DELETE request to: ${url}`);
        await axios.delete(url, { headers: getAuthHeaders() }); // Backend checks ownership via protect middleware + controller logic

        // 5. Update UI on Success
        setPublications((prev) => prev.filter((p) => p.id !== id)); // Remove from list
        setShowFullSummary((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        }); // Clean up summary state
        showNotification(`Publication "${title || id}" deleted successfully.`);
        console.log(`Publication ${id} deleted successfully.`);
      } catch (error) {
        // 6. Handle Errors
        console.error(`Error deleting publication ${id}:`, error);
        const errMsg =
          error.response?.data?.message || "Failed to delete publication";
        showNotification(errMsg, "error");
      } finally {
        // 7. Reset Loading State
        setDeletingId(null);
      }
    },
    [showNotification, currentUser]
  ); // Dependencies

  // Edit Publication
  const handleEdit = useCallback(
    (publicationId) => {
      if (!currentUser) {
        showNotification("Please log in to edit publications.", "error"); // Should not happen
        return;
      }
      console.log(`Navigating to edit page for ID: ${publicationId}`);
      navigate(`/publications/edit/${publicationId}`);
    },
    [navigate, currentUser, showNotification]
  );

  // Add New Publication
  const handleAddNew = useCallback(() => {
    if (currentUser) {
      console.log("Navigating to add new publication page.");
      navigate("/publications/new");
    } else {
      console.log("Redirecting to login for adding new publication.");
      showNotification("Please log in to add a publication.", "info");
      navigate("/login"); // Redirect to login if not logged in
    }
  }, [navigate, currentUser, showNotification]);

  // Bookmark Publication
  const handleBookmark = useCallback(
    async (id, bookmark) => {
      if (!currentUser) {
        showNotification("Please log in to bookmark publications.", "info");
        return;
      }
      console.log(`Setting bookmark status for ID: ${id} to ${bookmark}`);
      try {
        const url = `${API_BASE_URL}/api/publications/${id}/bookmark`; // Ensure this endpoint exists and handles non-owner bookmarks if needed
        console.log(`Sending PATCH request to: ${url}`, { bookmark });
        await axios.patch(url, { bookmark }, { headers: getAuthHeaders() });
        // Update local state - this assumes the API call worked
        setPublications((prev) =>
          prev.map((pub) =>
            pub.id === id ? { ...pub, isBookmarked: bookmark } : pub
          )
        );
        showNotification(
          bookmark ? "Publication bookmarked" : "Bookmark removed",
          "info"
        );
      } catch (error) {
        console.error(`Error updating bookmark for ${id}:`, error);
        const errMsg =
          error.response?.data?.message || "Failed to update bookmark";
        showNotification(errMsg, "error");
      }
    },
    [showNotification, currentUser]
  );

  // Clone Publication
  const handleClone = useCallback(
    async (id) => {
      if (!currentUser) {
        showNotification("Please log in to duplicate publications.", "error"); // Should not happen
        return;
      }
      console.log(`Attempting to clone publication ID: ${id}`);
      // Add loading state specifically for cloning if needed
      try {
        const url = `${API_BASE_URL}/api/publications/${id}/clone`; // Ensure endpoint exists
        console.log(`Sending POST request to: ${url}`);
        const response = await axios.post(
          url,
          {},
          { headers: getAuthHeaders() }
        ); // Backend checks ownership
        if (response.data?.success && response.data.data) {
          const clonedPub = response.data.data;
          console.log("Cloned publication data:", clonedPub);
          setPublications((prev) => [clonedPub, ...prev]); // Add to list
          setShowFullSummary((prev) => ({ ...prev, [clonedPub.id]: false })); // Set summary state
          showNotification("Publication duplicated successfully");
        } else {
          console.error("Clone response missing data:", response.data);
          throw new Error(
            response.data?.message || "Failed to clone: Invalid server response"
          );
        }
      } catch (error) {
        console.error(`Error cloning publication ${id}:`, error);
        const errMsg =
          error.response?.data?.message || "Failed to duplicate publication";
        showNotification(errMsg, "error");
      } finally {
        // Reset cloning loading state if implemented
      }
    },
    [showNotification, currentUser]
  );

  // Share Publication
  const handleShare = useCallback((publication) => {
    console.log(`Opening share modal for publication ID: ${publication.id}`);
    setSelectedPublication(publication);
    setIsShareModalOpen(true);
  }, []);

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
  const handleStatusFilterChange = (selectedOption) => {
    setStatusFilter(selectedOption.value);
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };
  const handleToggleSummary = useCallback((id) => {
    setShowFullSummary((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);
  const handleToggleAllSummaries = useCallback((expand) => {
    setShowFullSummary((prev) => {
      const newState = {};
      Object.keys(prev).forEach((id) => {
        newState[id] = expand;
      });
      return newState;
    });
  }, []);
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  }, []);

  // --- Memoized Data for Display ---
  const displayedPublications = useMemo(() => {
    // Assuming backend handles filtering/sorting based on params sent in fetchPublications
    return publications;
  }, [publications]);

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
      console.log(`Changing page to: ${newPage}`);
      setPagination((p) => ({ ...p, currentPage: newPage }));
      window.scrollTo(0, 0);
      // useEffect will trigger refetch due to pagination.currentPage dependency in fetchPublications
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            {" "}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Explore Publications
            </h1>{" "}
            <p className="text-sm text-gray-500 mt-1">
              Discover research and collaborations
            </p>{" "}
          </div>
          <div className="flex gap-3 w-full sm:w-auto flex-shrink-0">
            {" "}
            <button
              onClick={toggleViewMode}
              title={
                viewMode === "grid"
                  ? "Switch to List View"
                  : "Switch to Grid View"
              }
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
            >
              {" "}
              {viewMode === "grid" ? (
                <FaList className="h-4 w-4" />
              ) : (
                <FaThLarge className="h-4 w-4" />
              )}{" "}
              <span>{viewMode === "grid" ? "List" : "Grid"}</span>{" "}
            </button>{" "}
            {currentUser && (
              <button
                onClick={handleAddNew}
                className="px-4 py-1.5 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
              >
                {" "}
                <FaPlus className="h-3.5 w-3.5" /> New Publication{" "}
              </button>
            )}{" "}
          </div>
        </div>

        {/* Notification */}
        <div className="fixed top-5 right-5 z-50 w-auto max-w-sm">
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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="relative md:col-span-2">
            {" "}
            <label htmlFor="search-pubs" className="sr-only">
              Search Publications
            </label>{" "}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {" "}
              <FaSearch className="h-4 w-4 text-gray-400" />{" "}
            </div>{" "}
            <input
              id="search-pubs"
              type="search"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search by title, author, summary, tags..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
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
          {/* <div className="flex items-center gap-2"> <label htmlFor="status-filter" className="sr-only">Filter by Status</label> <FaFilter className="h-4 w-4 text-gray-500 flex-shrink-0" /> <Select inputId="status-filter" options={statusOptions} value={statusOptions.find(opt => opt.value === statusFilter)} onChange={handleStatusFilterChange} className="flex-grow text-sm react-select-container" classNamePrefix="react-select" isSearchable={false} /> </div> */}
          <div className="md:col-start-4 flex items-center gap-2">
            {" "}
            <label htmlFor="sort-by" className="sr-only">
              Sort By
            </label>{" "}
            <FaSortAmountDown className="h-4 w-4 text-gray-500 flex-shrink-0" />{" "}
            <Select
              inputId="sort-by"
              options={sortOptions}
              value={sortOptions.find((opt) => opt.value === sortBy)}
              onChange={handleSortChange}
              className="flex-grow text-sm react-select-container"
              classNamePrefix="react-select"
              isSearchable={false}
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
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <FaExpandArrowsAlt className="h-3.5 w-3.5" /> Expand All{" "}
            </button>{" "}
            <button
              onClick={() => handleToggleAllSummaries(false)}
              disabled={!isAnySummaryExpanded}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              <FaCompressArrowsAlt className="h-3.5 w-3.5" /> Collapse All{" "}
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
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse flex flex-col h-[350px]"
                >
                  {" "}
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>{" "}
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>{" "}
                  <div className="space-y-2 mb-4 flex-grow">
                    {" "}
                    <div className="h-4 bg-gray-200 rounded w-full"></div>{" "}
                    <div className="h-4 bg-gray-200 rounded w-full"></div>{" "}
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>{" "}
                  </div>{" "}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {" "}
                    <div className="h-5 w-16 bg-gray-300 rounded-full"></div>{" "}
                    <div className="h-5 w-20 bg-gray-300 rounded-full"></div>{" "}
                  </div>{" "}
                  <div className="flex justify-between items-center text-sm mt-auto pt-3 border-t border-gray-200">
                    {" "}
                    <div className="h-6 w-20 bg-gray-300 rounded-full"></div>{" "}
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          )}
          {!loading && !apiError && displayedPublications.length === 0 && (
            <div className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-200">
              {" "}
              <FaInfoCircle className="mx-auto text-5xl text-gray-400 mb-4" />{" "}
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {" "}
                {searchTerm
                  ? "No matching publications found"
                  : "No publications available"}{" "}
              </p>{" "}
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {" "}
                {searchTerm
                  ? "Try adjusting your search query or clearing the filters."
                  : "Check back later or add your own!"}{" "}
              </p>{" "}
              {currentUser && !searchTerm && (
                <button
                  onClick={handleAddNew}
                  className="px-5 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2 mx-auto transition-colors shadow-sm"
                >
                  {" "}
                  <FaPlus className="h-3.5 w-3.5" /> Add Your Publication{" "}
                </button>
              )}{" "}
            </div>
          )}
          {!loading &&
            !apiError &&
            displayedPublications.length > 0 &&
            (viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    const isSummaryExpanded =
                      showFullSummary[publication.id] || false;
                    const isOwner = currentUser?.id === publication.ownerId;
                    return (
                      <motion.div
                        key={publication.id}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 p-4 flex flex-col sm:flex-row gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        layout
                      >
                        {" "}
                        {publication.thumbnail && (
                          <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {" "}
                            <img
                              src={publication.thumbnail}
                              alt={publication.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />{" "}
                          </div>
                        )}{" "}
                        <div className="flex-grow">
                          {" "}
                          <div className="flex justify-between items-start mb-1">
                            {" "}
                            <h3
                              className={`text-base font-semibold text-gray-800 flex-1 mr-2 ${
                                isOwner
                                  ? "cursor-pointer hover:text-blue-600"
                                  : ""
                              }`}
                              onClick={
                                isOwner
                                  ? () => handleEdit(publication.id)
                                  : undefined
                              }
                            >
                              {" "}
                              {publication.title}{" "}
                            </h3>{" "}
                            <div className="flex gap-2 flex-shrink-0">
                              {" "}
                              {isOwner && (
                                <button
                                  onClick={() => handleEdit(publication.id)}
                                  title="Edit"
                                  className="text-gray-400 hover:text-blue-600 p-1"
                                >
                                  <FaEdit />
                                </button>
                              )}{" "}
                              <button
                                onClick={() => handleShare(publication)}
                                title="Share"
                                className="text-gray-400 hover:text-blue-600 p-1"
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
                                  className="text-gray-400 hover:text-blue-600 p-1"
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
                                  className="text-gray-400 hover:text-red-600 p-1 disabled:opacity-50"
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
                          <p className="text-xs text-gray-500 mb-2">
                            {" "}
                            By: {publication.author} ·{" "}
                            {formatDate(
                              publication.publicationDate ||
                                publication.createdAt
                            )}{" "}
                          </p>{" "}
                          <p
                            className={`text-sm text-gray-600 mb-2 ${
                              isSummaryExpanded ? "" : "line-clamp-2"
                            }`}
                          >
                            {" "}
                            {publication.summary}{" "}
                          </p>{" "}
                          {(publication.summary?.length > 100 ||
                            isSummaryExpanded) && (
                            <button
                              onClick={() =>
                                handleToggleSummary(publication.id)
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {" "}
                              {isSummaryExpanded
                                ? "Show less"
                                : "Show more"}{" "}
                            </button>
                          )}{" "}
                          <div className="flex flex-wrap gap-2 items-center mt-3 text-xs">
                            {" "}
                            <span
                              className={`px-2 py-0.5 rounded-full border text-xs ${getStatusBadgeClass(
                                publication.collaborationStatus
                              )}`}
                            >
                              {formatStatusText(
                                publication.collaborationStatus
                              )}
                            </span>{" "}
                            {publication.tags?.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}{" "}
                          </div>{" "}
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
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1 mx-1 rounded-md bg-white border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              Previous{" "}
            </button>
            <span className="text-sm text-gray-700 mx-2">
              {" "}
              Page {pagination.currentPage} of {pagination.totalPages} (
              {pagination.totalItems} items){" "}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1 mx-1 rounded-md bg-white border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              Next{" "}
            </button>
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
    </div> // End Page Wrapper
  );
}
