// src/Layout/AdminLayout.jsx
// NOTE: This file should likely be named AdminLayout.jsx for consistency
import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../Component/Admin/AdminSidebar"; // Adjust path if needed

// Currently accepts no props from App.jsx, which is fine if not needed.
// If AdminSidebar needed currentUser, you'd add '{ currentUser }' as an argument
// and pass it down: <AdminSidebar currentUser={currentUser} />
const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <AdminSidebar />
      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
          {/* Child admin routes (AdminDashboard, AdminUsers, etc.) are rendered here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
