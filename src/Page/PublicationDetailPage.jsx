// src/Page/PublicationDetailPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react"; // Added useRef
import {
  useParams,
  Link,
  useNavigate,
  useLocation, // Added useLocation
} from "react-router-dom";
import axios from "axios";
import {
  FaFlask,
  FaCalendarAlt,
  FaTags,
  FaUser,
  FaLink,
  FaExternalLinkAlt,
  FaEdit,
  FaTrashAlt,
  FaArrowLeft,
  FaBookOpen,
  FaRegBookmark,
  FaBookmark,
  FaShare,
  FaCommentDots, // Added Comments icon
} from "react-icons/fa";
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
import ShareModal from "../Component/Common/ShareModal";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";

// Config & Helpers (Keep as is)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const formatDate = (dateString) => {
  // Keep formatDate function as is
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
const formatStatusText = (status) => {
  // Keep formatStatusText as is
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};
const getStatusBadgeClass = (status) => {
  // Keep getStatusBadgeClass as is
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

// --- Placeholder Comment Components (Define or Import) ---
// It's better to put these in separate files and import them

const CommentItem = ({ comment }) => (
  <li className="py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-start space-x-3">
      <img
        src={comment.author?.profilePictureUrl || "/default-avatar.png"} // Provide a default avatar path
        alt={comment.author?.username}
        className="h-8 w-8 rounded-full bg-gray-200 object-cover flex-shrink-0"
        onError={(e) => {
          e.target.src = "/default-avatar.png";
        }} // Handle image load error
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800">
          {comment.author?.username || "Unknown User"}
          <span className="ml-2 text-xs font-normal text-gray-500">
            ({new Date(comment.createdAt).toLocaleString()})
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
          {comment.content}
        </p>
        {/* Add delete/edit buttons here if implementing */}
      </div>
    </div>
  </li>
);

const CommentList = ({ comments }) => (
  <ul className="space-y-2">
    {comments.map((comment) => (
      <CommentItem key={comment.id} comment={comment} />
    ))}
  </ul>
);

const CommentForm = ({ onSubmit, isSubmitting, currentUser }) => {
  const [content, setContent] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate("/login", { state: { from: location } }); // Redirect if somehow submitted while logged out
      return;
    }
    if (content.trim()) {
      onSubmit(content.trim());
      setContent(""); // Clear form after submit attempt
    }
  };

  if (!currentUser) {
    return (
      <p className="text-sm text-gray-600 bg-gray-100 p-4 rounded-md border">
        Please{" "}
        <Link
          to="/login"
          state={{ from: location }}
          className="text-indigo-600 hover:underline font-medium"
        >
          log in
        </Link>{" "}
        to post a comment.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment here..."
        rows="3"
        required
        disabled={isSubmitting}
        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-70 disabled:bg-gray-100"
        maxLength={2000} // Example max length
      />
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
};

// --- Main Detail Page Component ---
const PublicationDetailPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Hook to check query params
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // --- ** NEW Comment State ** ---
  const [comments, setComments] = useState([]);
  const [commentError, setCommentError] = useState(null);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPagination, setCommentPagination] = useState(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const commentsSectionRef = useRef(null); // Ref for scrolling

  console.log(
    `--- PublicationDetailPage Rendering --- ID: ${id}, Current User ID: ${currentUser?.id}`
  );

  // Notification Handler (Keep as is)
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // Fetch Publication Data
  const fetchPublicationDetails = useCallback(async () => {
    // Keep existing fetchPublicationDetails logic
    console.log(`Fetching publication details for ID: ${id}`);
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/publications/${id}`;
      const response = await axios.get(url, { headers: getAuthHeaders() });
      if (response.data?.success && response.data.data) {
        console.log("Publication data fetched:", response.data.data);
        setPublication(response.data.data);
        setIsBookmarked(response.data.data.isBookmarked || false);
      } else {
        // Handle errors as before...
        if (
          response.status === 404 ||
          response.data?.message?.toLowerCase().includes("not found")
        ) {
          throw new Error("Publication not found.");
        } else {
          throw new Error(
            response.data?.message || "Failed to load publication data."
          );
        }
      }
    } catch (err) {
      const errMsg =
        err.response?.status === 404
          ? "Publication not found."
          : err.response?.data?.message ||
            err.message ||
            "Could not load publication data.";
      setError(errMsg);
      setPublication(null);
    } finally {
      setLoading(false); // Set main loading false here
    }
  }, [id]);

  // --- ** NEW Fetch Comments Function ** ---
  const fetchComments = useCallback(
    async (page = 1, loadMore = false) => {
      if (!id) return;
      console.log(`Fetching comments for ID: ${id}, Page: ${page}`);
      setLoadingComments(true);
      setCommentError(null);
      try {
        const url = `${API_BASE_URL}/api/publications/${id}/comments?page=${page}&limit=15`; // Adjust limit if needed
        const response = await axios.get(url); // Comments are usually public to fetch

        if (response.data?.success) {
          console.log("Comments data fetched:", response.data);
          setComments((prev) =>
            loadMore ? [...prev, ...response.data.data] : response.data.data
          );
          setCommentPagination(response.data.pagination);
          setCommentPage(response.data.pagination.currentPage);
        } else {
          throw new Error(response.data?.message || "Failed to load comments");
        }
      } catch (err) {
        console.error("Fetch comments error:", err);
        setCommentError(
          err.response?.data?.message ||
            err.message ||
            "Could not load comments."
        );
      } finally {
        setLoadingComments(false);
      }
    },
    [id]
  );

  // Initial Data Fetch Effect
  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      fetchPublicationDetails();
      fetchComments(1); // Fetch initial comments
    } else {
      setError("Invalid Publication ID specified.");
      setLoading(false);
      setLoadingComments(false);
    }
  }, [id, fetchPublicationDetails, fetchComments]); // Add fetchComments dependency

  // --- ** NEW Effect for Scrolling to Comments ** ---
  useEffect(() => {
    // Check after main loading is done and ref is available
    if (!loading && location.search.includes("focus=comments")) {
      console.log("Focus=comments detected, attempting to scroll.");
      // Timeout ensures the element is rendered after data load
      const timer = setTimeout(() => {
        if (commentsSectionRef.current) {
          console.log("Scrolling to comments section...");
          commentsSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start", // Scrolls the top of the element to the top of the viewport
          });
          // Optional: Remove focus=comments from URL without reloading
          // navigate(location.pathname, { replace: true });
        } else {
          console.warn("Comments section ref not found for scrolling.");
        }
      }, 100); // Small delay
      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [location.search, loading, navigate]); // Depend on location search and loading state

  // --- ** NEW Handler to Add Comment ** ---
  const handleAddComment = useCallback(
    async (commentContent) => {
      if (!currentUser) {
        showNotification("Please log in to comment.", "info");
        navigate("/login", { state: { from: location } });
        return;
      }
      if (!commentContent) return; // Should be caught by form validation

      console.log("Attempting to post comment:", commentContent);
      setIsPostingComment(true);
      setCommentError(null); // Clear previous comment errors
      try {
        const url = `${API_BASE_URL}/api/publications/${id}/comments`;
        const response = await axios.post(
          url,
          { content: commentContent },
          { headers: getAuthHeaders() } // Send auth token
        );

        if (response.data?.success && response.data.data) {
          console.log("Comment posted successfully:", response.data.data);
          // Add the new comment to the beginning of the list
          setComments((prev) => [response.data.data, ...prev]);
          // Update total comment count in pagination locally (optional but nice)
          setCommentPagination((prev) =>
            prev ? { ...prev, totalItems: prev.totalItems + 1 } : null
          );
          // Update publication's comment count if displayed (refetching is another option)
          setPublication((prev) =>
            prev
              ? { ...prev, commentCount: (prev.commentCount || 0) + 1 }
              : null
          );
          showNotification("Comment posted!", "success");
        } else {
          throw new Error(response.data?.message || "Failed to post comment");
        }
      } catch (err) {
        console.error("Post comment error:", err);
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Could not post comment.";
        setCommentError(errMsg); // Show error near comment section
        showNotification("Failed to post comment.", "error");
      } finally {
        setIsPostingComment(false);
      }
    },
    [id, currentUser, showNotification, navigate, location]
  );

  // --- ** NEW Handler to Load More Comments ** ---
  const loadMoreComments = () => {
    if (
      commentPagination &&
      commentPagination.currentPage < commentPagination.totalPages &&
      !loadingComments
    ) {
      fetchComments(commentPage + 1, true); // Pass true for loadMore
    }
  };

  // --- Action Handlers (Edit, Delete, Bookmark, Share - Keep as is) ---
  const handleEditRedirect = useCallback(() => {
    if (currentUser?.id === publication?.ownerId) {
      navigate(`/publications/edit/${id}`);
    } else {
      showNotification("Permission denied.", "error");
    }
  }, [currentUser, publication, id, navigate, showNotification]);

  const handleDeleteConfirm = useCallback(async () => {
    if (currentUser?.id !== publication?.ownerId) {
      showNotification("Permission denied.", "error");
      return;
    }
    if (
      window.confirm(`Delete "${publication?.title || "this publication"}"?`)
    ) {
      try {
        await axios.delete(`${API_BASE_URL}/api/publications/${id}`, {
          headers: getAuthHeaders(),
        });
        showNotification("Deleted.", "success");
        navigate("/publications", { replace: true });
      } catch (err) {
        showNotification(
          err.response?.data?.message || "Delete failed.",
          "error"
        );
        console.error("Delete Error:", err);
      }
    }
  }, [currentUser, publication, id, navigate, showNotification]);

  const handleBookmarkToggle = useCallback(async () => {
    if (!currentUser) {
      showNotification("Please log in to bookmark.", "info");
      return;
    }
    if (!publication) return;
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState); // Optimistic UI update
    try {
      await axios.patch(
        `${API_BASE_URL}/api/publications/${id}/bookmark`,
        { bookmark: newBookmarkState },
        { headers: getAuthHeaders() }
      );
      showNotification(
        newBookmarkState ? "Bookmarked" : "Bookmark removed",
        "info"
      );
    } catch (error) {
      setIsBookmarked(!newBookmarkState); // Revert on error
      showNotification(
        error.response?.data?.message || "Bookmark failed",
        "error"
      );
    }
  }, [currentUser, publication, id, isBookmarked, showNotification]);

  const handleShare = useCallback(() => {
    if (publication) {
      setIsShareModalOpen(true);
    }
  }, [publication]);

  // --- Render Logic ---
  if (loading) {
    // Initial page loading state
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error) {
    // Error loading main publication data
    return (
      <div className="container mx-auto p-8">
        <button
          onClick={() => navigate("/publications")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-700 font-medium mb-4"
        >
          <FaArrowLeft /> Back
        </button>
        <ErrorMessage title="Error Loading Publication" message={error} />
      </div>
    );
  }

  if (!publication) {
    // Publication specifically not found after loading attempt
    return (
      <div className="container mx-auto p-8 text-center">
        <button
          onClick={() => navigate("/publications")}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-700 font-medium mb-4 mx-auto"
        >
          <FaArrowLeft /> Back
        </button>
        <p className="text-xl text-gray-500">Publication could not be found.</p>
      </div>
    );
  }

  // If publication loaded, proceed to render
  const isOwner = currentUser?.id === publication.ownerId;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Notification Area */}
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

        {/* Back Button */}
        <div className="mb-6">
          {" "}
          <button
            onClick={() => navigate("/publications")}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-700 font-medium transition-colors rounded-md px-3 py-1 hover:bg-gray-100"
          >
            {" "}
            <FaArrowLeft /> Back to Publications{" "}
          </button>{" "}
        </div>

        {/* Main Publication Article */}
        <article className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header Image */}
          {publication.thumbnail && (
            <div className="h-56 md:h-72 bg-gray-200">
              {" "}
              <img
                src={publication.thumbnail}
                alt={`Header for ${publication.title}`}
                className="w-full h-full object-cover"
              />{" "}
            </div>
          )}
          <div className="p-6 md:p-8 lg:p-10">
            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              {" "}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                {publication.title}
              </h1>{" "}
              <span
                className={`mt-1 text-sm font-semibold px-3 py-1 rounded-full border whitespace-nowrap ${getStatusBadgeClass(
                  publication.collaborationStatus
                )}`}
              >
                {" "}
                {formatStatusText(publication.collaborationStatus)}{" "}
              </span>{" "}
            </div>
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
              {" "}
              <div className="flex items-center gap-1.5" title="Author(s)">
                {" "}
                <FaUser className="text-gray-400" />{" "}
                <span className="hover:text-indigo-600 cursor-pointer">
                  {publication.author}
                </span>{" "}
              </div>{" "}
              <div
                className="flex items-center gap-1.5"
                title="Publication Date"
              >
                {" "}
                <FaCalendarAlt className="text-gray-400" />{" "}
                {formatDate(
                  publication.publicationDate || publication.createdAt
                )}{" "}
              </div>{" "}
              <div className="flex items-center gap-1.5" title="Research Area">
                {" "}
                <FaFlask className="text-gray-400" />{" "}
                {publication.area || "N/A"}{" "}
              </div>{" "}
            </div>
            {/* Summary */}
            <div className="prose prose-lg prose-indigo max-w-none mb-8">
              {" "}
              <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1 border-gray-200">
                Summary
              </h2>{" "}
              {/* Use prose for nice typography */}
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {publication.summary}
              </p>{" "}
            </div>
            {/* Tags */}
            {Array.isArray(publication.tags) && publication.tags.length > 0 && (
              <div className="mb-8">
                {" "}
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-1 border-gray-200">
                  <FaTags className="text-gray-400" /> Tags
                </h3>{" "}
                <div className="flex flex-wrap gap-2">
                  {" "}
                  {publication.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium border border-indigo-200"
                    >
                      {" "}
                      {tag}{" "}
                    </span>
                  ))}{" "}
                </div>{" "}
              </div>
            )}
            {/* Links */}
            <div className="space-y-4 mb-8">
              {" "}
              {publication.document_link && (
                <div>
                  {" "}
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaLink className="text-gray-400" /> Document Link
                  </h3>{" "}
                  <a
                    href={publication.document_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 hover:underline break-all"
                  >
                    {" "}
                    {publication.document_link}{" "}
                    <FaExternalLinkAlt className="inline ml-1 h-3 w-3" />{" "}
                  </a>{" "}
                </div>
              )}{" "}
              {publication.doi && (
                <div>
                  {" "}
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaBookOpen className="text-gray-400" /> DOI
                  </h3>{" "}
                  <a
                    href={`https://doi.org/${publication.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {" "}
                    {publication.doi}{" "}
                    <FaExternalLinkAlt className="inline ml-1 h-3 w-3" />{" "}
                  </a>{" "}
                </div>
              )}{" "}
            </div>

            {/* --- Action Buttons Row (Keep as is) --- */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-8 border-t border-gray-200">
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-indigo-500"
              >
                <FaShare /> Share
              </button>
              {/* Bookmark Button */}
              {currentUser && (
                <button
                  onClick={handleBookmarkToggle}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors border ${
                    isBookmarked
                      ? "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 focus:ring-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 focus:ring-indigo-500"
                  }`}
                  data-tooltip-id="detail-bookmark"
                  data-tooltip-content={
                    isBookmarked ? "Remove Bookmark" : "Add Bookmark"
                  }
                >
                  {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}{" "}
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
              )}
              <Tooltip id="detail-bookmark" />
              {/* Owner Actions */}
              {isOwner && (
                <>
                  <button
                    onClick={handleEditRedirect}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 border border-transparent"
                  >
                    <FaEdit /> Edit Publication
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-white text-red-600 border border-red-300 hover:bg-red-50 focus:ring-red-500"
                  >
                    <FaTrashAlt /> Delete Publication
                  </button>
                </>
              )}
            </div>
          </div>{" "}
          {/* End Main Content Padding */}
        </article>

        {/* --- ** NEW Comment Section ** --- */}
        <section
          ref={commentsSectionRef}
          id="comments-section"
          className="mt-10 bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8"
          aria-labelledby="comments-heading"
        >
          <h2
            id="comments-heading"
            className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2"
          >
            <FaCommentDots className="text-gray-500" /> Comments (
            {commentPagination?.totalItems ?? publication.commentCount ?? 0}){" "}
            {/* Display count */}
          </h2>

          {/* Comment Form */}
          <CommentForm
            onSubmit={handleAddComment}
            isSubmitting={isPostingComment}
            currentUser={currentUser}
          />

          {/* Comment Error Display */}
          {commentError && (
            <div className="mt-4">
              <ErrorMessage
                title="Comment Error"
                message={commentError}
                onClose={() => setCommentError(null)}
              />
            </div>
          )}

          {/* Comments List Area */}
          <div className="mt-8">
            {loadingComments && comments.length === 0 && <LoadingSpinner />}
            {!loadingComments && comments.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                Be the first to add a comment!
              </p>
            )}
            {comments.length > 0 && <CommentList comments={comments} />}
          </div>

          {/* Load More Button */}
          {!loadingComments &&
            commentPagination &&
            commentPagination.currentPage < commentPagination.totalPages && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={loadingComments}
                  className="px-4 py-2 text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
                >
                  Load More Comments
                </button>
              </div>
            )}
        </section>
        {/* --- End Comment Section --- */}
      </div>{" "}
      {/* End Container */}
      {/* Share Modal */}
      {isShareModalOpen && publication && (
        <ShareModal
          item={publication}
          itemType="publication"
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div> // End Page Wrapper
  );
};

export default PublicationDetailPage;
