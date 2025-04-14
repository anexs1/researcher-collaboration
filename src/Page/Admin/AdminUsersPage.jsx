// src/Page/Admin/AdminUsersPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import ConfirmationModal from "../../Component/Common/ConfirmationModal";
import UserDetailsModal from "../../Component/Admin/UserDetailsModal";
import Notification from "../../Component/Common/Notification";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({ delete: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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

  const fetchUsers = useCallback(async (page = 1, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError("");

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
      setIsLoading(false);
      return;
    }

    try {
      // Updated endpoint to match backend
      const url = `${API_BASE_URL}/api/admin/users?page=${page}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && response.data.data?.users) {
        setUsers(response.data.data.users);
        setPagination(
          response.data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
          }
        );
      } else {
        throw new Error(response.data?.message || "Unexpected data structure");
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      let errorMsg = "Failed to fetch users";
      if (err.response) {
        errorMsg =
          err.response.data?.message || `Server error: ${err.response.status}`;
        if (err.response.status === 401 || err.response.status === 403) {
          errorMsg += " - Please log in again";
        }
      }
      setError(errorMsg);
      setUsers([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = (userId) => {
    navigate(`/admin/users/${userId}/edit`);
  };

  const initiateDeleteConfirmation = (user) => {
    if (!user?.id || !user?.username) {
      showNotification("Invalid user data", "error");
      return;
    }
    setUserToDelete({ id: user.id, username: user.username });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete?.id) return;

    setActionLoading((prev) => ({ ...prev, delete: true }));
    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification("Authentication required", "error");
      return;
    }

    try {
      // Updated endpoint to match backend
      const url = `${API_BASE_URL}/api/admin/users/${userToDelete.id}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showNotification(`User "${userToDelete.username}" deleted`, "success");
      setShowDetailsModal(false);
    } catch (err) {
      console.error("Delete error:", err);
      let errorMsg = "Failed to delete user";
      if (err.response) {
        errorMsg = err.response.data?.message || `Error ${err.response.status}`;
      }
      showNotification(errorMsg, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, delete: false }));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchUsers(page);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          User Management
        </h1>
        <button
          onClick={() => fetchUsers(pagination.currentPage, true)}
          disabled={isLoading}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh Users"
        >
          <ArrowPathIcon
            className={`h-6 w-6 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!isLoading && error && (
        <div className="mt-4">
          <ErrorMessage message={error} onClose={() => setError("")} />
        </div>
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
          No users found
        </div>
      )}

      {!isLoading && !error && users.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {user.role}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : user.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : user.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                      <button
                        onClick={() => handleViewUserDetails(user)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Edit User"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => initiateDeleteConfirmation(user)}
                        disabled={actionLoading.delete}
                        className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                        title="Delete User"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteUser}
        title="Confirm Deletion"
        message={`Delete user ${
          userToDelete?.username || ""
        }? This cannot be undone.`}
        confirmText={actionLoading.delete ? "Deleting..." : "Confirm"}
        isConfirming={actionLoading.delete}
        confirmButtonColor="red"
      />

      <UserDetailsModal
        isOpen={showDetailsModal}
        user={selectedUser}
        onClose={handleCloseDetailsModal}
        onDeleteRequest={initiateDeleteConfirmation}
      />
    </div>
  );
};

export default AdminUsersPage;
