// src/Component/projects/RequestsModal.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios"; // Using axios directly
import { Link } from "react-router-dom"; // Import Link for profile link
import {
  FaTimes,
  FaCheck,
  FaBan,
  FaSpinner,
  FaUserCircle,
  FaUserClock,
  FaUserCheck as FaUserCheckIcon,
  FaChevronDown,
  FaChevronUp, // Icons for expand/collapse
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- Import Common Components --- (Verify Paths are Correct)
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessage from "../Common/ErrorMessage";
import Notification from "../Common/Notification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Axios Instance ---
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ========================================================================
// --- RequestsModal Component ---
// ========================================================================
const RequestsModal = ({
  project,
  onClose,
  currentUser,
  onAllRequestsHandled,
}) => {
  // --- State ---
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start true: fetch on mount
  const [error, setError] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null); // ID of request being processed
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [expandedRequestId, setExpandedRequestId] = useState(null); // Tracks expanded request

  // --- Refs ---
  const isMounted = useRef(true); // Track component mount status
  const initialPendingCount = useRef(0); // Store initial number of pending requests
  const fetchAttempted = useRef(false); // Track if initial fetch has been tried

  // --- Effect for Mount/Unmount Tracking ---
  useEffect(() => {
    isMounted.current = true;
    console.log("RequestsModal Mounted for Project:", project?.id);
    // Reset fetch status when component mounts or project ID changes
    fetchAttempted.current = false;
    initialPendingCount.current = 0;
    return () => {
      isMounted.current = false;
      console.log("RequestsModal Unmounted");
    };
  }, [project?.id]); // Rerun if project ID changes

  // --- Notification Handler ---
  const showModalNotification = useCallback((message, type = "success") => {
    if (!isMounted.current) return;
    setNotification({ message, type, show: true });
    const timerId = setTimeout(() => {
      if (isMounted.current) {
        // Only clear if the message is still the current one, prevents race conditions
        setNotification((prev) =>
          prev.message === message ? { ...prev, show: false } : prev
        );
      }
    }, 4000);
    // Optional: Store timerId if you need to clear it manually, e.g., on unmount
  }, []); // Stable dependency

  // --- Fetch Pending Requests ---
  const fetchPendingRequests = useCallback(async () => {
    // Basic validation and concurrency check
    if (!project?.id) {
      if (isMounted.current) {
        setError("Project ID missing.");
        setIsLoading(false);
      }
      return;
    }
    if (processingRequestId) {
      console.log("Fetch skipped: processing an action.");
      return; // Don't fetch while an approve/reject is in progress
    }
    if (!isMounted.current) return; // Extra safety check

    console.log(`FETCHING PENDING requests for project ${project.id}`);
    setIsLoading(true); // Set loading BEFORE the API call
    setError(null); // Clear previous errors

    try {
      // --- API Call ---
      // Assumes GET /api/collaboration-requests?projectId=X&status=pending returns pending requests
      const response = await apiClient.get(`/api/collaboration-requests`, {
        params: { projectId: project.id, status: "pending" },
      });

      console.log(
        "RequestsModal API Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (!isMounted.current) return; // Check again after await

      // --- Validate and Process Response ---
      if (response.data?.success && Array.isArray(response.data.data)) {
        const pending = response.data.data;
        setPendingRequests(pending);

        // Set initial count only ONCE per modal instance/project change
        // Use fetchAttempted ref to ensure it's only set after the *first* successful fetch
        if (!fetchAttempted.current) {
          initialPendingCount.current = pending.length;
          console.log(
            "Initial pending count set:",
            initialPendingCount.current
          );
        }
      } else {
        // Handle cases where backend reports success: false or data isn't an array
        throw new Error(
          response.data?.message || "Invalid data structure received from API."
        );
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      if (isMounted.current) {
        const errorMsg =
          err.response?.status === 404
            ? `API Route Not Found (${err.config?.url})`
            : err.response?.status === 403
            ? "Permission Denied."
            : err.response?.data?.message ||
              err.message ||
              "Could not load requests.";
        setError(errorMsg);
        setPendingRequests([]); // Clear data on error
        initialPendingCount.current = 0; // Reset initial count on error
      }
    } finally {
      console.log("Fetch pending requests finally block.");
      if (isMounted.current) {
        setIsLoading(false); // ALWAYS set loading false after attempt
        fetchAttempted.current = true; // Mark that an attempt was made
      }
    }
  }, [project?.id, processingRequestId]); // Dependencies: project.id and processingRequestId

  // --- Initial Fetch Effect ---
  useEffect(() => {
    // Fetch only when project ID is available and fetch hasn't been attempted yet
    if (project?.id && !fetchAttempted.current) {
      fetchPendingRequests();
    } else if (!project?.id) {
      // If component mounts without project ID, set loading false and show error
      setIsLoading(false);
      setError("Project data unavailable.");
    }
    // This effect depends on project.id and the stable fetch callback
  }, [project?.id, fetchPendingRequests]);

  // --- Handle Request Action (Approve/Reject) ---
  const handleRequestAction = useCallback(
    async (requestId, action, responseMessage = null) => {
      if (!requestId || !action || processingRequestId || !isMounted.current)
        return;

      setProcessingRequestId(requestId); // Set loading state *for this specific request*
      setError(null); // Clear general modal error

      console.log(`Attempting to ${action} request ID: ${requestId}`);

      try {
        const url = `/api/collaboration-requests/${requestId}/respond`;
        const payload = {
          status: action,
          ...(responseMessage && { responseMessage }),
        };
        const response = await apiClient.patch(url, payload); // Assuming PATCH method

        if (!isMounted.current) return; // Check after await

        if (response.data?.success) {
          showModalNotification(`Request ${action}.`, "success");

          // Update state: remove the handled request
          // Use functional update to get the latest state length correctly
          let wasLastInitialRequest = false;
          setPendingRequests((prevPending) => {
            const initialLength = initialPendingCount.current; // Capture initial count before state update
            const currentLength = prevPending.length;
            const newList = prevPending.filter((req) => req.id !== requestId);
            // Check if this action clears the list AND if there were initial requests
            if (
              newList.length === 0 &&
              initialLength > 0 &&
              currentLength === 1
            ) {
              wasLastInitialRequest = true;
            }
            return newList;
          });

          // If it was the last initial request, call the parent callback
          if (wasLastInitialRequest && onAllRequestsHandled) {
            console.log(
              "Last initial request handled. Calling onAllRequestsHandled."
            );
            onAllRequestsHandled(project.id);
            initialPendingCount.current = 0; // Reset as all initial ones are done
          }

          // Optional: Optimistic update for an approved members list elsewhere if needed
          // if (action === 'approved') { /* ... */ }
        } else {
          throw new Error(
            response.data?.message || `Failed to ${action} request.`
          );
        }
      } catch (err) {
        console.error(`Error ${action} request ${requestId}:`, err);
        if (isMounted.current) {
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            `Could not ${action} request.`;
          setError(errorMsg); // Show error in the modal
          showModalNotification(errorMsg, "error");
          // Consider refetching on error? Depends on desired behavior
          // fetchPendingRequests();
        }
      } finally {
        if (isMounted.current) {
          setProcessingRequestId(null); // Clear loading state for this specific request
        }
      }
      // Dependencies
    },
    [
      project?.id,
      processingRequestId,
      pendingRequests,
      showModalNotification,
      onAllRequestsHandled,
    ]
  );

  // --- Toggle Detail Expansion ---
  const toggleDetails = (requestId) => {
    setExpandedRequestId((prev) => (prev === requestId ? null : requestId));
  };

  // --- Render Logic ---

  const renderPendingRequestsList = () => {
    // Only show messages or list *after* the initial fetch attempt is complete
    if (!isLoading && fetchAttempted.current) {
      if (error) {
        // Error is displayed globally, so don't show specific message here
        return null;
      }
      if (pendingRequests.length === 0) {
        if (initialPendingCount.current > 0) {
          // Initial fetch had requests, now empty
          return (
            <p className="text-sm text-center text-green-600 py-4 italic">
              All pending requests handled.
            </p>
          );
        } else {
          // Initial fetch had no requests
          return (
            <p className="text-sm text-center text-gray-500 py-4 italic">
              No pending requests found for this project.
            </p>
          );
        }
      }
    }
    // If still loading initially or list is empty before fetch attempt completes
    if (isLoading || pendingRequests.length === 0) {
      return null;
    }

    // Render the list
    return (
      <ul className="space-y-2">
        {pendingRequests.map((req) => {
          const isExpanded = expandedRequestId === req.id;
          const requester = req.requester || {}; // Default for safety
          const isProcessingThis = processingRequestId === req.id;

          return (
            <li
              key={req.id}
              className="border rounded-lg bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Clickable Row Header */}
              <div
                className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isExpanded ? "bg-gray-50" : "hover:bg-gray-50"
                } transition-colors`}
                // No onClick here, use button for explicit action
              >
                {/* Requester Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {requester.profilePictureUrl ? (
                      <img
                        src={requester.profilePictureUrl}
                        alt={requester.username || "User"}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <FaUserCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    )}
                    <span
                      className="font-medium text-gray-800 text-sm truncate"
                      title={requester.username || "Unknown"}
                    >
                      {requester.username || "Unknown User"}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      ({new Date(req.createdAt).toLocaleDateString()})
                    </span>
                  </div>
                  {req.requestMessage && !isExpanded && (
                    <p className="text-xs text-gray-500 mt-1 truncate italic">
                      {" "}
                      Message: {req.requestMessage}{" "}
                    </p>
                  )}
                </div>
                {/* Actions & Expand Icon */}
                <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={isExpanded ? "Hide Details" : "Show Details"}
                    onClick={() => toggleDetails(req.id)}
                  >
                    {isExpanded ? (
                      <FaChevronUp className="h-3 w-3" />
                    ) : (
                      <FaChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRequestAction(req.id, "approved")}
                    disabled={isProcessingThis}
                    className="p-1.5 rounded-full text-green-600 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-wait"
                    title="Approve"
                  >
                    {" "}
                    {isProcessingThis ? (
                      <FaSpinner className="animate-spin h-4 w-4" />
                    ) : (
                      <FaCheck className="h-4 w-4" />
                    )}{" "}
                  </button>
                  <button
                    onClick={() => handleRequestAction(req.id, "rejected")}
                    disabled={isProcessingThis}
                    className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-wait"
                    title="Reject"
                  >
                    {" "}
                    {isProcessingThis ? (
                      <FaSpinner className="animate-spin h-4 w-4" />
                    ) : (
                      <FaBan className="h-4 w-4" />
                    )}{" "}
                  </button>
                </div>
              </div>
              {/* Expanded Details Section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    id={`details-${req.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-gray-50 border-t border-gray-200 px-4 py-3 text-xs overflow-hidden"
                  >
                    <h5 className="font-semibold text-gray-700 mb-1.5">
                      Requester Details:
                    </h5>
                    {requester.email && (
                      <p>
                        <span className="font-medium text-gray-600">
                          Email:
                        </span>{" "}
                        {requester.email}
                      </p>
                    )}
                    {requester.university && (
                      <p>
                        <span className="font-medium text-gray-600">
                          University:
                        </span>{" "}
                        {requester.university}
                      </p>
                    )}
                    {requester.department && (
                      <p>
                        <span className="font-medium text-gray-600">
                          Department:
                        </span>{" "}
                        {requester.department}
                      </p>
                    )}
                    {requester.jobTitle && (
                      <p>
                        <span className="font-medium text-gray-600">
                          Job Title:
                        </span>{" "}
                        {requester.jobTitle}
                      </p>
                    )}
                    {requester.bio && (
                      <p className="mt-1">
                        <span className="font-medium text-gray-600">Bio:</span>{" "}
                        {requester.bio}
                      </p>
                    )}
                    {req.requestMessage && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="font-medium text-gray-600 mb-0.5">
                          Message:
                        </p>
                        <p className="whitespace-pre-wrap break-words">
                          {req.requestMessage}
                        </p>
                      </div>
                    )}
                    <div className="mt-2">
                      <Link
                        to={`/profile/${requester.id}`}
                        className="text-indigo-600 hover:underline text-xs font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Full Profile →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    );
  };

  // --- Main Modal Render ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-gray-50 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">
            Manage Requests for "{project?.title || "Project"}"
          </h3>
          <button
            onClick={onClose}
            disabled={!!processingRequestId}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification.show && (
            <motion.div /* ... */ className="overflow-hidden">
              {" "}
              <Notification /* ... */ />{" "}
            </motion.div>
          )}{" "}
        </AnimatePresence>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-grow">
          {/* Loading Indicator - Centered */}
          {isLoading && (
            <div className="flex justify-center items-center p-10">
              {" "}
              <LoadingSpinner />
              <span className="ml-3 text-gray-500">Loading...</span>{" "}
            </div>
          )}

          {/* Error Message - Shown when not loading */}
          {!isLoading && error && (
            <div className="mb-4">
              {" "}
              <ErrorMessage
                message={error}
                onClose={() => setError(null)}
              />{" "}
            </div>
          )}

          {/* Pending Requests Section - Shown when not loading and no error */}
          {!isLoading && !error && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaUserClock className="mr-2 text-orange-500" /> Pending
                Requests
              </h4>
              {renderPendingRequestsList()}
            </div>
          )}

          {/* Approved Members section removed for simplicity, add back if needed */}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 border-t border-gray-200 flex-shrink-0 bg-gray-100 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={!!processingRequestId}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RequestsModal;
