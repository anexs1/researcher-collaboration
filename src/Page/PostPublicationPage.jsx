// src/Component/Profile/PostPublicationForm.jsx (AFTER - Updated)
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaPaperPlane, // For Submit button
  FaTimes, // For Cancel (if you add one)
  FaSpinner,
  FaExclamationCircle,
  FaUser,
  FaTag,
  FaFlask,
  FaCalendarAlt,
  FaLink,
  FaInfoCircle,
  FaBookOpen, // For Journal
  FaExternalLinkAlt, // For DOI
  FaImage, // For Thumbnail
  FaGlobe,
  FaCodeBranch,
  FaCheckCircle,
  FaBalanceScale,
  FaHistory,
} from "react-icons/fa";

// API Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Reusable Style Constants ---
const baseInputClass =
  "block w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 disabled:bg-gray-100";
const errorInputClass = "border-red-500 focus:ring-red-500";
const baseLabelClass =
  "block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5";
const baseButtonClass =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
const primaryButtonClass = `${baseButtonClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent`;
// const secondaryButtonClass = `${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-indigo-500`;

const PostPublicationForm = ({ currentUser, showNotification }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    author: currentUser?.username || "", // Pre-fill author
    tags: "",
    area: "",
    publicationDate: "", // YYYY-MM-DD
    document_link: "",
    journal: "",
    doi: "",
    thumbnail: "",
    // collaborationStatus: "open", // <<<< REMOVED
    // 🆕 New fields with defaults
    language: "English",
    version: "v1.0",
    isPeerReviewed: false,
    license: "",
    lastReviewedAt: "", // YYYY-MM-DD
    // Citations, views, rating, downloadCount are usually set by system/other actions, not on initial post
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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
    if (!formData.title.trim()) errors.title = "Title is required.";
    if (!formData.summary.trim()) errors.summary = "Summary is required.";
    if (!formData.author.trim()) errors.author = "Author is required.";
    if (!formData.area.trim()) errors.area = "Research Area is required.";

    if (
      formData.document_link &&
      !/^https?:\/\/.+/.test(formData.document_link)
    ) {
      errors.document_link = "Enter a valid URL (http:// or https://).";
    }
    if (formData.thumbnail && !/^https?:\/\/.+/.test(formData.thumbnail)) {
      errors.thumbnail = "Enter a valid URL for the thumbnail.";
    }
    const validateDate = (dateStr, fieldName, allowFuture = true) => {
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) errors[fieldName] = "Invalid date format.";
          else if (!allowFuture && date > new Date()) {
            // Add a day to 'today' for comparison to avoid timezone issues making 'today' seem like future
            const today = new Date();
            today.setHours(23, 59, 59, 999); // Set to end of today
            if (date > today)
              errors[fieldName] = "Date cannot be in the future.";
          }
        } catch (e) {
          errors[fieldName] = "Invalid date format.";
        }
      }
    };
    validateDate(formData.publicationDate, "publicationDate", false); // Publication date usually not in future
    validateDate(formData.lastReviewedAt, "lastReviewedAt", false); // Last reviewed date also usually not in future

    // Add more specific validations for new fields if needed
    // e.g., formData.version format, specific license options from a dropdown

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification(
        "Please correct the form errors before submitting.",
        "error"
      );
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      firstErrorField?.focus();
      return;
    }

    setIsSubmitting(true);
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
      language: formData.language?.trim() || "English", // Provide default if empty
      version: formData.version?.trim() || "v1.0", // Provide default if empty
      isPeerReviewed: formData.isPeerReviewed,
      license: formData.license?.trim() || null,
      lastReviewedAt: formData.lastReviewedAt || null,
      // `citations`, `views`, `rating`, `downloadCount` will be defaulted by backend/DB
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/publications`,
        payload,
        { headers: getAuthHeaders() }
      );

      if (response.data?.success && response.data.data) {
        showNotification("Publication posted successfully!", "success");
        // Navigate to the newly created publication's page or the list
        navigate(`/publications/${response.data.data.id}`); // Or navigate('/publications');
      } else {
        throw new Error(
          response.data?.message || "Failed to post publication."
        );
      }
    } catch (err) {
      console.error("Error posting publication:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not post publication.";
      showNotification(`Error: ${errMsg}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-gray-200">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center">
        Share Your Research
      </h1>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* --- CORE FIELDS (similar to Edit form) --- */}
        <div>
          {" "}
          {/* Title */}
          <label htmlFor="post-title" className={baseLabelClass}>
            {" "}
            <FaUser className="text-gray-400" /> Title{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="post-title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            aria-invalid={!!formErrors.title}
            className={`${baseInputClass} ${
              formErrors.title ? errorInputClass : ""
            }`}
          />
          {formErrors.title && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <FaExclamationCircle /> {formErrors.title}
            </p>
          )}
        </div>
        <div>
          {" "}
          {/* Summary */}
          <label htmlFor="post-summary" className={baseLabelClass}>
            {" "}
            <FaInfoCircle className="text-gray-400" /> Summary{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="post-summary"
            name="summary"
            rows="6"
            value={formData.summary}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            aria-invalid={!!formErrors.summary}
            className={`${baseInputClass} ${
              formErrors.summary ? errorInputClass : ""
            }`}
          />
          {formErrors.summary && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <FaExclamationCircle /> {formErrors.summary}
            </p>
          )}
        </div>
        <div>
          {" "}
          {/* Author */}
          <label htmlFor="post-author" className={baseLabelClass}>
            {" "}
            <FaUser className="text-gray-400" /> Author(s){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="post-author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            aria-invalid={!!formErrors.author}
            className={`${baseInputClass} ${
              formErrors.author ? errorInputClass : ""
            }`}
          />
          {formErrors.author && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <FaExclamationCircle /> {formErrors.author}
            </p>
          )}
        </div>
        <div>
          {" "}
          {/* Tags */}
          <label htmlFor="post-tags" className={baseLabelClass}>
            {" "}
            <FaTag className="text-gray-400" /> Tags{" "}
          </label>
          <input
            type="text"
            id="post-tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className={baseInputClass}
            placeholder="e.g., AI, Neuroscience, Climate Change"
          />
          <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
            {" "}
            <FaInfoCircle /> Separate tags with commas.{" "}
          </p>
        </div>
        <div>
          {" "}
          {/* Research Area */}
          <label htmlFor="post-area" className={baseLabelClass}>
            {" "}
            <FaFlask className="text-gray-400" /> Research Area{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="post-area"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            aria-invalid={!!formErrors.area}
            className={`${baseInputClass} ${
              formErrors.area ? errorInputClass : ""
            }`}
            placeholder="e.g., Computer Science, Biology"
          />
          {formErrors.area && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <FaExclamationCircle /> {formErrors.area}
            </p>
          )}
        </div>
        <div>
          {" "}
          {/* Publication Date */}
          <label htmlFor="post-publicationDate" className={baseLabelClass}>
            {" "}
            <FaCalendarAlt className="text-gray-400" /> Publication Date
            (Optional){" "}
          </label>
          <input
            type="date"
            id="post-publicationDate"
            name="publicationDate"
            value={formData.publicationDate}
            onChange={handleInputChange}
            disabled={isSubmitting}
            aria-invalid={!!formErrors.publicationDate}
            className={`${baseInputClass} ${
              formErrors.publicationDate ? errorInputClass : ""
            }`}
            max={new Date().toISOString().split("T")[0]}
          />
          {formErrors.publicationDate && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <FaExclamationCircle /> {formErrors.publicationDate}
            </p>
          )}
        </div>
        <div>
          {" "}
          {/* Document Link */}
          <label htmlFor="post-document_link" className={baseLabelClass}>
            {" "}
            <FaLink className="text-gray-400" /> Document Link (Optional){" "}
          </label>
          <input
            type="url"
            id="post-document_link"
            name="document_link"
            value={formData.document_link}
            onChange={handleInputChange}
            disabled={isSubmitting}
            aria-invalid={!!formErrors.document_link}
            className={`${baseInputClass} ${
              formErrors.document_link ? errorInputClass : ""
            }`}
            placeholder="https://example.com/publication.pdf"
          />
          {formErrors.document_link && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <FaExclamationCircle /> {formErrors.document_link}
            </p>
          )}
        </div>
        <div>
          {" "}
          {/* Journal */}
          <label htmlFor="post-journal" className={baseLabelClass}>
            {" "}
            <FaBookOpen className="text-gray-400" /> Journal/Conference
            (Optional){" "}
          </label>
          <input
            type="text"
            id="post-journal"
            name="journal"
            value={formData.journal}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className={baseInputClass}
            placeholder="e.g., Nature, NeurIPS 2024"
          />
        </div>
        <div>
          {" "}
          {/* DOI */}
          <label htmlFor="post-doi" className={baseLabelClass}>
            {" "}
            <FaExternalLinkAlt className="text-gray-400" /> DOI (Optional){" "}
          </label>
          <input
            type="text"
            id="post-doi"
            name="doi"
            value={formData.doi}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className={baseInputClass}
            placeholder="e.g., 10.1000/xyz123"
          />
        </div>
        <div>
          {" "}
          {/* Thumbnail URL */}
          <label htmlFor="post-thumbnail" className={baseLabelClass}>
            {" "}
            <FaImage className="text-gray-400" /> Thumbnail URL (Optional){" "}
          </label>
          <input
            type="url"
            id="post-thumbnail"
            name="thumbnail"
            value={formData.thumbnail}
            onChange={handleInputChange}
            disabled={isSubmitting}
            aria-invalid={!!formErrors.thumbnail}
            className={`${baseInputClass} ${
              formErrors.thumbnail ? errorInputClass : ""
            }`}
            placeholder="https://example.com/image.png"
          />
          {formErrors.thumbnail && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <FaExclamationCircle /> {formErrors.thumbnail}
            </p>
          )}
        </div>

        {/* REMOVED: Collaboration Status Field */}

        {/* --- 🆕 NEW FIELDS --- */}
        <div className="pt-6 mt-6 border-t border-gray-200/80 space-y-6">
          <h3 className="text-lg font-medium text-gray-800">
            Additional Details (Optional)
          </h3>
          <div>
            {" "}
            {/* Language */}
            <label htmlFor="post-language" className={baseLabelClass}>
              {" "}
              <FaGlobe className="text-gray-400" /> Language{" "}
            </label>
            <input
              type="text"
              id="post-language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={baseInputClass}
              placeholder="Default: English"
            />
          </div>
          <div>
            {" "}
            {/* Version */}
            <label htmlFor="post-version" className={baseLabelClass}>
              {" "}
              <FaCodeBranch className="text-gray-400" /> Version{" "}
            </label>
            <input
              type="text"
              id="post-version"
              name="version"
              value={formData.version}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={baseInputClass}
              placeholder="Default: v1.0"
            />
          </div>
          <div className="flex items-center">
            {" "}
            {/* isPeerReviewed */}
            <input
              type="checkbox"
              id="post-isPeerReviewed"
              name="isPeerReviewed"
              checked={formData.isPeerReviewed}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
            />
            <label
              htmlFor="post-isPeerReviewed"
              className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
            >
              {" "}
              <FaCheckCircle className="text-gray-400" /> Is this Peer Reviewed?{" "}
            </label>
          </div>
          <div>
            {" "}
            {/* License */}
            <label htmlFor="post-license" className={baseLabelClass}>
              {" "}
              <FaBalanceScale className="text-gray-400" /> License{" "}
            </label>
            <input
              type="text"
              id="post-license"
              name="license"
              value={formData.license}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={baseInputClass}
              placeholder="e.g., MIT, CC BY-SA 4.0"
            />
          </div>
          <div>
            {" "}
            {/* Last Reviewed At */}
            <label htmlFor="post-lastReviewedAt" className={baseLabelClass}>
              {" "}
              <FaHistory className="text-gray-400" /> Last Reviewed Date{" "}
            </label>
            <input
              type="date"
              id="post-lastReviewedAt"
              name="lastReviewedAt"
              value={formData.lastReviewedAt}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={!!formErrors.lastReviewedAt}
              className={`${baseInputClass} ${
                formErrors.lastReviewedAt ? errorInputClass : ""
              }`}
              max={new Date().toISOString().split("T")[0]}
            />
            {formErrors.lastReviewedAt && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <FaExclamationCircle /> {formErrors.lastReviewedAt}
              </p>
            )}
          </div>
        </div>

        {/* --- Action Button --- */}
        <div className="pt-8 mt-8 border-t border-gray-200/80">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${primaryButtonClass} w-full sm:w-auto`}
          >
            {isSubmitting ? (
              <>
                {" "}
                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />{" "}
                Posting...{" "}
              </>
            ) : (
              <>
                {" "}
                <FaPaperPlane /> Post Publication{" "}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostPublicationForm;
