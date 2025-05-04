import React from "react";
import { FaEdit, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

const ProfileHeader = React.memo(
  ({
    username,
    isOwnProfile,
    isEditing,
    isSaving,
    onEdit,
    onSave,
    onCancel,
  }) => (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-0 break-words dark:text-white">
        {username ? `${username}'s Profile` : "Profile"}
      </h1>
      {isOwnProfile && (
        <div className="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                disabled={isSaving}
                aria-live="polite"
              >
                {isSaving ? (
                  <FaSpinner className="animate-spin h-4 w-4" />
                ) : (
                  <FaCheck className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onCancel}
                className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out disabled:opacity-70 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                disabled={isSaving}
              >
                <FaTimes className="h-4 w-4" /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <FaEdit className="h-4 w-4" /> Edit Profile
            </button>
          )}
        </div>
      )}
    </header>
  )
);

export default ProfileHeader;
