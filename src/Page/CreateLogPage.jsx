// src/pages/CreateLogPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaQuestionCircle,
  FaLightbulb,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

// Define log type options
const logTypes = [
  { value: "question", label: "Question", Icon: FaQuestionCircle },
  { value: "idea_hypothesis", label: "Idea / Hypothesis", Icon: FaLightbulb },
  { value: "observation", label: "Observation / Finding", Icon: FaSearch },
  { value: "collaboration", label: "Call for Collaboration", Icon: FaUsers },
];

// Constants
const MAX_LENGTH_TEXT = 500;
const MAX_LENGTH_TITLE = 80;
const MAX_TAGS = 5;

const CreateLogPage = ({ isLoggedIn, currentUser }) => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [tags, setTags] = useState("");
  const [logType, setLogType] = useState(logTypes[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const textareaRef = useRef(null);

  // Auth Check & Redirect
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", {
        replace: true,
        state: { message: "Please log in to post an idea." },
      });
    }
  }, [isLoggedIn, navigate]);

  // Autofocus Text Area
  useEffect(() => {
    if (isLoggedIn) {
      // Only focus if user wasn't redirected
      textareaRef.current?.focus();
    }
  }, [isLoggedIn]);

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    const trimmedText = ideaText.trim();
    const trimmedTitle = title.trim();

    // Validation
    if (!trimmedText) {
      setError("Please share your core idea or question first!");
      textareaRef.current?.focus();
      return;
    }
    if (trimmedText.length > MAX_LENGTH_TEXT) {
      setError(
        `The main text is too long (max ${MAX_LENGTH_TEXT} characters).`
      );
      textareaRef.current?.focus();
      return;
    }
    if (trimmedTitle.length > MAX_LENGTH_TITLE) {
      setError(`The title is too long (max ${MAX_LENGTH_TITLE} characters).`);
      return;
    }
    const parsedTags = [
      ...new Set(
        tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      ),
    ];
    if (parsedTags.length > MAX_TAGS) {
      setError(`You can add a maximum of ${MAX_TAGS} tags.`);
      return;
    }

    setIsSubmitting(true);
    const newLogData = {
      title: trimmedTitle || null,
      text: trimmedText,
      tags: parsedTags,
      logType: logType,
      visibility: "public",
    };

    // --- Simulate API Call ---
    // TODO: Replace this with actual fetch/axios POST to your backend API (e.g., POST /api/logs)
    console.log("[CreateLogPage] Simulating API POST:", newLogData);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Fake delay
      console.log("[CreateLogPage] API POST successful (simulated).");
      setSuccessMessage("Log posted successfully! Redirecting...");
      // Optional: Clear form state after success before redirect
      // setTitle(''); setIdeaText(''); setTags(''); setLogType(logTypes[0].value);
      setTimeout(() => {
        navigate("/explore");
      }, 1500); // Redirect after showing success
    } catch (submissionError) {
      console.error(
        "[CreateLogPage] API POST error (simulated):",
        submissionError
      );
      setError("Failed to post your log. Please try again later.");
      setIsSubmitting(false); // Re-enable button on error
    }
    // --- End Simulate API Call ---
  };

  const remainingChars = MAX_LENGTH_TEXT - ideaText.length;
  const isTextInvalid =
    error.includes("idea") ||
    error.includes("question") ||
    error.includes("text");
  const isTitleInvalid = error.includes("title");

  // Render null or loading indicator if redirecting
  if (!isLoggedIn) {
    return <div className="text-center p-10">Redirecting to login...</div>;
  }

  // Render the form
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Create New Thinking Log
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Share your quick thoughts, questions, or observations.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Optional Title */}
          <div>
            <label
              htmlFor="logTitle"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title{" "}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="logTitle"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (
                  isTitleInvalid &&
                  e.target.value.trim().length <= MAX_LENGTH_TITLE
                )
                  setError("");
              }}
              maxLength={MAX_LENGTH_TITLE}
              disabled={isSubmitting}
              placeholder="A brief title for your log..."
              className={`w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                isTitleInvalid
                  ? "border-red-400 ring-red-300"
                  : "border-gray-300 hover:border-gray-400 focus:ring-purple-500"
              }`}
              aria-describedby="error-message status-message"
            />
            {title.length > MAX_LENGTH_TITLE && (
              <p className="text-xs text-red-500 mt-1">
                Title exceeds {MAX_LENGTH_TITLE} characters.
              </p>
            )}
          </div>
          {/* Main Idea Text */}
          <div>
            <label
              htmlFor="ideaText"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Idea / Question <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              id="ideaText"
              rows="5"
              placeholder={`Elaborate on your thought, ${
                currentUser?.name || "researcher"
              }...`}
              value={ideaText}
              onChange={(e) => {
                setIdeaText(e.target.value);
                if (isTextInvalid && e.target.value.trim()) setError("");
              }}
              maxLength={MAX_LENGTH_TEXT}
              disabled={isSubmitting}
              className={`w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent resize-y transition-colors ${
                isTextInvalid
                  ? "border-red-400 ring-red-300"
                  : "border-gray-300 hover:border-gray-400 focus:ring-purple-500"
              }`}
              aria-required="true"
              aria-invalid={isTextInvalid}
              aria-describedby="char-count error-message status-message"
            />
            <div
              id="char-count"
              aria-live="polite"
              className={`text-xs mt-1 text-right font-medium ${
                remainingChars < 0
                  ? "text-red-600"
                  : remainingChars <= 30
                  ? "text-yellow-600"
                  : "text-gray-500"
              }`}
            >
              {" "}
              {remainingChars} characters remaining{" "}
            </div>
          </div>
          {/* Log Type Selector */}
          <div>
            <label
              htmlFor="logType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type of Log
            </label>
            <select
              id="logType"
              name="logType"
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-gray-400"
            >
              {logTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {" "}
                  {type.label}{" "}
                </option>
              ))}
            </select>
          </div>
          {/* Tags Input */}
          <div>
            <label
              htmlFor="tagsInput"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tags{" "}
              <span className="text-gray-500 font-normal">
                (Optional, up to {MAX_TAGS}, comma-separated)
              </span>
            </label>
            <input
              id="tagsInput"
              type="text"
              placeholder="Keywords to help discovery (e.g., methodology, ethics)"
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
                if (error.includes("tag")) setError("");
              }}
              disabled={isSubmitting}
              className={`w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                error.includes("tag")
                  ? "border-red-400 ring-red-300"
                  : "border-gray-300 hover:border-gray-400 focus:ring-purple-500"
              }`}
              aria-describedby="error-message status-message"
            />
            {tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t).length > MAX_TAGS && (
              <p className="text-xs text-red-500 mt-1">
                Maximum {MAX_TAGS} tags allowed.
              </p>
            )}
          </div>
          {/* Status Message Area */}
          <div
            id="status-message"
            aria-live="assertive"
            className="mt-1 mb-1 min-h-[2rem] text-sm text-center"
          >
            {error && (
              <p className="font-medium text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                {error}
              </p>
            )}
            {successMessage && (
              <p className="font-medium text-green-600 bg-green-50 p-2 rounded-md border border-green-200">
                {successMessage}
              </p>
            )}
          </div>
          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={
                isSubmitting ||
                !ideaText.trim() ||
                ideaText.length > MAX_LENGTH_TEXT ||
                title.length > MAX_LENGTH_TITLE ||
                tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t).length > MAX_TAGS
              }
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Posting...
                </>
              ) : (
                "Post Log"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateLogPage.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  currentUser: PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};

export default CreateLogPage;
