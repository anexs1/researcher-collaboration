// src/Page/Admin/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUsers, FaUserCheck, FaProjectDiagram, FaNewspaper, FaUserClock,
  FaClipboardList, FaCog, FaChartBar,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Assuming these components are correctly pathed and updated as discussed
import StatCard from "./StatCard";
import RecentActivityCard from "./RecentActivityCard";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import Notification from "../../Component/Common/Notification";
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 15 } },
};

const AdminDashboardPage = () => {
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
    message: "", type: "", show: false,
  });
  const navigate = useNavigate();

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, show: false })), 4000);
  }, []); // Empty dependency array if setNotification is stable (which it is)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showNotification("Authentication required. Please log in.", "error");
        navigate("/login"); // Redirect immediately if no token
        return;
      }
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard/stats`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      if (response.data?.success && response.data?.data) {
        setDashboardData({
          counts: {
            users: response.data.data.counts?.users ?? { total: 0, active: 0, pending: 0, admins: 0 },
            publications: response.data.data.counts?.publications ?? { total: 0 },
            projects: response.data.data.counts?.projects ?? { total: 0, active: 0 },
          },
          recentActivities: {
            users: response.data.data.recentActivities?.users ?? [],
            publications: response.data.data.recentActivities?.publications ?? [],
            projects: response.data.data.recentActivities?.projects ?? [],
          },
        });
      } else {
        throw new Error(response.data?.message || "Invalid API response for dashboard data.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to load dashboard data.";
      setError(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        showNotification("Session expired or unauthorized. Redirecting to login...", "error");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        showNotification(errorMsg, "error"); // Show other errors as well
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, showNotification]); // Added showNotification

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const renderLoadingState = () => (
    <div className="space-y-10">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        variants={containerVariants} initial="hidden" animate="visible"
      >
        {[...Array(8)].map((_, i) => (
          <motion.div key={`stat-skel-${i}`} variants={itemVariants}>
            <LoadingSkeleton height="h-40" rounded="rounded-xl" className="bg-slate-200" />
          </motion.div>
        ))}
      </motion.div>
      <motion.div className="mt-12" variants={itemVariants}>
        <LoadingSkeleton height="h-10" width="w-1/3" className="mb-6 bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <LoadingSkeleton key={`recent-skel-${i}`} height="h-56" rounded="rounded-xl" className="bg-slate-200" />
          ))}
        </div>
      </motion.div>
      <motion.div className="mt-12" variants={itemVariants}>
        <LoadingSkeleton height="h-10" width="w-1/3" className="mb-6 bg-slate-200" />
        <LoadingSkeleton height="h-28" rounded="rounded-xl" className="bg-slate-200" />
      </motion.div>
    </div>
  );

  const renderStatCards = () => (
    <motion.div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      variants={containerVariants} initial="hidden" animate="visible"
    >
      <motion.div variants={itemVariants}><StatCard title="Total Users" value={dashboardData.counts.users.total} icon={<FaUsers />} linkTo="/admin/users" linkText="Manage Users" color="sky" /></motion.div>
      <motion.div variants={itemVariants}><StatCard title="Active Users" value={dashboardData.counts.users.active} icon={<FaUserCheck />} color="emerald" /></motion.div>
      <motion.div variants={itemVariants}><StatCard title="Pending Approvals" value={dashboardData.counts.users.pending} icon={<FaUserClock />} linkTo="/admin/pending-users" linkText="Review Users" color="amber" /></motion.div>
      <motion.div variants={itemVariants}><StatCard title="Admin Accounts" value={dashboardData.counts.users.admins} icon={<FaUsers />} color="red" /></motion.div> {/* Changed icon to be different or use a specific admin icon */}
      <motion.div variants={itemVariants}><StatCard title="Total Projects" value={dashboardData.counts.projects.total} icon={<FaProjectDiagram />} linkTo="/admin/projects" linkText="Manage Projects" color="violet" /></motion.div>
      <motion.div variants={itemVariants}><StatCard title="Active Projects" value={dashboardData.counts.projects.active} icon={<FaClipboardList />} color="teal" /></motion.div>
      <motion.div variants={itemVariants}><StatCard title="Total Publications" value={dashboardData.counts.publications.total} icon={<FaNewspaper />} linkTo="/admin/publications" linkText="Manage Pubs" color="blue" /></motion.div>
      <motion.div variants={itemVariants}><StatCard title="System Settings" value="Configure" icon={<FaCog />} linkTo="/admin/settings" linkText="Go to Settings" color="slate" /></motion.div>
    </motion.div>
  );

  const renderRecentActivities = () => (
    <motion.div className="mt-12" variants={containerVariants} initial="hidden" animate="visible">
      <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Recent Activities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}><RecentActivityCard title="New Users" items={dashboardData.recentActivities.users} linkPrefix="/admin/users" keyPrefix="users" isLoading={loading} /></motion.div>
        <motion.div variants={itemVariants}><RecentActivityCard title="Recent Publications" items={dashboardData.recentActivities.publications} linkPrefix="/admin/publications" keyPrefix="publications" isLoading={loading} /></motion.div>
        <motion.div variants={itemVariants}><RecentActivityCard title="Recent Projects" items={dashboardData.recentActivities.projects} linkPrefix="/admin/projects" keyPrefix="projects" isLoading={loading} /></motion.div>
      </div>
    </motion.div>
  );

  const renderQuickActions = () => (
    <motion.div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 md:p-8 rounded-xl shadow-2xl mt-12" variants={itemVariants}>
      <h2 className="text-2xl font-semibold mb-6 pb-4 border-b border-slate-600 text-white">Quick Actions</h2>
      <div className="flex flex-wrap gap-4">
        <Link to="/admin/users" className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-md text-slate-800 bg-sky-400 hover:bg-sky-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors duration-150">
          <FaUsers className="mr-2 h-5 w-5" /> Manage Users
        </Link>
        <Link to="/admin/pending-users" className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-md text-slate-800 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 transition-colors duration-150">
          <FaUserClock className="mr-2 h-5 w-5" /> Review Pending
        </Link>
        <Link to="/admin/projects" className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-md text-white bg-violet-600 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-violet-700 transition-colors duration-150">
          <FaProjectDiagram className="mr-2 h-5 w-5" /> Manage Projects
        </Link>
         <Link to="/admin/publications" className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-md text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-700 transition-colors duration-150">
          <FaNewspaper className="mr-2 h-5 w-5" /> Publications
        </Link>
        <Link to="/admin/reports" className="inline-flex items-center px-6 py-3 border border-slate-500 text-sm font-semibold rounded-lg shadow-sm text-slate-200 bg-transparent hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors duration-150">
          <FaChartBar className="mr-2 h-5 w-5" /> View Reports
        </Link>
        <Link to="/admin/settings" className="inline-flex items-center px-6 py-3 border border-slate-500 text-sm font-semibold rounded-lg shadow-sm text-slate-200 bg-transparent hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors duration-150">
          <FaCog className="mr-2 h-5 w-5" /> System Settings
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        <AdminPageHeader
          title="Admin Dashboard"
          subtitle="Comprehensive overview of system metrics and activities."
        />
        <div className="fixed top-24 right-6 z-[100] w-full max-w-md">
          <AnimatePresence>
            {notification.show && (
              <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100, transition: { duration: 0.2 }}}>
                <Notification message={notification.message} type={notification.type} show={notification.show} onClose={() => setNotification((prev) => ({ ...prev, show: false }))}/>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-0 mb-6">
            <ErrorMessage message={error} onClose={() => setError(null)} isDismissible={true} />
          </motion.div>
        )}

        {loading ? (
          renderLoadingState()
        ) : !error ? (
          <motion.div className="space-y-12" initial="hidden" animate="visible" variants={containerVariants}>
            {renderStatCards()}
            {renderRecentActivities()}
            {renderQuickActions()}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminDashboardPage;