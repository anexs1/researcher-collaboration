import React from "react";
import { FaEdit, FaCheck, FaTimes, FaSpinner, FaCamera } from "react-icons/fa";

const ProfileHeader = React.memo(
  ({
    username,
    jobTitle, // Added for potential subtitle, aligns with main Profile.js
    isOwnProfile,
    isEditing,
    isSaving,
    onEdit,
    onSave,
    onCancel,
    backgroundImageUrl,
    onTriggerBgUpload,
  }) => {
    const headerStyle = backgroundImageUrl
      ? { backgroundImage: `url(${backgroundImageUrl})` }
      : {};

    // Subtle button base class - keeping it consistent
    const buttonBaseClass =
      "flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
    // Slightly reduced padding and font size for more subtlety

    return (
      <header
        className={`relative bg-slate-100 dark:bg-slate-800 bg-cover bg-center rounded-lg shadow-sm min-h-[170px] sm:min-h-[200px] md:min-h-[100px] text-white transition-all duration-300`}
        // Softer default bg, softer shadow (shadow-sm), slightly reduced min-height
        style={headerStyle}
      >
        {/* Slightly more transparent overlay */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/40 rounded-lg transition-opacity duration-300"></div>

        <div className="relative z-10 flex flex-col justify-between h-full p-3 sm:p-5">
          {" "}
          {/* Reduced padding */}
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-shadow-sm break-words">
              {" "}
              {/* Reduced font size, font-semibold */}
              {username ? `${username}'s Profile` : "Profile"}
            </h1>
            {jobTitle && (
              <p className="text-xs sm:text-sm text-slate-200/90 dark:text-slate-300/90 text-shadow-xs mt-0.5">
                {" "}
                {/* Subtitle style */}
                {jobTitle}
              </p>
            )}
          </div>
          {isOwnProfile && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-1.5 sm:space-y-0 sm:space-x-1.5 mt-2 sm:mt-0">
              {" "}
              {/* Reduced spacing */}
              {isEditing ? (
                <>
                  <button
                    onClick={onSave}
                    // Softer green, smaller ring offset
                    className={`${buttonBaseClass} bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 focus:ring-offset-black/20 shadow-xs hover:shadow-sm`}
                    disabled={isSaving}
                    aria-live="polite"
                  >
                    {isSaving ? (
                      <FaSpinner className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" /> // Slightly smaller spinner
                    ) : (
                      <FaCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={onCancel}
                    // Softer slate, smaller ring offset
                    className={`${buttonBaseClass} bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 focus:ring-slate-400 focus:ring-offset-black/20 shadow-xs hover:shadow-sm`}
                    disabled={isSaving}
                  >
                    <FaTimes className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={onEdit}
                  // Softer blue, smaller ring offset
                  className={`${buttonBaseClass} bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 focus:ring-offset-black/20 shadow-xs hover:shadow-sm`}
                >
                  <FaEdit className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Edit Profile
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing && isOwnProfile && (
          <button
            onClick={onTriggerBgUpload}
            // Softer icon button background
            className="absolute top-2.5 right-2.5 z-20 p-1.5 sm:p-2 bg-black/30 hover:bg-black/50 rounded-full text-slate-100 hover:text-white transition-colors duration-150"
            title="Change background image"
            aria-label="Change background image"
          >
            <FaCamera size={16} /> {/* Slightly smaller icon */}
          </button>
        )}
        {/* Text shadow utility if not globally defined */}
        {/* You might want to add this to your global CSS or Tailwind config instead */}
        <style jsx global>{`
          .text-shadow-xs {
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          .text-shadow-sm {
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
          }
          .shadow-xs {
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          }
        `}</style>
      </header>
    );
  }
);

export default ProfileHeader;
