// frontend/src/Pages/Admin/AdminPendingUsersPage.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import Notification from "../../Component/Common/Notification";
import ConfirmationModal from "../../Component/Common/ConfirmationModal"; // Verify this path
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

  // --- Utility Functions ---
  const showNotification = (message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  // --- Data Fetching ---
  const fetchPendingUsers = useCallback(
    async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("Authentication required.");
          navigate("/login");
          return;
        }
        console.log("[DEBUG] Fetching pending users...");
        const response = await axios.get(
          `${API_BASE_URL}/api/admin/users?status=pending`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          }
        );
        console.log("[DEBUG] Pending users response:", response.data);
        if (response.data?.success && response.data.data?.users) {
          setPendingUsers(response.data.data.users);
        } else if (
          response.data?.success &&
          Array.isArray(response.data.data)
        ) {
          console.warn("[DEBUG] Adapting to data array format.");
          setPendingUsers(response.data.data);
        } else {
          throw new Error(response.data?.message || "Invalid fetch response");
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || err.message || "Failed to fetch.";
        setError(errorMsg);
        console.error("[DEBUG] Fetch Pending Users Error:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          showNotification("Session expired.", "error");
          localStorage.removeItem("authToken");
          setTimeout(() => navigate("/login"), 2000);
        }
      } finally {
        if (showLoadingSpinner) setIsLoading(false);
      }
    },
    [navigate]
  );
  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // --- ACTION FUNCTION (Keep all detailed logs) ---
  const handleUserAction = async (userId, action, username) => {
    console.log("!!! [DEBUG] handleUserAction FUNCTION WAS CALLED !!!", {
      userId,
      action,
      username,
    });
    setActionLoading(userId);
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error(
        "[DEBUG] FATAL: No auth token found inside handleUserAction."
      );
      showNotification(
        "Authentication token missing. Please login again.",
        "error"
      );
      setActionLoading(null);
      return;
    }
    console.log("[DEBUG] Auth token found.");
    const targetUrl = `${API_BASE_URL}/api/admin/users/${userId}/status`;
    const payload = { status: action === "approve" ? "approved" : "rejected" };
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    console.log(`[DEBUG] Preparing ${action} action for user ${userId}`);
    console.log("[DEBUG] Target URL:", targetUrl);
    console.log("[DEBUG] Payload:", payload);
    console.log("[DEBUG] Headers:", headers);
    try {
      console.log("[DEBUG] Entering TRY block for API call...");
      console.log("[DEBUG] === Attempting axios.patch... ===");
      const response = await axios.patch(targetUrl, payload, { headers });
      console.log("[DEBUG] === axios.patch SUCCEEDED (apparently) ===");
      console.log("[DEBUG] API Response (axios):", response);
      if (response.data.success) {
        console.log("[DEBUG] Action successful according to backend response.");
        setPendingUsers((prevUsers) =>
          prevUsers.filter((user) => user.id !== userId)
        );
        showNotification(
          `User '${username}' ${
            action === "approve" ? "approved" : "rejected"
          }.`,
          "success"
        );
      } else {
        console.error(
          "[DEBUG] Backend reported failure:",
          response.data.message
        );
        throw new Error(
          response.data.message || `Backend reported failure for ${action}.`
        );
      }
    } catch (err) {
      console.error(
        "[DEBUG] === ERROR during or after axios.patch attempt! ==="
      );
      console.error("[DEBUG] Caught Error Object:", err);
      if (err.response) {
        console.error("[DEBUG] Error Response Data:", err.response.data);
        console.error("[DEBUG] Error Response Status:", err.response.status);
        console.error("[DEBUG] Error Response Headers:", err.response.headers);
      } else if (err.request) {
        console.error("[DEBUG] Error Request Data:", err.request);
        console.error("[DEBUG] Error: No response received from server.");
      } else {
        console.error("[DEBUG] Error Message:", err.message);
        console.error("[DEBUG] Error setting up the request.");
      }
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        `Failed to ${action} user '${username}'.`;
      showNotification(errorMsg, "error");
    } finally {
      console.log("[DEBUG] Finally block: Resetting action loading.");
      setActionLoading(null);
    }
  };

  // --- Other Handlers ---
  const requestConfirmation = (userId, username, action) => {
    console.log("[DEBUG] requestConfirmation called:", {
      userId,
      username,
      action,
    });
    setConfirmModal({ isOpen: true, userId, username, action });
  };
  const handleRefresh = () => {
    console.log("[DEBUG] Refresh button clicked.");
    fetchPendingUsers(false); // Re-fetch without the main page loading spinner
    showNotification("Pending user list refreshed.", "info");
  };
  const breadcrumbs = [
    { label: "Admin", link: "/admin" },
    { label: "Pending Approvals", link: "/admin/pending-users" },
  ];

  // --- JSX Rendering ---
  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <AdminPageHeader title="Pending User Approvals" breadcrumbs={breadcrumbs}>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          title="Refresh List"
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

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onClose={() => setError("")} />
        ) : pendingUsers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <CheckCircleIcon
              className="mx-auto h-12 w-12 text-green-500"
              aria-hidden="true"
            />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
              All Clear!
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There are no users currently awaiting approval.
            </p>
          </div>
        ) : (
          // *** COMPLETE TABLE SECTION ***
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Username
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Registered On
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
                    >
                      {/* Data Cells */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* === COMPLETE ACTION BUTTONS CELL === */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center items-center space-x-2">
                          {/* View Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/users/${user.id}`);
                            }}
                            className="p-1.5 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="View User Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>

                          {/* Approve Button */}
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
                            className="p-1.5 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
                            title="Approve User"
                          >
                            {actionLoading === user.id &&
                            confirmModal.action === "approve" ? (
                              <LoadingSpinner
                                size="xs"
                                color="text-green-600"
                              />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5" />
                            )}
                          </button>

                          {/* Reject Button */}
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
                            className="p-1.5 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Reject User"
                          >
                            {actionLoading === user.id &&
                            confirmModal.action === "reject" ? (
                              <LoadingSpinner size="xs" color="text-red-600" />
                            ) : (
                              <XCircleIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                      {/* === END COMPLETE ACTION BUTTONS CELL === */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          // *** END COMPLETE TABLE SECTION ***
        )}
      </div>

      {/* --- Confirmation Modal (with restored parent logic) --- */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onCancel={() => {
          console.log(
            "[DEBUG] AdminPendingUsersPage: Modal onCancel triggered (closing modal)."
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        // *** RESTORED onConfirm LOGIC ***
        onConfirm={() => {
          // Log when this specific handler starts
          console.log(
            "[DEBUG] Parent onConfirm triggered. Checking state:",
            confirmModal
          );

          // THE CRITICAL CHECK
          if (confirmModal.userId && confirmModal.action) {
            console.log(
              "[DEBUG] Parent onConfirm: Condition PASSED. Calling handleUserAction."
            );
            // Call the actual action handler if check passes
            handleUserAction(
              confirmModal.userId,
              confirmModal.action,
              confirmModal.username
            );
          } else {
            // Log if the check fails
            console.error(
              "[DEBUG] Parent onConfirm: Condition FAILED! userId or action missing/falsy.",
              confirmModal
            );
          }
          // Close the modal AFTER attempting the action (or after check fails)
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        // *** END RESTORED LOGIC ***
        title={`Confirm User ${
          confirmModal.action === "approve" ? "Approval" : "Rejection"
        }`}
        message={`Are you sure you want to ${confirmModal.action} the user '${confirmModal.username}'?`}
        confirmButtonText={
          confirmModal.action === "approve" ? "Approve" : "Reject"
        }
        confirmButtonClass={
          confirmModal.action === "approve"
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }
        cancelButtonClass="bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
        isConfirming={
          actionLoading === confirmModal.userId && confirmModal.isOpen
        }
      />
    </div>
  );
};

export default AdminPendingUsersPage;
