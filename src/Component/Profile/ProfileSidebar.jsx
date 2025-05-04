import React from "react";
import { FaFileUpload, FaSpinner, FaUser } from "react-icons/fa"; // Example icons

const ProfileSidebar = React.memo(
  ({
    user,
    imagePreview,
    isEditing,
    isOwnProfile,
    isUploading,
    onTriggerUpload,
    fileInputRef,
  }) => {
    const profilePictureUrl = user?.profilePictureUrl;
    const username = user?.username || "User";
    const currentImage =
      imagePreview || profilePictureUrl || "/img/default-avatar.png"; // Provide a path to your default avatar

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center dark:bg-gray-800 dark:border-gray-700">
        <div className="relative mb-4 inline-block group">
          <img
            src={currentImage}
            alt={`${username}'s profile`}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl mx-auto transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/img/default-avatar.png";
            }} // Fallback on error
          />
          {isOwnProfile && isEditing && (
            <button
              type="button"
              onClick={onTriggerUpload}
              className="absolute bottom-1 right-1 bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 shadow-md transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload new picture"
              aria-label="Upload new profile picture"
              disabled={isUploading}
            >
              {isUploading ? (
                <FaSpinner className="animate-spin h-4 w-4" />
              ) : (
                <FaFileUpload className="h-4 w-4" />
              )}
            </button>
          )}
          {/* Hidden file input - controlled by ref from parent */}
          <input
            type="file"
            ref={fileInputRef} // Use the passed ref
            // onChange handled in parent
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/webp"
            disabled={isUploading}
            aria-hidden="true"
          />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 dark:text-white break-words mt-2">
          {username}
        </h2>
        {/* Optionally add more summary info here */}
        {/* <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.jobTitle || 'No title provided'}</p> */}
        {/* <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Member Since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p> */}
      </div>
    );
  }
);

export default ProfileSidebar;
