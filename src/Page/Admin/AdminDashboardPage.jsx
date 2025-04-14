import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUsers,
  FaUserCheck,
  FaProjectDiagram,
  FaNewspaper,
  FaUserClock,
} from "react-icons/fa";
import { Cog6ToothIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import StatCard from "../../Component/Admin/StatCard";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton";
import Notification from "../../Component/Common/Notification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    counts: {
      users: { total: 0, active: 0, pending: 0 },
      publications: { total: 0, published: 0 },
      projects: { total: 0, active: 0 },
    },
    recentActivities: { users: [], publications: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const navigate = useNavigate();

  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };
  // Update your fetchDashboardData function to ensure proper error handling
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data?.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error(response.data?.message || "Invalid response format");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard data";
      setError(errorMsg);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Render a loading state for the dashboard, consisting of a grid of LoadingSkeleton
   * components for the stats section and a pair of LoadingSkeleton components for the
   * recent activities section.
   *
   * @returns {JSX.Element} The rendered loading state.
   */
  /*******  de554bf5-c569-4c26-b73e-d504723a41ee  *******/ const renderLoadingState =
    () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <LoadingSkeleton key={i} height="h-32" />
          ))}
        </div>
        <div className="space-y-4">
          <LoadingSkeleton height="h-8" width="w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LoadingSkeleton height="h-40" />
            <LoadingSkeleton height="h-40" />
          </div>
        </div>
      </div>
    );

  const renderStatCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        title="Published Content"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-3">New Users</h3>
          {dashboardData.recentActivities.users.length > 0 ? (
            <ul className="space-y-2">
              {dashboardData.recentActivities.users.map((user) => (
                <li key={user.id} className="flex items-center space-x-3">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent users</p>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-3">
            Recent Publications
          </h3>
          {dashboardData.recentActivities.publications.length > 0 ? (
            <ul className="space-y-2">
              {dashboardData.recentActivities.publications.map((pub) => (
                <li key={pub.id} className="flex items-center space-x-3">
                  <span className="font-medium truncate">{pub.title}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(pub.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent publications</p>
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <FaUsers className="-ml-1 mr-2 h-5 w-5" /> Manage Users
        </Link>
        <Link
          to="/admin/users/pending"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
        >
          <FaUserClock className="-ml-1 mr-2 h-5 w-5" /> Review Pending
        </Link>
        <Link
          to="/admin/publications"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
        >
          <FaNewspaper className="-ml-1 mr-2 h-5 w-5" /> Manage Publications
        </Link>
        <Link
          to="/admin/reports"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" /> View Reports
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Dashboard Overview" />

      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {loading ? (
        renderLoadingState()
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              System Overview
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Current platform statistics and activities
            </p>
          </div>

          {renderStatCards()}
          {renderRecentActivities()}
          {renderQuickActions()}
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
