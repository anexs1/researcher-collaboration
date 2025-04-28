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
  FaClipboardList,
  FaCog, // Added settings icon
} from "react-icons/fa";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// src/Page/Admin/AdminDashboardPage.jsx

// --- Adjust imports based on the image ---
import StatCard from "./StatCard"; // It's in the same folder
import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Verify THIS path - is it in Component/Admin?
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Verify path
import LoadingSpinner from "../../Component/Common/LoadingSpinner"; // Verify path
import Notification from "../../Component/Common/Notification"; // Verify path
import RecentActivityCard from "./RecentActivityCard"; // <<< CORRECTED PATH: Use ./
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton"; // Verify path
// --- End Adjustments ---

// ... other imports (React, axios, icons, framer-motion) ...
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

const AdminDashboardPage = () => {
  // --- State ---
  const [dashboardData, setDashboardData] = useState({
    counts: { users: {}, publications: {}, projects: {} }, // Init empty for safety
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
    /* ... show notification logic ... */
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  const fetchDashboardData = useCallback(async () => {
    /* ... data fetching logic (no changes needed from previous version) ... */
    setLoading(true);
    setError(null);
    console.log("Fetching admin dashboard data...");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Auth required");
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard/stats`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      if (response.data?.success && response.data?.data) {
        console.log("Dashboard data received:", response.data.data);
        setDashboardData({
          // Use nullish coalescing for safer defaults
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

  // Skeleton remains mostly the same, but maybe use it more granularly
  const renderLoadingState = () => (
    <div className="space-y-8">
      {/* Stat Card Skeletons */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(8)].map((_, i) => (
          <motion.div key={`stat-skel-${i}`} variants={itemVariants}>
            <LoadingSkeleton height="h-36" rounded="rounded-xl" />
          </motion.div>
        ))}
      </motion.div>
      {/* Recent Activities Skeletons */}
      <motion.div className="mt-10" variants={itemVariants}>
        <LoadingSkeleton height="h-8" width="w-1/4" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton
            key="recent-u-skel"
            height="h-48"
            rounded="rounded-xl"
          />
          <LoadingSkeleton
            key="recent-p-skel"
            height="h-48"
            rounded="rounded-xl"
          />
          <LoadingSkeleton
            key="recent-pr-skel"
            height="h-48"
            rounded="rounded-xl"
          />
        </div>
      </motion.div>
      {/* Quick Actions Skeleton */}
      <motion.div className="mt-10" variants={itemVariants}>
        <LoadingSkeleton height="h-8" width="w-1/4" className="mb-4" />
        <LoadingSkeleton height="h-24" rounded="rounded-xl" />
      </motion.div>
    </div>
  );

  // Stat Cards - Use data safely with nullish coalescing
  const renderStatCards = () => (
    <motion.div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          title="Total Users"
          value={dashboardData.counts?.users?.total ?? 0}
          icon={<FaUsers className="text-indigo-500" />}
          linkTo="/admin/users"
          linkText="Manage Users"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Active Users"
          value={dashboardData.counts?.users?.active ?? 0}
          icon={<FaUserCheck className="text-green-500" />}
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Pending Approvals"
          value={dashboardData.counts?.users?.pending ?? 0}
          icon={<FaUserClock className="text-amber-500" />}
          linkTo="/admin/pending-users"
          linkText="Review Users"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Admin Accounts"
          value={dashboardData.counts?.users?.admins ?? 0}
          icon={<FaUsers className="text-red-500" />}
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Total Projects"
          value={dashboardData.counts?.projects?.total ?? 0}
          icon={<FaProjectDiagram className="text-purple-500" />}
          linkTo="/admin/projects"
          linkText="Manage Projects"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Active Projects"
          value={dashboardData.counts?.projects?.active ?? 0}
          icon={<FaClipboardList className="text-teal-500" />}
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Total Publications"
          value={dashboardData.counts?.publications?.total ?? 0}
          icon={<FaNewspaper className="text-sky-500" />}
          linkTo="/admin/publications"
          linkText="Manage Pubs"
        />
      </motion.div>
      {/* Add placeholder or other relevant card */}
      <motion.div variants={itemVariants}>
        <StatCard
          title="Settings"
          value={"Configure"}
          icon={<FaCog className="text-gray-500" />}
          linkTo="/admin/settings"
          linkText="Go to Settings"
        />
      </motion.div>
    </motion.div>
  );

  // Use the new RecentActivityCard component
  const renderRecentActivities = () => (
    <motion.div
      className="mt-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-5">
        Recent Activities
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <RecentActivityCard
            title="New Users"
            items={dashboardData.recentActivities?.users ?? []}
            linkPrefix="/admin/users"
            keyPrefix="user"
            isLoading={loading} // Pass loading state if needed per card
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RecentActivityCard
            title="Recent Publications"
            items={dashboardData.recentActivities?.publications ?? []}
            linkPrefix="/admin/publications"
            keyPrefix="pub"
            isLoading={loading}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RecentActivityCard
            title="Recent Projects"
            items={dashboardData.recentActivities?.projects ?? []}
            linkPrefix="/admin/projects" // Assuming this is the detail route
            keyPrefix="proj"
            isLoading={loading}
          />
        </motion.div>
      </div>
    </motion.div>
  );

  // Quick actions section - enhanced styling
  const renderQuickActions = () => (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-10"
      variants={itemVariants}
    >
      <h2 className="text-xl font-semibold mb-5 pb-3 border-b border-gray-200 text-gray-800">
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-4">
        {" "}
        {/* Increased gap */}
        {/* Example Button Style */}
        <Link
          to="/admin/users"
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          {" "}
          <FaUsers className="-ml-1 mr-2 h-5 w-5" /> Manage Users{" "}
        </Link>
        <Link
          to="/admin/pending-users"
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-150 ease-in-out"
        >
          {" "}
          <FaUserClock className="-ml-1 mr-2 h-5 w-5" /> Review Pending{" "}
        </Link>
        <Link
          to="/admin/projects"
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out"
        >
          {" "}
          <FaProjectDiagram className="-ml-1 mr-2 h-5 w-5" /> Manage Projects{" "}
        </Link>
        <Link
          to="/admin/publications"
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition duration-150 ease-in-out"
        >
          {" "}
          <FaNewspaper className="-ml-1 mr-2 h-5 w-5" /> Publications{" "}
        </Link>
        {/* <Link to="/admin/reports" className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"> <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" /> View Reports </Link> */}
        <Link
          to="/admin/settings"
          className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          {" "}
          <FaCog className="-ml-1 mr-2 h-5 w-5" /> System Settings{" "}
        </Link>
      </div>
    </motion.div>
  );

  // --- Main Render ---
  return (
    // Added container for better padding control
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <AdminPageHeader
        title="Dashboard Overview"
        subtitle="System statistics and recent activity"
      />
      {/* Position Notification Fixed or Relative */}
      {/* Using fixed positioning for global notifications often works well */}
      <div className="fixed top-20 right-6 z-50 w-full max-w-sm">
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
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
      </div>
      {/* Display Error Message if fetch failed */}
      {error && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ErrorMessage
            message={error}
            onClose={() => setError(null)}
            isDismissible={true}
          />
        </motion.div>
      )}
      {/* Display Loading Skeleton or Content */}
      {loading ? (
        renderLoadingState()
      ) : !error ? ( // Render content only if no error AND not loading
        <motion.div
          className="space-y-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {" "}
          {/* Added spacing */}
          {renderStatCards()}
          {renderRecentActivities()}
          {renderQuickActions()}
        </motion.div>
      ) : null}{" "}
      {/* Don't render content sections if there was a fetch error */}
    </div>
  );
};

export default AdminDashboardPage;
