// src/Page/Admin/AdminUsersPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Removed Link as it wasn't directly used
import axios from "axios";
import { FaUserCircle } from "react-icons/fa";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion"; // Ensure framer-motion is installed

// --- Component Imports ---
// Double-check these paths against your actual project structure
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import ConfirmationModal from "../../Component/Common/ConfirmationModal";
// import UserDetailsModal from "../../Component/Admin/UserDetailsModal"; // <<< IMPORTANT: Uncomment this line if you have created this component
import Notification from "../../Component/Common/Notification";
// import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // <<< Uncomment this if you use a shared admin page header component

// --- Configuration ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const USERS_PER_PAGE = 15;

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-800 border border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-800 border border-red-200";
    case "suspended":
      return "bg-gray-200 text-gray-700 border border-gray-300";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

// --- AdminUsersPage Component ---
const AdminUsersPage = () => {
  // Centralized state using useState
  const [state, setState] = useState({
    users: [],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
    isLoading: true,
    error: "",
    actionLoading: { delete: false },
    modals: { deleteConfirm: false, userDetails: false }, // userDetails flag controls the modal's visibility
    selectedUser: null, // Stores the user object when an action requires context (view, edit, delete prep)
    userToDelete: null, // Stores {id, username} specifically for the delete confirmation
    notification: { message: "", type: "", show: false },
  });

  const navigate = useNavigate();

  // --- State Update Helper ---
  // Uses functional update form to ensure updates are based on the latest state
  const updateState = useCallback((newState) => {
    setState((prev) => ({ ...prev, ...newState }));
  }, []); // Empty dependency array means this function reference is stable

  // --- Notification Helper ---
  const showNotification = useCallback(
    (message, type = "success") => {
      updateState({ notification: { message, type, show: true } });
      // Auto-hide notification after 4 seconds
      const timerId = setTimeout(
        () => updateState({ notification: { show: false } }),
        4000
      );
      // Return a cleanup function for React StrictMode or component unmount
      return () => clearTimeout(timerId);
    },
    [updateState]
  ); // Depends only on the stable updateState function

  // --- Data Fetching ---
  const fetchUsers = useCallback(
    async (page = 1, showLoadingSpinner = true) => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        updateState({
          error: "Authentication required. Redirecting to login...",
          isLoading: false,
        });
        setTimeout(() => navigate("/login"), 2500); // Redirect after showing message
        return;
      }

      if (showLoadingSpinner) updateState({ isLoading: true, error: "" });

      try {
        console.log(`ADMIN: Fetching users - Page: ${page}`);
        const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, limit: USERS_PER_PAGE },
          timeout: 12000, // 12 second timeout
        });

        if (response.data?.success) {
          updateState({
            users: response.data.data?.users ?? [],
            pagination: response.data.data?.pagination ?? {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
            },
            isLoading: false,
          });
        } else {
          // Handle cases where the API returns success: false or unexpected format
          throw new Error(
            response.data?.message ||
              "Invalid response format received from server."
          );
        }
      } catch (err) {
        console.error("Fetch users error:", err);
        let errorMsg = "Failed to fetch users.";
        if (axios.isCancel(err)) {
          errorMsg = "Request timed out.";
        } else if (err.response) {
          errorMsg =
            err.response.data?.message ||
            `Server error: ${err.response.status}`;
          // Handle specific auth errors with redirect
          if (err.response.status === 401 || err.response.status === 403) {
            showNotification(
              "Session expired or unauthorized. Redirecting to login.",
              "error"
            );
            setTimeout(() => navigate("/login"), 2500);
          }
        } else if (err.request) {
          errorMsg = "Network error. Could not reach the server.";
        } else {
          errorMsg = err.message; // Other errors (e.g., setup error, coding error)
        }
        updateState({ error: errorMsg, users: [], isLoading: false });
      }
    },
    [navigate, showNotification, updateState]
  ); // Dependencies for useCallback

  // Initial fetch on component mount
  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUsers]); // fetchUsers is memoized by useCallback

  // --- Action Handlers ---
  const handleUserAction = useCallback(
    (user, action) => {
      // Ensure user object and user.id exist before proceeding
      if (!user?.id) {
        console.warn("handleUserAction called with invalid user object:", user);
        showNotification("Cannot perform action: Invalid user data.", "error");
        return;
      }

      // Always set selectedUser for context, clear if modal closes without action
      updateState({ selectedUser: user });

      switch (action) {
        case "view":
          console.log("View action triggered for:", user.username);
          // Open the user details modal (either the real one or the fallback)
          updateState({ modals: { ...state.modals, userDetails: true } });
          break;
        case "edit":
          console.log("Edit action triggered for:", user.username);
          navigate(`/admin/users/edit/${user.id}`); // Navigate to the dedicated edit page
          break;
        case "delete":
          console.log("Delete action triggered for:", user.username);
          // Set user details for the confirmation modal
          updateState({
            userToDelete: { id: user.id, username: user.username },
            modals: { ...state.modals, deleteConfirm: true }, // Open delete confirmation
          });
          break;
        default:
          console.warn("Unknown user action requested:", action);
      }
      // Note: We only depend on navigate, showNotification, and updateState here.
      // Accessing state directly (like state.modals) inside useCallback without listing it
      // can lead to stale closures, but here we use updateState's functional form, which avoids this.
    },
    [navigate, showNotification, updateState]
  ); // Added state.modals to dependencies if direct read is needed before update

  // Confirm Delete Action (called from ConfirmationModal)
  const confirmDeleteUser = useCallback(async () => {
    const userToDeleteData = state.userToDelete; // Get the user info before potentially clearing state
    if (!userToDeleteData?.id) {
      console.error("Attempted to delete without a valid userToDelete state.");
      return; // Should not happen if logic is correct
    }

    // Start loading, close confirmation modal immediately
    updateState({
      actionLoading: { delete: true },
      modals: { ...state.modals, deleteConfirm: false },
    });

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showNotification("Authentication required.", "error");
        updateState({ actionLoading: { delete: false } }); // Stop loading
        return;
      }

      console.log(`ADMIN: Deleting user ${userToDeleteData.id}`);
      await axios.delete(
        `${API_BASE_URL}/api/admin/users/${userToDeleteData.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showNotification(
        `User "${userToDeleteData.username}" deleted successfully.`,
        "success"
      );

      // Refetch the *current* page to update the list
      // Pass false to fetchUsers to avoid showing the main loading spinner
      fetchUsers(state.pagination.currentPage, false);
    } catch (err) {
      console.error("Delete user error:", err);
      showNotification(
        err.response?.data?.message || "Failed to delete user.",
        "error"
      );
    } finally {
      // Always stop loading and clear the userToDelete state, regardless of success/failure
      updateState({ userToDelete: null, actionLoading: { delete: false } });
    }
  }, [
    state.userToDelete,
    state.pagination.currentPage,
    updateState,
    fetchUsers,
    showNotification,
  ]);

  // Pagination Handler
  const handlePageChange = (newPage) => {
    // Prevent fetching if already loading or page is invalid/same
    if (
      newPage >= 1 &&
      newPage <= state.pagination.totalPages &&
      newPage !== state.pagination.currentPage &&
      !state.isLoading
    ) {
      fetchUsers(newPage, true); // Fetch new page and show loading spinner
    }
  };

  // Function to close user details modal and clear selected user
  const closeUserDetailsModal = useCallback(() => {
    updateState({
      modals: { ...state.modals, userDetails: false },
      selectedUser: null,
    });
  }, [updateState, state.modals]); // Include state.modals if spreading it

  // --- Render ---
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Optional Admin Page Header */}
      {/* {AdminPageHeader && <AdminPageHeader title="User Management" />} */}

      {/* Page Title and Refresh Button */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4 border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          User Management
        </h1>
        <button
          onClick={() => fetchUsers(state.pagination.currentPage, true)}
          disabled={state.isLoading}
          className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-wait"
          title="Refresh User List"
          aria-label="Refresh User List"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${
              state.isLoading ? "animate-spin text-indigo-600" : ""
            }`}
          />
        </button>
      </div>

      {/* Notification Area */}
      {/* Fixed height container to prevent layout shifts */}
      <div className="h-12 relative">
        <AnimatePresence>
          {state.notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="absolute inset-x-0 top-0" // Position absolute to float over content
            >
              <Notification
                message={state.notification.message}
                type={state.notification.type}
                onClose={() => updateState({ notification: { show: false } })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Area: Loading / Error / Empty State / User Table */}
      <div className="mt-1">
        {" "}
        {/* Reduced margin-top slightly due to fixed height notification area */}
        {state.isLoading && state.users.length === 0 ? ( // Show full page loading only on initial load or page change
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" message="Loading Users..." />
          </div>
        ) : state.error ? (
          <ErrorMessage message={state.error} onRetry={() => fetchUsers(1)} />
        ) : state.users.length === 0 && !state.isLoading ? ( // Show empty state only if not loading and no users
          <div className="bg-white rounded-lg shadow border border-gray-100 p-10 text-center text-gray-500">
            <p className="text-lg font-medium">No Users Found</p>
            <p className="text-sm mt-1">
              There are currently no users matching the criteria.
            </p>
          </div>
        ) : (
          // Display Table and Pagination if users exist
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Joined
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {state.users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors duration-100"
                      >
                        {/* User Cell */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profilePictureUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover shadow-sm border border-gray-200"
                                  src={user.profilePictureUrl}
                                  alt={`${user.username}'s profile`}
                                />
                              ) : (
                                <span
                                  className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center shadow-sm border border-gray-200"
                                  aria-label="Default profile icon"
                                >
                                  <FaUserCircle className="h-7 w-7 text-gray-500" />
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.username}
                              </div>
                              {/* Optional: Display name if available */}
                              {/* <div className="text-sm text-gray-500">{user.fullName || ''}</div> */}
                            </div>
                          </div>
                        </td>
                        {/* Other Data Cells */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {user.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              user.status || "unknown"
                            )}`}
                          >
                            {user.status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        {/* Action Buttons Cell */}
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                          {/* View Button */}
                          <button
                            onClick={() => handleUserAction(user, "view")}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            title="View Details"
                            aria-label={`View details for ${user.username}`}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {/* Edit Button */}
                          <button
                            onClick={() => handleUserAction(user, "edit")}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400"
                            title="Edit User"
                            aria-label={`Edit user ${user.username}`}
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={() => handleUserAction(user, "delete")}
                            disabled={
                              state.actionLoading.delete &&
                              state.userToDelete?.id === user.id
                            }
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400"
                            title="Delete User"
                            aria-label={`Delete user ${user.username}`}
                          >
                            {state.actionLoading.delete &&
                            state.userToDelete?.id === user.id ? (
                              <LoadingSpinner size="xs" color="text-red-600" />
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {state.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center pt-5 gap-4">
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(state.pagination.currentPage - 1) * USERS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      state.pagination.currentPage * USERS_PER_PAGE,
                      state.pagination.totalItems
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {state.pagination.totalItems}
                  </span>{" "}
                  results
                </p>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  {/* Previous Button */}
                  <button
                    onClick={() =>
                      handlePageChange(state.pagination.currentPage - 1)
                    }
                    disabled={
                      state.pagination.currentPage <= 1 || state.isLoading
                    }
                    className="relative inline-flex items-center px-3 py-1.5 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    Previous
                  </button>
                  {/* Page Indicator */}
                  <span className="relative hidden sm:inline-flex items-center px-4 py-1.5 border-y border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {state.pagination.currentPage} of{" "}
                    {state.pagination.totalPages}
                  </span>
                  {/* Next Button */}
                  <button
                    onClick={() =>
                      handlePageChange(state.pagination.currentPage + 1)
                    }
                    disabled={
                      state.pagination.currentPage >=
                        state.pagination.totalPages || state.isLoading
                    }
                    className="relative inline-flex items-center px-3 py-1.5 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={state.modals.deleteConfirm}
        onClose={() =>
          updateState({
            modals: { ...state.modals, deleteConfirm: false },
            userToDelete: null,
          })
        } // Clear userToDelete on close too
        onConfirm={confirmDeleteUser}
        title="Confirm User Deletion"
        message={`Are you sure you want to permanently delete the user "${
          state.userToDelete?.username || "this user"
        }"? This action cannot be undone.`}
        confirmText={state.actionLoading.delete ? "Deleting..." : "Delete User"}
        isConfirming={state.actionLoading.delete}
        confirmButtonColor="red"
      />

      {/* User Details Modal Section */}
      {/*
        IMPORTANT: This section conditionally renders the UserDetailsModal.
        1. UNCOMMENT the import statement for UserDetailsModal at the top of the file.
        2. Ensure the UserDetailsModal component file exists and is correctly implemented.
        If UserDetailsModal is imported, it will be rendered when state.modals.userDetails is true.
        If UserDetailsModal is NOT imported (import commented out), the fallback message below will show instead.
      */}
      {typeof UserDetailsModal !== "undefined" &&
      state.modals.userDetails &&
      state.selectedUser ? (
        // Render the actual modal if it's imported and needed
        <UserDetailsModal
          isOpen={state.modals.userDetails}
          user={state.selectedUser}
          onClose={closeUserDetailsModal} // Use the callback to close and clear selectedUser
          // Pass handlers if the modal needs to trigger delete/edit flows
          // onDeleteRequest={(user) => handleUserAction(user, 'delete')}
          // onEditRequest={(user) => handleUserAction(user, 'edit')}
        />
      ) : (
        state.modals.userDetails &&
        state.selectedUser && (
          // Fallback: Render a simple placeholder if UserDetailsModal is not imported/defined
          <div
            className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={closeUserDetailsModal} // Close on backdrop click
          >
            <div
              className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the box
            >
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                User Details
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                (UserDetailsModal component is not available.)
              </p>
              <p className="text-base font-semibold text-gray-900">
                Username: {state.selectedUser?.username}
              </p>
              <p className="text-sm text-gray-700">
                Email: {state.selectedUser?.email}
              </p>
              {/* Add more basic details if needed */}
              <button
                onClick={closeUserDetailsModal}
                className="mt-6 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default AdminUsersPage;
