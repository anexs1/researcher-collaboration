import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import Notification from "../../Component/Common/Notification";
import ConfirmationModal from "../../Component/Common/ConfirmationModal";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminPendingUsersPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    username: "",
    action: null,
  });
  const navigate = useNavigate();

  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  const fetchPendingUsers = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("Authentication required");
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/admin/users?status=pending`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          }
        );

        if (response.data?.success) {
          setPendingUsers(response.data.data?.users || []);
        } else {
          throw new Error(response.data?.message || "Invalid response format");
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch pending users";
        setError(errorMsg);

        if (err.response?.status === 401 || err.response?.status === 403) {
          showNotification("Session expired. Please login again.", "error");
          setTimeout(() => navigate("/login"), 2000);
        }
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleUserAction = async (userId, action, username) => {
    setActionLoading(userId);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showNotification("Authentication required", "error");
        return;
      }

      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/users/${userId}/status`,
        { status: action === "approve" ? "approved" : "rejected" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
        showNotification(
          `User ${username} ${
            action === "approve" ? "approved" : "rejected"
          } successfully`,
          "success"
        );
      } else {
        throw new Error(response.data.message || "Action failed");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || `Failed to ${action} user`;
      showNotification(errorMsg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const requestConfirmation = (userId, username, action) => {
    setConfirmModal({
      isOpen: true,
      userId,
      username,
      action,
    });
  };

  const handleRefresh = () => {
    fetchPendingUsers(false);
    showNotification("List refreshed", "info");
  };

  const breadcrumbs = [
    { label: "Admin", link: "/admin" },
    { label: "Pending Approvals", link: "/admin/pending-users" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Pending User Approvals" breadcrumbs={breadcrumbs}>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"
          title="Refresh"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </AdminPageHeader>

      <Notification
        {...notification}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onClose={() => setError("")} />
      ) : pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-lg font-medium">No pending users</h3>
          <p className="mt-1 text-gray-500">All users have been processed</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 pointer-events-none">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 pointer-events-none">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize pointer-events-none">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 pointer-events-none">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/users/${user.id}`);
                          }}
                          className="p-1.5 rounded-full text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                          title="View details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestConfirmation(
                              user.id,
                              user.username,
                              "approve"
                            );
                          }}
                          disabled={actionLoading === user.id}
                          className="p-1.5 rounded-full text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestConfirmation(
                              user.id,
                              user.username,
                              "reject"
                            );
                          }}
                          disabled={actionLoading === user.id}
                          className="p-1.5 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          handleUserAction(
            confirmModal.userId,
            confirmModal.action,
            confirmModal.username
          );
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        title={`Confirm ${
          confirmModal.action === "approve" ? "Approval" : "Rejection"
        }`}
        message={`Are you sure you want to ${confirmModal.action} ${confirmModal.username}?`}
        confirmText={confirmModal.action === "approve" ? "Approve" : "Reject"}
        confirmButtonColor={confirmModal.action === "approve" ? "green" : "red"}
      />
    </div>
  );
};

export default AdminPendingUsersPage;
