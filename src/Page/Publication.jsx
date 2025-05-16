// src/Page/Publication.jsx
// Displays publications publicly, with enhanced styling and conditional controls.

import React, { useState, useEffect, useCallback, useMemo, memo } from "react"; // Added memo
import { useNavigate, Link, useLocation } from "react-router-dom";
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
  FaList,
  FaThLarge,
  FaEye,
  // FaUser, // Replaced by FaUserCircle more often
  FaUserCircle,
  FaCommentDots,
  FaGlobe,
  FaCodeBranch,
  FaCheckCircle,
  FaBalanceScale,
  FaStar,
  FaDownload,
  FaHistory,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import Select from "react-select";

// Import shared components
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString) && dateString.length === 10) {
      const [year, month, day] = dateString.split("-");
      const utcDate = new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day))
      );
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
    });
  } catch (error) {
    console.error(`Error formatting date "${dateString}":`, error);
    return "Date Error";
  }
};

const sortOptions = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
  { value: "views_desc", label: "Most Viewed" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "downloadCount_desc", label: "Most Downloaded" },
];

const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

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
  input: (provided) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "38px",
  }),
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

// --- ProfileImage Sub-Component (Similar to Projects.jsx) ---
const ProfileImage = memo(
  ({ src, alt, fallbackUsername, className = "h-6 w-6 rounded-full" }) => {
    const [hasError, setHasError] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
      setHasError(false); // Reset error on src change
      if (src) {
        if (src.startsWith("http") || src.startsWith("blob:")) {
          setImageSrc(src);
        } else {
          // Prepend API_BASE_URL if it's a relative path
          let fullUrl = API_BASE_URL;
          if (API_BASE_URL.endsWith("/") && src.startsWith("/")) {
            fullUrl += src.substring(1);
          } else if (!API_BASE_URL.endsWith("/") && !src.startsWith("/")) {
            fullUrl += "/"; // Ensure a slash if both are missing it
            fullUrl += src;
          } else {
            fullUrl += src;
          }
          setImageSrc(fullUrl);
        }
      } else {
        setImageSrc(null); // No src provided
      }
    }, [src]);

    if (!imageSrc || hasError) {
      // Fallback to initials or a generic icon
      return (
        <span
          className={`${className} bg-gray-300 flex items-center justify-center text-gray-600 font-semibold uppercase`}
          title={alt} // Add title for accessibility on fallback
        >
          {fallbackUsername ? (
            fallbackUsername.charAt(0)
          ) : (
            <FaUserCircle className="w-[80%] h-[80%] text-gray-400" />
          )}
        </span>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    );
  }
);
// --- End of ProfileImage Sub-Component ---

