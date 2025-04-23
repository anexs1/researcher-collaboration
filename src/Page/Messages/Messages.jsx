import React from "react";
import { format } from "date-fns";
import PropTypes from "prop-types";
import UserAvatar from "../Common/UserAvatar"; // ✅ Adjusted relative path

const Message = ({
  message,
  isCurrentUser,
  user,
  showAvatar = true,
  showUsername = true,
  showTimestamp = true,
}) => {
  // Format the timestamp safely
  let formattedTime = "";
  try {
    if (message?.timestamp) {
      formattedTime = format(new Date(message.timestamp), "HH:mm");
    }
  } catch (error) {
    console.error("Invalid timestamp:", message?.timestamp, error);
  }

  const isSystemMessage = message?.type === "system";

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message?.content || "System message"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex mb-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      {/* Avatar (left side) */}
      {!isCurrentUser && showAvatar && (
        <div className="mr-2 self-end">
          <UserAvatar user={user} className="w-8 h-8" size="sm" />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl ${
          isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
        } rounded-lg p-3 shadow-sm`}
      >
        {/* Username (if not current user) */}
        {!isCurrentUser && showUsername && user?.username && (
          <div className="font-semibold text-xs mb-1">{user.username}</div>
        )}

        {/* Message content */}
        <div className="text-sm break-words">
          {message?.content || "No message content"}
        </div>

        {/* Timestamp */}
        {showTimestamp && formattedTime && (
          <div
            className={`text-xs mt-1 text-right ${
              isCurrentUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {formattedTime}
          </div>
        )}
      </div>

      {/* Avatar (right side for current user) */}
      {isCurrentUser && showAvatar && (
        <div className="ml-2 self-end">
          <UserAvatar user={user} className="w-8 h-8" size="sm" />
        </div>
      )}
    </div>
  );
};

Message.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["user", "system"]),
    senderId: PropTypes.string,
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
    profilePictureUrl: PropTypes.string,
  }),
  showAvatar: PropTypes.bool,
  showUsername: PropTypes.bool,
  showTimestamp: PropTypes.bool,
};

Message.defaultProps = {
  showAvatar: true,
  showUsername: true,
  showTimestamp: true,
};

export default Message;
