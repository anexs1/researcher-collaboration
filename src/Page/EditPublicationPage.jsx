import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSave,
  FaTimes, // For Cancel button
  FaSpinner, // Alternative loading icon
  FaExclamationCircle, // For error messages
  FaUser,
  FaTag,
  FaFlask,
  FaCalendarAlt,
  FaLink,
  FaUsers, // For Collaboration Status
  FaInfoCircle, // For hints
} from "react-icons/fa";

import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Verify path
import ErrorMessage from "../Component/Common/ErrorMessage"; // Verify path
import Notification from "../Component/Common/Notification"; // Verify path

// API Base URL (Ensure consistency)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Reusable Style Constants --- (Similar to Publication.jsx)
const baseInputClass =
  "block w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 disabled:bg-gray-100";
const errorInputClass = "border-red-500 focus:ring-red-500";
const baseLabelClass =
  "block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5";
const baseButtonClass =
  "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
const primaryButtonClass = `${baseButtonClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent`;
const secondaryButtonClass = `${baseButtonClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-indigo-500`;

// --- Component ---
const EditPublicationPage = () => {
  const { id: publicationId } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [publicationData, setPublicationData] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    author: "",
    tags: "",
    area: "",
    publicationDate: "",
    document_link: "",
    collaborationStatus: "open",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General page load error
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [formErrors, setFormErrors] = useState({}); // Specific field errors

  // --- Notification Handler ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // --- Fetch Publication Data ---
  useEffect(() => {
    const fetchPublication = async () => {
      setLoading(true);
      setError(null);
      setFormErrors({}); // Clear previous form errors on load
      try {
        if (!publicationId) throw new Error("No Publication ID provided.");

        const url = `${API_BASE_URL}/api/publications/${publicationId}`;
        const response = await axios.get(url, { headers: getAuthHeaders() });

        if (response.data?.success && response.data.data) {
          const fetchedPub = response.data.data;
          setPublicationData(fetchedPub); // Keep original data for reference if needed

          // Format date for input type="date" (YYYY-MM-DD)
          let formattedDate = "";
          if (fetchedPub.publicationDate) {
            try {
              // Ensure it's a valid date object before formatting
              const dateObj = new Date(fetchedPub.publicationDate);
              if (!isNaN(dateObj.getTime())) {
                // Format to YYYY-MM-DD. Handle timezone offset carefully.
                //toISOString gives YYYY-MM-DDTHH:mm:ss.sssZ, slice(0, 10) gets the date part.
                formattedDate = dateObj.toISOString().slice(0, 10);
              } else {
                console.warn(
                  "Fetched publicationDate is invalid:",
                  fetchedPub.publicationDate
                );
              }
            } catch (dateError) {
              console.error("Error parsing publicationDate:", dateError);
            }
          }

          // Pre-fill form state
          setFormData({
            title: fetchedPub.title || "",
            summary: fetchedPub.summary || "",
            author: fetchedPub.author || "",
            tags: Array.isArray(fetchedPub.tags)
              ? fetchedPub.tags.join(", ")
              : "",
            area: fetchedPub.area || "",
            publicationDate: formattedDate,
            document_link: fetchedPub.document_link || "",
            collaborationStatus: fetchedPub.collaborationStatus || "open",
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

  // --- Form Handling ---
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear the specific error when user starts typing in the field
      if (formErrors[name]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [formErrors]
  ); // Include formErrors dependency

  // --- Form Validation ---
  const validateForm = useCallback(() => {
    let errors = {};
    if (!formData.title?.trim()) errors.title = "Title cannot be empty.";
    if (!formData.summary?.trim()) errors.summary = "Summary cannot be empty.";
    if (!formData.author?.trim()) errors.author = "Author cannot be empty.";
    if (!formData.area?.trim()) errors.area = "Research Area cannot be empty.";
    // Basic URL validation (can be improved)
    if (
      formData.document_link &&
      !/^https?:\/\/.+/.test(formData.document_link)
    ) {
      errors.document_link =
        "Please enter a valid URL (starting with http:// or https://).";
    }
    // Date validation (check if it's a reasonable date if entered)
    if (formData.publicationDate) {
      try {
        const date = new Date(formData.publicationDate);
        if (isNaN(date.getTime())) {
          errors.publicationDate = "Invalid date format.";
        }
        // Optional: Check if date is in the future? Depends on requirements.
        // else if (date > new Date()) {
        //     errors.publicationDate = "Publication date cannot be in the future.";
        // }
      } catch (e) {
        errors.publicationDate = "Invalid date format.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0; // True if no errors
  }, [formData]);

  // --- Save Handler ---
  const handleSave = async (e) => {
    e.preventDefault();
    setError(null); // Clear general errors before saving

    if (!validateForm()) {
      showNotification("Please review the form for errors.", "error");
      // Find the first field with an error and focus it (optional UX improvement)
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      firstErrorField?.focus();
      return;
    }

    setIsSaving(true);

    const tagsArray = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean); // Filter out empty strings after trim

    const payload = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      author: formData.author.trim(),
      tags: tagsArray,
      area: formData.area.trim(),
      // Ensure date is sent in a format backend expects (or null)
      // Sending YYYY-MM-DD might be fine, or convert back to ISOString if needed
      publicationDate: formData.publicationDate || null,
      document_link: formData.document_link?.trim() || null,
      collaborationStatus: formData.collaborationStatus,
    };

    try {
      const url = `${API_BASE_URL}/api/publications/${publicationId}`;
      const response = await axios.put(url, payload, {
        headers: getAuthHeaders(),
      });

      if (response.data?.success) {
        // Update local state with the *saved* data (optional, depends if you stay on page)
        const savedPub = response.data.data;
        setPublicationData(savedPub); // Update the reference data
        // You might re-format the form data based on savedPub if needed, e.g., date format
        // setFormData({...}); // Or just rely on navigation

        showNotification("Publication updated successfully!", "success");
        // Navigate back to the publications list after a short delay
        setTimeout(() => navigate("/publications"), 1500);
      } else {
        // Handle specific backend failure messages
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
      setError(errMsg); // Show a general error message at the top
      showNotification(`Update failed: ${errMsg}`, "error"); // Show detailed error in notification
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Logic ---

  // 1. Initial Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        {" "}
        {/* Adjust height as needed */}
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // 2. Page Load Error State (e.g., publication not found, network error)
  if (error && !publicationData) {
    // Show only if data couldn't be loaded at all
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <ErrorMessage
          title="Error Loading Publication"
          message={error}
          onClose={() => navigate("/publications")} // Option to go back
        />
      </div>
    );
  }

  // 3. Data Loaded, Render Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fixed Notification Area */}
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 mb-1">
              Edit Publication
            </h1>
            {publicationData?.title && (
              <p className="text-lg text-gray-600">
                Editing:{" "}
                <span className="font-medium">{publicationData.title}</span>
              </p>
            )}
          </div>
          {/* Display general save errors here if needed */}
          {error &&
            publicationData && ( // Show save errors separately if form is visible
              <div className="mb-6">
                <ErrorMessage
                  title="Update Error"
                  message={error}
                  onClose={() => setError(null)}
                />
              </div>
            )}
          {/* Form Card */}
          <form
            onSubmit={handleSave}
            noValidate // Disable browser default validation, rely on ours
            className="space-y-6 bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200/80"
          >
            {/* --- Form Fields --- */}

            {/* Title */}
            <div>
              <label htmlFor="edit-title" className={baseLabelClass}>
                <FaUser className="text-gray-400" /> Title
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
                  <FaExclamationCircle /> {formErrors.title}
                </p>
              )}
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="edit-summary" className={baseLabelClass}>
                <FaInfoCircle className="text-gray-400" /> Summary
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
                  <FaExclamationCircle /> {formErrors.summary}
                </p>
              )}
            </div>

            {/* Author */}
            <div>
              <label htmlFor="edit-author" className={baseLabelClass}>
                <FaUser className="text-gray-400" /> Author(s)
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
                  <FaExclamationCircle /> {formErrors.author}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="edit-tags" className={baseLabelClass}>
                <FaTag className="text-gray-400" /> Tags
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
                <FaInfoCircle /> Separate tags with commas.
              </p>
            </div>

            {/* Research Area */}
            <div>
              <label htmlFor="edit-area" className={baseLabelClass}>
                <FaFlask className="text-gray-400" /> Research Area
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
                  <FaExclamationCircle /> {formErrors.area}
                </p>
              )}
            </div>

            {/* Publication Date */}
            <div>
              <label htmlFor="edit-publicationDate" className={baseLabelClass}>
                <FaCalendarAlt className="text-gray-400" /> Publication Date
                (Optional)
              </label>
              <input
                type="date" // Use HTML5 date picker
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
                // Optional: Set max date to today if future dates aren't allowed
                // max={new Date().toISOString().split("T")[0]}
              />
              {formErrors.publicationDate ? (
                <p
                  id="date-error"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  <FaExclamationCircle /> {formErrors.publicationDate}
                </p>
              ) : (
                <p
                  id="date-hint"
                  className="mt-1.5 text-xs text-gray-500 flex items-center gap-1"
                >
                  <FaInfoCircle /> Select the date the publication was
                  officially released.
                </p>
              )}
            </div>

            {/* Document Link */}
            <div>
              <label htmlFor="edit-document_link" className={baseLabelClass}>
                <FaLink className="text-gray-400" /> Document Link (Optional)
              </label>
              <input
                type="url" // Use URL type for basic browser validation hints
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
                  <FaExclamationCircle /> {formErrors.document_link}
                </p>
              ) : (
                <p
                  id="link-hint"
                  className="mt-1.5 text-xs text-gray-500 flex items-center gap-1"
                >
                  <FaInfoCircle /> Link to the full text, DOI, or project page
                  (must start with http/https).
                </p>
              )}
            </div>

            {/* Collaboration Status */}
            <div>
              <label htmlFor="edit-collabStatus" className={baseLabelClass}>
                <FaUsers className="text-gray-400" /> Collaboration Status
              </label>
              <select
                id="edit-collabStatus"
                name="collaborationStatus"
                value={formData.collaborationStatus}
                onChange={handleInputChange}
                disabled={isSaving}
                className={`${baseInputClass} appearance-none pr-8`} // Add appearance-none for custom arrow styling (needs more setup usually)
              >
                <option value="open">Open to Collaboration</option>
                <option value="in_progress">Collaboration In Progress</option>
                <option value="closed">Not Seeking Collaboration</option>
              </select>
              {/* You might add a custom dropdown arrow here if needed */}
            </div>

            {/* --- Action Buttons --- */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200/80 mt-8">
              <button
                type="button"
                onClick={() => navigate("/publications")} // Go back to the list
                disabled={isSaving}
                className={secondaryButtonClass}
              >
                <FaTimes /> Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={primaryButtonClass}
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>{" "}
          {/* --- END FORM --- */}
        </div>{" "}
        {/* End Max Width Container */}
      </div>{" "}
      {/* End Page Container */}
    </div> /* End Page Wrapper */
  );
};

export default EditPublicationPage;
