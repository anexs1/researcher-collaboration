// src/Component/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaUser,
  FaBook,
  FaCog,
  FaSignOutAlt,
  FaPlusSquare,
} from "react-icons/fa";

const menuItems = [
  // Link to /profile (will show logged-in user's profile)
  { path: "/profile", label: "Profile", Icon: FaUser },
  { path: "/publications", label: "My Publications", Icon: FaBook },
  { path: "/publications/new", label: "Post Publication", Icon: FaPlusSquare },
];

const commonLinkClasses =
  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
const activeLinkClasses = "bg-blue-100 text-blue-700 font-semibold";
const inactiveLinkClasses =
  "text-gray-600 hover:bg-gray-300 hover:text-gray-900";

function Sidebar({ isLoggedIn, handleLogout }) {
  return (
    <div className="bg-gray-200 p-4 rounded-md h-full w-60 flex flex-col shadow-sm flex-shrink-0">
      <h2 className="text-lg font-semibold mb-4 px-2 text-gray-800">
        Navigation
      </h2>
      <nav className="flex-grow">
        <ul>
          {menuItems.map(({ path, label, Icon }) => (
            <li key={label} className="mb-2">
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `${commonLinkClasses} ${
                    isActive ? activeLinkClasses : inactiveLinkClasses
                  }`
                }
                end // Use 'end' for exact matching
              >
                <Icon
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {/* Logout Button */}
      {isLoggedIn && (
        <div className="mt-auto pt-4 border-t border-gray-300">
          {handleLogout && (
            <button
              onClick={handleLogout}
              className={`${commonLinkClasses} ${inactiveLinkClasses} w-full text-left`}
            >
              <FaSignOutAlt className="mr-3 h-5 w-5" aria-hidden="true" />{" "}
              Logout
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export default Sidebar;
