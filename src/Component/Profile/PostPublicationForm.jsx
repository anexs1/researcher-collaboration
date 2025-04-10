// src/Component/Profile/PostPublicationForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaPaperPlane,
  FaSpinner,
  FaTag,
  FaCalendarAlt,
  FaFlask,
} from "react-icons/fa";
// Adjust these paths if your Common components are elsewhere
import ErrorMessage from "../Common/ErrorMessage";

// API Base URL (Ensure this is consistent with your setup)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Default Publication Form Data Structure
const defaultPublicationData = {
  title: "",
  summary: "",
  author: "",
  tags: "", // Stored as comma-separated string in form
  area: "",
  publicationDate: "",
  document_link: "",
};

// Research Areas for the dropdown
const researchAreas = [
  "", // Default empty option
  "Computer Science",
  "Physics",
  "Engineering",
  "Biology",
  "Health",
  "Ethics",
  "Other",
];

export default function PostPublicationForm({ currentUser, showNotification }) {
  const navigate = useNavigate();

  // --- State ---
  const [formData, setFormData] = useState(defaultPublicationData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // --- Effect to Set Default Author ---
  useEffect(() => {
    // Set author only if currentUser is available and form author hasn't been manually changed
    if (currentUser) {
      const authorName =
        `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
        currentUser.username ||
        "";
      // Update only if the form is still default or author is empty
      if (
        formData.author === "" ||
        formData.author === defaultPublicationData.author
      ) {
        setFormData((prev) => ({
          ...prev,
          author: authorName,
        }));
      }
    } else {
      // Reset form if user logs out or currentUser becomes unavailable
      setFormData(defaultPublicationData);
    }
    // We only want this effect to re-run when currentUser changes,
    // not when formData.author changes due to user input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // --- Input Change Handler ---
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear validation error for the field being changed
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors] // Recreate handler if errors object changes reference
  );

  // --- Form Validation ---
  const validateForm = useCallback(() => {
    let formErrors = {};
    if (!formData.title?.trim()) formErrors.title = "Title is required";
    if (!formData.summary?.trim()) formErrors.summary = "Summary is required";
    if (!formData.author?.trim()) formErrors.author = "Author name is required";
    if (!formData.area?.trim()) formErrors.area = "Research Area is required";
    if (!formData.publicationDate)
      formErrors.publicationDate = "Publication Date is required";
    if (!formData.document_link?.trim()) {
      formErrors.document_link = "Document link is required";
    } else {
      try {
        // Basic URL validation
        new URL(formData.document_link);
      } catch (_) {
        formErrors.document_link =
          "Please enter a valid URL (e.g., https://...)";
      }
    }
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0; // Return true if no errors
  }, [formData]); // Recreate validator if formData changes

  // --- Reset Form ---
  const resetForm = useCallback(() => {
    const currentAuthor = currentUser
      ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
        currentUser.username ||
        ""
      : "";
    setFormData({
      ...defaultPublicationData,
      author: currentAuthor, // Reset author based on current user
    });
    setErrors({});
    setApiError("");
  }, [currentUser]); // Recreate reset function if currentUser changes

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default HTML form submission
    if (!validateForm()) {
      showNotification("Please fix the errors in the form.", "error");
      return; // Stop submission if validation fails
    }

    setIsSubmitting(true);
    setApiError("");
    const token = localStorage.getItem("authToken");

    if (!token) {
      setApiError("Authentication required. Please log in again.");
      showNotification("Authentication required.", "error");
      setIsSubmitting(false);
      return; // Stop if not authenticated
    }

    // Prepare the payload for the API
    const tagsArray = formData.tags
      .split(",") // Split by comma
      .map((tag) => tag.trim()) // Remove leading/trailing whitespace
      .filter((tag) => tag !== ""); // Remove any empty strings resulting from multiple commas etc.

    const payload = {
      title: formData.title,
      summary: formData.summary,
      author: formData.author,
      document_link: formData.document_link,
      tags: tagsArray, // Send tags as an array
      area: formData.area,
      publicationDate: formData.publicationDate,
      // collaborationStatus often defaults on backend, add here if needed:
      // collaborationStatus: 'open',
    };

    try {
      const url = `${API_BASE_URL}/api/publications`; // Verify your API endpoint
      await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification("Publication posted successfully!", "success");
      resetForm(); // Clear the form on success
      // Optional: Navigate away after success
      // navigate('/publications'); // Example: Navigate to a publications list page
      // Or just stay on the profile page
    } catch (error) {
      console.error("Error submitting publication:", error);
      // Extract more specific error message if available from backend response
      const errMsg =
        error.response?.data?.message ||
        "Failed to post publication. Please try again.";
      showNotification(errMsg, "error");
      setApiError(errMsg); // Display API error near the form
    } finally {
      setIsSubmitting(false); // Re-enable button regardless of success/failure
    }
  };

  // --- Render ---
  return (
    // Add margin-top for spacing from the profile card above it
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mt-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
        Post New Publication
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Display API error messages specific to this form */}
        {apiError && (
          <ErrorMessage message={apiError} onClose={() => setApiError("")} />
        )}

        {/* Title Field */}
        <div>
          <label
            htmlFor="pub-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            type="text"
            id="pub-title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="The Amazing Discovery"
            required
            className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Summary Field */}
        <div>
          <label
            htmlFor="pub-summary"
            className="block text-sm font-medium text-gray-700"
          >
            Summary
          </label>
          <textarea
            id="pub-summary"
            name="summary"
            rows="4"
            value={formData.summary}
            onChange={handleInputChange}
            placeholder="A brief overview of the publication's key findings or purpose..."
            required
            className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.summary ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.summary && (
            <p className="mt-1 text-xs text-red-600">{errors.summary}</p>
          )}
        </div>

        {/* Author Field */}
        <div>
          <label
            htmlFor="pub-author"
            className="block text-sm font-medium text-gray-700"
          >
            Author(s)
          </label>
          <input
            type="text"
            id="pub-author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="Defaults to your name. Add co-authors separated by commas if needed."
            required
            className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.author ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.author && (
            <p className="mt-1 text-xs text-red-600">{errors.author}</p>
          )}
        </div>

        {/* Tags Field */}
        <div>
          <label
            htmlFor="pub-tags"
            className="block text-sm font-medium text-gray-700"
          >
            Tags (comma-separated)
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaTag className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="pub-tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="e.g., AI, Machine Learning, Cancer Research"
              className={`pl-10 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.tags ? "border-red-500" : "border-gray-300"
              }`} /* Error styling optional for tags */
            />
          </div>
          {/* Optional: Add specific validation/error message for tags if needed */}
          {/* {errors.tags && <p className="mt-1 text-xs text-red-600">{errors.tags}</p>} */}
        </div>

        {/* Research Area Field (Dropdown) */}
        <div>
          <label
            htmlFor="pub-area"
            className="block text-sm font-medium text-gray-700"
          >
            Research Area
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFlask className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="pub-area"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              required
              className={`pl-10 block w-full py-2 pr-8 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none ${
                errors.area ? "border-red-500" : "border-gray-300"
              }`} /* Added appearance-none */
            >
              {researchAreas.map((areaOption) => (
                <option
                  key={areaOption}
                  value={areaOption}
                  disabled={areaOption === ""}
                >
                  {areaOption === "" ? "Select an area..." : areaOption}
                </option>
              ))}
            </select>
            {/* Add dropdown arrow indicator */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          {errors.area && (
            <p className="mt-1 text-xs text-red-600">{errors.area}</p>
          )}
        </div>

        {/* Publication Date Field */}
        <div>
          <label
            htmlFor="pub-date"
            className="block text-sm font-medium text-gray-700"
          >
            Publication Date
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="pub-date"
              name="publicationDate"
              value={formData.publicationDate}
              onChange={handleInputChange}
              required
              // Optionally add max date constraint
              max={new Date().toISOString().split("T")[0]}
              className={`pl-10 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.publicationDate ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>
          {errors.publicationDate && (
            <p className="mt-1 text-xs text-red-600">
              {errors.publicationDate}
            </p>
          )}
        </div>

        {/* Document Link Field */}
        <div>
          <label
            htmlFor="pub-link"
            className="block text-sm font-medium text-gray-700"
          >
            Document Link (URL)
          </label>
          <input
            type="url"
            id="pub-link"
            name="document_link"
            value={formData.document_link}
            onChange={handleInputChange}
            placeholder="https://example.com/path/to/your/paper.pdf"
            required
            className={`mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.document_link ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.document_link && (
            <p className="mt-1 text-xs text-red-600">{errors.document_link}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane className="-ml-1 mr-2 h-5 w-5" />
                Post Publication
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
