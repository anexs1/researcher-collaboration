// src/Component/Profile/UserActivityPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { FaHistory } from "react-icons/fa";
import { formatDistanceToNow, parseISO } from "date-fns";

// --- MODIFICATION: Import the configured Axios instance ---
import axiosInstance from "../../api/axiosInstance"; // Adjust path if needed!

// --- MODIFICATION: Keep original axios for CancelToken and isCancel ---
import axios from "axios";

import LoadingSpinner from "../../Component/Common/LoadingSpinner"; // Verify path
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Verify path

// --- MODIFICATION: API_BASE_URL is no longer needed here if baseURL is set in axiosInstance ---
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const UserActivityPage = ({ currentUser }) => {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  // fetchActivity using the configured axiosInstance
  const fetchActivity = useCallback(
    async (page = 1, cancelToken = null) => {
      if (!currentUser?.id) {
        setError("User ID is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const config = {
          params: { page, limit: 15 },
        };
        if (cancelToken) {
          config.cancelToken = cancelToken; // Pass the cancel token
        }

        console.log(
          `Fetching activity for user ${currentUser.id}, page ${page} using axiosInstance`
        );

        // --- MODIFICATION: Use axiosInstance and relative path ---
        const response = await axiosInstance.get(
          `/api/users/${currentUser.id}/activity`, // Relative path to baseURL
          config
        );
        // --- END MODIFICATION ---

        if (response.data && response.data.items) {
          setActivity(response.data.items);
          setPagination({
            currentPage: response.data.currentPage || 1,
            totalPages: response.data.totalPages || 1,
          });
        } else {
          setActivity([]);
          setPagination({ currentPage: 1, totalPages: 1 });
          console.warn(
            "Received success response but data format was unexpected:",
            response.data
          );
        }
      } catch (err) {
        // --- MODIFICATION: Use original axios for isCancel check ---
        if (axios.isCancel(err)) {
          console.log("Request canceled:", err.message);
        } else {
          // Error should now be less likely 401 if interceptor works,
          // but handle other errors (like 403, 500, or network issues)
          const errorMessage =
            err.response?.data?.message || // Backend error message
            err.message || // Network or other generic error
            "Failed to load activity data";
          setError(errorMessage);
          console.error("Activity fetch error in component:", err);
          setActivity([]);
          setPagination({ currentPage: 1, totalPages: 1 });
        }
      } finally {
        // Simplified finally block: always stop loading when done/cancelled/errored
        setIsLoading(false);
      }
    },
    [currentUser?.id] // Dependency remains currentUser.id
  );

  // useEffect for INITIAL fetch and cleanup
  useEffect(() => {
    // --- MODIFICATION: Use original axios for CancelToken ---
    const source = axios.CancelToken.source();

    // Call fetchActivity for the first page, passing the token
    // fetchActivity now uses axiosInstance internally
    fetchActivity(1, source.token);

    // Return the cleanup function directly
    return () => {
      console.log("Cleaning up UserActivityPage effect, cancelling request...");
      source.cancel(
        "UserActivityPage Component unmounted or dependencies changed."
      );
    };
  }, [fetchActivity]); // Dependency is the useCallback function

  // --- handlePageChange implicitly uses the modified fetchActivity ---
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== pagination.currentPage &&
      !isLoading // Prevent multiple rapid clicks while loading
    ) {
      // Optional: Add cancellation for pagination requests if needed
      // const source = axios.CancelToken.source();
      fetchActivity(newPage /*, source.token */);
    }
  };

  // --- Helper Functions (Timestamp formatting, Rendering Details) ---
  const formatRelativeTimestamp = (ts) => {
    if (!ts) return "";
    try {
      return formatDistanceToNow(parseISO(ts), { addSuffix: true });
    } catch (e) {
      console.error("Error formatting date:", ts, e);
      return "Invalid date";
    }
  };

  const renderActivityDetails = (item) => {
    // Customize based on your activity item structure
    if (!item || !item.type) return "Details unavailable"; // Basic check

    if (item.type === "PROJECT_CREATED") {
      return `Project: ${item.details?.projectName || "N/A"}`;
    }
    if (item.type === "REQUEST_SENT") {
      return `Sent request for project: ${
        item.details?.projectName || "N/A"
      } to ${item.details?.ownerName || "N/A"}`;
    }
    // Add more activity types as needed
    // Fallback for unknown types or types without specific details rendering
    return item.details ? JSON.stringify(item.details) : "Standard activity";
  };

  // --- Rendering Logic (List and Pagination) ---
  const renderActivityList = () => {
    // Display message only after initial load attempt if no activity & no error
    if (activity.length === 0 && !isLoading && !error) {
      return (
        <p className="text-gray-500 text-center py-5">No activity found.</p>
      );
    }
    // Don't render list if there's an error (ErrorMessage component handles display)
    if (error) return null;

    return (
      <ul className="space-y-4">
        {activity.map((item) => (
          <li
            key={item.id || item.timestamp} // Use a stable unique key
            className="p-4 border rounded-md hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-gray-700">
              {item.description || "No description provided"}
            </p>
            <p className="text-sm text-gray-500">
              {renderActivityDetails(item)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatRelativeTimestamp(item.timestamp)}
            </p>
          </li>
        ))}
      </ul>
    );
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1 || error) return null; // Don't show pagination on error

    const pages = [];
    // Basic pagination rendering - consider edge cases or libraries for complex needs
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={isLoading || i === pagination.currentPage}
          className={`px-3 py-1 border rounded-md text-sm mx-1 ${
            i === pagination.currentPage
              ? "bg-indigo-600 text-white border-indigo-600 cursor-default"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          } disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="mt-6 flex justify-center items-center">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={isLoading || pagination.currentPage === 1}
          className="px-3 py-1 border rounded-md text-sm mx-1 bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={
            isLoading || pagination.currentPage === pagination.totalPages
          }
          className="px-3 py-1 border rounded-md text-sm mx-1 bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Next
        </button>
      </div>
    );
  };

  // --- Main Component Return ---
  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 border border-gray-200 min-h-[300px]">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center border-b pb-3">
        <FaHistory className="mr-3 text-indigo-600" />
        Your Activity Log
      </h1>

      {/* Display Loading Spinner */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Loading activity...</span>
        </div>
      )}

      {/* Display Error Message (only when not loading) */}
      {!isLoading && error && (
        <ErrorMessage
          message={error}
          onClose={() => setError(null)} // Allow dismissing error
          retry={() => fetchActivity(pagination.currentPage)} // Retry fetching current page
        />
      )}

      {/* Display Activity List and Pagination (only when not loading and no error) */}
      {!isLoading && !error && (
        <>
          {renderActivityList()}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default UserActivityPage;
