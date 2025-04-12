// src/Component/Sidebar.jsx
import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  FaUser,
  FaBook,
  FaFolderOpen,
  FaPlus,
  FaCog,
  FaSignOutAlt,
  FaPlusSquare,
} from "react-icons/fa";

// ***** menuItems MUST be defined OUTSIDE the component function *****
const menuItems = [
  { path: "/profile", label: "Profile", Icon: FaUser },
  { path: "/explore", label: "Explore", Icon: FaBook },
  { path: "/publications", label: "My Publications", Icon: FaBook },
  { path: "/publications/new", label: "Post Publication", Icon: FaPlusSquare },
  { path: "/my-projects", label: "My Projects", Icon: FaFolderOpen },
  { path: "/projects/new", label: "Create Project", Icon: FaPlus },
];
// ********************************************************************

// --- Styling Classes ---
const commonLinkClasses =
  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out group";
const activeLinkClasses =
  "bg-indigo-100 text-indigo-700 font-semibold shadow-sm";
const inactiveLinkClasses =
  "text-gray-600 hover:bg-gray-200 hover:text-gray-900";
const iconClasses =
  "mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors";
const activeIconClasses = "text-indigo-600";

// --- Sidebar Component ---
// Props: isLoggedIn, handleLogout, currentUser
function Sidebar({ isLoggedIn, handleLogout, currentUser }) {
  // Helper functions (getInitials) and derived constants (userInitials, etc.)
  const getInitials = (firstName = "", lastName = "") =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  const userInitials = currentUser
    ? getInitials(currentUser.firstName, currentUser.lastName)
    : "?";
  const profilePictureUrl = currentUser?.profilePictureUrl;
  const userName = currentUser
    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() ||
      currentUser.username
    : "User";
  const userHeadline =
    currentUser?.institution || currentUser?.role || "Researcher";

  return (
    <div className="bg-white border-r border-gray-200 h-screen w-64 flex flex-col shadow-lg flex-shrink-0 sticky top-0">
      {/* Profile Header Section */}
      {isLoggedIn && currentUser && (
        <div className="p-4 border-b border-gray-200">
          <Link to="/profile" className="block group text-center">
            {/* Profile Picture or Placeholder */}
            <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-indigo-200 to-purple-200 text-indigo-700 overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transform transition-transform duration-200">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={`${userName}'s profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-3xl font-semibold">{userInitials}</span>
              )}
            </div>
            <h3
              className="text-md font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate"
              title={userName}
            >
              {userName}
            </h3>
            <p
              className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors mt-1 truncate"
              title={userHeadline}
            >
              {userHeadline}
            </p>
          </Link>
        </div>
      )}

      {/* Navigation Section */}
      <nav
        className={`flex-grow px-3 ${
          isLoggedIn && currentUser ? "pt-4" : "pt-6"
        }`}
      >
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Navigation
        </p>
        <ul>
          {/* *** Make sure you are using menuItems (correct variable name) here *** */}
          {menuItems.map(({ path, label, Icon }) => (
            <li key={label} className="mb-1">
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `${commonLinkClasses} ${
                    isActive ? activeLinkClasses : inactiveLinkClasses
                  }`
                }
                end
              >
                {/* Icon Rendering */}
                {({ isActive }) => (
                  <Icon
                    className={`${iconClasses} ${
                      isActive ? activeIconClasses : ""
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="ml-1">{label}</span>
              </NavLink>
            </li>
          ))}
          {/* *** End Map *** */}
        </ul>
      </nav>

      {/* Settings Section */}

      {/* Footer Section (Logout) */}

      {isLoggedIn && (
        <div className="mt-auto p-3 border-t border-gray-200">
          {handleLogout && (
            <button
              onClick={handleLogout}
              className={`${commonLinkClasses} ${inactiveLinkClasses} w-full text-red-600 hover:bg-red-50 hover:text-red-800`}
            >
              <FaSignOutAlt
                className={`${iconClasses} text-red-500 group-hover:text-red-700`}
                aria-hidden="true"
              />
              <span className="ml-1">Logout</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export default Sidebar;
