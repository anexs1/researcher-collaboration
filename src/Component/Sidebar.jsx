import React from "react";
import { NavLink, Link, useLocation } from "react-router-dom"; // Import useLocation
import {
  FaUser,
  FaBook, // Explore / Publications
  FaFolderOpen, // Projects
  FaPlusSquare, // Post Publication
  FaRocket, // New Project
  FaFeatherAlt, // Post Idea
  FaEnvelope, // Messages
  FaCog, // Settings
  FaSignOutAlt, // Logout
} from "react-icons/fa";

// --- Menu Items Array ---
const menuItems = [
  { path: "/profile", label: "Profile", Icon: FaUser },
  { path: "/explore", label: "Explore Logs", Icon: FaBook },
  { path: "/logs/new", label: "Post Idea", Icon: FaFeatherAlt }, // <<< UPDATED PATH
  { path: "/publications", label: "Publications", Icon: FaBook },
  { path: "/publications/new", label: "Post Publication", Icon: FaPlusSquare },
  { path: "/projects", label: "Projects", Icon: FaFolderOpen },
  { path: "/projects/new", label: "New Project", Icon: FaRocket },
  { path: "/messages", label: "Messages", Icon: FaEnvelope },
];

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

function Sidebar({ isLoggedIn, handleLogout, currentUser }) {
  const location = useLocation(); // Get current location

  // Helper function to get initials safely
  const getInitials = (user) => {
    /* ... (keep existing function) ... */
    const first = user?.firstName || "";
    const last = user?.lastName || "";
    const usernameInitial = user?.username ? user.username.charAt(0) : "";
    const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    return initials || usernameInitial.toUpperCase() || "?";
  };

  const userInitials = currentUser ? getInitials(currentUser) : "?";
  const profilePictureUrl = currentUser?.profilePictureUrl;
  const userName = currentUser
    ? currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.username || "User"
    : "User";
  const userHeadline =
    currentUser?.jobTitle ||
    currentUser?.department ||
    currentUser?.university ||
    currentUser?.role ||
    "Researcher";

  // Show menu items only if logged in
  const visibleMenuItems = isLoggedIn ? menuItems : [];

  return (
    <div className="bg-white border-r border-gray-200 h-screen w-64 flex flex-col shadow-lg flex-shrink-0 sticky top-0 overflow-y-auto">
      {/* Profile Header Section */}
      {isLoggedIn && currentUser && (
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <Link to="/profile" className="block group text-center">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-2 sm:mb-3 flex items-center justify-center bg-gradient-to-br from-indigo-200 to-purple-200 text-indigo-700 overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transform transition-transform duration-200 relative">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={`${userName}'s profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    /* ... error handling ... */
                  }}
                />
              ) : null}
              <div
                className="initials-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-200 to-purple-200"
                style={{ display: profilePictureUrl ? "none" : "flex" }}
              >
                <span className="text-2xl sm:text-3xl font-semibold text-indigo-700">
                  {userInitials}
                </span>
              </div>
            </div>
            {/* User Info */}
            <h3
              className="text-sm sm:text-md font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate"
              title={userName}
            >
              {userName}
            </h3>
            <p
              className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors mt-0.5 sm:mt-1 truncate"
              title={userHeadline}
            >
              {userHeadline}
            </p>
          </Link>
        </div>
      )}

      {/* Navigation Section */}
      <nav
        className={`flex-grow px-2 sm:px-3 overflow-y-auto ${
          isLoggedIn && currentUser ? "pt-4" : "pt-6"
        }`}
      >
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Navigation
        </p>
        {isLoggedIn && (
          <ul>
            {visibleMenuItems.map(({ path, label, Icon }) => {
              // --- Determine active state more reliably ---
              const currentPathname = location.pathname;
              let isActive = currentPathname === path;

              // Special case: Make 'Explore Logs' active when on '/logs/new'
              if (path === "/explore" && currentPathname === "/logs/new") {
                isActive = true;
              }
              // Special case: Ensure 'Post Idea' is only active on its exact path
              if (path === "/logs/new" && currentPathname !== "/logs/new") {
                isActive = false; // Should already be false from initial check, but ensures it
              }
              // Add similar logic if '/publications' should be active on '/publications/new' etc.
              if (
                path === "/publications" &&
                (currentPathname === "/publications/new" ||
                  currentPathname.startsWith("/publications/edit/"))
              ) {
                isActive = true;
              }
              if (
                path === "/projects" &&
                (currentPathname === "/projects/new" ||
                  currentPathname.startsWith("/projects/edit/"))
              ) {
                isActive = true;
              }
              // --- End Active State Logic ---

              return (
                <li key={path} className="mb-1">
                  <NavLink
                    to={path}
                    // Use the calculated isActive state for classes
                    className={`${commonLinkClasses} ${
                      isActive ? activeLinkClasses : inactiveLinkClasses
                    }`}
                    // Use `end` prop carefully based on whether child routes should activate the parent
                    // Explore should NOT end, Publications should NOT end, Projects should NOT end
                    end={
                      !(
                        path === "/explore" ||
                        path === "/publications" ||
                        path === "/projects"
                      )
                    }
                  >
                    {/* Render icon and label - use calculated `isActive` for icon class */}
                    <Icon
                      className={`${iconClasses} ${
                        isActive ? activeIconClasses : ""
                      }`}
                      aria-hidden="true"
                    />
                    <span className="ml-1">{label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
        {!isLoggedIn && (
          <p className="px-3 text-sm text-gray-500">
            Please log in to navigate.
          </p>
        )}
      </nav>

      {/* Settings/Logout Section */}
      {isLoggedIn && (
        <div className="mt-auto p-3 border-t border-gray-200 flex-shrink-0">
          <Link
            to="/settings/account"
            className={`${commonLinkClasses} ${inactiveLinkClasses} w-full mb-1`}
          >
            <FaCog className={`${iconClasses}`} aria-hidden="true" />
            <span className="ml-1">Settings</span>
          </Link>
          {handleLogout && (
            <button
              onClick={handleLogout}
              className={`${commonLinkClasses} ${inactiveLinkClasses} w-full text-red-600 hover:bg-red-50 hover:text-red-800 group`}
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

// Add PropTypes if desired
// Sidebar.propTypes = { ... };

export default Sidebar;
