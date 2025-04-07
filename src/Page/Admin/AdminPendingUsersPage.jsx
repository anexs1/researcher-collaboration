// src/Page/Admin/AdminPendingUsersPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import Notification from "../../Component/Common/Notification"; // Assuming you have this
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import axios from "axios"; // Using axios for PATCH

const AdminPendingUsersPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // Store ID of user being actioned
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  // --- Fetch Pending Users ---
  const fetchPendingUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError("");
    if (showLoading) setPendingUsers([]);

    const token = localStorage.getItem("authToken");
    if (!token) {
      /* ... handle auth error ... */ return;
    }

    try {
      const url = "http://localhost:5000/api/auth/admin/users/pending"; // Endpoint for pending users
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setPendingUsers(response.data.data);
      } else {
        setPendingUsers([]);
        setError("Received unexpected data structure for pending users.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch pending users."
      );
      setPendingUsers([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingUsers(true);
  }, [fetchPendingUsers]);

  // --- Handle Approve/Reject Actions ---
  const handleUpdateStatus = async (userId, newStatus, username) => {
    setActionLoading(userId); // Indicate loading for this specific user row
    setError(""); // Clear previous general errors
    const token = localStorage.getItem("authToken");
    if (!token) {
      /* ... handle auth error ... */ setActionLoading(null);
      return;
    }

    try {
      const url = `http://localhost:5000/api/auth/admin/users/${userId}/status`;
      await axios.patch(
        url,
        { status: newStatus },
        {
          // Send status in request body
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Success: remove user from pending list
      setPendingUsers((current) => current.filter((u) => u.id !== userId));
      showNotification(`User "${username}" has been ${newStatus}.`, "success");
    } catch (err) {
      const errMsg =
        err.response?.data?.message || `Failed to ${newStatus} user.`;
      setError(errMsg); // Show error message
      showNotification(errMsg, "error");
      console.error(`Error updating status for user ${userId}:`, err);
    } finally {
      setActionLoading(null); // Stop loading indicator for the row
    }
  };

  // --- Refresh ---
  const handleRefresh = () => {
    fetchPendingUsers(true);
  };

  const breadcrumbs = [
    { label: "Pending Approvals", link: "/admin/pending-users" },
  ];

  // --- Render ---
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <AdminPageHeader title="Pending User Approvals" breadcrumbs={breadcrumbs}>
        <button
          onClick={handleRefresh}
          disabled={isLoading || actionLoading}
          className={`p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Refresh Pending List"
        >
          <ArrowPathIcon
            className={`h-6 w-6 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </AdminPageHeader>

      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      {isLoading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && error && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {!isLoading && !error && pendingUsers.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
          There are no users pending approval.
        </div>
      )}

      {!isLoading && !error && pendingUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
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
                    <div className="flex items-center justify-center space-x-2">
                      {/* Approve Button */}
                      <button
                        onClick={() =>
                          handleUpdateStatus(user.id, "approved", user.username)
                        }
                        disabled={actionLoading === user.id}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-wait"
                        title="Approve User"
                      >
                        <CheckCircleIcon
                          className="-ml-0.5 mr-1.5 h-4 w-4"
                          aria-hidden="true"
                        />
                        Approve
                      </button>
                      {/* Reject Button */}
                      <button
                        onClick={() =>
                          handleUpdateStatus(user.id, "rejected", user.username)
                        }
                        disabled={actionLoading === user.id}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait"
                        title="Reject User"
                      >
                        <XCircleIcon
                          className="-ml-0.5 mr-1.5 h-4 w-4"
                          aria-hidden="true"
                        />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPendingUsersPage;
