// src/Page/Admin/AdminPendingUsersPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // <-- Import useNavigate
import axios from "axios";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import Notification from "../../Component/Common/Notification";
import ConfirmationModal from "../../Component/Common/ConfirmationModal"; // <-- Import ConfirmationModal
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon, // <-- Import EyeIcon for view details
  ExclamationTriangleIcon, // Could be used in error messages
} from "@heroicons/react/24/outline";

// Define base URL (better than repeating localhost)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminPendingUsersPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // User ID being actioned
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [confirmModal, setConfirmModal] = useState({
    // State for confirmation modal
    isOpen: false,
    userId: null,
    username: "",
    action: null, // 'approve' or 'reject'
  });
  const navigate = useNavigate(); // <-- Initialize useNavigate

  // --- Notification Handler ---
  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  // --- Fetch Pending Users ---
  const fetchPendingUsers = useCallback(
    async (showLoadingIndicator = true) => {
      if (showLoadingIndicator) setIsLoading(true);
      setError(""); // Clear previous errors on fetch
      // Optionally clear users only if using main loader, otherwise data remains during refresh
      // if (showLoadingIndicator) setPendingUsers([]);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required. Please log in.");
        setIsLoading(false);
        // Consider redirecting: navigate('/login');
        return;
      }

      try {
        const url = `${API_BASE_URL}/api/admin/users?status=pending`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (
          response.data?.success &&
          Array.isArray(response.data.data?.users)
        ) {
          setPendingUsers(response.data.data.users);
        } else {
          console.warn(
            "Unexpected data structure for pending users:",
            response.data
          );
          setPendingUsers([]); // Set empty on unexpected data
          // Optionally set an error message here if response.data indicates failure
          if (!response.data?.success) {
            setError(
              response.data?.message ||
                "Failed to fetch users: API indicated failure."
            );
          }
        }
      } catch (err) {
        console.error("Error fetching pending users:", err);
        let detailedError = "Failed to fetch pending users.";
        if (err.response) {
          detailedError = `Error ${err.response.status}: ${
            err.response.data?.message || "Server error"
          }`;
          if (err.response.status === 401 || err.response.status === 403) {
            detailedError += " Please check your login session.";
            // Maybe force logout or redirect here
          }
        } else if (err.request) {
          detailedError = "Network Error: Could not reach the server.";
        } else {
          detailedError = `Client Error: ${err.message}`;
        }
        setError(detailedError);
        setPendingUsers([]); // Clear users on error
      } finally {
        if (showLoadingIndicator) setIsLoading(false);
      }
    },
    [
      /* navigate */
    ]
  ); // navigate dependency removed if not used directly inside

  useEffect(() => {
    fetchPendingUsers(true);
  }, [fetchPendingUsers]);

  // --- Request Action (Opens Confirmation Modal for Reject) ---
  const requestAction = (userId, username, action) => {
    if (action === "reject") {
      setConfirmModal({
        isOpen: true,
        userId,
        username,
        action: "reject",
      });
    } else if (action === "approve") {
      // Approve directly (or add confirmation if desired)
      handlePerformAction(userId, "approved", username);
    } else {
      console.error("Unknown action requested:", action);
    }
  };

  // --- Perform Actual API Call ---
  const handlePerformAction = async (userId, newStatus, username) => {
    setActionLoading(userId); // Indicate loading for this specific user row
    setError(""); // Clear previous general errors

    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification("Authentication required.", "error");
      setActionLoading(null);
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/auth/admin/users/${userId}/status`;
      await axios.patch(
        url,
        { status: newStatus }, // Send status in request body
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Success: remove user from local pending list
      setPendingUsers((current) => current.filter((u) => u.id !== userId));
      showNotification(`User "${username}" has been ${newStatus}.`, "success");
    } catch (err) {
      console.error(
        `Error updating status to ${newStatus} for user ${userId}:`,
        err
      );
      const errMsg =
        err.response?.data?.message ||
        `Failed to ${newStatus} user "${username}".`;
      setError(errMsg); // Show error near top
      showNotification(errMsg, "error"); // Show detailed error in notification
    } finally {
      setActionLoading(null); // Stop loading indicator for the row
    }
  };

  // --- Handle User Detail Navigation ---
  const handleViewDetails = (userId) => {
    // Navigate to a detail page (this route needs to be set up in App.js)
    navigate(`/admin/users/${userId}/details`);
    // Or open a modal with details if preferred (more complex state management)
  };

  // --- Refresh ---
  const handleRefresh = () => {
    // Fetch without the main loading spinner, maybe just spin the refresh icon
    fetchPendingUsers(false); // Pass false to avoid full page loader
    showNotification("Refreshing list...", "info");
  };

  const breadcrumbs = [
    { label: "Admin", link: "/admin" }, // Example breadcrumb
    { label: "Pending Approvals", link: "/admin/pending-users" },
  ];

  // --- Render ---
  return (
    // Removed min-h-screen and bg-gray-50 if AdminLayout handles it
    <div className="space-y-6">
      <AdminPageHeader title="Pending User Approvals" breadcrumbs={breadcrumbs}>
        <button
          onClick={handleRefresh}
          disabled={isLoading || !!actionLoading} // Disable if any action is loading
          className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh Pending List"
        >
          {/* Show spinner on refresh button itself if not using full page loader */}
          <ArrowPathIcon className="h-6 w-6" />
        </button>
      </AdminPageHeader>

      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      {/* Main loading spinner */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* General Error Display */}
      {!isLoading && error && (
        <div className="mt-4">
          <ErrorMessage message={error} onClose={() => setError("")} />
        </div>
      )}

      {/* No Pending Users Message */}
      {!isLoading && !error && pendingUsers.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">All Clear!</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no users currently pending approval.
          </p>
        </div>
      )}

      {/* Pending Users Table */}
      {!isLoading && !error && pendingUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {" "}
              {/* Changed head background */}
              <tr>
                {/* Table Headers */}
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  Username
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  Registered
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pendingUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {user.role}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      {" "}
                      {/* Reduced space */}
                      {/* View Details Button */}
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        disabled={actionLoading === user.id}
                        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`View details for ${user.username}`}
                      >
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {/* Approve Button */}
                      <button
                        onClick={() =>
                          requestAction(user.id, user.username, "approve")
                        }
                        disabled={actionLoading === user.id}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait"
                        title={`Approve ${user.username}`}
                      >
                        <CheckCircleIcon
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        {/* <span className="hidden sm:inline ml-1">Approve</span> */}
                      </button>
                      {/* Reject Button (now opens modal) */}
                      <button
                        onClick={() =>
                          requestAction(user.id, user.username, "reject")
                        }
                        disabled={actionLoading === user.id}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait"
                        title={`Reject ${user.username}`}
                      >
                        <XCircleIcon className="h-4 w-4" aria-hidden="true" />
                        {/* <span className="hidden sm:inline ml-1">Reject</span> */}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal Render */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() =>
          handlePerformAction(
            confirmModal.userId,
            "rejected",
            confirmModal.username
          )
        }
        title="Confirm Rejection"
        message={`Are you sure you want to reject the user "${confirmModal.username}"? This action cannot be easily undone.`}
        confirmText="Reject User"
        confirmButtonColor="red"
      />
    </div>
  );
};

export default AdminPendingUsersPage;
