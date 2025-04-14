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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import Select from "react-select";

import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
import ShareModal from "../Component/Common/ShareModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Enhanced helper functions
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
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
];

const sortOptions = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
  { value: "most_viewed", label: "Most Viewed" },
  { value: "most_cited", label: "Most Cited" },
];

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "in_progress":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "closed":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "draft":
      return "bg-gray-100 text-gray-800 border-gray-200";
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
    } = publication;

    const isSummaryExpanded = showFullSummary[id] || false;
    const displayDate = formatDate(publicationDate || createdAt);
    const statusClass = getStatusBadgeClass(collaborationStatus);
    const formattedStatus = formatStatusText(collaborationStatus);
    const safeTags = Array.isArray(tags) ? tags : [];

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    return (
      <motion.div
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        layout
      >
        {thumbnail && (
          <div className="h-40 bg-gray-100 overflow-hidden relative">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={() => onBookmark(id, !isBookmarked)}
                className="p-2 bg-white/80 rounded-full backdrop-blur-sm hover:bg-white transition-colors"
                data-tooltip-id="bookmark-tooltip"
                data-tooltip-content={
                  isBookmarked ? "Remove bookmark" : "Bookmark"
                }
              >
                {isBookmarked ? (
                  <FaBookmark className="text-yellow-500" />
                ) : (
                  <FaRegBookmark className="text-gray-500 hover:text-yellow-500" />
                )}
              </button>
              <Tooltip id="bookmark-tooltip" />
            </div>
          </div>
        )}

        <div className="p-5 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h2
              className="text-lg font-semibold text-gray-800 leading-tight cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => onEdit(id)}
            >
              {title}
            </h2>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaEllipsisV className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button
                    onClick={() => {
                      onShare(publication);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaShare className="w-3 h-3" /> Share
                  </button>
                  <button
                    onClick={() => {
                      onClone(id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaRegClone className="w-3 h-3" /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onEdit(id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete(id, title);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <FaTrashAlt className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">By: {author}</p>

          <div className="relative mb-4 flex-grow">
            <p
              className={`text-sm text-gray-700 ${
                isSummaryExpanded ? "" : "line-clamp-4"
              }`}
            >
              {summary}
            </p>
            {(summary?.length > 150 || isSummaryExpanded) && (
              <button
                onClick={() => onToggleSummary(id)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
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
                  className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
              {safeTags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{safeTags.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <FaFlask className="h-3.5 w-3.5" />
                <span>{area}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="h-3.5 w-3.5" />
                <span>{displayDate}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusClass}`}
              >
                {formattedStatus}
              </span>

              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FaBookOpen className="h-3 w-3" /> {views}
                </span>
                <span className="flex items-center gap-1">
                  <FaRegChartBar className="h-3 w-3" /> {citations}
                </span>
              </div>
            </div>
          </div>
        </div>

        {doi && (
          <div className="px-5 pb-3">
            <a
              href={`https://doi.org/${doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <FaExternalLinkAlt className="h-3 w-3" /> View DOI
            </a>
          </div>
        )}
      </motion.div>
    );
  }
);

export default function PublicationDashboard({ currentUser }) {
  // State management
  const [myPublications, setMyPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFullSummary, setShowFullSummary] = useState({});
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [deletingId, setDeletingId] = useState(null);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  const navigate = useNavigate();

  // Notification handler
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // Data fetching
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
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        setMyPublications(response.data.data || []);
        const initialSummaryState = (response.data.data || []).reduce(
          (acc, pub) => {
            acc[pub.id] = false;
            return acc;
          },
          {}
        );
        setShowFullSummary(initialSummaryState);
      } else {
        throw new Error(response.data?.message || "Invalid data structure");
      }
    } catch (error) {
      console.error("Error fetching publications:", error);
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to load publications";
      setApiError(errMsg);
      setMyPublications([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, statusFilter]);

  useEffect(() => {
    fetchMyPublications();
  }, [fetchMyPublications]);

  // Action handlers
  const handleDelete = useCallback(
    async (id, title) => {
      if (
        !window.confirm(`Delete "${title || "this publication"}" permanently?`)
      )
        return;

      setDeletingId(id);
      try {
        await axios.delete(`${API_BASE_URL}/api/publications/${id}`, {
          headers: getAuthHeaders(),
        });
        setMyPublications((prev) => prev.filter((p) => p.id !== id));
        setShowFullSummary((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        showNotification(`"${title || id}" deleted successfully`);
      } catch (error) {
        console.error("Error deleting publication:", error);
        const errMsg = error.response?.data?.message || "Delete failed";
        showNotification(errMsg, "error");
      } finally {
        setDeletingId(null);
      }
    },
    [showNotification]
  );

  const handleEdit = (publicationId) => {
    navigate(`/publications/edit/${publicationId}`);
  };

  const handleAddNew = () => {
    navigate("/publications/new");
  };

  const handleBookmark = async (id, bookmark) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/publications/${id}/bookmark`,
        { bookmark },
        { headers: getAuthHeaders() }
      );
      setMyPublications((prev) =>
        prev.map((pub) =>
          pub.id === id ? { ...pub, isBookmarked: bookmark } : pub
        )
      );
      showNotification(
        bookmark ? "Publication bookmarked" : "Bookmark removed",
        "success"
      );
    } catch (error) {
      console.error("Error updating bookmark:", error);
      showNotification("Failed to update bookmark", "error");
    }
  };

  const handleClone = async (id) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/publications/${id}/clone`,
        {},
        { headers: getAuthHeaders() }
      );
      if (response.data?.success) {
        const clonedPub = response.data.data;
        setMyPublications((prev) => [clonedPub, ...prev]);
        setShowFullSummary((prev) => ({ ...prev, [clonedPub.id]: false }));
        showNotification("Publication duplicated successfully", "success");
      }
    } catch (error) {
      console.error("Error cloning publication:", error);
      showNotification("Failed to duplicate publication", "error");
    }
  };

  const handleShare = (publication) => {
    setSelectedPublication(publication);
    setIsShareModalOpen(true);
  };

  // Search and filter handlers
  const debouncedSetSearchTerm = useCallback(debounce(setSearchTerm, 400), []);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchTerm(value);
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchTerm("");
  }, []);

  const handleSortChange = (selectedOption) => {
    setSortBy(selectedOption.value);
  };

  const handleStatusFilterChange = (selectedOption) => {
    setStatusFilter(selectedOption.value);
  };

  // Toggle handlers
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

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  };

  // Processed publications
  const processedPublications = useMemo(() => {
    if (!Array.isArray(myPublications)) return [];

    let filtered = [...myPublications];

    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => {
        const searchFields = [
          p?.title,
          p?.author,
          p?.summary,
          p?.area,
          ...(Array.isArray(p?.tags) ? p.tags : []),
        ];
        return searchFields.some(
          (field) => field && field.toLowerCase().includes(lower)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title_asc":
          return (a?.title ?? "").localeCompare(b?.title ?? "");
        case "title_desc":
          return (b?.title ?? "").localeCompare(a?.title ?? "");
        case "date_asc":
          return (
            new Date(a.publicationDate || a.createdAt).getTime() -
            new Date(b.publicationDate || b.createdAt).getTime()
          );
        case "most_viewed":
          return (b.views || 0) - (a.views || 0);
        case "most_cited":
          return (b.citations || 0) - (a.citations || 0);
        case "date_desc":
        default:
          return (
            new Date(b.publicationDate || b.createdAt).getTime() -
            new Date(a.publicationDate || a.createdAt).getTime()
          );
      }
    });

    return filtered;
  }, [myPublications, searchTerm, sortBy]);

  // Check if any summary is expanded
  const isAnySummaryExpanded = useMemo(() => {
    return Object.values(showFullSummary).some((isExpanded) => isExpanded);
  }, [showFullSummary]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Publications
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your research publications and collaborations
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={toggleViewMode}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              {viewMode === "grid" ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  List View
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Grid View
                </>
              )}
            </button>

            <button
              onClick={handleAddNew}
              className="px-4 py-1.5 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <FaPlus className="h-3.5 w-3.5" />
              New Publication
            </button>
          </div>
        </div>

        {/* Notification Area */}
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

        {/* Global API Error */}
        {apiError && !loading && (
          <ErrorMessage message={apiError} onClose={() => setApiError(null)} />
        )}

        {/* Controls Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search publications..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FaFilter className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <Select
              options={statusOptions}
              defaultValue={statusOptions[0]}
              onChange={handleStatusFilterChange}
              className="flex-grow text-sm"
              classNamePrefix="select"
              isSearchable={false}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <FaSortAmountDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <Select
              options={sortOptions}
              defaultValue={sortOptions[0]}
              onChange={handleSortChange}
              className="flex-grow text-sm"
              classNamePrefix="select"
              isSearchable={false}
            />
          </div>
        </div>

        {/* Summary Toggle Buttons */}
        {processedPublications.length > 0 && (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleToggleAllSummaries(true)}
              disabled={isAnySummaryExpanded}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FaExpandArrowsAlt className="h-3.5 w-3.5" />
              Expand All
            </button>
            <button
              onClick={() => handleToggleAllSummaries(false)}
              disabled={!isAnySummaryExpanded}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FaCompressArrowsAlt className="h-3.5 w-3.5" />
              Collapse All
            </button>
          </div>
        )}

        {/* Publication List Area */}
        <div className="space-y-6">
          {loading ? (
            <div
              className={`grid ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              } gap-6`}
            >
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse flex flex-col"
                >
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
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
                  <div className="pt-3 border-t border-gray-200 flex justify-end gap-3">
                    <div className="h-7 w-16 bg-gray-300 rounded-md"></div>
                    <div className="h-7 w-16 bg-gray-300 rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : processedPublications.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <FaInfoCircle className="mx-auto text-5xl text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm
                  ? "No matching publications"
                  : "No publications yet"}
              </p>
              {searchTerm ? (
                <p className="text-sm text-gray-500 mb-6">
                  Try adjusting your search or filters
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-6">
                    Get started by adding your first publication
                  </p>
                  <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <FaPlus className="h-3.5 w-3.5" />
                    Create Publication
                  </button>
                </>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {processedPublications.map((publication) => (
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
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {processedPublications.map((publication) => {
                  const isSummaryExpanded =
                    showFullSummary[publication.id] || false;
                  return (
                    <motion.div
                      key={publication.id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 p-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      layout
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {publication.thumbnail && (
                          <div className="w-full md:w-40 h-40 bg-gray-100 overflow-hidden rounded-lg flex-shrink-0">
                            <img
                              src={publication.thumbnail}
                              alt={publication.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <h2
                              className="text-lg font-semibold text-gray-800 mb-1 leading-tight cursor-pointer hover:text-blue-600"
                              onClick={() => handleEdit(publication.id)}
                            >
                              {publication.title}
                            </h2>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleBookmark(
                                    publication.id,
                                    !publication.isBookmarked
                                  )
                                }
                                className="text-gray-400 hover:text-yellow-500"
                              >
                                {publication.isBookmarked ? (
                                  <FaBookmark className="text-yellow-500" />
                                ) : (
                                  <FaRegBookmark />
                                )}
                              </button>
                              <button
                                onClick={() => handleShare(publication)}
                                className="text-gray-400 hover:text-blue-500"
                              >
                                <FaShare />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(
                                    publication.id,
                                    publication.title
                                  )
                                }
                                className="text-gray-400 hover:text-red-500"
                                disabled={deletingId === publication.id}
                              >
                                {deletingId === publication.id ? (
                                  <LoadingSpinner size="xs" />
                                ) : (
                                  <FaTrashAlt />
                                )}
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-gray-500 mb-2">
                            By: {publication.author}
                          </p>

                          <div className="mb-3">
                            <p
                              className={`text-sm text-gray-700 ${
                                isSummaryExpanded ? "" : "line-clamp-3"
                              }`}
                            >
                              {publication.summary}
                            </p>
                            {(publication.summary?.length > 150 ||
                              isSummaryExpanded) && (
                              <button
                                onClick={() =>
                                  handleToggleSummary(publication.id)
                                }
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block"
                              >
                                {isSummaryExpanded ? "Show less" : "Show more"}
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {publication.tags?.slice(0, 5).map((tag, index) => (
                              <span
                                key={`${tag}-${index}`}
                                className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-3">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <FaFlask className="h-3 w-3" />{" "}
                                {publication.area}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaCalendarAlt className="h-3 w-3" />{" "}
                                {formatDate(
                                  publication.publicationDate ||
                                    publication.createdAt
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2.5 py-1 rounded-full border ${getStatusBadgeClass(
                                  publication.collaborationStatus
                                )}`}
                              >
                                {formatStatusText(
                                  publication.collaborationStatus
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaBookOpen className="h-3 w-3" />{" "}
                                {publication.views || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaRegChartBar className="h-3 w-3" />{" "}
                                {publication.citations || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && selectedPublication && (
        <ShareModal
          item={selectedPublication}
          itemType="publication"
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}
