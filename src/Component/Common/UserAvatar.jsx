import React from "react";
import PropTypes from "prop-types";

const UserAvatar = ({ user, className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const getInitials = () => {
    if (!user?.username) return "?";
    const parts = user.username.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`
      : user.username.substring(0, 2);
  };

  return (
    <div
      className={`rounded-full bg-gray-300 flex items-center justify-center 
      overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {user?.profilePictureUrl ? (
        <img
          src={user.profilePictureUrl}
          alt={user.username || "User"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-gray-600 font-medium uppercase">
          {getInitials()}
        </span>
      )}
    </div>
  );
};

UserAvatar.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    profilePictureUrl: PropTypes.string,
  }),
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
};

UserAvatar.defaultProps = {
  size: "md",
};

export default UserAvatar;
