// src/Component/projects/RequestsModal.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios"; // Using axios directly
import {
  FaTimes,
  FaCheck,
  FaBan,
  FaSpinner,
  FaUserCircle,
  FaUserClock,
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

  // --- Refs ---
  const isMounted = useRef(true); // Track component mount status
  const initialPendingCount = useRef(0); // Store initial count for callback logic
  const currentPendingCount = useRef(0); // Track current count for callback logic

  // --- Effect for Mount/Unmount Tracking ---
  useEffect(() => {
    isMounted.current = true;
    console.log("RequestsModal Mounted for Project:", project?.id);
    return () => {
      isMounted.current = false;
      console.log("RequestsModal Unmounted");
    };
  }, []); // Run only once on mount

  // --- Notification Handler ---
  const showModalNotification = useCallback((message, type = "success") => {
    if (!isMounted.current) return;
    setNotification({ message, type, show: true });
    setTimeout(() => {
      if (isMounted.current) {
        setNotification((prev) =>
          prev.message === message ? { ...prev, show: false } : prev
        );
      }
    }, 4000);
  }, []); // Stable: doesn't depend on component state

  // --- Fetch Pending Requests ---
  const fetchPendingRequests = useCallback(async () => {
    if (!project?.id) {
      if (isMounted.current) {
        setError("Project ID missing.");
        setIsLoading(false);
      }
      return;
    }
    // Prevent refetch if already processing an action
    if (processingRequestId) {
      console.log("Fetch skipped: processing an action.");
      // Do not set isLoading to false here, the action's finally block will do it
      return;
    }

    console.log(`FETCHING PENDING requests for project ${project.id}`);
    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // API Call to get pending requests for this project
      const response = await apiClient.get(`/api/collaboration-requests`, {
        params: { projectId: project.id, status: "pending" },
      });

      console.log(
        "RequestsModal API Response:",
        JSON.stringify(response.data, null, 2)
      );

      // Validate and set state if component is still mounted
      if (isMounted.current) {
        if (response.data?.success && Array.isArray(response.data.data)) {
          const pending = response.data.data;
          setPendingRequests(pending);
          // Set initial count ONLY the first time data is successfully fetched
          if (initialPendingCount.current === 0 && pending.length > 0) {
            initialPendingCount.current = pending.length;
          }
          currentPendingCount.current = pending.length; // Update current count
          console.log(
            `Fetch successful: ${pending.length} pending requests. Initial count was: ${initialPendingCount.current}`
          );
        } else {
          throw new Error(
            response.data?.message || "Invalid data structure received."
          );
        }
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      if (isMounted.current) {
        const errorMsg =
          err.response?.status === 403
            ? "Permission denied."
            : err.response?.data?.message ||
              err.message ||
              "Could not load requests.";
        setError(errorMsg);
        setPendingRequests([]);
        initialPendingCount.current = 0; // Reset on error
        currentPendingCount.current = 0;
      }
    } finally {
      console.log("Fetch pending requests finally block.");
      if (isMounted.current) {
        setIsLoading(false); // Always ensure loading is false after attempt
      }
    }
    // Dependencies: only project ID. Re-fetch will happen if ID changes.
    // isLoading/processingRequestId checks prevent concurrent fetches.
  }, [project?.id, processingRequestId]);

  // --- Initial Fetch Effect ---
  useEffect(() => {
    // Fetch on mount if project ID exists
    if (project?.id) {
      fetchPendingRequests();
    } else {
      // Handle case where project is initially undefined/null
      setError("Project data not available.");
      setIsLoading(false);
    }
    // This effect should run once when project.id becomes available
  }, [project?.id, fetchPendingRequests]);

  // --- Handle Request Action (Approve/Reject) ---
  const handleRequestAction = useCallback(
    async (requestId, action, responseMessage = null) => {
      if (!requestId || !action || processingRequestId) return; // Prevent concurrent actions
      if (!isMounted.current) return;

      setProcessingRequestId(requestId); // Indicate this specific request is being processed
      setError(null); // Clear previous general errors

      console.log(`Attempting to ${action} request ID: ${requestId}`);

      try {
        const url = `/api/collaboration-requests/${requestId}/respond`;
        const payload = {
          status: action,
          ...(responseMessage && { responseMessage }),
        };
        const response = await apiClient.patch(url, payload); // Use PATCH as per controller likely

        if (response.data?.success) {
          if (!isMounted.current) return; // Check mount status after async call
          showModalNotification(`Request ${action}.`, "success");

          // Update state: remove the handled request from the pending list
          let newPendingCount = 0;
          setPendingRequests((prevPending) => {
            const updatedList = prevPending.filter(
              (req) => req.id !== requestId
            );
            newPendingCount = updatedList.length; // Get the count *after* filtering
            return updatedList;
          });

          currentPendingCount.current = newPendingCount; // Update ref for current count

          // Check if the last of the *initial* requests was handled
          if (
            newPendingCount === 0 &&
            initialPendingCount.current > 0 &&
            onAllRequestsHandled
          ) {
            console.log(
              "Last initial pending request handled. Calling onAllRequestsHandled."
            );
            onAllRequestsHandled(project.id);
            initialPendingCount.current = 0; // Reset initial count as all are handled
          }

          // Optional: Optimistically update an 'approvedMembers' list if needed elsewhere
          // if (action === 'approved') { ... setApprovedMembers ... }
        } else {
          // Handle backend reporting success: false
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
          // Set general error, don't necessarily revert optimistic UI unless needed
          setError(errorMsg);
          showModalNotification(errorMsg, "error");
          // Optionally refetch to get the definite state from server on error:
          // fetchPendingRequests();
        }
      } finally {
        if (isMounted.current) {
          setProcessingRequestId(null); // Clear processing state for this request
        }
      }
      // Dependencies for the action handler
    },
    [
      project?.id,
      processingRequestId,
      pendingRequests,
      showModalNotification,
      onAllRequestsHandled,
    ]
  );

  // --- Render Logic ---

  // Render List of Pending Requests or appropriate message
  const renderPendingRequestsList = () => {
    // If finished loading AND fetch completed (even if error) AND list is empty
    if (!isLoading && error === null && pendingRequests.length === 0) {
      // Distinguish between "never had requests" and "all handled"
      if (initialPendingCount.current > 0) {
        return (
          <p className="text-sm text-center text-green-600 py-4 italic">
            All pending requests handled.
          </p>
        );
      } else {
        return (
          <p className="text-sm text-center text-gray-500 py-4 italic">
            No pending requests found for this project.
          </p>
        );
      }
    }
    // If finished loading and there ARE requests
    if (!isLoading && pendingRequests.length > 0) {
      return (
        <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
          {" "}
          {/* Constrained height */}
          {pendingRequests.map((req) => (
            <li
              key={req.id}
              className="p-3 border rounded-lg bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Request Details */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {req.requester?.profilePictureUrl ? (
                    <img
                      src={req.requester.profilePictureUrl}
                      alt={req.requester.username || "User"}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <FaUserCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                  <span
                    className="font-medium text-gray-800 text-sm truncate"
                    title={req.requester?.username || "Unknown User"}
                  >
                    {req.requester?.username || "Unknown User"}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ({new Date(req.createdAt).toLocaleDateString()})
                  </span>
                </div>
                {req.requestMessage && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border mt-1 whitespace-pre-wrap break-words">
                    <span className="font-medium">Message:</span>{" "}
                    {req.requestMessage}
                  </p>
                )}
              </div>
              {/* Action Buttons */}
              <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => handleRequestAction(req.id, "approved")}
                  disabled={processingRequestId === req.id}
                  className="p-1.5 rounded-full text-green-600 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-wait"
                  title="Approve Request"
                >
                  {" "}
                  {processingRequestId === req.id ? (
                    <FaSpinner className="animate-spin h-4 w-4" />
                  ) : (
                    <FaCheck className="h-4 w-4" />
                  )}{" "}
                </button>
                <button
                  onClick={() => handleRequestAction(req.id, "rejected")}
                  disabled={processingRequestId === req.id}
                  className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-wait"
                  title="Reject Request"
                >
                  {" "}
                  {processingRequestId === req.id ? (
                    <FaSpinner className="animate-spin h-4 w-4" />
                  ) : (
                    <FaBan className="h-4 w-4" />
                  )}{" "}
                </button>
              </div>
            </li>
          ))}
        </ul>
      );
    }
    // If still loading initial data, or error occurred before rendering list
    return null; // Render nothing until loading is false and error is handled
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
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {" "}
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() =>
                  setNotification((prev) => ({ ...prev, show: false }))
                }
              />{" "}
            </motion.div>
          )}{" "}
        </AnimatePresence>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-grow">
          {/* Global Fetch Error Message */}
          {error && !isLoading && (
            <div className="mb-4">
              {" "}
              <ErrorMessage
                message={error}
                onClose={() => setError(null)}
              />{" "}
            </div>
          )}

          {/* Loading Indicator */}
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
          {!isLoading && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaUserClock className="mr-2 text-orange-500" /> Pending
                Requests
              </h4>
              {renderPendingRequestsList()}
            </div>
          )}

          {/* Placeholder for Approved Members if needed later */}
          {/* {!isLoading && renderApprovedMembers()} */}
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
