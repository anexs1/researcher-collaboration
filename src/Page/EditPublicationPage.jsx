// src/Page/EditPublicationPage.jsx (or similar filename for your edit form)
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSave,
  FaTimes,
  FaSpinner,
  FaExclamationCircle,
  FaUser,
  FaTag,
  FaFlask,
  FaCalendarAlt,
  FaLink,
  // FaUsers, // REMOVED: Icon for Collaboration Status
  FaInfoCircle,
  FaGlobe, // For Language
  FaCodeBranch, // For Version
  FaCheckCircle, // For Peer Reviewed
  FaBalanceScale, // For License
  FaHistory, // For Last Reviewed At
} from "react-icons/fa";

import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const baseInputClass =
  "block w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 disabled:bg-gray-100";
const errorInputClass = "border-red-500 focus:ring-red-500";
const baseLabelClass =
  "block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5";
const baseButtonClass =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
const primaryButtonClass = `${baseButtonClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent`;
const secondaryButtonClass = `${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-indigo-500`;

const EditPublicationPage = () => {
  const { id: publicationId } = useParams();
  const navigate = useNavigate();

  const [publicationData, setPublicationData] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    author: "",
    tags: "",
    area: "",
    publicationDate: "",
    document_link: "",
    journal: "", // Added
    doi: "", // Added
    thumbnail: "", // Added
    // collaborationStatus: "open", // <<<< REMOVED
    // 🆕 New fields
    language: "English",
    version: "v1.0",
    isPeerReviewed: false,
    license: "",
    lastReviewedAt: "", // Keep as empty string for date input
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [formErrors, setFormErrors] = useState({});

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // --- Helper to format date for input type="date" (YYYY-MM-DD) ---
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const dateObj = new Date(dateString);
      if (!isNaN(dateObj.getTime())) {
        // For UTC dates (like publicationDate), toISOString().slice(0,10) is fine
        // For local dates (like lastReviewedAt if it's meant to be local), ensure timezone handling
        // For simplicity, we'll use toISOString for both here assuming backend handles timezone if necessary
        return dateObj.toISOString().slice(0, 10);
      }
    } catch (e) {
      /* ignore */
    }
    return ""; // Return empty if invalid
  };

  useEffect(() => {
    const fetchPublication = async () => {
      setLoading(true);
      setError(null);
      setFormErrors({});
      try {
        if (!publicationId) throw new Error("No Publication ID provided.");
        const url = `${API_BASE_URL}/api/publications/${publicationId}`;
        const response = await axios.get(url, { headers: getAuthHeaders() });

        if (response.data?.success && response.data.data) {
          const fetchedPub = response.data.data;
          setPublicationData(fetchedPub);

          setFormData({
            title: fetchedPub.title || "",
            summary: fetchedPub.summary || "",
            author: fetchedPub.author || "",
            tags: Array.isArray(fetchedPub.tags)
              ? fetchedPub.tags.join(", ")
              : "",
            area: fetchedPub.area || "",
            publicationDate: formatDateForInput(fetchedPub.publicationDate),
            document_link: fetchedPub.document_link || "",
            journal: fetchedPub.journal || "",
            doi: fetchedPub.doi || "",
            thumbnail: fetchedPub.thumbnail || "",
            // collaborationStatus: fetchedPub.collaborationStatus || "open", // <<<< REMOVED
            // 🆕 Set new fields
            language: fetchedPub.language || "English",
            version: fetchedPub.version || "v1.0",
            isPeerReviewed:
              typeof fetchedPub.isPeerReviewed === "boolean"
                ? fetchedPub.isPeerReviewed
                : false,
            license: fetchedPub.license || "",
            lastReviewedAt: formatDateForInput(fetchedPub.lastReviewedAt),
            // Note: rating and downloadCount are usually not directly edited in this form
          });
        } else {
          throw new Error(
            response.data?.message || "Publication not found or failed to load."
          );
        }
      } catch (err) {
        console.error("Error fetching publication for edit:", err);
        const errMsg =
          err.response?.status === 404
            ? "Publication not found."
            : err.response?.data?.message ||
              err.message ||
              "Could not load publication data.";
        setError(errMsg);
        setPublicationData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPublication();
  }, [publicationId]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (formErrors[name]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [formErrors]
  );

  const validateForm = useCallback(() => {
    let errors = {};
    if (!formData.title?.trim()) errors.title = "Title cannot be empty.";
    if (!formData.summary?.trim()) errors.summary = "Summary cannot be empty.";
    if (!formData.author?.trim()) errors.author = "Author cannot be empty.";
    if (!formData.area?.trim()) errors.area = "Research Area cannot be empty.";

    if (
      formData.document_link &&
      !/^https?:\/\/.+/.test(formData.document_link)
    ) {
      errors.document_link =
        "Please enter a valid URL (starting with http:// or https://).";
    }
    if (formData.thumbnail && !/^https?:\/\/.+/.test(formData.thumbnail)) {
      errors.thumbnail = "Please enter a valid URL for the thumbnail.";
    }

    const validateDate = (dateStr, fieldName) => {
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) errors[fieldName] = "Invalid date format.";
        } catch (e) {
          errors[fieldName] = "Invalid date format.";
        }
      }
    };
    validateDate(formData.publicationDate, "publicationDate");
    validateDate(formData.lastReviewedAt, "lastReviewedAt");

    // 🆕 Validate new fields if necessary (e.g., version format, license options)
    // For simplicity, keeping basic validation for now.

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      showNotification("Please review the form for errors.", "error");
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      firstErrorField?.focus();
      return;
    }

    setIsSaving(true);

    const tagsArray = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      author: formData.author.trim(),
      tags: tagsArray,
      area: formData.area.trim(),
      publicationDate: formData.publicationDate || null,
      document_link: formData.document_link?.trim() || null,
      journal: formData.journal?.trim() || null,
      doi: formData.doi?.trim() || null,
      thumbnail: formData.thumbnail?.trim() || null,
      // collaborationStatus: formData.collaborationStatus, // <<<< REMOVED
      // 🆕 Add new fields to payload
      language: formData.language?.trim() || null,
      version: formData.version?.trim() || null,
      isPeerReviewed: formData.isPeerReviewed,
      license: formData.license?.trim() || null,
      lastReviewedAt: formData.lastReviewedAt || null,
      // rating and downloadCount are generally not updated here by user
    };
    // Filter out null values if backend expects undefined for no change or prefers cleaner payload
    // Object.keys(payload).forEach(key => payload[key] === null && delete payload[key]);

    try {
      const url = `${API_BASE_URL}/api/publications/${publicationId}`;
      const response = await axios.put(url, payload, {
        headers: getAuthHeaders(),
      });

      if (response.data?.success) {
        showNotification("Publication updated successfully!", "success");
        setTimeout(() => navigate("/publications"), 1500);
      } else {
        throw new Error(
          response.data?.message || "Failed to update publication."
        );
      }
    } catch (err) {
      console.error("Error updating publication:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not update publication.";
      setError(errMsg);
      showNotification(`Update failed: ${errMsg}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    /* ... (loading spinner - no change) ... */
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        {" "}
        <LoadingSpinner size="xl" />{" "}
      </div>
    );
  }
  if (error && !publicationData) {
    /* ... (page load error - no change) ... */
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {" "}
        <ErrorMessage
          title="Error Loading Publication"
          message={error}
          onClose={() => navigate("/publications")}
        />{" "}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fixed top-5 right-5 z-50 w-auto max-w-sm">
          <Notification /* ... (notification component - no change) ... */
            message={notification.message}
            type={notification.type}
            show={notification.show}
            onClose={() =>
              setNotification((prev) => ({ ...prev, show: false }))
            }
          />
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center sm:text-left">
            {" "}
            {/* ... (header - no change) ... */}
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 mb-1">
              {" "}
              Edit Publication{" "}
            </h1>
            {publicationData?.title && (
              <p className="text-lg text-gray-600">
                {" "}
                Editing:{" "}
                <span className="font-medium">
                  {publicationData.title}
                </span>{" "}
              </p>
            )}
          </div>
          {error &&
            publicationData /* ... (save error display - no change) ... */ && (
              <div className="mb-6">
                {" "}
                <ErrorMessage
                  title="Update Error"
                  message={error}
                  onClose={() => setError(null)}
                />{" "}
              </div>
            )}
          <form
            onSubmit={handleSave}
            noValidate
            className="space-y-6 bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200/80"
          >
            {/* --- CORE FIELDS --- */}
            <div>
              {" "}
              {/* Title */}
              <label htmlFor="edit-title" className={baseLabelClass}>
                {" "}
                <FaUser className="text-gray-400" /> Title{" "}
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={isSaving}
                aria-invalid={!!formErrors.title}
                aria-describedby={formErrors.title ? "title-error" : undefined}
                className={`${baseInputClass} ${
                  formErrors.title ? errorInputClass : ""
                }`}
              />
              {formErrors.title && (
                <p
                  id="title-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  {" "}
                  <FaExclamationCircle /> {formErrors.title}{" "}
                </p>
              )}
            </div>
            <div>
              {" "}
              {/* Summary */}
              <label htmlFor="edit-summary" className={baseLabelClass}>
                {" "}
                <FaInfoCircle className="text-gray-400" /> Summary{" "}
              </label>
              <textarea
                id="edit-summary"
                name="summary"
                rows="6"
                value={formData.summary}
                onChange={handleInputChange}
                required
                disabled={isSaving}
                aria-invalid={!!formErrors.summary}
                aria-describedby={
                  formErrors.summary ? "summary-error" : undefined
                }
                className={`${baseInputClass} ${
                  formErrors.summary ? errorInputClass : ""
                }`}
              />
              {formErrors.summary && (
                <p
                  id="summary-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  {" "}
                  <FaExclamationCircle /> {formErrors.summary}{" "}
                </p>
              )}
            </div>
            <div>
              {" "}
              {/* Author */}
              <label htmlFor="edit-author" className={baseLabelClass}>
                {" "}
                <FaUser className="text-gray-400" /> Author(s){" "}
              </label>
              <input
                type="text"
                id="edit-author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                disabled={isSaving}
                aria-invalid={!!formErrors.author}
                aria-describedby={
                  formErrors.author ? "author-error" : undefined
                }
                className={`${baseInputClass} ${
                  formErrors.author ? errorInputClass : ""
                }`}
              />
              {formErrors.author && (
                <p
                  id="author-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  {" "}
                  <FaExclamationCircle /> {formErrors.author}{" "}
                </p>
              )}
            </div>
            <div>
              {" "}
              {/* Tags */}
              <label htmlFor="edit-tags" className={baseLabelClass}>
                {" "}
                <FaTag className="text-gray-400" /> Tags{" "}
              </label>
              <input
                type="text"
                id="edit-tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                disabled={isSaving}
                aria-describedby="tags-hint"
                className={baseInputClass}
                placeholder="e.g., AI, Machine Learning, Bioinformatics"
              />
              <p
                id="tags-hint"
                className="mt-1.5 text-xs text-gray-500 flex items-center gap-1"
              >
                {" "}
                <FaInfoCircle /> Separate tags with commas.{" "}
              </p>
            </div>
            <div>
              {" "}
              {/* Research Area */}
              <label htmlFor="edit-area" className={baseLabelClass}>
                {" "}
                <FaFlask className="text-gray-400" /> Research Area{" "}
              </label>
              <input
                type="text"
                id="edit-area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                disabled={isSaving}
                aria-invalid={!!formErrors.area}
                aria-describedby={formErrors.area ? "area-error" : undefined}
                className={`${baseInputClass} ${
                  formErrors.area ? errorInputClass : ""
                }`}
                placeholder="e.g., Computer Science, Biology"
              />
              {formErrors.area && (
                <p
                  id="area-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  {" "}
                  <FaExclamationCircle /> {formErrors.area}{" "}
                </p>
              )}
            </div>
            <div>
              {" "}
              {/* Publication Date */}
              <label htmlFor="edit-publicationDate" className={baseLabelClass}>
                {" "}
                <FaCalendarAlt className="text-gray-400" /> Publication Date
                (Optional){" "}
              </label>
              <input
                type="date"
                id="edit-publicationDate"
                name="publicationDate"
                value={formData.publicationDate}
                onChange={handleInputChange}
                disabled={isSaving}
                aria-invalid={!!formErrors.publicationDate}
                aria-describedby={
                  formErrors.publicationDate ? "date-error" : "date-hint"
                }
                className={`${baseInputClass} ${
                  formErrors.publicationDate ? errorInputClass : ""
                }`}
              />
              {formErrors.publicationDate ? (
                <p
                  id="date-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  {" "}
                  <FaExclamationCircle /> {formErrors.publicationDate}{" "}
                </p>
              ) : (
                <p
                  id="date-hint"
                  className="mt-1.5 text-xs text-gray-500 flex items-center gap-1"
                >
                  {" "}
                  <FaInfoCircle /> Select the date the publication was
                  officially released.{" "}
                </p>
              )}
            </div>
            <div>
              {" "}
              {/* Document Link */}
              <label htmlFor="edit-document_link" className={baseLabelClass}>
                {" "}
                <FaLink className="text-gray-400" /> Document Link (Optional){" "}
              </label>
              <input
                type="url"
                id="edit-document_link"
                name="document_link"
                value={formData.document_link}
                onChange={handleInputChange}
                disabled={isSaving}
                aria-invalid={!!formErrors.document_link}
                aria-describedby={
                  formErrors.document_link ? "link-error" : "link-hint"
                }
                className={`${baseInputClass} ${
                  formErrors.document_link ? errorInputClass : ""
                }`}
                placeholder="https://example.com/publication.pdf"
              />
              {formErrors.document_link ? (
                <p
                  id="link-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  {" "}
                  <FaExclamationCircle /> {formErrors.document_link}{" "}
                </p>
              ) : (
                <p
                  id="link-hint"
                  className="mt-1.5 text-xs text-gray-500 flex items-center gap-1"
                >
                  {" "}
                  <FaInfoCircle /> Link to the full text, DOI, or project page
                  (must start with http/https).{" "}
                </p>
              )}
            </div>
            <div>
              {" "}
              {/* Journal */}
              <label htmlFor="edit-journal" className={baseLabelClass}>
                {" "}
                <FaBookOpen className="text-gray-400" /> Journal/Conference
                (Optional){" "}
              </label>
              <input
                type="text"
                id="edit-journal"
                name="journal"
                value={formData.journal}
                onChange={handleInputChange}
                disabled={isSaving}
                className={baseInputClass}
                placeholder="e.g., Nature, NeurIPS 2024"
              />
            </div>
            <div>
              {" "}
              {/* DOI */}
              <label htmlFor="edit-doi" className={baseLabelClass}>
                {" "}
                <FaExternalLinkAlt className="text-gray-400" /> DOI (Optional){" "}
              </label>
              <input
                type="text"
                id="edit-doi"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                disabled={isSaving}
                className={baseInputClass}
                placeholder="e.g., 10.1000/xyz123"
              />
            </div>
            <div>
              {" "}
              {/* Thumbnail URL */}
              <label htmlFor="edit-thumbnail" className={baseLabelClass}>
                {" "}
                <FaImage className="text-gray-400" /> Thumbnail URL (Optional){" "}
              </label>
              <input
                type="url"
                id="edit-thumbnail"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleInputChange}
                disabled={isSaving}
                aria-invalid={!!formErrors.thumbnail}
                aria-describedby={
                  formErrors.thumbnail ? "thumbnail-error" : "thumbnail-hint"
                }
                className={`${baseInputClass} ${
                  formErrors.thumbnail ? errorInputClass : ""
                }`}
                placeholder="https://example.com/image.png"
              />
              {formErrors.thumbnail ? (
                <p
                  id="thumbnail-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  <FaExclamationCircle /> {formErrors.thumbnail}
                </p>
              ) : (
                <p
                  id="thumbnail-hint"
                  className="mt-1.5 text-xs text-gray-500 flex items-center gap-1"
                >
                  <FaInfoCircle /> Link to an image for the publication card.
                </p>
              )}
            </div>

            {/* REMOVED: Collaboration Status Field */}
            {/* <div>
              <label htmlFor="edit-collabStatus" className={baseLabelClass}> <FaUsers className="text-gray-400" /> Collaboration Status </label>
              <select id="edit-collabStatus" name="collaborationStatus" value={formData.collaborationStatus} onChange={handleInputChange} disabled={isSaving} className={`${baseInputClass} appearance-none pr-8`} >
                <option value="open">Open to Collaboration</option>
                <option value="in_progress">Collaboration In Progress</option>
                <option value="closed">Not Seeking Collaboration</option>
              </select>
            </div> */}

            {/* --- 🆕 NEW FIELDS --- */}
            <div className="pt-6 mt-6 border-t border-gray-200/80 space-y-6">
              <h3 className="text-lg font-medium text-gray-800">
                Additional Details
              </h3>
              <div>
                {" "}
                {/* Language */}
                <label htmlFor="edit-language" className={baseLabelClass}>
                  {" "}
                  <FaGlobe className="text-gray-400" /> Language{" "}
                </label>
                <input
                  type="text"
                  id="edit-language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className={baseInputClass}
                  placeholder="e.g., English, Spanish"
                />
              </div>
              <div>
                {" "}
                {/* Version */}
                <label htmlFor="edit-version" className={baseLabelClass}>
                  {" "}
                  <FaCodeBranch className="text-gray-400" /> Version{" "}
                </label>
                <input
                  type="text"
                  id="edit-version"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className={baseInputClass}
                  placeholder="e.g., v1.0, Preprint"
                />
              </div>
              <div className="flex items-center">
                {" "}
                {/* isPeerReviewed */}
                <input
                  type="checkbox"
                  id="edit-isPeerReviewed"
                  name="isPeerReviewed"
                  checked={formData.isPeerReviewed}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                />
                <label
                  htmlFor="edit-isPeerReviewed"
                  className="text-sm font-medium text-gray-700"
                >
                  {" "}
                  <FaCheckCircle className="text-gray-400 inline mr-1.5" /> Is
                  Peer Reviewed?{" "}
                </label>
              </div>
              <div>
                {" "}
                {/* License */}
                <label htmlFor="edit-license" className={baseLabelClass}>
                  {" "}
                  <FaBalanceScale className="text-gray-400" /> License
                  (Optional){" "}
                </label>
                <input
                  type="text"
                  id="edit-license"
                  name="license"
                  value={formData.license}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className={baseInputClass}
                  placeholder="e.g., MIT, CC BY-SA 4.0"
                />
              </div>
              <div>
                {" "}
                {/* Last Reviewed At */}
                <label htmlFor="edit-lastReviewedAt" className={baseLabelClass}>
                  {" "}
                  <FaHistory className="text-gray-400" /> Last Reviewed Date
                  (Optional){" "}
                </label>
                <input
                  type="date"
                  id="edit-lastReviewedAt"
                  name="lastReviewedAt"
                  value={formData.lastReviewedAt}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  aria-invalid={!!formErrors.lastReviewedAt}
                  aria-describedby={
                    formErrors.lastReviewedAt
                      ? "lastReviewedAt-error"
                      : "lastReviewedAt-hint"
                  }
                  className={`${baseInputClass} ${
                    formErrors.lastReviewedAt ? errorInputClass : ""
                  }`}
                />
                {formErrors.lastReviewedAt ? (
                  <p
                    id="lastReviewedAt-error"
                    className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                  >
                    {" "}
                    <FaExclamationCircle /> {formErrors.lastReviewedAt}{" "}
                  </p>
                ) : (
                  <p
                    id="lastReviewedAt-hint"
                    className="mt-1.5 text-xs text-gray-500 flex items-center gap-1"
                  >
                    {" "}
                    <FaInfoCircle /> Date of the last significant review or
                    update.{" "}
                  </p>
                )}
              </div>
              {/* Note: Rating and Download Count are typically not editable directly in this form.
                    They are often derived from user interactions or system events.
                    If you need to edit them, add input fields similar to the above.
                */}
            </div>

            {/* --- Action Buttons --- */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200/80 mt-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isSaving}
                className={secondaryButtonClass}
              >
                {" "}
                {/* Changed to navigate(-1) for better UX */}
                <FaTimes /> Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={primaryButtonClass}
              >
                {isSaving ? (
                  <>
                    {" "}
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />{" "}
                    Saving...{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <FaSave /> Save Changes{" "}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPublicationPage;
