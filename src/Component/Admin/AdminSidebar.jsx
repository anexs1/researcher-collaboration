// src/Component/Admin/AdminSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom"; // Use NavLink for active styling
import { FaTachometerAlt, FaUsers, FaCog, FaChartBar } from "react-icons/fa";

const AdminSidebar = () => {
  const linkClass =
    "flex items-center px-4 py-2 mt-2 text-gray-600 transition-colors duration-200 transform rounded-md hover:bg-gray-200 hover:text-gray-700";
  const activeLinkClass =
    "flex items-center px-4 py-2 mt-2 text-gray-700 bg-gray-200 rounded-md"; // Style for active link

  return (
    <aside className="w-64 bg-white border-r h-full hidden md:block">
      {" "}
      {/* Adjust width/visibility */}
      <nav className="px-2 py-4">
        <NavLink
          to="/admin"
          end // Match only exact path for dashboard
          className={({ isActive }) => (isActive ? activeLinkClass : linkClass)}
        >
          <FaTachometerAlt className="w-5 h-5 mr-3" /> Dashboard
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) => (isActive ? activeLinkClass : linkClass)}
        >
          <FaUsers className="w-5 h-5 mr-3" /> Users
        </NavLink>
        {/* Add links to other sections */}
        <NavLink
          to="/admin/reports"
          className={({ isActive }) => (isActive ? activeLinkClass : linkClass)}
        >
          <FaChartBar className="w-5 h-5 mr-3" /> Reports
        </NavLink>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => (isActive ? activeLinkClass : linkClass)}
        >
          <FaCog className="w-5 h-5 mr-3" /> Settings
        </NavLink>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
