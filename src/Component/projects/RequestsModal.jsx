import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  FaTimes,
  FaCheck,
  FaBan,
  FaSpinner,
  FaUserCircle,
  FaUserClock, // Icon for pending
  FaUserCheck as FaUserCheckIcon, // Icon for approved members
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
// Adjust path as needed
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessage from "../Common/ErrorMessage";
import Notification from "../Common/Notification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const RequestsModal = ({
  project,
  onClose,
  currentUser,
  onAllRequestsHandled,
}) => {
  // Accept callback prop
  const [pendingRequests, setPendingRequests] = useState([]); // Renamed for clarity
  const [approvedMembers, setApprovedMembers] = useState([]); // New state for approved members
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const initialRequestCount = useRef(0); // Ref to store initial PENDING count
  const hasFetched = useRef(false); // Prevent multiple initial fetches
  const wasLastRequestHandled = useRef(false); // Ref flag to trigger useEffect callback

  // --- Notification Handler ---
  const showModalNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
    return () => clearTimeout(timer);
  }, []);

  // --- Fetch Pending Requests AND Approved Members ---
  const fetchRequestsAndMembers = useCallback(async () => {
    if (!project?.id || (isLoading && hasFetched.current)) return;

    console.log(`Fetching requests & members for project ${project.id}`);
    setIsLoading(true);
    setError(null);
    wasLastRequestHandled.current = false; // Reset flag
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required.");
      setIsLoading(false);
      return;
    }

    try {
      // Use the SAME endpoint, backend now returns both lists
      const response = await axios.get(
        `${API_BASE_URL}/api/projects/${project.id}/requests`, // Removed ?status=pending, backend defaults or handles it
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // <<< Handle new response structure >>>
      if (response.data?.success && response.data?.data) {
        const pending = Array.isArray(response.data.data.pendingRequests)
          ? response.data.data.pendingRequests
          : [];
        const approved = Array.isArray(response.data.data.approvedMembers)
          ? response.data.data.approvedMembers
          : [];

        setPendingRequests(pending);
        setApprovedMembers(approved); // Set the approved members state

        initialRequestCount.current = pending.length; // Track initial PENDING count
        console.log(
          "Initial pending:",
          initialRequestCount.current,
          "Approved fetched:",
          approved.length
        );
        hasFetched.current = true;
      } else {
        throw new Error(response.data?.message || "Invalid data received.");
      }
    } catch (err) {
      console.error("Error fetching requests/members:", err);
      const errorMsg =
        err.response?.status === 403
          ? "Permission denied."
          : err.response?.data?.message ||
            err.message ||
            "Could not load data.";
      setError(errorMsg);
      setPendingRequests([]);
      setApprovedMembers([]); // Clear both lists on error
      initialRequestCount.current = 0;
    } finally {
      setIsLoading(false);
    }
  }, [project?.id, isLoading]); // Keep isLoading dependency

  // Fetch data only once when modal mounts
  useEffect(() => {
    if (!hasFetched.current) {
      fetchRequestsAndMembers();
    }
  }, [fetchRequestsAndMembers]);

  // --- Handle Request Action (Approve/Reject) ---
  const handleRequestAction = useCallback(
    async (requestId, action, responseMessage = null) => {
      if (!requestId || !action || processingRequestId) return; // Prevent double clicks

      setProcessingRequestId(requestId);
      setError(null);
      const token = localStorage.getItem("authToken");
      if (!token) {
        showModalNotification("Authentication required.", "error");
        setProcessingRequestId(null);
        return;
      }

      // Find the request details BEFORE filtering state (for optimistic UI update)
      const requestBeingHandled = pendingRequests.find(
        (req) => req.id === requestId
      );

      console.log(`Attempting to ${action} request ID: ${requestId}`);

      try {
        const url = `${API_BASE_URL}/api/collaboration-requests/${requestId}/respond`;
        const requestData = {
          status: action,
          ...(responseMessage && { responseMessage }),
        };
        const response = await axios.patch(url, requestData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success) {
          showModalNotification(`Request ${action} successfully.`, "success");

          // Update state using functional updates
          setPendingRequests((prevPending) => {
            const updatedPending = prevPending.filter(
              (req) => req.id !== requestId
            );
            // Check if this action resulted in the last pending request being handled
            if (
              updatedPending.length === 0 &&
              initialRequestCount.current > 0 &&
              prevPending.length > 0
            ) {
              console.log(
                "Setting flag: Last pending request handled for project:",
                project.id
              );
              wasLastRequestHandled.current = true; // Set flag
            } else if (initialRequestCount.current > 0) {
              // Decrement initial count *only if* it wasn't the last one, avoids count mismatch issues
              initialRequestCount.current = Math.max(
                0,
                initialRequestCount.current - 1
              );
            }
            return updatedPending;
          });

          // If approved, optimistically ADD to approved members list
          if (action === "approved" && requestBeingHandled) {
            const newMember = {
              // Construct structure similar to fetched members
              id: null, // We don't know the Member table ID yet
              userId: requestBeingHandled.requesterId,
              projectId: project.id,
              role: "member",
              status: "active",
              joinedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              user: requestBeingHandled.requester
                ? { ...requestBeingHandled.requester }
                : {
                    id: requestBeingHandled.requesterId,
                    username: "User...",
                    profilePictureUrl: null,
                  },
            };
            setApprovedMembers((prevApproved) => [...prevApproved, newMember]);
          }
          // If rejected, no change to approvedMembers list needed here
        } else {
          throw new Error(
            response.data?.message || `Failed to ${action} request.`
          );
        }
      } catch (err) {
        console.error(`Error ${action} request ${requestId}:`, err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          `Could not ${action} request.`;
        setError(errorMsg);
        showModalNotification(errorMsg, "error");
        // Consider reverting optimistic UI changes here if necessary
      } finally {
        setProcessingRequestId(null);
      }
    },
    [showModalNotification, project?.id, processingRequestId, pendingRequests]
  ); // Added pendingRequests

  // --- useEffect to call parent AFTER state update ---
  useEffect(() => {
    // Check the flag AFTER the render cycle where 'pendingRequests' might have become empty
    if (wasLastRequestHandled.current) {
      if (onAllRequestsHandled) {
        console.log(
          "useEffect triggered: Calling onAllRequestsHandled for project:",
          project.id
        );
        onAllRequestsHandled(project.id);
      }
      wasLastRequestHandled.current = false; // Reset the flag immediately after calling
    }
    // Dependency array: watch changes in pendingRequests (length) and the callback prop itself
  }, [pendingRequests, onAllRequestsHandled, project?.id]);

  // --- Render Logic ---

  // Render Pending Requests Section
  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) {
      if (!isLoading && initialRequestCount.current === 0 && !error) {
        return (
          <p className="text-sm text-center text-gray-500 py-3 italic">
            No pending requests.
          </p>
        );
      } else if (!isLoading && initialRequestCount.current > 0 && !error) {
        return (
          <p className="text-sm text-center text-green-600 py-3 italic">
            All pending requests handled.
          </p>
        );
      }
      return null;
    }
    return (
      <ul className="space-y-3">
        {pendingRequests.map((req) => (
          <li
            key={req.id}
            className="p-3 border rounded-lg bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {req.requester?.profilePictureUrl ? (
                  <img
                    src={req.requester.profilePictureUrl}
                    alt={req.requester.username}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : (
                  <FaUserCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
                <span
                  className="font-medium text-gray-800 text-sm truncate inline-block max-w-[150px] sm:max-w-xs"
                  title={req.requester?.username || "Unknown User"}
                >
                  {" "}
                  {req.requester?.username || "Unknown User"}{" "}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {" "}
                  ({new Date(req.createdAt).toLocaleDateString()}){" "}
                </span>
              </div>
              {req.requestMessage && (
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 mt-1 whitespace-pre-wrap">
                  {" "}
                  <span className="font-medium">Message:</span>{" "}
                  {req.requestMessage}{" "}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => handleRequestAction(req.id, "approved")}
                disabled={processingRequestId === req.id}
                className="p-1.5 rounded-full text-green-600 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
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
                className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
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
  };

  // Render Approved Members Section
  const renderApprovedMembers = () => {
    if (
      isLoading ||
      (approvedMembers.length === 0 &&
        initialRequestCount.current === 0 &&
        pendingRequests.length === 0 &&
        !error)
    ) {
      return null;
    } // Hide if loading or truly empty

    return (
      <>
        <h4 className="text-sm font-semibold text-gray-700 mt-5 mb-2 pt-3 border-t border-gray-200 flex items-center">
          <FaUserCheckIcon className="mr-2 text-green-600" /> Approved Members (
          {approvedMembers.length})
        </h4>
        {approvedMembers.length === 0 ? (
          <p className="text-sm text-center text-gray-500 py-3 italic">
            No members have been approved yet.
          </p>
        ) : (
          <ul className="space-y-2 max-h-[25vh] overflow-y-auto pr-2">
            {" "}
            {/* Limit height */}
            {approvedMembers.map((member) => (
              // Use unique key: combination of userId and projectId if member.id is null from optimistic update
              <li
                key={member.id || `${member.userId}-${member.projectId}`}
                className="p-2 border rounded-md bg-white shadow-sm flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {" "}
                  {/* Prevent long names pushing out date */}
                  {member.user?.profilePictureUrl ? (
                    <img
                      src={member.user.profilePictureUrl}
                      alt={member.user.username}
                      className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <FaUserCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span
                    className="font-medium text-gray-800 truncate"
                    title={member.user?.username || "Unknown User"}
                  >
                    {member.user?.username || "Unknown User"}
                  </span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {/* Use joinedAt if available (from DB or optimistic), fallback to createdAt */}
                  Joined:{" "}
                  {new Date(
                    member.joinedAt || member.createdAt
                  ).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  };

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
            {" "}
            Requests & Members for "{project?.title || "Project"}"{" "}
          </h3>
          <button
            onClick={onClose}
            disabled={!!processingRequestId}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            {" "}
            <FaTimes size={20} />{" "}
          </button>
        </div>

        {/* Notification Area */}
        <AnimatePresence>
          {" "}
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

        {/* Body - Scrollable */}
        <div className="p-4 overflow-y-auto flex-grow">
          {/* Global Fetch Error */}
          {error &&
            pendingRequests.length === 0 &&
            approvedMembers.length === 0 &&
            !isLoading && (
              <div className="py-5">
                {" "}
                <ErrorMessage
                  message={error}
                  onClose={() => setError(null)}
                />{" "}
              </div>
            )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center p-10">
              {" "}
              <LoadingSpinner />{" "}
            </div>
          )}

          {/* Pending Requests Section */}
          {!isLoading && (
            <>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <FaUserClock className="mr-2 text-orange-500" /> Pending
                Requests ({pendingRequests.length})
              </h4>
              {renderPendingRequests()}
            </>
          )}

          {/* Approved Members Section */}
          {!isLoading && renderApprovedMembers()}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 border-t border-gray-200 flex-shrink-0 bg-gray-100 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={!!processingRequestId}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            {" "}
            Close{" "}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RequestsModal;
