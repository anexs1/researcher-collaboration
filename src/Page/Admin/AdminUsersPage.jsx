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
  const [state, setState] = useState({
    users: [],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
    isLoading: true,
    error: "",
    actionLoading: { delete: false },
    modals: {
      deleteConfirm: false,
      userDetails: false,
    },
    selectedUser: null,
    userToDelete: null,
    notification: { message: "", type: "", show: false },
  });

  const navigate = useNavigate();

  const updateState = (newState) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const showNotification = (message, type = "success") => {
    updateState({
      notification: { message, type, show: true },
    });
    setTimeout(
      () =>
        updateState({
          notification: { ...state.notification, show: false },
        }),
      4000
    );
  };

  const fetchUsers = useCallback(
    async (page = 1, showLoading = true) => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        updateState({
          error: "Authentication required. Please log in.",
          isLoading: false,
        });
        return;
      }

      if (showLoading) updateState({ isLoading: true, error: "" });

      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page },
        });

        if (response.data?.success) {
          updateState({
            users: response.data.data?.users || [],
            pagination: response.data.data?.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
            },
            isLoading: false,
          });
        } else {
          throw new Error(response.data?.message || "Invalid response format");
        }
      } catch (err) {
        console.error("Fetch users error:", err);
        let errorMsg = "Failed to fetch users";

        if (err.response) {
          errorMsg =
            err.response.data?.message ||
            `Server error: ${err.response.status}`;
          if (err.response.status === 401 || err.response.status === 403) {
            showNotification("Session expired. Please login again.", "error");
            setTimeout(() => navigate("/login"), 2000);
          }
        }

        updateState({
          error: errorMsg,
          users: [],
          isLoading: false,
        });
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserAction = (user, action) => {
    switch (action) {
      case "view":
        updateState({
          selectedUser: user,
          modals: { ...state.modals, userDetails: true },
        });
        break;
      case "edit":
        navigate(`/admin/users/${user.id}/edit`);
        break;
      case "delete":
        updateState({
          userToDelete: { id: user.id, username: user.username },
          modals: { ...state.modals, deleteConfirm: true },
        });
        break;
      default:
        console.warn("Unknown user action:", action);
    }
  };

  const confirmDeleteUser = async () => {
    if (!state.userToDelete?.id) return;

    updateState({ actionLoading: { ...state.actionLoading, delete: true } });

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showNotification("Authentication required", "error");
        return;
      }

      await axios.delete(
        `${API_BASE_URL}/api/admin/users/${state.userToDelete.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      updateState({
        users: state.users.filter((u) => u.id !== state.userToDelete.id),
        modals: { ...state.modals, deleteConfirm: false, userDetails: false },
        userToDelete: null,
      });

      showNotification(
        `User "${state.userToDelete.username}" deleted`,
        "success"
      );
    } catch (err) {
      console.error("Delete error:", err);
      const errorMsg = err.response?.data?.message || "Failed to delete user";
      showNotification(errorMsg, "error");
    } finally {
      updateState({ actionLoading: { ...state.actionLoading, delete: false } });
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= state.pagination.totalPages) {
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
          onClick={() => fetchUsers(state.pagination.currentPage)}
          disabled={state.isLoading}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"
          title="Refresh"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${state.isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <Notification
        {...state.notification}
        onClose={() =>
          updateState({ notification: { ...state.notification, show: false } })
        }
      />

      {state.isLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : state.error ? (
        <ErrorMessage
          message={state.error}
          onClose={() => updateState({ error: "" })}
        />
      ) : state.users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          No users found
        </div>
      ) : (
        <>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                        <button
                          onClick={() => handleUserAction(user, "view")}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user, "edit")}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Edit User"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user, "delete")}
                          disabled={state.actionLoading.delete}
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
          </div>

          {state.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-gray-700">
                Page {state.pagination.currentPage} of{" "}
                {state.pagination.totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    handlePageChange(state.pagination.currentPage - 1)
                  }
                  disabled={state.pagination.currentPage <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    handlePageChange(state.pagination.currentPage + 1)
                  }
                  disabled={
                    state.pagination.currentPage >= state.pagination.totalPages
                  }
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
        isOpen={state.modals.deleteConfirm}
        onClose={() =>
          updateState({ modals: { ...state.modals, deleteConfirm: false } })
        }
        onConfirm={confirmDeleteUser}
        title="Confirm Deletion"
        message={`Delete user ${
          state.userToDelete?.username || ""
        }? This cannot be undone.`}
        confirmText={state.actionLoading.delete ? "Deleting..." : "Confirm"}
        isConfirming={state.actionLoading.delete}
        confirmButtonColor="red"
      />

      <UserDetailsModal
        isOpen={state.modals.userDetails}
        user={state.selectedUser}
        onClose={() =>
          updateState({ modals: { ...state.modals, userDetails: false } })
        }
        onDeleteRequest={() => handleUserAction(state.selectedUser, "delete")}
      />
    </div>
  );
};

export default AdminUsersPage;
