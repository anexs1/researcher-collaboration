// src/Component/ThinkingLogCard.jsx
import React from "react";
import PropTypes from "prop-types";
// Import icons if you plan to use them for log types or actions
import {
  FaQuestionCircle,
  FaLightbulb,
  FaSearch,
  FaUsers,
  FaHeart,
  FaRegHeart,
  FaCommentAlt,
  FaRegCommentAlt,
  FaBookmark,
  FaRegBookmark,
  FaUserPlus,
  FaHandsHelping,
} from "react-icons/fa"; // Added action icons

// --- Helper Function: Time Formatting ---
// (Assuming this is the improved version you want)
const formatTimeAgo = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (isNaN(seconds) || seconds < 0) return "just now";
    const intervals = [
      { label: "y", seconds: 31536000 },
      { label: "mo", seconds: 2592000 },
      { label: "d", seconds: 86400 },
      { label: "h", seconds: 3600 },
      { label: "m", seconds: 60 },
      { label: "s", seconds: 1 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) return `${count}${interval.label} ago`;
    }
    return "just now";
  } catch (error) {
    console.error("Error formatting time:", isoString, error);
    return "invalid date";
  }
};

// --- Avatar Sub-component ---
// (Assuming this is the improved version you want)
const Avatar = ({ name, avatarUrl }) => {
  const initial =
    typeof name === "string" && name.length > 0
      ? name.charAt(0).toUpperCase()
      : "?";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ? `${name}'s avatar` : "User avatar"}
        className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0 border border-gray-100 shadow-sm"
        onError={(e) => {
          e.target.style.display =
            "none"; /* Optionally show fallback initials */
        }}
      />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-semibold text-sm mr-3 flex-shrink-0"
      title={name || "Unknown User"}
      aria-label={`Avatar for ${name || "Unknown User"}`}
    >
      {initial}
    </div>
  );
};
Avatar.propTypes = { name: PropTypes.string, avatarUrl: PropTypes.string };

// --- Log Type Definitions (Needed for typeInfo logic) ---
// NOTE: Ideally, this might come from a shared constants file or the API response
const logTypes = [
  { value: "question", label: "Question", Icon: FaQuestionCircle },
  { value: "idea_hypothesis", label: "Idea / Hypothesis", Icon: FaLightbulb },
  { value: "observation", label: "Observation / Finding", Icon: FaSearch },
  { value: "collaboration", label: "Call for Collaboration", Icon: FaUsers },
];

