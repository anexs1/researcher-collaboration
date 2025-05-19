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
  FaComments, // Icon for Contact Submissions (or choose another)
  FaQuestionCircle,
} from "react-icons/fa";

const AdminSidebar = ({ onLogout }) => {
  const navLinks = [
    { to: "/admin", icon: <FaTachometerAlt />, label: "Dashboard", end: true },
    { to: "/admin/users", icon: <FaUsers />, label: "Manage Users" },
    {
      to: "/admin/pending-users",
      icon: <FaUserClock />,
      label: "Pending Users",
    },
    { to: "/admin/chat", icon: <FaComments />, label: "Platform Chat" }, // Assuming this is different
    { to: "/admin/reports", icon: <FaChartBar />, label: "Reports" },

    // +++ CONTACT SUBMISSIONS MANAGEMENT LINK +++
    {
      to: "/admin/contact-submissions", // New route for managing submissions
      icon: <FaComments style={{ transform: "scaleX(-1)" }} />, // Example: Flipped chat icon or a dedicated "envelope" icon
      label: "Support Inbox",
    },
    // ------------------------------------


    { to: "/admin/settings", icon: <FaCog />, label: "Settings" },
  ];

  const baseLinkClass =
    "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition duration-150 ease-in-out text-sm font-medium";
  const activeLinkClass = "bg-gray-900 text-white";

  const handleLogoutClick = () => {
    if (onLogout && typeof onLogout === "function") {
      onLogout();
    } else {
      console.warn("AdminSidebar: onLogout prop not provided. Using fallback.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
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
            end={link.end || false}
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
          className={`${baseLinkClass} w-full justify-start hover:bg-red-600 hover:text-white`}
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
