import React, { useState, useEffect, useCallback } from "react";
import { FaHistory, FaInfoCircle } from "react-icons/fa";
import { formatDistanceToNow, parseISO } from "date-fns";
import axios from "axios";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const UserActivityPage = ({ currentUser }) => {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });

  // Enhanced fetch with cancellation
  const fetchActivity = useCallback(
    async (page = 1) => {
      if (!currentUser?.id) return;

      setIsLoading(true);
      setError(null);

      const source = axios.CancelToken.source();

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${currentUser.id}/activity`,
          {
            params: { page, limit: 15 },
            cancelToken: source.token,
          }
        );

        if (response.data) {
          setActivity(response.data.items || []);
          setPagination({
            currentPage: response.data.currentPage || 1,
            totalPages: response.data.totalPages || 1,
          });
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load activity data"
          );
          console.error("Activity fetch error:", err);
        }
      } finally {
        if (!source.token.reason) {
          // Only update loading if not cancelled
          setIsLoading(false);
        }
      }

      return () => source.cancel("Component unmounted");
    },
    [currentUser?.id]
  );

  useEffect(() => {
    const cleanup = fetchActivity(1);
    return () => {
      if (cleanup) cleanup();
    };
  }, [fetchActivity]);

  // Rest of your component remains the same...
  const formatRelativeTimestamp = (ts) => {
    if (!ts) return "";
    try {
      return formatDistanceToNow(parseISO(ts), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchActivity(newPage);
    }
  };

  const renderActivityDetails = (item) => {
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

      {error && (
        <ErrorMessage
          message={error}
          onClose={() => setError(null)}
          retry={() => fetchActivity(pagination.currentPage)}
        />
      )}

      {/* ... rest of your JSX ... */}
    </div>
  );
};

export default UserActivityPage;
