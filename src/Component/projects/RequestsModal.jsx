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
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
// Adjust path as needed
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessage from "../Common/ErrorMessage";
import Notification from "../Common/Notification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper to get Auth Token
const getAuthToken = () => localStorage.getItem("authToken");

// --- Component Start ---
const RequestsModal = ({
  project,
  onClose,
  currentUser,
  onAllRequestsHandled,
}) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedMembers, setApprovedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null); // Tracks which request is being acted upon
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  // Refs to manage fetch state and callback logic
  const hasFetched = useRef(false);
  const initialPendingCount = useRef(0); // Store the initial number of pending requests
  const wasLastRequestHandled = useRef(false); // Flag to trigger callback after state update

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
    // Prevent fetching if already loading or project ID is missing
    if (!project?.id) {
      setError("Project information is missing.");
      setIsLoading(false);
      return;
    }
    // Don't refetch if already loading
    if (isLoading) return;

    console.log(`Fetching requests & members for project ${project.id}`);
    setIsLoading(true);
    setError(null); // Clear previous errors
    wasLastRequestHandled.current = false; // Reset flag on new fetch

    const token = getAuthToken();
    if (!token) {
      setError("Authentication required.");
      setIsLoading(false);
      return;
    }

    try {
      // --- Use a specific endpoint for fetching both requests and members for a project ---
      // !!! IMPORTANT: Ensure this backend endpoint exists and returns the expected structure !!!
      // Example endpoint: GET /api/projects/:projectId/requests-and-members
      // Or adapt your existing GET /api/collaboration-requests endpoint
      const response = await axios.get(
        `${API_BASE_URL}/api/collaboration-requests?projectId=${project.id}`, // Assuming this endpoint returns both now
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // --- LOG THE RESPONSE TO DEBUG ---
      console.log(
        "RequestsModal API Response:",
        JSON.stringify(response.data, null, 2)
      );

      // --- CORRECTED DATA VALIDATION AND EXTRACTION ---
      // Expecting structure: { success: true, data: { pendingRequests: [], approvedMembers: [] } }
      // OR structure from getReceivedRequests: { success: true, count: X, data: [...] } -> Needs adjustment
      if (response.data?.success) {
        let pending = [];
        let approved = []; // Default to empty

        // Check structure: Is data an object with keys, or just an array (like getReceivedRequests)?
        if (response.data.data && typeof response.data.data === "object") {
          // Scenario 1: Backend sends { success: true, data: { pendingRequests: [], approvedMembers: [] } }
          pending = Array.isArray(response.data.data.pendingRequests)
            ? response.data.data.pendingRequests
            : [];
          approved = Array.isArray(response.data.data.approvedMembers)
            ? response.data.data.approvedMembers
            : [];
          console.log(
            `Parsed: ${pending.length} pending, ${approved.length} approved.`
          );
        } else if (Array.isArray(response.data.data)) {
          // Scenario 2: Backend sends { success: true, count: X, data: [...] } (only pending requests)
          // This means we need another call for members, OR the backend needs changing.
          // For now, assume it only returns pending based on your controller.
          pending = response.data.data;
          approved = []; // Cannot get approved members from this endpoint currently
          console.warn(
            "RequestsModal: API endpoint only returned pending requests. Approved members list will be empty."
          );
          // TODO: Add a separate call to fetch members if needed, e.g., GET /api/projects/:projectId/members
        } else {
          // Unexpected structure within 'data'
          throw new Error(
            "Invalid data structure received inside 'data' field."
          );
        }

        setPendingRequests(pending);
        setApprovedMembers(approved); // Set approved members (might be empty)

        // Set initial count only on the first successful fetch
        if (!hasFetched.current) {
          initialPendingCount.current = pending.length;
          console.log(
            "Initial pending count set:",
            initialPendingCount.current
          );
        }
        hasFetched.current = true; // Mark as fetched
      } else {
        // Backend returned success: false or missing success flag
        throw new Error(
          response.data?.message || "Invalid data received from API."
        );
      }
      // --- END CORRECTION ---
    } catch (err) {
      console.error("Error fetching requests/members:", err);
      const errorMsg =
        err.response?.status === 403
          ? "Permission denied to view requests/members."
          : err.response?.data?.message ||
            err.message ||
            "Could not load request/member data.";
      setError(errorMsg);
      setPendingRequests([]);
      setApprovedMembers([]);
      initialPendingCount.current = 0; // Reset count on error
      hasFetched.current = true; // Mark fetch attempt even if failed
    } finally {
      setIsLoading(false);
    }
    // Depend on project.id; isLoading prevents rapid refetching
  }, [project?.id, isLoading]);

  // Initial Fetch Effect
  useEffect(() => {
    // Fetch only if project ID exists and fetch hasn't happened yet
    if (project?.id && !hasFetched.current) {
      fetchRequestsAndMembers();
    }
    // Cleanup ref on unmount if needed (usually not necessary for this pattern)
    // return () => { hasFetched.current = false; };
  }, [project?.id, fetchRequestsAndMembers]); // Depend on fetchRequestsAndMembers callback

  // --- Handle Request Action (Approve/Reject) ---
  const handleRequestAction = useCallback(
    async (requestId, action, responseMessage = null) => {
      if (!requestId || !action || processingRequestId) return;

      setProcessingRequestId(requestId);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        showModalNotification("Authentication required.", "error");
        setProcessingRequestId(null);
        return;
      }

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

          // --- State Updates ---
          const wasPreviouslyEmpty = pendingRequests.length === 1; // Was this the only pending request?

          // Remove from pending list
          setPendingRequests((prevPending) =>
            prevPending.filter((req) => req.id !== requestId)
          );

          // If approved, add to approved members list (optimistic)
          if (action === "approved" && requestBeingHandled) {
            const newMember = {
              id: `optimistic-${requestId}`, // Temporary unique key for optimistic update
              userId: requestBeingHandled.requesterId,
              projectId: project.id,
              role: "member",
              status: "active",
              joinedAt: new Date().toISOString(),
              createdAt: requestBeingHandled.createdAt, // Use request createdAt as approx
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

          // --- Flag for Callback ---
          // Set the flag *if* this action cleared the *last* of the *initially fetched* pending requests
          if (wasPreviouslyEmpty && initialPendingCount.current > 0) {
            console.log(
              "Setting flag: Last pending request handled for project:",
              project.id
            );
            wasLastRequestHandled.current = true;
            initialPendingCount.current = 0; // Reset initial count as they are all handled now
          }
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
        // TODO: Consider adding logic to revert optimistic UI changes on failure
      } finally {
        setProcessingRequestId(null);
      }
    },
    [showModalNotification, project?.id, processingRequestId, pendingRequests]
  ); // Include pendingRequests

  // --- useEffect to call parent callback AFTER state update ---
  useEffect(() => {
    // This effect runs *after* the render cycle caused by setPendingRequests
    if (wasLastRequestHandled.current) {
      if (onAllRequestsHandled) {
        console.log(
          "useEffect triggered: Calling onAllRequestsHandled for project:",
          project.id
        );
        onAllRequestsHandled(project.id); // Call the callback passed from parent
      }
      wasLastRequestHandled.current = false; // Reset the flag immediately
    }
    // Depend on the length of pendingRequests to detect when it becomes zero
    // Also depend on the callback prop itself and project.id for stability
  }, [pendingRequests.length, onAllRequestsHandled, project?.id]);

  // --- Render Logic ---

  // Render Pending Requests Section
  const renderPendingRequests = () => {
    // Show message only after initial load and if there was at least one request initially
    if (pendingRequests.length === 0 && !isLoading && hasFetched.current) {
      if (initialPendingCount.current > 0) {
        // Show if there *were* requests initially
        return (
          <p className="text-sm text-center text-green-600 py-3 italic">
            All pending requests handled.
          </p>
        );
      } else if (!error) {
        // Show if there were *never* any requests and no error
        return (
          <p className="text-sm text-center text-gray-500 py-3 italic">
            No pending requests.
          </p>
        );
      }
    }

    if (pendingRequests.length === 0) return null; // Don't render list if empty

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
    // Hide section title if loading OR if there are no approved members AND no pending requests to potentially approve
    if (
      isLoading ||
      (approvedMembers.length === 0 && pendingRequests.length === 0 && !error)
    ) {
      return null;
    }

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
              <li
                key={member.id || `${member.userId}-${member.projectId}`}
                className="p-2 border rounded-md bg-white shadow-sm flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
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

  // Main Modal Render
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
          {/* Global Fetch Error (Show only if nothing loaded) */}
          {error &&
            !isLoading &&
            pendingRequests.length === 0 &&
            approvedMembers.length === 0 && (
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
          {renderApprovedMembers()}
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
