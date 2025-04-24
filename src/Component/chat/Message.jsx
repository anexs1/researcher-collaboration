import React from "react";
import { format, isValid } from "date-fns";
import PropTypes from "prop-types";
import UserAvatar from "../Common/UserAvatar";

const Message = ({
  message,
  isCurrentUser,
  user,
  showAvatar = true,
  showUsername = true,
  showTimestamp = true,
}) => {
  let formattedTime = "";

  if (message?.timestamp) {
    try {
      const dateObject = new Date(message.timestamp);
      if (isValid(dateObject)) {
        formattedTime = format(dateObject, "HH:mm");
      }
    } catch (error) {
      console.error("Error processing timestamp:", error);
    }
  }

  const isSystemMessage = message?.type === "system";
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2 px-4">
        <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
          {message?.content || "System Information"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end mb-2 ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isCurrentUser && showAvatar && (
        <div className="flex-shrink-0">
          <UserAvatar user={user} className="w-8 h-8" />
        </div>
      )}
      <div
        className={`flex flex-col max-w-xs sm:max-w-sm ${
          isCurrentUser
            ? "bg-indigo-500 text-white"
            : "bg-white text-gray-800 border border-gray-200"
        } rounded-xl p-3 shadow-sm`}
      >
        {!isCurrentUser && showUsername && user?.username && (
          <span className="text-xs text-gray-500 mb-1">{user.username}</span>
        )}
        <p className="text-sm break-words whitespace-pre-wrap">
          {message?.content || (
            <span className="italic text-gray-400">(empty message)</span>
          )}
        </p>
        {showTimestamp && formattedTime && (
          <span
            className={`text-[10px] pt-1 block ${
              isCurrentUser ? "text-indigo-100" : "text-gray-400"
            }`}
          >
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
};

Message.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    content: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.oneOf(["user", "system"]),
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
  user: null,
};

export default Message;
