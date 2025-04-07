// src/Page/Admin/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Assuming axios is used
import { FaUsers, FaProjectDiagram, FaNewspaper } from "react-icons/fa";
import { Cog6ToothIcon, ChartBarIcon } from "@heroicons/react/24/outline"; // For quick links

import StatCard from "../../Component/Admin/StatCard";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Use improved header
import ErrorMessage from "../../Component/Common/ErrorMessage";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUsername, setAdminUsername] = useState("Admin"); // Placeholder
  const navigate = useNavigate();

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStats(null); // Clear previous stats

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 1500); // Redirect after delay
      return;
    }

    try {
      // Fetch stats (replace with your actual endpoint)
      const statsResponse = await axios.get("/api/admin/stats", {
        // Make sure this endpoint exists
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statsResponse.data?.data) {
        setStats(statsResponse.data.data);
      } else {
        console.warn("Stats data not found in response:", statsResponse.data);
        setStats({}); // Set to empty if no data key
      }

      // Optional: Fetch admin user details for welcome message
      // const profileResponse = await axios.get("/api/auth/me", { // Assuming a 'me' endpoint
      //    headers: { Authorization: `Bearer ${token}` },
      // });
      // if (profileResponse.data?.data?.username) {
      //    setAdminUsername(profileResponse.data.data.username);
      // }
      // Check role AFTER potentially fetching profile
      // if (profileResponse.data?.data?.role !== 'admin') {
      //    throw new Error("Access denied. Admins only.");
      // }
    } catch (err) {
      console.error("Error fetching admin data:", err);
      if (err.message === "Access denied. Admins only.") {
        setError(err.message);
        setTimeout(() => navigate("/"), 2000); // Redirect non-admins home
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load dashboard data."
        );
        if (err.response?.status === 401 || err.response?.status === 403) {
          // Maybe redirect to login if unauthorized
          // setTimeout(() => navigate("/login"), 2000);
        }
      }
      setStats({}); // Ensure stats is not null on error
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <AdminPageHeader title="Admin Dashboard">
        {/* Optional actions like "Create New User" */}
      </AdminPageHeader>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Welcome Message */}
      {!loading && !error && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome, {adminUsername}!
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Here's a quick overview of the platform.
          </p>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Total Users"
          value={stats?.userCount} // Use optional chaining
          icon={<FaUsers className="text-indigo-500" />} // Changed color
          linkTo="/admin/users"
          linkText="Manage Users"
          isLoading={loading}
        />
        <StatCard
          title="Total Projects"
          value={stats?.projectCount}
          icon={<FaProjectDiagram className="text-emerald-500" />} // Changed color
          isLoading={loading}
          // linkTo="/admin/projects" linkText="View Projects" // Add link if applicable
        />
        <StatCard
          title="Total Publications"
          value={stats?.publicationCount}
          icon={<FaNewspaper className="text-sky-500" />} // Changed color
          isLoading={loading}
          // linkTo="/admin/publications" linkText="Manage Publications" // Add link if applicable
        />
        {/* Add more StatCards */}
      </div>

      {/* Quick Links Section */}
      {!loading && !error && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <FaUsers className="mr-2 h-4 w-4" /> Manage Users
            </Link>
            <Link
              to="/admin/reports"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <ChartBarIcon className="mr-2 h-4 w-4" /> View Reports
            </Link>
            <Link
              to="/admin/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Cog6ToothIcon className="mr-2 h-4 w-4" /> System Settings
            </Link>
            {/* Add more relevant links */}
          </div>
        </div>
      )}

      {/* Placeholder for other dashboard widgets like recent activity, charts etc. */}
    </div>
  );
};

export default AdminDashboardPage;
