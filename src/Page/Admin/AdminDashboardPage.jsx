import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUsers,
  FaUserCheck,
  FaProjectDiagram,
  FaNewspaper,
  FaUserClock,
  FaClipboardList, // Added for Projects
} from "react-icons/fa";
import { ChartBarIcon } from "@heroicons/react/24/outline"; // Assuming Cog6ToothIcon is not used now
import StatCard from "../../Component/Admin/StatCard"; // Verify path
import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Verify path
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Verify path
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton"; // Verify path
import Notification from "../../Component/Common/Notification"; // Verify path

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminDashboardPage = () => {
  // --- State ---
  const [dashboardData, setDashboardData] = useState({
    counts: {
      users: { total: 0, active: 0, pending: 0 },
      publications: { total: 0, published: 0 },
      projects: { total: 0, active: 0 }, // Added projects count
    },
    recentActivities: {
      users: [],
      publications: [],
      projects: [], // Added recent projects
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const navigate = useNavigate();

  // --- Functions ---

  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("Fetching admin dashboard data...");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication required");

      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response.data?.success && response.data?.data) {
        console.log("Dashboard data received:", response.data.data);
        // Ensure defaults if parts of the data structure are missing from API
        setDashboardData((prev) => ({
          counts: {
            users: response.data.data.counts?.users ?? {
              total: 0,
              active: 0,
              pending: 0,
            },
            publications: response.data.data.counts?.publications ?? {
              total: 0,
              published: 0,
            },
            projects: response.data.data.counts?.projects ?? {
              total: 0,
              active: 0,
            }, // Default for projects count
          },
          recentActivities: {
            users: response.data.data.recentActivities?.users ?? [],
            publications:
              response.data.data.recentActivities?.publications ?? [],
            projects: response.data.data.recentActivities?.projects ?? [], // Default for recent projects
          },
        }));
      } else {
        throw new Error(
          response.data?.message || "Invalid response format from dashboard API"
        );
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard data";
      setError(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        showNotification(
          "Session expired or unauthorized. Redirecting to login.",
          "error"
        );
        setTimeout(() => navigate("/login"), 2500);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]); // Dependency array

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Fetch data on mount

  // --- Render Helper Functions ---

  const renderLoadingState = () => (
    <div className="space-y-6 animate-pulse">
      {" "}
      {/* Added pulse animation */}
      {/* Stat Card Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {" "}
        {/* Adjusted grid for 6 cards */}
        {[...Array(6)].map(
          (
            _,
            i // Changed to 6 skeletons
          ) => (
            <LoadingSkeleton key={`stat-${i}`} height="h-32" />
          )
        )}
      </div>
      {/* Recent Activities Skeletons */}
      <div className="space-y-4">
        <LoadingSkeleton height="h-8" width="w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {" "}
          {/* Adjusted grid for 3 activity types */}
          <LoadingSkeleton key="recent-1" height="h-40" />
          <LoadingSkeleton key="recent-2" height="h-40" />
          <LoadingSkeleton key="recent-3" height="h-40" />
        </div>
      </div>
      {/* Quick Actions Skeleton */}
      <div className="space-y-4">
        <LoadingSkeleton height="h-8" width="w-1/4" />
        <LoadingSkeleton height="h-24" />
      </div>
    </div>
  );

  const renderStatCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Total Users"
        value={dashboardData.counts.users.total}
        icon={<FaUsers className="text-indigo-500" />}
        linkTo="/admin/users"
        linkText="Manage Users"
      />
      <StatCard
        title="Active Users"
        value={dashboardData.counts.users.active}
        icon={<FaUserCheck className="text-green-500" />}
      />
      <StatCard
        title="Pending Users"
        value={dashboardData.counts.users.pending}
        icon={<FaUserClock className="text-amber-500" />}
        linkTo="/admin/users/pending"
        linkText="Review Users"
      />
      <StatCard
        title="Total Projects"
        value={dashboardData.counts.projects.total}
        icon={<FaProjectDiagram className="text-purple-500" />}
        linkTo="/admin/projects"
        linkText="Manage Projects"
      />{" "}
      {/* Added Project Card */}
      <StatCard
        title="Active Projects"
        value={dashboardData.counts.projects.active}
        icon={<FaClipboardList className="text-teal-500" />}
      />{" "}
      {/* Added Active Project Card */}
      <StatCard
        title="Publications"
        value={dashboardData.counts.publications.published}
        icon={<FaNewspaper className="text-sky-500" />}
        linkTo="/admin/publications"
        linkText="Manage"
      />
    </div>
  );

  const renderRecentActivities = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Recent Activities</h2>
      {/* Adjusted grid for 3 activity types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Users */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 max-h-60 overflow-y-auto">
          {" "}
          {/* Added max-height and scroll */}
          <h3 className="font-medium text-gray-700 mb-3 sticky top-0 bg-white pb-2">
            New Users
          </h3>
          {dashboardData.recentActivities.users?.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {dashboardData.recentActivities.users.map((user) => (
                <li
                  key={`user-${user.id}`}
                  className="flex items-center justify-between space-x-2"
                >
                  <Link
                    to={`/admin/users/${user.id}`}
                    className="font-medium hover:text-indigo-600 truncate"
                    title={user.username}
                  >
                    {user.username}
                  </Link>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No recent users</p>
          )}
        </div>
        {/* Recent Publications */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 max-h-60 overflow-y-auto">
          <h3 className="font-medium text-gray-700 mb-3 sticky top-0 bg-white pb-2">
            Recent Publications
          </h3>
          {dashboardData.recentActivities.publications?.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {dashboardData.recentActivities.publications.map((pub) => (
                <li
                  key={`pub-${pub.id}`}
                  className="flex items-center justify-between space-x-2"
                >
                  <Link
                    to={`/admin/publications/${pub.id}`}
                    className="font-medium hover:text-indigo-600 truncate"
                    title={pub.title}
                  >
                    {pub.title}
                  </Link>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(pub.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No recent publications</p>
          )}
        </div>
        {/* === Recent Projects === */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 max-h-60 overflow-y-auto">
          <h3 className="font-medium text-gray-700 mb-3 sticky top-0 bg-white pb-2">
            Recent Projects
          </h3>
          {dashboardData.recentActivities.projects?.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {dashboardData.recentActivities.projects.map((proj) => (
                <li
                  key={`proj-${proj.id}`}
                  className="flex items-center justify-between space-x-2"
                >
                  <Link
                    to={`/admin/projects/${proj.id}`}
                    className="font-medium hover:text-indigo-600 truncate"
                    title={proj.title}
                  >
                    {proj.title}
                  </Link>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(proj.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No recent projects</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-700">
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/users"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FaUsers className="-ml-1 mr-2 h-5 w-5" /> Manage Users
        </Link>
        <Link
          to="/admin/users/pending"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:ring-offset-2 focus:ring-amber-500"
        >
          <FaUserClock className="-ml-1 mr-2 h-5 w-5" /> Review Pending
        </Link>
        {/* === Added Projects Button === */}
        <Link
          to="/admin/projects"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:ring-offset-2 focus:ring-purple-500"
        >
          <FaProjectDiagram className="-ml-1 mr-2 h-5 w-5" /> Manage Projects
        </Link>
        {/* ========================== */}
        <Link
          to="/admin/publications"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:ring-offset-2 focus:ring-sky-500"
        >
          <FaNewspaper className="-ml-1 mr-2 h-5 w-5" /> Publications
        </Link>
        <Link
          to="/admin/reports"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" /> View Reports
        </Link>
        {/* Optional: Settings Link */}
        {/* <Link to="/admin/settings" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:ring-offset-2 focus:ring-indigo-500"><Cog6ToothIcon className="-ml-1 mr-2 h-5 w-5" /> Settings</Link> */}
      </div>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {" "}
      {/* Added container and padding */}
      <AdminPageHeader title="Dashboard Overview" />
      {/* Position Notification Fixed or Relative */}
      <div className="relative h-10">
        {" "}
        {/* Container for notification positioning */}
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
          className="absolute top-0 left-0 right-0 z-40" // Adjust as needed
        />
      </div>
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      {loading ? (
        renderLoadingState()
      ) : !error ? ( // Only render content if no error and not loading
        <>
          {/* Optional welcome/summary */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            ...
          </div>

          {renderStatCards()}
          {renderRecentActivities()}
          {renderQuickActions()}
        </>
      ) : null}{" "}
    </div>
  );
};

export default AdminDashboardPage;
