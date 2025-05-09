// src/Page/Admin/AdminSinglePublicationDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FaFlask,
  FaCalendarAlt,
  FaTags,
  FaUser,
  FaLink,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaBookOpen,
  FaEye,
  FaDownload,
  FaStar,
  FaCheckCircle,
  FaGlobe,
  FaCodeBranch,
  FaBalanceScale,
  FaHistory,
  FaEdit,

  // No need for bookmark/share/comment icons if this is purely admin view
} from "react-icons/fa";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import Notification from "../../Component/Common/Notification"; // If you plan to have actions like "Verify"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "N/A";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
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
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (error) {
    return "Invalid Date";
  }
};

const AdminSinglePublicationDetailPage = () => {
  const { id: publicationId } = useParams(); // Get 'id' from URL
  const navigate = useNavigate();
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const showNotification = useCallback((message, type = "info") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  useEffect(() => {
    const fetchPublication = async () => {
      if (!publicationId) {
        setError("No Publication ID provided.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Using the public detail endpoint for now.
        // Admins might need a dedicated endpoint if they require more/different data.
        const url = `${API_BASE_URL}/api/publications/${publicationId}`;
        const response = await axios.get(url, { headers: getAuthHeaders() });

        if (response.data?.success && response.data.data) {
          setPublication(response.data.data);
        } else if (
          response.status === 404 ||
          (response.data &&
            !response.data.success &&
            response.data.message?.toLowerCase().includes("not found"))
        ) {
          setError("Publication not found.");
          setPublication(null);
        } else {
          throw new Error(
            response.data?.message || "Failed to load publication details."
          );
        }
      } catch (err) {
        let errMsg = "Could not load publication details.";
        if (err.response) {
          errMsg =
            err.response.status === 404
              ? "Publication not found."
              : err.response.data?.message || err.message;
        } else if (err.message) {
          errMsg = err.message;
        }
        setError(errMsg);
        setPublication(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPublication();
  }, [publicationId]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="xl" />
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto p-8">
        <ErrorMessage title="Error" message={error} />
      </div>
    );
  if (!publication)
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-xl text-gray-500">Publication data not available.</p>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {" "}
      {/* This component will be rendered within AdminLayout */}
      <div className="fixed top-20 right-5 z-50 w-full max-w-sm">
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        />
      </div>
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/publications")} // Navigate back to admin list
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-700 font-medium transition-colors rounded-md px-3 py-1 hover:bg-gray-100"
        >
          <FaArrowLeft /> Back to Admin Publications List
        </button>
      </div>
      <article className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {publication.thumbnail && (
          <div className="h-56 md:h-72 bg-gray-200">
            <img
              src={publication.thumbnail}
              alt={`Header for ${publication.title}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 md:p-8 lg:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight mb-6">
            {publication.title}
            <span className="block text-lg text-gray-500 font-normal mt-1">
              Admin View
            </span>
          </h1>

          {/* Meta Info Section 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm text-gray-700 mb-4 p-4 bg-slate-50 rounded-md border">
            <div className="flex items-center gap-2" title="Owner">
              {" "}
              <FaUser className="text-slate-500 flex-shrink-0" />{" "}
              <strong>Owner:</strong>{" "}
              <Link
                to={`/admin/users/manage/${publication.ownerId}`}
                className="text-indigo-600 hover:underline"
              >
                {publication.owner?.username ||
                  `User ID: ${publication.ownerId}`}
              </Link>{" "}
            </div>
            <div className="flex items-center gap-2" title="Listed Author(s)">
              {" "}
              <FaUser className="text-slate-500 flex-shrink-0" />{" "}
              <strong>Author(s):</strong> {publication.author}{" "}
            </div>
            <div className="flex items-center gap-2" title="Publication Date">
              {" "}
              <FaCalendarAlt className="text-slate-500 flex-shrink-0" />{" "}
              <strong>Published:</strong>{" "}
              {formatDate(publication.publicationDate || publication.createdAt)}{" "}
            </div>
            <div className="flex items-center gap-2" title="Research Area">
              {" "}
              <FaFlask className="text-slate-500 flex-shrink-0" />{" "}
              <strong>Area:</strong> {publication.area || "N/A"}{" "}
            </div>
            <div className="flex items-center gap-2" title="Language">
              {" "}
              <FaGlobe className="text-slate-500 flex-shrink-0" />{" "}
              <strong>Language:</strong> {publication.language || "N/A"}{" "}
            </div>
            <div className="flex items-center gap-2" title="Version">
              {" "}
              <FaCodeBranch className="text-slate-500 flex-shrink-0" />{" "}
              <strong>Version:</strong> {publication.version || "N/A"}{" "}
            </div>
          </div>

          {/* Meta Info Section 2 (Booleans and Dates) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm text-gray-700 mb-6 pb-6 border-b border-gray-200 p-4 bg-slate-50 rounded-md border">
            <div
              className={`flex items-center gap-2 ${
                publication.isPeerReviewed ? "text-green-700" : "text-gray-700"
              }`}
              title="Peer Reviewed"
            >
              {publication.isPeerReviewed ? (
                <FaCheckCircle className="text-green-500 flex-shrink-0" />
              ) : (
                <FaTimes className="text-red-500 flex-shrink-0" />
              )}
              <strong>Peer Reviewed:</strong>{" "}
              {publication.isPeerReviewed ? "Yes" : "No"}
            </div>
            {publication.license && (
              <div className="flex items-center gap-2" title="License">
                {" "}
                <FaBalanceScale className="text-slate-500 flex-shrink-0" />{" "}
                <strong>License:</strong> {publication.license}{" "}
              </div>
            )}
            {publication.lastReviewedAt && (
              <div
                className="flex items-center gap-2"
                title="Last Reviewed Date"
              >
                {" "}
                <FaHistory className="text-slate-500 flex-shrink-0" />{" "}
                <strong>Last Reviewed:</strong>{" "}
                {formatDate(publication.lastReviewedAt, true)}{" "}
              </div>
            )}
            <div className="flex items-center gap-2" title="Journal">
              {" "}
              <FaBookOpen className="text-slate-500 flex-shrink-0" />{" "}
              <strong>Journal:</strong> {publication.journal || "N/A"}{" "}
            </div>
          </div>

          <div className="prose prose-lg prose-indigo max-w-none mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1 border-gray-200">
              Summary
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {publication.summary}
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
              <div className="flex flex-col items-center p-3 bg-gray-100 rounded-lg border">
                {" "}
                <FaEye className="text-2xl text-blue-500 mb-1" />{" "}
                <span className="font-semibold text-gray-700">
                  {publication.views ?? 0}
                </span>{" "}
                <span className="text-gray-500">Views</span>{" "}
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-100 rounded-lg border">
                {" "}
                <FaBookOpen className="text-2xl text-green-500 mb-1" />{" "}
                <span className="font-semibold text-gray-700">
                  {publication.citations ?? 0}
                </span>{" "}
                <span className="text-gray-500">Citations</span>{" "}
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-100 rounded-lg border">
                {" "}
                <FaDownload className="text-2xl text-purple-500 mb-1" />{" "}
                <span className="font-semibold text-gray-700">
                  {publication.downloadCount ?? 0}
                </span>{" "}
                <span className="text-gray-500">Downloads</span>{" "}
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-100 rounded-lg border">
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

          <div className="pt-8 border-t border-gray-200 text-right">
            <button
              onClick={() => navigate(`/publications/edit/${publication.id}`)} // Navigate to public edit page
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 border border-transparent"
            >
              <FaEdit /> Edit Publication (via Public Form)
            </button>
          </div>
        </div>
      </article>
      {/* Admin might not interact with comments here, but you could add them if needed */}
      {/* <section ref={commentsSectionRef} ... > ... </section> */}
    </div>
  );
};

export default AdminSinglePublicationDetailPage;
