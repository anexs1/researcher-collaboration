// src/Component/Sidebar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import Link
import { FaHome, FaUser, FaCogs, FaSignOutAlt } from "react-icons/fa";
// Sidebar component that displays navigation links to different sections of the profile page

function Sidebar({ isLoggedIn }) {
  const [menuItems, setMenuItems] = useState([
    { path: "account", label: "Account Information" },
    { path: "about", label: "About Me" },
    { path: "education", label: "Education" },
    { path: "skills", label: "Skills & Technologies" },
    { path: "research", label: "Research Interests" },
    { path: "publications", label: "Publications" },
  ]);

  return (
    <div className="bg-gray-200 p-4 rounded-md h-full w-64">
      <h2 className="text-lg font-semibold mb-4">Profile Menu</h2>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="mb-2">
              <Link
                to={`/profile/${item.path}`} // Adjust the base path as needed
                className="text-blue-500 hover:text-blue-700"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
