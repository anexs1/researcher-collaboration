// src/Component/Admin/AdminSidebar.js
import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaProjectDiagram, // Keep if needed, otherwise remove if not used
  FaNewspaper, // Keep if needed, otherwise remove if not used
  FaCog,
  FaChartBar,
  FaUserClock,
  FaSignOutAlt,
  FaComments, // <-- Import the chat icon
} from "react-icons/fa";

// You might want to get the logout function via props or context
const AdminSidebar = ({ onLogout }) => {
  const navLinks = [
    { to: "/admin", icon: <FaTachometerAlt />, label: "Dashboard", end: true },
    { to: "/admin/users", icon: <FaUsers />, label: "Manage Users" },
    {
      to: "/admin/pending-users",
      icon: <FaUserClock />,
      label: "Pending Users",
    },
    // --- NEW CHAT LINK ADDED ---
    { to: "/admin/chat", icon: <FaComments />, label: "Chat" }, // Or "/admin/messages"
    // ---------------------------
    { to: "/admin/reports", icon: <FaChartBar />, label: "Reports" },
    { to: "/admin/settings", icon: <FaCog />, label: "Settings" },
    // Add back ProjectDiagram/Newspaper if you have routes for them
    // { to: '/admin/projects', icon: <FaProjectDiagram />, label: 'Projects' },
    // { to: '/admin/publications', icon: <FaNewspaper />, label: 'Publications' },
  ];

  const baseLinkClass =
    "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition duration-150 ease-in-out text-sm font-medium";
  const activeLinkClass = "bg-gray-900 text-white"; // Darker background for active

  // Placeholder Logout - Replace with actual logout logic from App.js context or props
  const handleLogoutClick = () => {
    console.log("Logout clicked - implement actual logout");
    // Call onLogout if passed as prop, or dispatch context action
    // Example: if (onLogout) onLogout();
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/login"; // Force redirect after logout
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0 h-screen shadow-lg">
      {/* Logo/Title */}
      <div className="h-16 flex items-center justify-center px-4 bg-gray-900 flex-shrink-0">
        <Link
          to="/admin"
          className="text-xl font-semibold text-white hover:text-gray-200"
        >
          Admin Panel
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end || false} // Use end prop if specified
            className={({ isActive }) =>
              `${baseLinkClass} ${isActive ? activeLinkClass : ""}`
            }
          >
            <span className="mr-3 text-lg w-5 text-center">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer/Logout Section */}
      <div className="p-4 border-t border-gray-700 mt-auto flex-shrink-0">
        {/* Example Logout Button */}
        <button
          onClick={handleLogoutClick}
          className={`${baseLinkClass} w-full justify-start hover:bg-red-700`} // Style as needed
        >
          <span className="mr-3 text-lg w-5 text-center">
            <FaSignOutAlt />
          </span>
          Logout
        </button>
        {/* <p className="text-xs text-gray-400 text-center mt-4">© Your App Name</p> */}
      </div>
    </div>
  );
};

export default AdminSidebar;
