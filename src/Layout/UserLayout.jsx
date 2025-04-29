// src/Layout/UserLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Component/Sidebar"; // Adjust path if needed

// Accepts props passed from the parent Route element in App.jsx
const UserLayout = ({ isLoggedIn, handleLogout, currentUser }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Pass relevant props down to Sidebar */}
      <Sidebar
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        currentUser={currentUser} // <-- Pass currentUser prop
      />

      {/* Main Content Area where nested routes render */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* Child user routes (Profile, Projects, etc.) are rendered here */}
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
