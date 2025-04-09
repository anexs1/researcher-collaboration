// File: src/Page/Admin/AdminDashboardPage.jsx - UPDATED

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUsers,
  FaProjectDiagram,
  FaNewspaper,
  FaUserClock,
} from "react-icons/fa";
import { Cog6ToothIcon, ChartBarIcon } from "@heroicons/react/24/outline";

import StatCard from "../../Component/Admin/StatCard"; // Adjust path if needed
import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Use if you have this component
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Adjust path if needed
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton"; // Adjust path if needed

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUsername, setAdminUsername] = useState("Admin");
  const navigate = useNavigate();

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login.");
      setLoading(false);
      setTimeout(() => navigate("/login", { replace: true }), 1500);
      return;
    }

    try {
      // ----- CHANGE HERE: Updated the API endpoint -----
      const statsResponse = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard-stats`, // <<< Use the dedicated stats endpoint
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // ----- END CHANGE -----

      // Assuming the new endpoint returns data in the same format: { success: true, data: { ...counts } }
      if (statsResponse.data && typeof statsResponse.data.data === "object") {
        const fetchedStats = statsResponse.data.data || {};
        setStats({
          userCount: fetchedStats.userCount ?? 0,
          pendingUserCount: fetchedStats.pendingUserCount ?? 0,
          projectCount: fetchedStats.projectCount ?? 0,
          publicationCount: fetchedStats.publicationCount ?? 0,
        });
      } else {
        console.warn("Stats data format unexpected:", statsResponse.data);
        setStats({});
        setError("Received unexpected data format for statistics.");
      }

      // Optional: Fetch admin user details remains the same if needed
    } catch (err) {
      console.error("Error fetching admin data:", err);
      let message = "An unexpected error occurred.";
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          message = "Unauthorized or session expired. Please log in again.";
          setTimeout(() => navigate("/login", { replace: true }), 2000);
        } else {
          message = `Server error: ${err.response.status} - ${
            err.response.data?.message || "Unknown error"
          }`;
        }
      } else if (err.request) {
        message = "Network error. Could not reach the server.";
      } else {
        message = err.message || message;
      }
      setError(message);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // --- Render Logic (remains the same) ---
  const renderLoadingSkeletons = () => (
    <>
      <div className="p-4 bg-gray-200 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <LoadingSkeleton height="h-32" />
        <LoadingSkeleton height="h-32" />
        <LoadingSkeleton height="h-32" />
        <LoadingSkeleton height="h-32" />
      </div>
      <div className="p-6 bg-gray-200 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
        <div className="flex flex-wrap gap-3">
          <div className="h-10 bg-gray-300 rounded w-32"></div>
          <div className="h-10 bg-gray-300 rounded w-36"></div>
          <div className="h-10 bg-gray-300 rounded w-40"></div>
          <div className="h-10 bg-gray-300 rounded w-40"></div>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
        Admin Dashboard
      </h1>
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      {loading ? (
        renderLoadingSkeletons()
      ) : (
        <>
          {!error && (
            <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Welcome, {adminUsername}!
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Platform overview and quick actions.
              </p>
            </div>
          )}
          {typeof stats === "object" && Object.keys(stats).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                title="Total Users"
                value={stats.userCount}
                icon={<FaUsers className="text-indigo-500" />}
                linkTo="/admin/users"
                linkText="Manage Users"
              />
              <StatCard
                title="Pending Users"
                value={stats.pendingUserCount}
                icon={<FaUserClock className="text-amber-500" />}
                linkTo="/admin/pending-users" // Make sure this route exists in admin.routes.js
                linkText="Review Users"
              />
              <StatCard
                title="Total Projects"
                value={stats.projectCount}
                icon={<FaProjectDiagram className="text-emerald-500" />}
                // linkTo="/admin/projects"
                // linkText="View Projects"
              />
              <StatCard
                title="Total Publications"
                value={stats.publicationCount}
                icon={<FaNewspaper className="text-sky-500" />}
                linkTo="/admin/publications"
                linkText="Manage Publications"
              />
            </div>
          ) : (
            !error && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center text-yellow-700">
                No statistics data available.
              </div>
            )
          )}
          {!error && (
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-700">
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/admin/users"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <FaUsers className="-ml-1 mr-2 h-5 w-5" /> Manage Users
                </Link>
                <Link
                  to="/admin/pending-users"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                >
                  <FaUserClock className="-ml-1 mr-2 h-5 w-5" /> Review Pending
                </Link>
                <Link
                  to="/admin/publications"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                >
                  <FaNewspaper className="-ml-1 mr-2 h-5 w-5" /> Manage
                  Publications
                </Link>
                <Link
                  to="/admin/reports"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" /> View Reports
                </Link>
                <Link
                  to="/admin/settings"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <Cog6ToothIcon className="-ml-1 mr-2 h-5 w-5" /> System
                  Settings
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
