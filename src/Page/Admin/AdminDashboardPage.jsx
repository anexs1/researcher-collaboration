// src/Page/Admin/AdminDashboardPage.jsx
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
import { ChartBarIcon } from "@heroicons/react/24/outline";
// --- *** ADDED IMPORT for framer-motion *** ---
import { motion, AnimatePresence } from "framer-motion";
// -------------------------------------------

// Adjust import paths as needed
import StatCard from "../../Component/Admin/StatCard";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton";
import Notification from "../../Component/Common/Notification"; // Assuming used for feedback

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminDashboardPage = () => {
  // --- State ---
  const [dashboardData, setDashboardData] = useState({
    counts: {
      users: { total: 0, active: 0, pending: 0, admins: 0 },
      publications: { total: 0 },
      projects: { total: 0, active: 0 },
    },
    recentActivities: { users: [], publications: [], projects: [] },
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
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard/stats`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      if (response.data?.success && response.data?.data) {
        console.log("Dashboard data received:", response.data.data);
        setDashboardData({
          // Use nullish coalescing for safety
          counts: {
            users: response.data.data.counts?.users ?? {
              total: 0,
              active: 0,
              pending: 0,
              admins: 0,
            },
            publications: response.data.data.counts?.publications ?? {
              total: 0,
            },
            projects: response.data.data.counts?.projects ?? {
              total: 0,
              active: 0,
            },
          },
          recentActivities: {
            users: response.data.data.recentActivities?.users ?? [],
            publications:
              response.data.data.recentActivities?.publications ?? [],
            projects: response.data.data.recentActivities?.projects ?? [],
          },
        });
      } else {
        throw new Error(
          response.data?.message || "Invalid API response format"
        );
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Failed dashboard data";
      setError(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        showNotification("Session expired/unauthorized.", "error");
        setTimeout(() => navigate("/login"), 2500);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Render Helper Functions ---

  const renderLoadingState = () => (
    /* ... loading skeleton JSX ... */
    <div className="space-y-6 animate-pulse">
      {" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {" "}
        {[...Array(8)].map((_, i) => (
          <LoadingSkeleton key={`stat-skel-${i}`} height="h-32" />
        ))}{" "}
      </div>{" "}
      <div className="mt-8 space-y-4">
        {" "}
        <LoadingSkeleton height="h-8" width="w-1/3" />{" "}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {" "}
          <LoadingSkeleton key="recent-u" height="h-48" />{" "}
          <LoadingSkeleton key="recent-p" height="h-48" />{" "}
          <LoadingSkeleton key="recent-pr" height="h-48" />{" "}
        </div>{" "}
      </div>{" "}
      <div className="mt-8 space-y-4">
        {" "}
        <LoadingSkeleton height="h-8" width="w-1/4" />{" "}
        <LoadingSkeleton height="h-24" />{" "}
      </div>{" "}
    </div>
  );

  const renderStatCards = () => (
    /* ... stat card JSX ... */
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {" "}
      <StatCard
        title="Total Users"
        value={dashboardData.counts.users.total}
        icon={<FaUsers className="text-indigo-500" />}
        linkTo="/admin/users"
        linkText="Manage Users"
      />{" "}
      <StatCard
        title="Active Users"
        value={dashboardData.counts.users.active}
        icon={<FaUserCheck className="text-green-500" />}
      />{" "}
      <StatCard
        title="Pending Users"
        value={dashboardData.counts.users.pending}
        icon={<FaUserClock className="text-amber-500" />}
        linkTo="/admin/pending-users"
        linkText="Review Users"
      />{" "}
      <StatCard
        title="Admin Users"
        value={dashboardData.counts.users.admins}
        icon={<FaUsers className="text-red-500" />}
      />{" "}
      <StatCard
        title="Total Projects"
        value={dashboardData.counts.projects.total}
        icon={<FaProjectDiagram className="text-purple-500" />}
        linkTo="/admin/projects"
        linkText="Manage Projects"
      />{" "}
      <StatCard
        title="Active Projects"
        value={dashboardData.counts.projects.active}
        icon={<FaClipboardList className="text-teal-500" />}
      />{" "}
      <StatCard
        title="Total Publications"
        value={dashboardData.counts.publications.total}
        icon={<FaNewspaper className="text-sky-500" />}
        linkTo="/admin/publications"
        linkText="Manage Pubs"
      />{" "}
    </div>
  );

  const formatDate = (dateString) => {
    /* ... date formatting helper ... */
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "-";
    }
  };

  const renderRecentActivities = () => (
    /* ... recent activities JSX ... */
    <div className="mt-8">
      {" "}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Recent Activities
      </h2>{" "}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {" "}
        {/* Users */}{" "}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          {" "}
          <h3 className="font-semibold text-lg text-gray-700 mb-3 border-b pb-2">
            New Users
          </h3>{" "}
          <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {" "}
            {dashboardData.recentActivities.users?.length > 0 ? (
              <ul className="space-y-2.5 text-sm">
                {dashboardData.recentActivities.users.map((user) => (
                  <li key={`user-${user.id}`} className="...">
                    <Link to={`/admin/users/${user.id}`} className="...">
                      {user.username}
                    </Link>
                    <span className="...">{formatDate(user.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent users.</p>
            )}{" "}
          </div>{" "}
        </div>{" "}
        {/* Publications */}{" "}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          {" "}
          <h3 className="font-semibold text-lg text-gray-700 mb-3 border-b pb-2">
            Recent Publications
          </h3>{" "}
          <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {" "}
            {dashboardData.recentActivities.publications?.length > 0 ? (
              <ul className="space-y-2.5 text-sm">
                {dashboardData.recentActivities.publications.map((pub) => (
                  <li key={`pub-${pub.id}`} className="...">
                    <Link to={`/admin/publications/${pub.id}`} className="...">
                      {pub.title}
                    </Link>
                    <span className="...">{formatDate(pub.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent publications.</p>
            )}{" "}
          </div>{" "}
        </div>{" "}
        {/* Projects */}{" "}
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          {" "}
          <h3 className="font-semibold text-lg text-gray-700 mb-3 border-b pb-2">
            Recent Projects
          </h3>{" "}
          <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {" "}
            {dashboardData.recentActivities.projects?.length > 0 ? (
              <ul className="space-y-2.5 text-sm">
                {dashboardData.recentActivities.projects.map((proj) => (
                  <li key={`proj-${proj.id}`} className="...">
                    <Link to={`/admin/projects/${proj.id}`} className="...">
                      {proj.title}
                    </Link>
                    <span className="...">{formatDate(proj.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent projects.</p>
            )}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );

  const renderQuickActions = () => (
    /* ... quick actions JSX ... */
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mt-8">
      {" "}
      <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-700">
        {" "}
        Quick Actions{" "}
      </h2>{" "}
      <div className="flex flex-wrap gap-3">
        {" "}
        <Link to="/admin/users" className="inline-flex ...">
          {" "}
          <FaUsers /> Manage Users{" "}
        </Link>{" "}
        <Link to="/admin/pending-users" className="inline-flex ...">
          {" "}
          <FaUserClock /> Review Pending{" "}
        </Link>{" "}
        <Link to="/admin/projects" className="inline-flex ...">
          {" "}
          <FaProjectDiagram /> Manage Projects{" "}
        </Link>{" "}
        <Link to="/admin/publications" className="inline-flex ...">
          {" "}
          <FaNewspaper /> Publications{" "}
        </Link>{" "}
        <Link to="/admin/reports" className="inline-flex ...">
          {" "}
          <ChartBarIcon /> View Reports{" "}
        </Link>{" "}
      </div>{" "}
    </div>
  );

  // --- Main Render ---
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <AdminPageHeader title="Dashboard Overview" />
      {/* Position Notification */}
      <div className="relative h-12 mb-4">
        {/* --- USE AnimatePresence HERE --- */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 z-40" // Positioned within relative parent
            >
              <Notification
                message={notification.message}
                type={notification.type}
                show={notification.show}
                onClose={() =>
                  setNotification((prev) => ({ ...prev, show: false }))
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* ------------------------------ */}
      </div>

      {error && !loading && (
        <ErrorMessage
          message={error}
          onClose={() => setError(null)}
          isDismissible={true}
        />
      )}

      {loading ? (
        renderLoadingState()
      ) : !error ? (
        <div className="space-y-8">
          {renderStatCards()}
          {renderRecentActivities()}
          {renderQuickActions()}
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
