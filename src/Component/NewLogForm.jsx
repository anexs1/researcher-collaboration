import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import {
  FaQuestionCircle,
  FaLightbulb,
  FaSearch,
  FaUsers,
} from "react-icons/fa"; // Icons for types

// Define log type options
const logTypes = [
  { value: "question", label: "Question", Icon: FaQuestionCircle },
  { value: "idea_hypothesis", label: "Idea / Hypothesis", Icon: FaLightbulb },
  { value: "observation", label: "Observation / Finding", Icon: FaSearch },
  { value: "collaboration", label: "Call for Collaboration", Icon: FaUsers },
  // Add other relevant types if needed
];

const NewLogForm = ({ onSubmitLog, currentUser }) => {
  const [title, setTitle] = useState(""); // Optional title state
  const [ideaText, setIdeaText] = useState("");
  const [tags, setTags] = useState("");
  const [logType, setLogType] = useState(logTypes[0].value); // Default to the first type
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const textareaRef = useRef(null); // Ref for autofocus

  const MAX_LENGTH_TEXT = 500; // Allow slightly longer text
  const MAX_LENGTH_TITLE = 80;
  const MAX_TAGS = 5;

  // Auto-focus the main text area on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const trimmedText = ideaText.trim();
    const trimmedTitle = title.trim();

    // --- Validation ---
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
      // Consider focusing the title input here if needed
      return;
    }
    // --- End Validation ---

    setIsSubmitting(true);

    // Tag Processing
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
      setIsSubmitting(false);
      return;
    }

    // Prepare data payload including new fields
    const newLogData = {
      title: trimmedTitle || null, // Send null if title is empty
      text: trimmedText,
      tags: parsedTags,
      logType: logType, // Include the selected log type
      visibility: "public", // Default visibility (could be made configurable)
    };

    // Submit Logic
    try {
      await onSubmitLog(newLogData);
      setSuccessMessage("Log posted successfully! ✨");
      // Reset form fields
      setTitle("");
      setIdeaText("");
      setTags("");
      setLogType(logTypes[0].value); // Reset type to default
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (submissionError) {
      console.error("Log submission error:", submissionError);
      setError(
        typeof submissionError === "string"
          ? submissionError
          : "Failed to post. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_LENGTH_TEXT - ideaText.length;
  const isTextInvalid =
    error.includes("idea") ||
    error.includes("question") ||
    error.includes("text");
  const isTitleInvalid = error.includes("title");

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {" "}
        {/* Use space-y for vertical spacing */}
        {/* Optional Title */}
        <div>
          <label
            htmlFor="logTitle"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title <span className="text-gray-500 font-normal">(Optional)</span>
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
            Your Idea / Question <span className="text-red-500">*</span>{" "}
            {/* Indicate required */}
          </label>
          <textarea
            ref={textareaRef}
            id="ideaText"
            rows="5" // Slightly more rows
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
            {remainingChars} characters remaining
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
                {type.label}
              </option>
              // Consider adding icons here if desired, requires more complex dropdown component
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
          {" "}
          {/* Add padding top */}
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
              "Post Log" // Changed button text slightly
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- PropTypes Definition ---
NewLogForm.propTypes = {
  onSubmitLog: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    name: PropTypes.string,
  }),
};

export default NewLogForm;
