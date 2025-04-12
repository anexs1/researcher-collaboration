// src/Page/Profile/UserActivityPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { FaHistory, FaInfoCircle } from "react-icons/fa";
import { formatDistanceToNow, parseISO } from "date-fns"; // Using date-fns again
import axios from "axios"; // Using axios directly for clarity

// Import shared components (adjust paths as needed)
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";

// API Client Setup (or use imported apiClient)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// This page will render inside the UserLayout (standard left sidebar)
const UserActivityPage = ({ currentUser }) => {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  }); // Basic pagination state

  // Fetch user activity data
  const fetchActivity = useCallback(
    async (page = 1) => {
      if (!currentUser) return; // Don't fetch if no user info yet

      setIsLoading(true);
      setError(null);
      try {
        // *** ADJUST API ENDPOINT AS NEEDED ***
        // Assumes endpoint supports pagination via query params
        const response = await apiClient.get(
          `/api/users/me/activity?page=${page}&limit=15`
        ); // Example endpoint

        if (response.data?.success) {
          setActivity(response.data.data || []); // Adjust based on your API response structure
          // Assuming pagination info is returned like this:
          setPagination({
            currentPage: response.data.pagination?.currentPage || 1,
            totalPages: response.data.pagination?.totalPages || 1,
          });
        } else {
          throw new Error(
            response.data?.message || "Failed to load activity data"
          );
        }
      } catch (err) {
        console.error("Error fetching activity:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load activity"
        );
        setActivity([]); // Clear activity on error
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  ); // Depend on currentUser to ensure user is loaded

  // Fetch initial data on mount
  useEffect(() => {
    fetchActivity(1); // Fetch page 1 initially
  }, [fetchActivity]);

  // Helper to format relative time
  const formatRelativeTimestamp = (ts) => {
    if (!ts) return "";
    try {
      return formatDistanceToNow(parseISO(ts), { addSuffix: true });
    } catch {
      return "";
    }
  };

  // Simple pagination handler
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== pagination.currentPage
    ) {
      fetchActivity(newPage);
    }
  };

  // Function to render details more nicely based on type (optional enhancement)
  const renderActivityDetails = (item) => {
    // You could add icons or specific formatting based on item.type
    // e.g., if (item.type === 'publication_post') return <><FaBook/> {item.details}</>
    return item.details || "Activity details unavailable";
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 border border-gray-200">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center border-b pb-3">
        <FaHistory className="mr-3 text-indigo-600" />
        Your Activity Log
      </h1>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Loading activity...</span>
        </div>
      )}

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {!isLoading && !error && (
        <div className="flow-root">
          {" "}
          {/* Use flow-root for better list structure */}
          {activity.length > 0 ? (
            <ul className="-mb-4">
              {" "}
              {/* Negative margin to counteract padding */}
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="mb-4 pb-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="relative pb-1">
                    {/* Timeline line (optional) */}
                    {/* <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span> */}
                    <div className="relative flex space-x-3 items-center">
                      <div>
                        {/* Icon based on type (optional) */}
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-white">
                          <FaInfoCircle
                            className="h-5 w-5 text-gray-500"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            {renderActivityDetails(item)}
                          </p>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-gray-500">
                          <time dateTime={item.timestamp}>
                            {formatRelativeTimestamp(item.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-10 italic">
              No activity found.
            </p>
          )}
          {/* Pagination Controls */}
          {activity.length > 0 && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 pt-4 border-t border-gray-200 space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserActivityPage;
