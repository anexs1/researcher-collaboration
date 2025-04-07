import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Using Axios
import LoadingSpinner from "../../Component/Common/LoadingSpinner"; // Verify path
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Verify path
import ConfirmationModal from "../../Component/Common/ConfirmationModal"; // Verify path
import UserDetailsModal from "../../Component/Admin/UserDetailsModal"; // Verify path
import Notification from "../../Component/Common/Notification"; // Import Notification
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Consistent API Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({ delete: false }); // Loading state specific to actions

  // --- Delete State ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null); // Stores {id, username}

  // --- Details Modal State ---
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Full user object for the details modal

  // --- Notification State ---
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const navigate = useNavigate();

  // --- Notification Handler ---
  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000 // Increased duration slightly
    );
  };

  // --- Fetch Users Function ---
  const fetchUsers = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(""); // Clear errors on fetch

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in.");
      setIsLoading(false);
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/auth/admin/users`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else {
        console.warn("Unexpected data structure for users:", response.data);
        setUsers([]);
        setError(
          response.data?.message || "Received unexpected data structure."
        );
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      let detailedError = "Failed to fetch users.";
      if (err.response) {
        detailedError = `Error ${err.response.status}: ${
          err.response.data?.message || "Server error"
        }`;
        if (err.response.status === 401 || err.response.status === 403) {
          detailedError += " Check admin permissions or re-login.";
        }
      } else if (err.request) {
        detailedError = "Network Error: Could not reach the server.";
      } else {
        detailedError = `Client Error: ${err.message}`;
      }
      setError(detailedError);
      setUsers([]);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  }, []);

  // --- Initial Fetch ---
  useEffect(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  // --- Action Handlers ---

  // Open Details Modal
  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Close Details Modal
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  // Navigate to Edit Page
  const handleEditUser = (userId) => {
    navigate(`/admin/users/${userId}/edit`); // Ensure this route exists in App.js
  };

  // Prepare for Deletion (Called from Table OR Details Modal via adapter)
  const initiateDeleteConfirmation = (user) => {
    if (!user || !user.id || !user.username) {
      console.error(
        "Cannot initiate delete: Invalid user data provided.",
        user
      );
      showNotification("Cannot initiate delete: Invalid user data.", "error");
      return;
    }
    setUserToDelete({ id: user.id, username: user.username });
    setShowDeleteConfirm(true);
  };

  // Adapter function passed to UserDetailsModal
  const handleDeleteRequestFromModal = (userId, username) => {
    initiateDeleteConfirmation({ id: userId, username });
  };

  // Cancel Deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  // --- Confirm and Execute Deletion (Called by Confirmation Modal) ---
  // --- THIS FUNCTION CONTAINS THE EDITED CATCH BLOCK ---
  const confirmDeleteUser = async () => {
    if (!userToDelete || !userToDelete.id) return;

    setActionLoading((prev) => ({ ...prev, delete: true })); // Start loading
    setError(""); // Clear previous errors
    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification("Authentication required to delete.", "error");
      setActionLoading((prev) => ({ ...prev, delete: false }));
      cancelDelete(); // Close confirm modal
      return;
    }

    const userId = userToDelete.id;
    const username = userToDelete.username; // Store username for error message
    const deleteUrl = `${API_BASE_URL}/api/auth/admin/users/${userId}`;
    console.log(`Attempting to DELETE: ${deleteUrl}`); // Log the URL being called

    try {
      const response = await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check for successful response (Axios throws errors for 4xx/5xx)
      console.log(`User ${userId} deleted successfully:`, response.data);

      // Update UI on success
      setUsers((currentUsers) => currentUsers.filter((u) => u.id !== userId));
      showNotification(`User "${username}" deleted successfully.`, "success");
      setShowDetailsModal(false); // Close details modal if it was open
      setSelectedUser(null); // Clear selected user

      // ======================================================= //
      // ================ EDITED CATCH BLOCK START ============= //
      // ======================================================= //
    } catch (err) {
      console.error("Delete user error object:", err); // Log the full error object

      let specificErrMsg = `Failed to delete user "${username}".`; // Default fallback

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = err.response.status;
        console.error(`Server Response Status: ${status}`);
        console.error("Server Response Data:", err.response.data);

        // Try to get message from backend, otherwise use status code
        const serverMsg =
          err.response.data?.message || err.response.data?.error; // Check common fields
        specificErrMsg = serverMsg
          ? `${serverMsg} (Status: ${status})`
          : `Server error (Status: ${status})`;

        // Add specific friendly messages for common errors
        if (status === 403) {
          specificErrMsg = `Permission Denied: You may not have rights to delete this user. (Status: ${status})`;
        } else if (status === 404) {
          specificErrMsg = `User or API endpoint not found. Please refresh. (Status: ${status})`;
        } else if (status === 401) {
          specificErrMsg = `Authentication failed. Please log in again. (Status: ${status})`;
        } else if (status >= 500) {
          specificErrMsg = `Server error occurred during deletion. Please check server logs. (Status: ${status})`;
        }
        // Add more specific checks if needed (e.g., 400 Bad Request)
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        specificErrMsg =
          "Network error: Could not reach the server to delete user.";
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", err.message);
        specificErrMsg = `Client setup error: ${err.message}`;
      }

      showNotification(specificErrMsg, "error"); // Show the more specific message
      // setError(specificErrMsg); // Optional: show general error as well
      // ======================================================= //
      // ================= EDITED CATCH BLOCK END ============== //
      // ======================================================= //
    } finally {
      setActionLoading((prev) => ({ ...prev, delete: false })); // Stop loading
      // Always close confirm modal and clear userToDelete after attempt
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  // --- Refresh Handler ---
  const handleRefresh = () => {
    fetchUsers(true); // Show full loader on manual refresh
  };

  // --- Render Logic ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          Registered Users Management
        </h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading || actionLoading.delete}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh User List"
        >
          <ArrowPathIcon
            className={`h-6 w-6 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Global Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="mt-4">
          <ErrorMessage message={error} onClose={() => setError("")} />
        </div>
      )}

      {/* No Users State */}
      {!isLoading && !error && users.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
          No registered users found.
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !error && users.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Headers */}
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
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* Data Cells */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {user.role}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : user.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : user.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : user.status === "banned"
                          ? "bg-red-200 text-red-900"
                          : "bg-gray-100 text-gray-800" // Default/Unknown
                      }`}
                    >
                      {user.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  {/* Actions Cell */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {/* View Details Button */}
                      <button
                        onClick={() => handleViewUserDetails(user)}
                        className="p-1.5 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition duration-150"
                        title="View Details"
                      >
                        {" "}
                        <EyeIcon className="h-5 w-5" />{" "}
                      </button>
                      {/* Edit User Button */}
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="p-1.5 rounded text-green-600 hover:text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition duration-150"
                        title="Edit User"
                      >
                        {" "}
                        <PencilSquareIcon className="h-5 w-5" />{" "}
                      </button>
                      {/* Delete User Button */}
                      <button
                        onClick={() => initiateDeleteConfirmation(user)}
                        disabled={
                          actionLoading.delete && userToDelete?.id === user.id
                        }
                        className="p-1.5 rounded text-red-600 hover:text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete User"
                      >
                        {" "}
                        <TrashIcon className="h-5 w-5" />{" "}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        onConfirm={confirmDeleteUser}
        title="Confirm User Deletion"
        message={`Are you sure you want to permanently delete the user "${
          userToDelete?.username || ""
        }"? This action cannot be undone.`}
        confirmText={actionLoading.delete ? "Deleting..." : "Delete User"}
        isConfirming={actionLoading.delete}
        confirmButtonColor="red"
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showDetailsModal}
        user={selectedUser}
        onClose={handleCloseDetailsModal}
        onDeleteRequest={handleDeleteRequestFromModal} // Pass the adapter function
      />
    </div>
  );
};

export default AdminUsersPage;
