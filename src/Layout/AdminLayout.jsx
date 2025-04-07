// src/Layout/AdminLayout.js
import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../Component/Admin/AdminSidebar"; // Adjust path if needed

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {" "}
      <AdminSidebar />
      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 lg:p-8">
          <Outlet /> {/* Child admin routes are rendered here */}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
