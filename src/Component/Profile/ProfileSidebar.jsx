// src/Component/Profile/ProfileSidebar.jsx
import React from "react";
import {
  FaEdit,
  FaUserShield,
  FaHistory,
  FaEnvelope,
  FaPlus,
} from "react-icons/fa"; // Example Icons
import { Link } from "react-router-dom"; // If linking to other pages

// This is the new sidebar specifically for the profile page (Right Side)
const ProfileSidebar = ({ isOwnProfile, isEditing, onEditClick }) => {
  // Add more relevant items here (e.g., Account Settings, Privacy, View Activity, Start Collaboration)

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 px-4 py-8 bg-white border-l border-gray-200 shadow-sm h-screen sticky top-0 overflow-y-auto">
      {" "}
      {/* Hide on smaller screens initially */}
      <h3 className="text-base font-semibold text-gray-700 mb-4 px-2">
        Profile Options
      </h3>
      <div className="space-y-2">
        {isOwnProfile && ( // Actions for own profile
          <>
            {!isEditing ? (
              <button
                onClick={onEditClick} // Trigger edit mode in parent (Profile.jsx)
                className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150 ease-in-out group focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <FaEdit
                  className="mr-3 h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                Edit Profile
              </button>
            ) : (
              <div className="px-3 py-2 text-sm text-center bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200">
                Currently editing...
              </div>
              // Save/Cancel buttons are kept on the main card in this example,
              // but could be moved here if desired.
            )}
            {/* Placeholder Links/Buttons */}
            <Link
              to="/settings/account"
              className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 ease-in-out group"
            >
              <FaUserShield
                className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600"
                aria-hidden="true"
              />
              Account Settings
            </Link>
            <Link
              to="/profile/activity"
              className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 ease-in-out group"
            >
              <FaHistory
                className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600"
                aria-hidden="true"
              />
              View Activity
            </Link>
          </>
        )}

        {!isOwnProfile && ( // Actions when viewing someone else's profile
          <div className="space-y-2">
            <p className="text-sm text-gray-600 px-3 py-2">Viewing profile.</p>
            {/* Example: Add Send Message button */}
            <button className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150 ease-in-out group focus:outline-none focus:ring-2 focus:ring-blue-500">
              <FaEnvelope
                className="mr-3 h-4 w-4 flex-shrink-0"
                aria-hidden="true"
              />
              Send Message
            </button>
            {/* Example: Add Collaboration Request button (if applicable here) */}
            <button className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 ease-in-out group">
              <FaPlus
                className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-600"
                aria-hidden="true"
              />
              Request Collaboration
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ProfileSidebar;
