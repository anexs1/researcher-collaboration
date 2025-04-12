// src/Layout/UserLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Component/Sidebar"; // Adjust path if needed

// *** MODIFIED: Accept currentUser prop ***
const UserLayout = ({ isLoggedIn, handleLogout, currentUser }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Pass currentUser down to Sidebar */}
      <Sidebar
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        currentUser={currentUser} // <-- Pass prop
      />

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
export default UserLayout;
