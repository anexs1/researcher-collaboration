import React from "react";
import { format, isValid, parseISO } from "date-fns";
import PropTypes from "prop-types";
import UserAvatar from "../Common/UserAvatar";

const Message = ({
  message = {},
  isCurrentUser = false,
  user = {},
  showAvatar = true,
  showUsername = true,
  showTimestamp = true,
}) => {
  // Safely handle undefined/null message
  if (!message) {
    console.warn("Message component received null/undefined message");
    return null;
  }

  // --- Robust Timestamp Formatting ---
  let formattedTime = "";
  const timestampInput = message.timestamp;

  // Only attempt to format if timestamp exists
  if (timestampInput) {
    try {
      let dateObject;
      if (
        typeof timestampInput === "string" &&
        timestampInput.includes("T") &&
        timestampInput.includes("Z")
      ) {
        dateObject = parseISO(timestampInput);
      } else {
        dateObject = new Date(timestampInput);
      }

      if (isValid(dateObject)) {
        formattedTime = format(dateObject, "HH:mm");
      } else {
        console.warn(
          "Invalid Date object:",
          timestampInput,
          "for message ID:",
          message.id
        );
      }
    } catch (error) {
      console.error("Error processing timestamp:", timestampInput, error);
    }
  }
  // -----------------------------------

  // Handle System Messages
  const isSystemMessage = message.type === "system";
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.content || "System message"}
        </div>
      </div>
    );
  }

  // Render Regular User Messages
  return (
    <div
      className={`flex items-end mb-3 px-2 sm:px-4 ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar (Left) */}
      {!isCurrentUser && showAvatar && (
        <div className="mr-2 flex-shrink-0">
          <UserAvatar user={user} className="w-8 h-8" size="sm" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`flex flex-col max-w-[70%] sm:max-w-[65%] md:max-w-[60%] ${
          isCurrentUser
            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-l-lg rounded-br-lg"
            : "bg-gray-100 text-gray-800 rounded-r-lg rounded-bl-lg"
        } p-3 shadow-md`}
      >
        {/* Sender Name */}
        {!isCurrentUser && showUsername && user?.username && (
          <div className="font-semibold text-xs mb-1 text-indigo-700">
            {user.username}
          </div>
        )}

        {/* Content */}
        <div className="text-sm break-words whitespace-pre-wrap">
          {message.content || (
            <span className="italic text-gray-400">(empty message)</span>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && formattedTime && (
          <div
            className={`text-[10px] mt-1.5 self-end ${
              isCurrentUser ? "text-blue-100 opacity-80" : "text-gray-500"
            }`}
          >
            {formattedTime}
          </div>
        )}
      </div>

      {/* Avatar (Right) */}
      {isCurrentUser && showAvatar && (
        <div className="ml-2 flex-shrink-0">
          <UserAvatar user={user} className="w-8 h-8" size="sm" />
        </div>
      )}
    </div>
  );
};

// PropTypes without defaultProps (using default parameters instead)
Message.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.oneOf(["user", "system"]),
    senderId: PropTypes.string,
  }),
  isCurrentUser: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
    profilePictureUrl: PropTypes.string,
  }),
  showAvatar: PropTypes.bool,
  showUsername: PropTypes.bool,
  showTimestamp: PropTypes.bool,
};

export default Message;
