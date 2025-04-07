import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../Component/Common/LoadingSpinner"; // Verify path
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Verify path
import ConfirmationModal from "../../Component/Common/ConfirmationModal"; // Assuming you have this
import UserDetailsModal from "../../Component/Admin/UserDetailsModal"; // <-- NEW: Assuming path for details modal
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"; // Import icons

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- State for Details Modal ---
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // User object for the details modal
  // --- End State for Details Modal ---

  const navigate = useNavigate();

  // --- Fetch Users Function (no changes needed) ---
  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError("");
    if (showLoading) setUsers([]);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please log in as admin.");
      setIsLoading(false);
      return;
    }

    try {
      const correctUrl = "http://localhost:5000/api/auth/admin/users";
      const response = await fetch(correctUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Unauthorized or Forbidden: Check admin permissions or re-login."
        );
      }
      if (response.status === 404) {
        throw new Error(
          `Not Found: The API endpoint (${correctUrl}) was not found.`
        );
      }
      if (!response.ok) {
        let errorData = {
          message: `Server responded with status: ${response.status}`,
        };
        try {
          errorData = await response.json();
        } catch (e) {
          /* ignore */
        }
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("API Response Data:", data);

      if (data && data.success && Array.isArray(data.data)) {
        // *** Ensure the fetched data includes necessary details for the modal ***
        // If not, you might need to fetch full details when opening the modal
        setUsers(data.data);
      } else {
        setUsers([]);
        setError("Received unexpected data structure from server.");
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(
        err.message || "An unexpected error occurred while fetching users."
      );
      setUsers([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // --- Initial Fetch ---
  useEffect(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  // --- Action Handlers ---

  // --- MODIFIED: View User Details Handler ---
  const handleViewUserDetails = (user) => {
    setSelectedUser(user); // Set the user data for the modal
    setShowDetailsModal(true); // Open the modal
    console.log("View details for user:", user.id);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null); // Clear selected user when closing
  };
  // --- End MODIFIED ---

  const handleEditUser = (userId) => {
    navigate(`/admin/users/${userId}/edit`);
    console.log("Edit user:", userId);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
    console.log("Initiate delete for user:", user.id);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const confirmDeleteUser = async () => {
    // ... (delete logic remains the same) ...
    if (!userToDelete) return;
    setIsDeleting(true);
    setError("");
    const userId = userToDelete.id;
    const token = localStorage.getItem("authToken");
    try {
      const deleteUrl = `http://localhost:5000/api/auth/admin/users/${userId}`;
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 401 || response.status === 403)
        throw new Error("Unauthorized or Forbidden: Cannot delete user.");
      if (response.status === 404)
        throw new Error("User not found on server for deletion.");
      if (!response.ok) {
        let errorData = {
          message: `Deletion failed with status: ${response.status}`,
        };
        try {
          errorData = await response.json();
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorData.message || `Deletion failed`);
      }
      console.log("User deleted successfully:", userId);
      setUsers((currentUsers) => currentUsers.filter((u) => u.id !== userId));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Delete user error:", err);
      setError(
        `Failed to delete user ${userToDelete.username}: ${err.message}`
      );
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers(true);
  };

  // --- Render Logic ---
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header and Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Registered Users
        </h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition duration-150 ease-in-out ${
            isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          title="Refresh User List"
        >
          <ArrowPathIcon
            className={`h-6 w-6 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && error && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}
      {!isLoading && !error && users.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
          No registered users found.
        </div>
      )}

      {!isLoading && !error && users.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {/* Headers */}
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
                  Joined
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
              {/* Rows */}
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  {/* Actions Cell */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {/* View Details Button - MODIFIED */}
                      <button
                        onClick={() => handleViewUserDetails(user)} // Pass the whole user object
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition duration-150 ease-in-out"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {/* Edit User Button */}
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition duration-150 ease-in-out"
                        title="Edit User"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      {/* Delete User Button */}
                      <button
                        onClick={() => handleDeleteClick(user)}
                        disabled={isDeleting && userToDelete?.id === user.id}
                        className={`p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Delete User"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal (remains the same) */}
      {showDeleteConfirm && userToDelete && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Confirm Deletion"
          message={`Are you sure you want to delete the user "${userToDelete.username}"? This action cannot be undone.`}
          onConfirm={confirmDeleteUser}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
          isConfirming={isDeleting}
          confirmButtonStyle="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        />
      )}

      {/* --- NEW: User Details Modal --- */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          isOpen={showDetailsModal}
          user={selectedUser}
          onClose={handleCloseDetailsModal}
        />
      )}
      {/* --- End NEW --- */}
    </div>
  );
};

export default AdminUsersPage;