// --- Main Thinking Log Card Component ---
const ThinkingLogCard = ({
  log,
  isLoggedIn,
  onLike,
  onComment,
  onJoin,
  onSave,
  onTagClick,
}) => {
  // Destructure log properties with defaults
  const {
    id = `invalid-${Date.now()}`,
    author = { name: "Unknown Author", avatar: null },
    title = null, // Optional Title
    text = "[No content available]",
    tags = [],
    timestamp = null,
    logType = null, // Type from form
    likes = 0,
    commentsCount = 0,
    joinsCount = 0,
    isLikedByUser = false,
    isSavedByUser = false,
  } = log || {};

  // Early return if critical data is missing
  if (id.startsWith("invalid-")) {
    console.warn(
      "Skipping ThinkingLogCard render due to missing/invalid ID:",
      log
    );
    return null;
  }

  // Get type info for display
  const typeInfo = logType ? logTypes.find((lt) => lt.value === logType) : null;

  return (
    <article
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out"
      aria-labelledby={title ? `log-title-${id}` : `log-author-${id}`}
    >
      {/* Use flex-col and h-full to allow footer to stick to bottom */}
      <div className="p-5 flex flex-col h-full">
        {/* --- Header --- */}
        <div className="flex items-start mb-3">
          <Avatar name={author.name} avatarUrl={author.avatar} />
          <div className="flex-grow min-w-0">
            {/* Optional Title */}
            {title && (
              <h3
                id={`log-title-${id}`}
                className="font-semibold text-lg text-gray-800 break-words leading-tight mb-1"
              >
                {title}
              </h3>
            )}
            {/* Author Name */}
            <p
              id={`log-author-${id}`}
              className={`font-medium ${
                title ? "text-sm text-gray-600" : "text-base text-gray-900"
              } break-words leading-tight`}
            >
              By: {author.name} {/* Maybe make this a Link later */}
            </p>
            {/* Timestamp & Optional Type */}
            <p className="text-xs text-gray-500 mt-0.5">
              {timestamp ? formatTimeAgo(timestamp) : "Timestamp unavailable"}
              {typeInfo && (
                <span
                  className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                  title={`Type: ${typeInfo.label}`}
                >
                  {typeInfo.Icon && (
                    <typeInfo.Icon
                      className="mr-1 h-3 w-3"
                      aria-hidden="true"
                    />
                  )}
                  {typeInfo.label}
                </span>
              )}
            </p>
          </div>
          {/* Optional "..." more actions button could go here */}
        </div>

        {/* --- Log Text --- */}
        {/* flex-grow makes this section take available space */}
        <p className="text-gray-700 mb-4 whitespace-pre-wrap break-words flex-grow">
          {text}
        </p>

        {/* --- Tags Section --- */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <button
                key={`${id}-tag-${tag}`}
                onClick={() => onTagClick(tag)}
                className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 transition-colors duration-150"
                aria-label={`Filter by tag: ${tag}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* --- Actions Footer --- */}
        {/* mt-auto pushes this to the bottom because parent is flex-col h-full */}
        <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-auto">
          {/* Left Actions: Like, Comment, Join */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 items-center">
            {/* Like Button */}
            <button
              onClick={() => onLike(id)}
              disabled={!isLoggedIn}
              className={`flex items-center space-x-1 transition-colors duration-150 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLikedByUser
                  ? "text-red-600 font-semibold"
                  : "text-gray-500 hover:text-red-500"
              }`}
              aria-label={
                isLikedByUser
                  ? `Unlike this idea (${likes} likes)`
                  : `Like this idea (${likes} likes)`
              }
              aria-pressed={isLikedByUser}
            >
              {isLikedByUser ? (
                <FaHeart className="h-4 w-4" />
              ) : (
                <FaRegHeart className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{likes}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => onComment(id)}
              disabled={!isLoggedIn}
              className="flex items-center space-x-1 transition-colors duration-150 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Comment on this idea (${commentsCount} comments)`}
            >
              <FaRegCommentAlt className="h-4 w-4" />
              <span className="text-sm font-medium">{commentsCount}</span>
            </button>

            {/* Join/Collaborate Button */}
            <button
              onClick={() => onJoin(id)}
              disabled={!isLoggedIn}
              className="flex items-center space-x-1 transition-colors duration-150 text-gray-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Express interest in joining this idea (${joinsCount} interested)`}
            >
              {/* Use different icon/text based on type? Example: */}
              {logType === "collaboration" ? (
                <FaHandsHelping className="h-4 w-4" />
              ) : (
                <FaUserPlus className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {joinsCount > 0 ? `${joinsCount}` : "Join"}
              </span>
            </button>
          </div>

          {/* Right Action: Save Button */}
          <button
            onClick={() => onSave(id)}
            disabled={!isLoggedIn}
            className={`flex items-center transition-colors duration-150 hover:text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSavedByUser ? "text-yellow-500" : "text-gray-500"
            }`}
            aria-label={
              isSavedByUser
                ? "Remove this idea from your saved items"
                : "Save this idea for later"
            }
            aria-pressed={isSavedByUser}
          >
            {isSavedByUser ? (
              <FaBookmark className="h-4 w-4" />
            ) : (
              <FaRegBookmark className="h-4 w-4" />
            )}
          </button>
        </div>
        {/* --- End Actions Footer --- */}
      </div>{" "}
      {/* End p-5 */}
    </article> // End article
  );
};

// Update PropTypes (keep the detailed version)
ThinkingLogCard.propTypes = {
  log: PropTypes.shape({
    id: PropTypes.string.isRequired,
    author: PropTypes.shape({
      name: PropTypes.string,
      avatar: PropTypes.string,
    }),
    title: PropTypes.string,
    text: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    timestamp: PropTypes.string,
    logType: PropTypes.string,
    likes: PropTypes.number,
    commentsCount: PropTypes.number,
    joinsCount: PropTypes.number,
    isLikedByUser: PropTypes.bool,
    isSavedByUser: PropTypes.bool,
  }).isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onJoin: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onTagClick: PropTypes.func.isRequired,
};

export default ThinkingLogCard;
