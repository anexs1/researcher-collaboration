// src/Component/projects/RequestsModal.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
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
import { Link } from "react-router-dom"; // Import Link for profile link
import { motion, AnimatePresence } from "framer-motion";

// --- Import Common Components --- (Verify Paths)
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [expandedRequestId, setExpandedRequestId] = useState(null); // Tracks expanded request

  // --- Refs ---
  const isMounted = useRef(true);
  const hasFetched = useRef(false);
  const initialPendingCount = useRef(0);
  const wasLastRequestHandled = useRef(false);

  // --- Effect for Mount/Unmount Tracking ---
  useEffect(() => {
    isMounted.current = true;
    console.log("RequestsModal Mounted for Project:", project?.id);
    // Reset fetch status when project changes or modal mounts
    hasFetched.current = false;
    initialPendingCount.current = 0;
    wasLastRequestHandled.current = false;
    return () => {
      isMounted.current = false;
      console.log("RequestsModal Unmounted");
    };
  }, [project?.id]); // Re-run if project changes

  // --- Notification Handler ---
  const showModalNotification = useCallback((message, type = "success") => {
    if (!isMounted.current) return;
    setNotification({ message, type, show: true });
    setTimeout(() => {
      if (isMounted.current) {
        setNotification((prev) => ({ ...prev, show: false }));
      }
    }, 4000);
  }, []);

  // --- Fetch Pending Requests ---
  const fetchPendingRequests = useCallback(async () => {
    if (!project?.id || processingRequestId) {
      if (!project?.id && isMounted.current) {
        setError("Project ID missing.");
        setIsLoading(false);
      }
      return;
    }
    if (!isMounted.current) return;

    console.log(`FETCHING PENDING requests for project ${project.id}`);
    setIsLoading(true);
    setError(null);
    wasLastRequestHandled.current = false;

    try {
      // --- API Call ---
      const response = await apiClient.get(`/api/collaboration-requests`, {
        params: { projectId: project.id, status: "pending" },
      });
      console.log(
        "RequestsModal API Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (isMounted.current) {
        // Expecting { success: true, count: X, data: [requests...] }
        if (response.data?.success && Array.isArray(response.data.data)) {
          const pending = response.data.data;
          setPendingRequests(pending);
          if (!hasFetched.current) {
            initialPendingCount.current = pending.length;
            hasFetched.current = true; // Mark initial fetch done
          }
          currentPendingCount.current = pending.length;
          console.log(
            `Fetch OK: ${pending.length} pending. Initial: ${initialPendingCount.current}`
          );
        } else {
          throw new Error(response.data?.message || "Invalid data structure.");
        }
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      if (isMounted.current) {
        /* ... set error state ... */ setError(
          err.response?.data?.message || err.message || "Error"
        );
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [project?.id, processingRequestId]); // Stable dependencies

  // --- Initial Fetch Effect ---
  useEffect(() => {
    if (project?.id) {
      hasFetched.current = false; // Reset fetch status if project ID changes
      fetchPendingRequests();
    } else {
      setIsLoading(false);
      setError("Project data missing.");
    }
  }, [project?.id, fetchPendingRequests]);

  // --- Handle Request Action (Approve/Reject) ---
  const handleRequestAction = useCallback(
    async (requestId, action, responseMessage = null) => {
      if (!requestId || !action || processingRequestId || !isMounted.current)
        return;
      setProcessingRequestId(requestId);
      setError(null);

      const requestBeingHandled = pendingRequests.find(
        (req) => req.id === requestId
      );
      console.log(`Action: ${action} request ${requestId}`);

      try {
        const url = `/api/collaboration-requests/${requestId}/respond`;
        const payload = {
          status: action,
          ...(responseMessage && { responseMessage }),
        };
        const response = await apiClient.patch(url, payload);

        if (response.data?.success) {
          if (!isMounted.current) return;
          showModalNotification(`Request ${action}.`, "success");
          const wasLastOne = pendingRequests.length === 1;
          setPendingRequests((prev) =>
            prev.filter((req) => req.id !== requestId)
          ); // Optimistic remove
          // Note: Approved members state is not updated here, relies on refetch or separate component
          if (wasLastOne && initialPendingCount.current > 0) {
            wasLastRequestHandled.current = true;
            initialPendingCount.current = 0;
          }
        } else {
          throw new Error(response.data?.message || `Failed to ${action}.`);
        }
      } catch (err) {
        if (isMounted.current) {
          /* ... set error state ... */
        }
      } finally {
        if (isMounted.current) {
          setProcessingRequestId(null);
        }
      }
    },
    [
      project?.id,
      processingRequestId,
      pendingRequests,
      showModalNotification,
      onAllRequestsHandled,
    ]
  );

  // --- Effect to call parent callback ---
  useEffect(() => {
    if (wasLastRequestHandled.current) {
      if (onAllRequestsHandled) {
        onAllRequestsHandled(project.id);
      }
      wasLastRequestHandled.current = false;
    }
  }, [pendingRequests.length, onAllRequestsHandled, project?.id]);

  // --- Toggle Detail Expansion ---
  const toggleDetails = (requestId) => {
    setExpandedRequestId((prev) => (prev === requestId ? null : requestId));
  };

  // --- Render Logic ---

  const renderPendingRequestsList = () => {
    if (!isLoading && error === null && pendingRequests.length === 0) {
      if (initialPendingCount.current > 0)
        return (
          <p className="text-sm text-center text-green-600 py-4 italic">
            All pending requests handled.
          </p>
        );
      else
        return (
          <p className="text-sm text-center text-gray-500 py-4 italic">
            No pending requests found.
          </p>
        );
    }
    if (isLoading && !hasFetched.current) return null; // Still loading initially
    if (pendingRequests.length === 0) return null; // Empty after load

    return (
      <ul className="space-y-2">
        {pendingRequests.map((req) => {
          const isExpanded = expandedRequestId === req.id;
          const requester = req.requester || {}; // Default to empty object if missing

          return (
            <li
              key={req.id}
              className="border rounded-lg bg-white shadow-sm overflow-hidden"
            >
              {/* Clickable Row Header */}
              <div
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleDetails(req.id)}
                aria-expanded={isExpanded}
                aria-controls={`details-${req.id}`}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDetails(req.id);
                    }}
                  >
                    {isExpanded ? (
                      <FaChevronUp className="h-3 w-3" />
                    ) : (
                      <FaChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestAction(req.id, "approved");
                    }}
                    disabled={processingRequestId === req.id}
                    className="p-1.5 rounded-full text-green-600 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                    title="Approve"
                  >
                    {" "}
                    {processingRequestId === req.id ? (
                      <FaSpinner className="animate-spin h-4 w-4" />
                    ) : (
                      <FaCheck className="h-4 w-4" />
                    )}{" "}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestAction(req.id, "rejected");
                    }}
                    disabled={processingRequestId === req.id}
                    className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                    title="Reject"
                  >
                    {" "}
                    {processingRequestId === req.id ? (
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
                    {/* Display additional details fetched */}
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
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="font-medium text-gray-600 mb-0.5">
                          Message:
                        </p>
                        <p className="whitespace-pre-wrap break-words">
                          {req.requestMessage}
                        </p>
                      </div>
                    )}
                    {/* Link to full profile */}
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
            <motion.div /*...*/ className="overflow-hidden">
              {" "}
              <Notification /*...*/ />{" "}
            </motion.div>
          )}{" "}
        </AnimatePresence>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-grow">
          {/* Global Fetch Error */}
          {error && !isLoading && (
            <div className="mb-4">
              {" "}
              <ErrorMessage
                message={error}
                onClose={() => setError(null)}
              />{" "}
            </div>
          )}
          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center items-center p-10">
              {" "}
              <LoadingSpinner />
              <span className="ml-3 text-gray-500">
                Loading Requests...
              </span>{" "}
            </div>
          )}
          {/* Pending Requests Section */}
          {!isLoading && !error && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaUserClock className="mr-2 text-orange-500" /> Pending
                Requests
              </h4>
              {renderPendingRequestsList()}
            </div>
          )}
          {/* Approved members section removed for focus */}
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
