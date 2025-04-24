// src/Component/Common/UserAvatar.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaUserCircle } from "react-icons/fa";

// --- Define default props directly in the function signature ---
const UserAvatar = ({
  user = null, // Default user to null
  size = "md", // Default size to 'md'
  className = "", // Default className to empty string
}) => {
  // ------------------------------------------------------------

  const baseSizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24", // Added example
  };
  const sizeClass = baseSizeClasses[size] || baseSizeClasses["md"];
  const imageUrl = user?.profilePictureUrl; // Safely access profile picture
  const altText = user?.username ? `${user.username}'s avatar` : "User avatar";

  return (
    <div className={`relative inline-block leading-none ${className}`}>
      {" "}
      {/* Added leading-none */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={altText}
          className={`${sizeClass} rounded-full object-cover border border-gray-200 shadow-sm`} // Adjusted styling
          onError={(e) => {
            e.target.style.display = "none"; /* Hide img on error */
          }} // Hide broken image
        />
      ) : (
        // Render fallback icon only if image failed or no URL
        (!imageUrl || imageUrl === "") && (
          <FaUserCircle className={`${sizeClass} text-gray-300`} />
        )
      )}
      {/* Fallback circle if image fails AND no icon needed, or just use icon always */}
      {/* {!imageUrl && <div className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold`}>{user?.username ? user.username[0].toUpperCase() : '?'}</div>} */}
    </div>
  );
};

// PropTypes remain the same
UserAvatar.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    profilePictureUrl: PropTypes.string,
    // Add other relevant user fields if needed by avatar logic
  }),
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]), // Added xl
  className: PropTypes.string,
};

// --- REMOVE THIS BLOCK ---
// UserAvatar.defaultProps = {
//    size: 'md',
//    className: '',
//    user: null
// };
// -------------------------

export default UserAvatar;
