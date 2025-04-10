// src/Layout/UserLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Component/Sidebar"; // Adjust path if needed

const UserLayout = ({ isLoggedIn, handleLogout }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {" "}
      {/* Use a background color like gray-100 */}
      {/* Sidebar */}
      <Sidebar isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
      {/* Main Content Area */}
      {/* Apply padding here for consistent spacing across pages within this layout */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-auto">
        <Outlet />{" "}
        {/* Child route components (Profile, Publication, etc.) will render here */}
      </main>
    </div>
  );
};

export default UserLayout;
