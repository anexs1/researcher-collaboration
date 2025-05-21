// src/Component/Admin/AdminSidebar.js
import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaCog,
  FaChartBar,
  FaUserClock,
  FaSignOutAlt,
  FaComments,
  FaQuestionCircle, // Not used in navLinks, consider removing if not planned
} from "react-icons/fa";

const AdminSidebar = ({ onLogout }) => {
  const navLinks = [
    { to: "/admin", icon: <FaTachometerAlt />, label: "Dashboard", end: true },
    { to: "/admin/users", icon: <FaUsers />, label: "Manage Users", end: true }, // Added end: true
    {
      to: "/admin/pending-users",
      icon: <FaUserClock />,
      label: "Pending Users",
      end: true // Added end: true
    },
    { to: "/admin/chat", icon: <FaComments />, label: "Platform Chat", end: true }, // Added end: true
    { to: "/admin/reports", icon: <FaChartBar />, label: "Reports", end: true }, // Added end: true
    {
      to: "/admin/contact-submissions",
      icon: <FaComments style={{ transform: "scaleX(-1)" }} />,
      label: "Support Inbox",
      end: true // Added end: true
    },
    { to: "/admin/settings", icon: <FaCog />, label: "Settings", end: true }, // Added end: true
  ];

  const baseLinkClass =
    "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition duration-150 ease-in-out text-sm font-medium";
  const activeLinkClass = "bg-gray-900 text-white"; // This implies a dark sidebar theme

  const handleLogoutClick = () => {
    if (onLogout && typeof onLogout === "function") {
      onLogout();
    } else {
      console.warn("AdminSidebar: onLogout prop not provided. Using fallback.");
      // Fallback logout logic
      localStorage.removeItem("authToken");
      localStorage.removeItem("user"); // Ensure this key is correct if you use it
      window.location.href = "/login"; // Consider using useNavigate for SPA navigation if sidebar is within Router context
    }
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0 h-screen shadow-lg">
      <div className="h-16 flex items-center justify-center px-4 bg-gray-900 flex-shrink-0 border-b border-gray-700">
        <Link
          to="/admin"
          className="text-xl font-semibold text-white hover:text-gray-200"
        >
          Admin Panel
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end} // Use link.end directly (it will be true or undefined which defaults to false)
            target={link.target || "_self"}
            rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
            className={({ isActive }) =>
              `${baseLinkClass} ${
                isActive && !link.target ? activeLinkClass : ""
              }`
            }
          >
            <span className="mr-3 text-lg w-5 text-center">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 mt-auto flex-shrink-0">
        <button
          onClick={handleLogoutClick}
          className={`${baseLinkClass} w-full justify-start hover:bg-red-600 hover:text-white`} // For logout, active state is not typical
        >
          <span className="mr-3 text-lg w-5 text-center">
            <FaSignOutAlt />
          </span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;  