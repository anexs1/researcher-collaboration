// src/Page/PublicationDetailPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  FaShare, // Added Share icon
} from "react-icons/fa"; // Removed FaHandshake
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Adjust path
import ErrorMessage from "../Component/Common/ErrorMessage"; // Adjust path
import Notification from "../Component/Common/Notification"; // Adjust path
import ShareModal from "../Component/Common/ShareModal"; // Ensure ShareModal is imported
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip"; // Import Tooltip

// Config & Helpers
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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
const formatStatusText = (status) => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};
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

// --- Component ---
const PublicationDetailPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // State for Share Modal
  // selectedPublication state is not needed here as we have 'publication'

  console.log(
    `--- PublicationDetailPage Rendering --- ID: ${id}, Current User ID: ${currentUser?.id}`
  );

  // Notification Handler
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchPublicationDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE_URL}/api/publications/${id}`;
        const response = await axios.get(url, { headers: getAuthHeaders() });
        if (response.data?.success && response.data.data) {
          setPublication(response.data.data);
          setIsBookmarked(response.data.data.isBookmarked || false);
        } else {
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
        setLoading(false);
      }
    };
    if (id && !isNaN(parseInt(id))) {
      fetchPublicationDetails();
    } else {
      setError("Invalid Publication ID specified.");
      setLoading(false);
    }
  }, [id]);

  // --- Action Handlers ---
  const handleEditRedirect = useCallback(() => {
    /* ... same as before ... */ if (currentUser?.id === publication?.ownerId) {
      navigate(`/publications/edit/${id}`);
    } else {
      showNotification("Permission denied.", "error");
    }
  }, [currentUser, publication, id, navigate, showNotification]);
  const handleDeleteConfirm = useCallback(async () => {
    /* ... same as before ... */ if (currentUser?.id !== publication?.ownerId) {
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
    /* ... same as before ... */ if (!currentUser) {
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

  // --- ** NEW Share Handler ** ---
  const handleShare = useCallback(() => {
    if (publication) {
      console.log(`Opening share modal for publication ID: ${publication.id}`);
      setIsShareModalOpen(true); // Open the modal
    }
  }, [publication]); // Depends on the publication data being loaded

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="xl" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <button
          onClick={() => navigate("/publications")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-700 font-medium mb-4"
        >
          {" "}
          <FaArrowLeft /> Back{" "}
        </button>
        <ErrorMessage title="Error Loading Publication" message={error} />
      </div>
    );
  }
  if (!publication) {
    return (
      <div className="container mx-auto p-8 text-center">
        <button
          onClick={() => navigate("/publications")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-700 font-medium mb-4 mx-auto"
        >
          {" "}
          <FaArrowLeft /> Back{" "}
        </button>
        <p className="text-xl text-gray-500">Publication not found.</p>
      </div>
    );
  }

  const isOwner = currentUser?.id === publication.ownerId;
  // const isOpenForCollab = publication.collaborationStatus === 'open'; // No longer needed

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
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

            {/* --- Action Buttons Row --- */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-8 border-t border-gray-200">
              {/* Share Button (Visible to all) */}
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-indigo-500"
              >
                <FaShare /> Share
              </button>
              {/* Bookmark Button (Visible if logged in) */}
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
              {/* Owner Actions (Visible only if owner) */}
              {isOwner && (
                <>
                  <button
                    onClick={handleEditRedirect}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 border border-transparent"
                  >
                    {" "}
                    <FaEdit /> Edit Publication{" "}
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-white text-red-600 border border-red-300 hover:bg-red-50 focus:ring-red-500"
                  >
                    {" "}
                    <FaTrashAlt /> Delete Publication{" "}
                  </button>
                </>
              )}
              {/* Collaboration button is removed */}
            </div>
          </div>
        </article>
        {/* Single Tooltip instance for multiple buttons if needed */}
        {/* <Tooltip id="action-tooltip" /> */}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && publication && (
        <ShareModal
          item={publication} // Pass the loaded publication data
          itemType="publication"
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PublicationDetailPage;