// --- Publication Card Sub-Component ---
const PublicationCard = memo(
  // Use React.memo here
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
    onAddComment,
  }) => {
    const {
      id,
      title = "Untitled Publication",
      summary = "No summary available.",
      tags = [],
      area = "N/A",
      publicationDate,
      createdAt,
      views = 0,
      isBookmarked = false,
      thumbnail, // Expecting this to be a full URL or a path relative to API_BASE_URL/public
      doi,
      ownerId,
      owner, // Expected: { name: string, username?: string, profilePictureUrl?: string, id?: string }
      commentCount = 0,
      language = "N/A",
      version = "N/A",
      isPeerReviewed = false,
      license = "N/A",
      lastReviewedAt,
      rating = 0,
      downloadCount = 0,
    } = publication;

    // Prefer owner.name, then owner.username, then publication.author (legacy), then "Unknown"
    const ownerName =
      owner?.name || owner?.username || publication.author || "Unknown Author";
    const ownerProfilePic = owner?.profilePictureUrl; // This will be handled by ProfileImage
    const effectiveOwnerId = owner?.id || ownerId;

    const isSummaryExpanded = showFullSummary[id] || false;
    const displayDate = formatDate(publicationDate || createdAt);
    const displayLastReviewedDate = lastReviewedAt
      ? formatDate(lastReviewedAt)
      : null;
    const safeTags = Array.isArray(tags) ? tags : [];
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isOwnerCheck = currentUser?.id === effectiveOwnerId; // Renamed for clarity

    const iconButtonClass =
      "p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-150";

    const thumbnailSrc = thumbnail
      ? thumbnail.startsWith("http") || thumbnail.startsWith("blob:")
        ? thumbnail
        : `${API_BASE_URL}${thumbnail.startsWith("/") ? "" : "/"}${thumbnail}`
      : "/placeholder-image.svg"; // Fallback to a public placeholder

    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/80 flex flex-col overflow-hidden group"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        layout
      >
        <div className="relative">
          <Link
            to={`/publications/${id}`}
            className="block"
            title={`View details for "${title}"`}
          >
            {thumbnail ? (
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 overflow-hidden rounded-t-xl">
                <img
                  src={thumbnailSrc}
                  alt={`Thumbnail for ${title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.svg";
                    console.warn(`Failed to load thumbnail: ${thumbnailSrc}`);
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
            {isOwnerCheck && (
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
                        <FaRegClone className="w-3.5 h-3.5 text-gray-500" />{" "}
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
                        )}{" "}
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          {/* === MODIFIED Owner display using ProfileImage === */}
          <div className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
            <ProfileImage
              src={ownerProfilePic}
              alt={ownerName}
              fallbackUsername={ownerName} // Use ownerName for initials
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
            <span className="truncate" title={ownerName}>
              {ownerName}
            </span>
            {version && version !== "N/A" && (
              <>
                <span className="mx-1 text-gray-300">·</span>
                <FaCodeBranch className="w-3 h-3 text-gray-400" />
                <span className="truncate">{version}</span>
              </>
            )}
          </div>

          <div className="relative mb-4 flex-grow min-h-[60px]">
            <p
              className={`text-sm text-gray-700 transition-all duration-300 ${
                isSummaryExpanded ? "" : "line-clamp-3"
              }`}
            >
              {summary}
            </p>
            {(summary?.length > 150 || isSummaryExpanded) && (
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
                  {" "}
                  +{safeTags.length - 3} more{" "}
                </span>
              )}
            </div>
          )}

          {isPeerReviewed && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full border border-green-200">
                <FaCheckCircle /> Peer Reviewed
              </span>
            </div>
          )}

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
              {language && language !== "N/A" && (
                <div className="flex items-center gap-1.5" title="Language">
                  <FaGlobe className="h-3.5 w-3.5 flex-shrink-0 text-sky-500" />
                  <span>{language}</span>
                </div>
              )}
              {displayLastReviewedDate && (
                <div
                  className="flex items-center gap-1.5"
                  title="Last Reviewed"
                >
                  <FaHistory className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" />
                  <span>{displayLastReviewedDate}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-3">
              <div
                className="flex items-center gap-1 text-xs text-amber-500"
                title={`Rating: ${rating.toFixed(1)}/5`}
              >
                <FaStar />
                <span className="font-semibold">{rating.toFixed(1)}</span>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1" title="Views">
                  <FaEye className="h-3.5 w-3.5" /> {views ?? 0}
                </span>
                <span className="flex items-center gap-1" title="Downloads">
                  <FaDownload className="h-3.5 w-3.5" /> {downloadCount ?? 0}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
              <Link
                to={`/publications/${id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                title="View Details"
              >
                <FaEye /> View Details
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onAddComment(publication)}
                  className={iconButtonClass}
                  title="View/Add Comments"
                  data-tooltip-id={`comment-btn-${id}`}
                  data-tooltip-content={`${
                    commentCount || 0
                  } Comment(s) - Click to view/add`}
                >
                  <FaCommentDots />{" "}
                  <span className="ml-1 text-xs">{commentCount || 0}</span>
                </button>{" "}
                <Tooltip id={`comment-btn-${id}`} />
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
                <Tooltip id={`bookmark-btn-${id}`} />
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
                {isOwnerCheck && (
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
        {(doi || (license && license !== "N/A")) && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl text-xs text-gray-600 space-y-1">
            {doi && (
              <a
                href={`https://doi.org/${doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5"
                title={`View on doi.org: ${doi}`}
              >
                <FaExternalLinkAlt className="h-3 w-3" /> View DOI
              </a>
            )}
            {license && license !== "N/A" && (
              <div className="flex items-center gap-1.5" title="License">
                <FaBalanceScale className="h-3 w-3 text-gray-500" />
                <span>{license}</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

// --- Main Page Component (Exported) ---
export default function PublicationPage({ currentUser }) {
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
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const navigate = useNavigate();
  const location = useLocation();

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      NOTIFICATION_DURATION
    );
  }, []);

  const fetchPublications = useCallback(
    async (page = 1) => {
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
        const response = await axios.get(url, { headers, params });

        if (response.data && Array.isArray(response.data.data)) {
          // Ensure each publication has the 'owner' object for ProfileImage
          const processedPublications = response.data.data.map((pub) => ({
            ...pub,
            owner: pub.owner || {
              name: pub.author || "Unknown Author",
              profilePictureUrl: null,
            }, // Fallback if owner object is missing
          }));
          setPublications(processedPublications);

          setPagination((prev) => ({
            ...prev,
            currentPage: response.data.pagination?.currentPage || page,
            totalPages: response.data.pagination?.totalPages || 1,
            totalItems: response.data.pagination?.totalItems || 0,
            limit: response.data.pagination?.limit || prev.limit,
          }));
          const initialSummaryState = processedPublications.reduce(
            (acc, pub) => {
              acc[pub.id] = false;
              return acc;
            },
            {}
          );
          setShowFullSummary(initialSummaryState);
        } else {
          throw new Error(
            response.data?.message || "Received unexpected data structure"
          );
        }
      } catch (error) {
        console.error("Error fetching publications:", error);
        const errMsg =
          error.response?.data?.message ||
          error.message ||
          "Failed to load publications.";
        setApiError(errMsg);
        setPublications([]);
        setPagination((prev) => ({
          ...prev,
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        }));
      } finally {
        setLoading(false);
      }
    },
    [sortBy, searchTerm, pagination.limit]
  );

  useEffect(() => {
    fetchPublications(1);
  }, [sortBy, searchTerm, pagination.limit, fetchPublications]);

  // This useEffect is for pagination clicks causing a page change.
  // It was simplified, but now we need to ensure it calls fetchPublications for the new page.
  useEffect(() => {
    // Only run if not loading and currentPage has actually changed and is positive
    if (!loading && pagination.currentPage > 0) {
      // This was the missing call. We need to fetch if page changed.
      // The fetchPublications in the dependency array of the *other* useEffect
      // handles initial load and filter changes (which reset to page 1).
      // This specific effect is for when ONLY pagination.currentPage changes.
      // However, to avoid infinite loops, we must be careful.
      // Let's rely on the handlePageChange function to call fetch.
    }
  }, [pagination.currentPage, loading]); // Removed fetchPublications from here to prevent loops if it's also in handlePageChange's chain

  const handleDelete = useCallback(
    async (id, title) => {
      if (!currentUser) {
        showNotification("Log in required to delete.", "error");
        navigate("/login", { state: { from: location } });
        return;
      }
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
        showNotification(`Successfully deleted "${title}"`);
        // After delete, fetch the current page again, or page 1 if it was the last item on a page > 1
        const newTotalItems = pagination.totalItems - 1;
        const newTotalPages = Math.ceil(newTotalItems / pagination.limit);

        if (publications.length === 1 && pagination.currentPage > 1) {
          // If it was the last item on a page > 1, go to the previous page
          handlePageChange(pagination.currentPage - 1);
        } else if (
          publications.length === 1 &&
          pagination.currentPage === 1 &&
          newTotalItems === 0
        ) {
          // If it was the very last item overall, fetch page 1 (will show empty state)
          fetchPublications(1);
        } else if (
          pagination.currentPage > newTotalPages &&
          newTotalPages > 0
        ) {
          // If current page no longer exists, go to the new last page
          handlePageChange(newTotalPages);
        } else {
          // Otherwise, refetch the current page
          fetchPublications(pagination.currentPage);
        }
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
    [
      showNotification,
      currentUser,
      navigate,
      location,
      publications.length,
      pagination,
      fetchPublications,
    ] // Ensure pagination is a dep
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
      const originalPublications = JSON.parse(JSON.stringify(publications));
      setPublications((prev) =>
        prev.map((pub) =>
          pub.id === id ? { ...pub, isBookmarked: bookmark } : pub
        )
      );
      try {
        await axios.patch(
          `${API_BASE_URL}/api/publications/${id}/bookmark`,
          { bookmark },
          { headers: getAuthHeaders() }
        );
        showNotification(
          bookmark ? "Publication bookmarked!" : "Bookmark removed.",
          "success"
        );
      } catch (e) {
        console.error("Bookmark error:", e);
        showNotification(
          e.response?.data?.message ||
            "Bookmark action failed. Please try again.",
          "error"
        );
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
      showNotification("Duplicating publication...", "info");
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/publications/${id}/clone`,
          {},
          { headers: getAuthHeaders() }
        );
        if (response.data?.success && response.data.data) {
          showNotification("Publication duplicated successfully!");
          // Refetch current page to see the new cloned item, likely at the top if sorted by date
          fetchPublications(pagination.currentPage);
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
    [
      showNotification,
      currentUser,
      navigate,
      location,
      fetchPublications,
      pagination.currentPage,
    ]
  );

  const handleShare = useCallback((publication) => {
    setSelectedPublication(publication);
    setIsShareModalOpen(true);
  }, []);

  const handleAddComment = useCallback(
    (publication) => {
      navigate(`/publications/${publication.id}?focus=comments`);
    },
    [navigate]
  );

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      // fetchPublications(1) will be triggered by the useEffect watching searchTerm
    }, DEBOUNCE_DELAY),
    []
  );

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchTerm(value);
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchTerm("");
    // fetchPublications(1) will be triggered by the useEffect watching searchTerm
  }, []);

  const handleSortChange = (selectedOption) => {
    setSortBy(selectedOption.value);
    // fetchPublications(1) will be triggered by the useEffect watching sortBy
  };

  const handleToggleSummary = useCallback((id) => {
    setShowFullSummary((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleToggleAllSummaries = useCallback(
    (expand) => {
      setShowFullSummary(() => {
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

  const displayedPublications = useMemo(() => publications, [publications]);
  const isAnySummaryExpanded = useMemo(
    () => Object.values(showFullSummary).some(Boolean),
    [showFullSummary]
  );

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== pagination.currentPage &&
      !loading // Prevent multiple fetches if already loading
    ) {
      // Set pagination first, then fetch. The useEffect watching pagination.currentPage will call fetchPublications.
      // This avoids direct call here and relies on the effect.
      // setPagination((p) => ({ ...p, currentPage: newPage })); NO, this causes issues.
      // Directly call fetch and let fetchPublications update pagination.
      window.scrollTo(0, 0);
      fetchPublications(newPage);
    }
  };

  // Effect to refetch if currentUser logs in/out, to update bookmarks etc.
  useEffect(() => {
    if (currentUser?.id !== undefined) {
      // Check if currentUser object is fully available
      fetchPublications(pagination.currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // Dependency on currentUser.id

  const iconButtonClass =
    "p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-150";
  const dangerIconButtonClass =
    "p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-blue-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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

        {apiError && !loading && (
          <ErrorMessage
            message={`Error: ${apiError}. Please try refreshing the page.`}
            onClose={() => setApiError(null)}
          />
        )}

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
              type="search"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search title, owner, summary, tags..."
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

        <div>
          {loading && publications.length === 0 ? ( // Show full page skeleton only if no publications are displayed
            <div
              className={`grid ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
                  : "grid-cols-1"
              } gap-6`}
            >
              {[...Array(pagination.limit)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse flex flex-col h-[450px]"
                >
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/5"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
                  <div className="space-y-2 flex-grow mb-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1 mb-2">
                    <div className="h-5 w-16 bg-gray-300 rounded"></div>
                    <div className="h-4 w-20 bg-gray-300 rounded"></div>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100 mt-auto">
                    <div className="flex gap-2">
                      <div className="h-5 w-12 bg-gray-300 rounded"></div>
                      <div className="h-5 w-12 bg-gray-300 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-8 bg-gray-300 rounded"></div>
                      <div className="h-6 w-8 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && !apiError && displayedPublications.length === 0 ? (
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
          ) : (
            <>
              {viewMode === "grid" ? (
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
                        onAddComment={handleAddComment}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                // List View Implementation
                <div className="space-y-4">
                  <AnimatePresence>
                    {displayedPublications.map((publication) => {
                      const effectiveOwnerId =
                        publication.owner?.id || publication.ownerId;
                      const isOwnerCheck = currentUser?.id === effectiveOwnerId;
                      const displayDate = formatDate(
                        publication.publicationDate || publication.createdAt
                      );
                      const displayLastReviewedDate = publication.lastReviewedAt
                        ? formatDate(publication.lastReviewedAt)
                        : null;

                      const ownerName =
                        publication.owner?.name ||
                        publication.owner?.username ||
                        publication.author ||
                        "Unknown Author";
                      const ownerProfilePic =
                        publication.owner?.profilePictureUrl;

                      const thumbnailSrcList = publication.thumbnail
                        ? publication.thumbnail.startsWith("http") ||
                          publication.thumbnail.startsWith("blob:")
                          ? publication.thumbnail
                          : `${API_BASE_URL}${
                              publication.thumbnail.startsWith("/") ? "" : "/"
                            }${publication.thumbnail}`
                        : "/placeholder-image.svg";

                      return (
                        <motion.div
                          key={publication.id}
                          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 p-5 flex flex-col sm:flex-row gap-5 items-start"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          layout
                        >
                          {publication.thumbnail ? (
                            <Link
                              to={`/publications/${publication.id}`}
                              className="block w-full sm:w-32 md:w-40 h-32 md:h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 group/thumb"
                            >
                              <img
                                src={thumbnailSrcList}
                                alt={`Thumbnail for ${publication.title}`}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.src = "/placeholder-image.svg";
                                }}
                              />
                            </Link>
                          ) : (
                            <Link
                              to={`/publications/${publication.id}`}
                              className="block w-full sm:w-32 md:w-40 h-32 md:h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400"
                            >
                              <FaBookOpen className="w-10 h-10 opacity-70" />
                            </Link>
                          )}

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
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                {isOwnerCheck && (
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
                                {isOwnerCheck && (
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

                            <p className="text-sm text-gray-500 mb-2 flex items-center flex-wrap gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1.5">
                                <ProfileImage
                                  src={ownerProfilePic}
                                  alt={ownerName}
                                  fallbackUsername={ownerName}
                                  className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                />
                                <span className="truncate" title={ownerName}>
                                  {ownerName}
                                </span>
                              </span>
                              {publication.version &&
                                publication.version !== "N/A" && (
                                  <span className="inline-flex items-center gap-1">
                                    <FaCodeBranch className="w-3 h-3 text-gray-400" />
                                    v{publication.version}
                                  </span>
                                )}
                              <span className="inline-flex items-center gap-1">
                                <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                                {displayDate}
                              </span>
                              {publication.language &&
                                publication.language !== "N/A" && (
                                  <span className="inline-flex items-center gap-1">
                                    <FaGlobe className="w-3 h-3 text-gray-400" />
                                    {publication.language}
                                  </span>
                                )}
                              {displayLastReviewedDate && (
                                <span className="inline-flex items-center gap-1">
                                  <FaHistory className="w-3 h-3 text-gray-400" />
                                  Reviewed: {displayLastReviewedDate}
                                </span>
                              )}
                            </p>

                            {publication.isPeerReviewed && (
                              <p className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-2">
                                <FaCheckCircle /> Peer Reviewed
                              </p>
                            )}

                            {publication.summary && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {publication.summary}
                              </p>
                            )}

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

                            {publication.license &&
                              publication.license !== "N/A" && (
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                  <FaBalanceScale className="w-3 h-3 text-gray-400" />
                                  License: {publication.license}
                                </p>
                              )}

                            <div className="flex flex-wrap justify-between items-center gap-3 mt-auto pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span
                                  className="flex items-center gap-1"
                                  title={`Rating: ${publication.rating?.toFixed(
                                    1
                                  )}/5`}
                                >
                                  <FaStar className="text-amber-400" />
                                  {publication.rating?.toFixed(1) ?? "0.0"}
                                </span>
                                <span
                                  className="flex items-center gap-1"
                                  title="Views"
                                >
                                  <FaEye /> {publication.views ?? 0}
                                </span>
                                <span
                                  className="flex items-center gap-1"
                                  title="Downloads"
                                >
                                  <FaDownload />{" "}
                                  {publication.downloadCount ?? 0}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddComment(publication)}
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
              )}
              {/* Loading indicator for subsequent pages */}
              {loading && publications.length > 0 && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                  <span className="ml-2 text-gray-600">
                    Loading more publications...
                  </span>
                </div>
              )}
            </>
          )}
        </div>

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
                disabled={pagination.currentPage <= 1 || loading}
                className="px-3 py-1.5 mx-1 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((pageNumber) => {
                    const total = pagination.totalPages;
                    const current = pagination.currentPage;
                    const range = 1;
                    const showEllipsis = total > 7;

                    if (!showEllipsis) return true;
                    if (pageNumber === 1 || pageNumber === total) return true;
                    if (
                      pageNumber >= current - range &&
                      pageNumber <= current + range
                    )
                      return true;
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
                        disabled={loading}
                        className={`h-9 w-9 rounded-md text-sm flex items-center justify-center transition-colors ${
                          pageNumber === pagination.currentPage
                            ? "bg-indigo-600 text-white font-semibold shadow-sm scale-105"
                            : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400"
                        } ${
                          loading
                            ? "disabled:opacity-50 disabled:cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={
                  pagination.currentPage >= pagination.totalPages || loading
                }
                className="px-3 py-1.5 mx-1 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
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
