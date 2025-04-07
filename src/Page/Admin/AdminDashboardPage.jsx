// src/Page/Admin/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUsers,
  FaProjectDiagram,
  FaNewspaper,
  FaUserClock,
} from "react-icons/fa"; // Added FaUserClock
import { Cog6ToothIcon, ChartBarIcon } from "@heroicons/react/24/outline";

import StatCard from "../../Component/Admin/StatCard"; // Adjust path if needed
import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Use if you have this component
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Adjust path if needed
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton"; // Adjust path if needed
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({}); // Initialize with empty object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminUsername, setAdminUsername] = useState("Admin"); // Placeholder or fetch real name
  const navigate = useNavigate();

  // Use useCallback for the fetch function to stabilize it for useEffect dependency
  const fetchAdminData = useCallback(async () => {
    // Reset state before fetching
    setLoading(true);
    setError(null);
    // setStats({}); // Don't reset stats here, let StatCard handle loading state

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login.");
      setLoading(false);
      setTimeout(() => navigate("/login", { replace: true }), 1500); // Use replace
      return;
    }

    try {
      // Fetch stats (Use relative path if proxy configured, else full URL)
      const statsResponse = await axios.get(
        `${API_BASE_URL}/api/auth/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Validate response structure before setting state
      if (statsResponse.data && typeof statsResponse.data.data === "object") {
        setStats(statsResponse.data.data || {}); // Ensure it's an object
      } else {
        console.warn("Stats data format unexpected:", statsResponse.data);
        setStats({}); // Fallback to empty object
        setError("Received unexpected data format for statistics."); // Inform user
      }

      // --- Optional: Fetch admin user details ---

      // --- End Optional Profile Fetch ---
    } catch (err) {
      console.error("Error fetching admin data:", err);

      // Specific error handling
      if (err.response) {
        // Request made and server responded
        if (err.response.status === 401 || err.response.status === 403) {
          setError("Unauthorized or session expired. Please log in again.");
          // Optional: Clear token and redirect immediately
          // localStorage.removeItem("authToken");
          // navigate("/login", { replace: true });
        } else if (err.response.status === 404) {
          setError(
            err.response.data?.message || `Server error: ${err.response.status}`
          );
        } else {
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError("Network error. Could not reach the server.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(err.message || "An unexpected error occurred.");
      }
      setStats({}); // Ensure stats is empty on error
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Dependency array

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]); // Run fetch function when component mounts or fetchAdminData changes

  // --- Render Logic ---

  // Display loading state more gracefully within the page structure
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
        </div>
      </div>
    </>
  );

  return (
    // Removed background and min-height, AdminLayout handles this
    <div className="space-y-6 md:space-y-8">
      {/* Use AdminPageHeader if you have it, or a simple h1 */}
      {/* <AdminPageHeader title="Admin Dashboard" /> */}
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
        Admin Dashboard
      </h1>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {loading ? (
        renderLoadingSkeletons()
      ) : (
        <>
          {/* Welcome Message - Only show if no error */}
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

          {/* Stats Cards Grid */}
          {/* Check if stats is an object and has keys before rendering grid */}
          {typeof stats === "object" && Object.keys(stats).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                title="Total Users"
                value={stats.userCount} // Optional chaining not needed if initialized to {}
                icon={<FaUsers className="text-indigo-500" />}
                linkTo="/admin/users"
                linkText="Manage Users"
                // isLoading={loading} // Handled by parent loading state now
              />
              <StatCard
                title="Pending Users" // Example for new stat
                value={stats.pendingUserCount} // Assuming API returns this
                icon={<FaUserClock className="text-amber-500" />}
                linkTo="/admin/pending-users"
                linkText="Review Users"
                // isLoading={loading}
              />
              <StatCard
                title="Total Projects"
                value={stats.projectCount}
                icon={<FaProjectDiagram className="text-emerald-500" />}
                // linkTo="/admin/projects" linkText="View Projects"
                // isLoading={loading}
              />
              <StatCard
                title="Total Publications"
                value={stats.publicationCount}
                icon={<FaNewspaper className="text-sky-500" />}
                // linkTo="/admin/publications" linkText="Manage Publications"
                // isLoading={loading}
              />
            </div>
          ) : (
            // Show message if stats are empty but no error occurred
            !error && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center text-yellow-700">
                No statistics data available.
              </div>
            )
          )}

          {/* Quick Links Section - Only show if no error */}
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

          {/* Add other dashboard widgets here if needed */}
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
