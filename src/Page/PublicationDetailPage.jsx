// src/Page/PublicationDetailPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
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
  FaCommentDots,
  FaGlobe,
  FaCodeBranch,
  FaCheckCircle,
  FaBalanceScale,
  FaStar,
  FaDownload,
  FaHistory,
  FaEye,
} from "react-icons/fa";
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
import ShareModal from "../Component/Common/ShareModal";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";

// Config & Helpers
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const options = { year: "numeric", month: "short", day: "numeric" };
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
      dateString.length === 10 &&
      !includeTime
    ) {
      const [year, month, day] = dateString.split("-");
      const utcDate = new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day))
      );
      options.timeZone = "UTC";
      return utcDate.toLocaleDateString(undefined, options);
    }
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error(`Error formatting date "${dateString}":`, error);
    return "Date Error";
  }
};

// Comment Components (Placeholders - ensure they are implemented or imported)
const CommentItem = ({ comment }) => (
  <li className="py-4 border-b border-gray-100 last:border-b-0">
    {" "}
    <div className="flex items-start space-x-3">
      {" "}
      <img
        src={comment.author?.profilePictureUrl || "/default-avatar.png"}
        alt={comment.author?.username}
        className="h-8 w-8 rounded-full bg-gray-200 object-cover flex-shrink-0"
        onError={(e) => {
          e.target.src = "/default-avatar.png";
        }}
      />{" "}
      <div className="flex-1">
        {" "}
        <div className="text-sm font-medium text-gray-800">
          {" "}
          {comment.author?.username || "Unknown User"}{" "}
          <span className="ml-2 text-xs font-normal text-gray-500">
            {" "}
            ({new Date(comment.createdAt).toLocaleString()}){" "}
          </span>{" "}
        </div>{" "}
        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
          {" "}
          {comment.content}{" "}
        </p>{" "}
      </div>{" "}
    </div>{" "}
  </li>
);
const CommentList = ({ comments }) => (
  <ul className="space-y-2">
    {" "}
    {comments.map((comment) => (
      <CommentItem key={comment.id} comment={comment} />
    ))}{" "}
  </ul>
);
const CommentForm = ({ onSubmit, isSubmitting, currentUser }) => {
  const [content, setContent] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (content.trim()) {
      onSubmit(content.trim());
      setContent("");
    }
  };
  if (!currentUser) {
    return (
      <p className="text-sm text-gray-600 bg-gray-100 p-4 rounded-md border">
        {" "}
        Please{" "}
        <Link
          to="/login"
          state={{ from: location }}
          className="text-indigo-600 hover:underline font-medium"
        >
          {" "}
          log in{" "}
        </Link>{" "}
        to post a comment.{" "}
      </p>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      {" "}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment here..."
        rows="3"
        required
        disabled={isSubmitting}
        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-70 disabled:bg-gray-100"
        maxLength={2000}
      />{" "}
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {" "}
        {isSubmitting ? "Posting..." : "Post Comment"}{" "}
      </button>{" "}
    </form>
  );
};

const PublicationDetailPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [comments, setComments] = useState([]);
  const [commentError, setCommentError] = useState(null);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPagination, setCommentPagination] = useState(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const commentsSectionRef = useRef(null);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  const fetchPublicationDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/publications/${id}`;
      const response = await axios.get(url, { headers: getAuthHeaders() });

      // **Refined Success/Error Handling**
      if (response.data?.success && response.data.data) {
        setPublication(response.data.data);
        setIsBookmarked(response.data.data.isBookmarked || false);
      } else if (
        response.status === 404 ||
        (response.data &&
          !response.data.success &&
          response.data.message?.toLowerCase().includes("not found"))
      ) {
        // More robust check for "not found"
        setError("Publication not found.");
        setPublication(null); // Ensure publication is null on not found
      } else {
        // For other non-success cases or unexpected structures
        throw new Error(
          response.data?.message ||
            "Failed to load publication data. Unexpected response."
        );
      }
    } catch (err) {
      // Catching network errors from axios or explicitly thrown errors
      let errMsg = "Could not load publication data."; // Default
      if (err.response) {
        // Axios error with a response
        errMsg =
          err.response.status === 404
            ? "Publication not found."
            : err.response.data?.message || err.message;
      } else if (err.message) {
        // Error thrown in try block or network error without response
        errMsg = err.message;
      }
      setError(errMsg);
      setPublication(null); // Ensure publication is null on error
    } finally {
      setLoading(false);
    }
  }, [id]); // Removed getAuthHeaders from deps as it's stable

  const fetchComments = useCallback(
    async (page = 1, loadMore = false) => {
      if (!id) return;
      setLoadingComments(true);
      setCommentError(null);
      try {
        const url = `${API_BASE_URL}/api/publications/${id}/comments?page=${page}&limit=15`;
        const response = await axios.get(url);
        if (response.data?.success) {
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

  useEffect(() => {
    if (id && !isNaN(parseInt(id))) {
      fetchPublicationDetails();
      fetchComments(1);
    } else {
      setError("Invalid Publication ID specified.");
      setLoading(false);
      setLoadingComments(false);
    }
  }, [id, fetchPublicationDetails, fetchComments]);

  useEffect(() => {
    if (!loading && location.search.includes("focus=comments")) {
      const timer = setTimeout(() => {
        if (commentsSectionRef.current) {
          commentsSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.search, loading]);

  const handleAddComment = useCallback(
    async (commentContent) => {
      if (!currentUser) {
        showNotification("Please log in to comment.", "info");
        navigate("/login", { state: { from: location } });
        return;
      }
      if (!commentContent) return;
      setIsPostingComment(true);
      setCommentError(null);
      try {
        const url = `${API_BASE_URL}/api/publications/${id}/comments`;
        const response = await axios.post(
          url,
          { content: commentContent },
          { headers: getAuthHeaders() }
        );
        if (response.data?.success && response.data.data) {
          setComments((prev) => [response.data.data, ...prev]);
          setCommentPagination((prev) =>
            prev ? { ...prev, totalItems: prev.totalItems + 1 } : null
          );
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
        setCommentError(errMsg);
        showNotification("Failed to post comment.", "error");
      } finally {
        setIsPostingComment(false);
      }
    },
    [id, currentUser, showNotification, navigate, location]
  );

  const loadMoreComments = () => {
    if (
      commentPagination &&
      commentPagination.currentPage < commentPagination.totalPages &&
      !loadingComments
    ) {
      fetchComments(commentPage + 1, true);
    }
  };
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
    setIsBookmarked(newBookmarkState);
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
      setIsBookmarked(!newBookmarkState);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        {" "}
        <LoadingSpinner size="xl" />{" "}
      </div>
    );
  }
  // Error state should specifically check if 'error' is set. 'publication' might be null even without an error if no ID.
  if (error) {
    return (
      <div className="container mx-auto p-8">
        {" "}
        <button
          onClick={() => navigate("/publications")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-700 font-medium mb-4"
        >
          {" "}
          <FaArrowLeft /> Back{" "}
        </button>{" "}
        <ErrorMessage title="Error Loading Publication" message={error} />{" "}
      </div>
    );
  }
  if (!publication && !error) {
    // This case handles valid ID but no data, or initial state before error is set
    return (
      <div className="container mx-auto p-8 text-center">
        {" "}
        <button
          onClick={() => navigate("/publications")}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-700 font-medium mb-4 mx-auto"
        >
          {" "}
          <FaArrowLeft /> Back{" "}
        </button>{" "}
        <p className="text-xl text-gray-500">
          Publication data is not available.
        </p>{" "}
      </div>
    );
  }

  const isOwner = currentUser?.id === publication.ownerId;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="fixed top-6 right-6 z-[100] w-auto max-w-md">
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
          </AnimatePresence>
        </div>
        <div className="mb-6">
          <button
            onClick={() => navigate("/publications")}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-700 font-medium transition-colors rounded-md px-3 py-1 hover:bg-gray-100"
          >
            {" "}
            <FaArrowLeft /> Back to Publications{" "}
          </button>
        </div>

        <article className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
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
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                {" "}
                {publication.title}{" "}
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5" title="Author(s)">
                {" "}
                <FaUser className="text-gray-400 flex-shrink-0" />{" "}
                <span className="hover:text-indigo-600 cursor-pointer truncate">
                  {publication.author}
                </span>{" "}
              </div>
              <div
                className="flex items-center gap-1.5"
                title="Publication Date"
              >
                {" "}
                <FaCalendarAlt className="text-gray-400 flex-shrink-0" />{" "}
                {formatDate(
                  publication.publicationDate || publication.createdAt
                )}{" "}
              </div>
              <div className="flex items-center gap-1.5" title="Research Area">
                {" "}
                <FaFlask className="text-gray-400 flex-shrink-0" />{" "}
                {publication.area || "N/A"}{" "}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-1.5" title="Language">
                {" "}
                <FaGlobe className="text-gray-400 flex-shrink-0" />{" "}
                {publication.language || "N/A"}{" "}
              </div>
              <div className="flex items-center gap-1.5" title="Version">
                {" "}
                <FaCodeBranch className="text-gray-400 flex-shrink-0" />{" "}
                {publication.version || "N/A"}{" "}
              </div>
              {publication.isPeerReviewed && (
                <div
                  className="flex items-center gap-1.5 text-green-700"
                  title="Peer Reviewed"
                >
                  {" "}
                  <FaCheckCircle className="text-green-500 flex-shrink-0" />{" "}
                  Peer Reviewed{" "}
                </div>
              )}
              {publication.license && (
                <div className="flex items-center gap-1.5" title="License">
                  {" "}
                  <FaBalanceScale className="text-gray-400 flex-shrink-0" />{" "}
                  {publication.license}{" "}
                </div>
              )}
              {publication.lastReviewedAt && (
                <div
                  className="flex items-center gap-1.5"
                  title="Last Reviewed Date"
                >
                  {" "}
                  <FaHistory className="text-gray-400 flex-shrink-0" />{" "}
                  {formatDate(publication.lastReviewedAt, true)}{" "}
                </div>
              )}
            </div>

            <div className="prose prose-lg prose-indigo max-w-none mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1 border-gray-200">
                {" "}
                Summary{" "}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {" "}
                {publication.summary}{" "}
              </p>
            </div>

            {Array.isArray(publication.tags) && publication.tags.length > 0 && (
              <div className="mb-8">
                {" "}
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-1 border-gray-200">
                  {" "}
                  <FaTags className="text-gray-400" /> Tags{" "}
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

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-1 border-gray-200">
                {" "}
                Statistics{" "}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border">
                  {" "}
                  <FaEye className="text-2xl text-blue-500 mb-1" />{" "}
                  <span className="font-semibold text-gray-700">
                    {publication.views ?? 0}
                  </span>{" "}
                  <span className="text-gray-500">Views</span>{" "}
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border">
                  {" "}
                  <FaBookOpen className="text-2xl text-green-500 mb-1" />{" "}
                  <span className="font-semibold text-gray-700">
                    {publication.citations ?? 0}
                  </span>{" "}
                  <span className="text-gray-500">Citations</span>{" "}
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border">
                  {" "}
                  <FaDownload className="text-2xl text-purple-500 mb-1" />{" "}
                  <span className="font-semibold text-gray-700">
                    {publication.downloadCount ?? 0}
                  </span>{" "}
                  <span className="text-gray-500">Downloads</span>{" "}
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border">
                  {" "}
                  <FaStar className="text-2xl text-amber-500 mb-1" />{" "}
                  <span className="font-semibold text-gray-700">
                    {publication.rating?.toFixed(1) ?? "0.0"} / 5
                  </span>{" "}
                  <span className="text-gray-500">Rating</span>{" "}
                </div>
              </div>
            </div>

            {(publication.document_link || publication.doi) && (
              <div className="mb-8">
                {" "}
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-1 border-gray-200">
                  {" "}
                  Access & Citation{" "}
                </h3>{" "}
                <div className="space-y-3">
                  {" "}
                  {publication.document_link && (
                    <div className="flex items-start gap-2">
                      {" "}
                      <FaLink className="text-gray-400 mt-1 flex-shrink-0" />{" "}
                      <div>
                        {" "}
                        <span className="font-medium text-gray-700 block">
                          Document Link:
                        </span>{" "}
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
                      </div>{" "}
                    </div>
                  )}{" "}
                  {publication.doi && (
                    <div className="flex items-start gap-2">
                      {" "}
                      <FaBookOpen className="text-gray-400 mt-1 flex-shrink-0" />{" "}
                      <div>
                        {" "}
                        <span className="font-medium text-gray-700 block">
                          DOI:
                        </span>{" "}
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
                      </div>{" "}
                    </div>
                  )}{" "}
                </div>{" "}
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-8 border-t border-gray-200">
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-indigo-500"
              >
                {" "}
                <FaShare /> Share{" "}
              </button>
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
                  {" "}
                  {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}{" "}
                  {isBookmarked ? "Bookmarked" : "Bookmark"}{" "}
                </button>
              )}{" "}
              <Tooltip id="detail-bookmark" />
              {isOwner && (
                <>
                  {" "}
                  <button
                    onClick={handleEditRedirect}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 border border-transparent"
                  >
                    {" "}
                    <FaEdit /> Edit Publication{" "}
                  </button>{" "}
                  <button
                    onClick={handleDeleteConfirm}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-white text-red-600 border border-red-300 hover:bg-red-50 focus:ring-red-500"
                  >
                    {" "}
                    <FaTrashAlt /> Delete Publication{" "}
                  </button>{" "}
                </>
              )}
            </div>
          </div>
        </article>

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
            {" "}
            <FaCommentDots className="text-gray-500" /> Comments (
            {commentPagination?.totalItems ?? publication.commentCount ?? 0}){" "}
          </h2>
          <CommentForm
            onSubmit={handleAddComment}
            isSubmitting={isPostingComment}
            currentUser={currentUser}
          />
          {commentError && (
            <div className="mt-4">
              {" "}
              <ErrorMessage
                title="Comment Error"
                message={commentError}
                onClose={() => setCommentError(null)}
              />{" "}
            </div>
          )}
          <div className="mt-8">
            {" "}
            {loadingComments && comments.length === 0 && (
              <LoadingSpinner />
            )}{" "}
            {!loadingComments && comments.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                {" "}
                Be the first to add a comment!{" "}
              </p>
            )}{" "}
            {comments.length > 0 && <CommentList comments={comments} />}{" "}
          </div>
          {!loadingComments &&
            commentPagination &&
            commentPagination.currentPage < commentPagination.totalPages && (
              <div className="mt-6 text-center">
                {" "}
                <button
                  onClick={loadMoreComments}
                  disabled={loadingComments}
                  className="px-4 py-2 text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
                >
                  {" "}
                  Load More Comments{" "}
                </button>{" "}
              </div>
            )}
        </section>
      </div>
      {isShareModalOpen && publication && (
        <ShareModal
          item={publication}
          itemType="publication"
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PublicationDetailPage;
