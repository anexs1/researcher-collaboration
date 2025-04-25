// src/Component/projects/RequestsModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FaTimes,
  FaCheck,
  FaBan,
  FaSpinner,
  FaUserCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../Common/LoadingSpinner"; // Adjust path
import ErrorMessage from "../Common/ErrorMessage"; // Adjust path
import Notification from "../Common/Notification"; // Adjust path

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const RequestsModal = ({ project, onClose, currentUser }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null); // ID of request being approved/rejected
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  // --- Notification Handler ---
  const showModalNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
    return () => clearTimeout(timer);
  }, []);

  // --- Fetch Pending Requests ---
  const fetchRequests = useCallback(async () => {
    if (!project?.id) {
      setError("Project ID missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required.");
      setIsLoading(false);
      return;
    }

    try {
      // --- Endpoint to fetch PENDING requests for THIS project ---
      // Adjust endpoint as needed (e.g., might include status=pending query param)
      const response = await axios.get(
        `${API_BASE_URL}/api/projects/${project.id}/requests?status=pending`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success && Array.isArray(response.data.data)) {
        setRequests(response.data.data); // Expecting an array of request objects
      } else {
        throw new Error(
          response.data?.message || "Invalid data received for requests."
        );
      }
    } catch (err) {
      console.error("Error fetching join requests:", err);
      const errorMsg =
        err.response?.status === 403
          ? "You don't have permission to view requests for this project."
          : err.response?.data?.message ||
            err.message ||
            "Could not load requests.";
      setError(errorMsg);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]); // Dependency: project ID

  // Fetch requests when modal opens
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // --- Handle Request Action (Approve/Reject) ---
  const handleRequestAction = useCallback(
    async (requestId, action) => {
      // action: 'approved' or 'rejected'
      if (!requestId || !action) return;

      setProcessingRequestId(requestId); // Show loading state for this specific request
      setError(null); // Clear previous errors
      const token = localStorage.getItem("authToken");
      if (!token) {
        showModalNotification("Authentication required.", "error");
        setProcessingRequestId(null);
        return;
      }

      console.log(`Attempting to ${action} request ID: ${requestId}`);

      try {
        // --- Endpoint to update request status ---
        // Adjust endpoint as needed
        const response = await axios.patch(
          `${API_BASE_URL}/api/collaboration-requests/${requestId}`,
          { status: action }, // Send the new status
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.success) {
          showModalNotification(`Request ${action} successfully.`, "success");
          // Remove the processed request from the list
          setRequests((prev) => prev.filter((req) => req.id !== requestId));
          // Optionally: Notify parent component if needed (e.g., update member list)
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
        setError(errorMsg); // Show error at the top
        showModalNotification(errorMsg, "error");
      } finally {
        setProcessingRequestId(null); // Stop loading for this request
      }
    },
    [showModalNotification]
  ); // Dependencies

  // --- Render Logic ---
  const renderRequestList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-10">
          <LoadingSpinner />
        </div>
      );
    }
    if (error && requests.length === 0) {
      // Show main error only if list is empty
      return <ErrorMessage message={error} onClose={() => setError(null)} />;
    }
    if (requests.length === 0) {
      return (
        <p className="text-center text-gray-500 py-10 italic">
          No pending join requests.
        </p>
      );
    }

    return (
      <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {requests.map((req) => (
          <li
            key={req.id}
            className="p-3 border rounded-lg bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            {/* Request Info */}
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                {req.requester?.profilePictureUrl ? (
                  <img
                    src={req.requester.profilePictureUrl}
                    alt={req.requester.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="w-6 h-6 text-gray-400" />
                )}
                <span className="font-medium text-gray-800 text-sm">
                  {req.requester?.username || "Unknown User"}
                </span>
                <span className="text-xs text-gray-400">
                  ({new Date(req.createdAt).toLocaleDateString()})
                </span>
              </div>
              {req.message && (
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 mt-1 whitespace-pre-wrap text-xs">
                  {req.message}
                </p>
              )}
            </div>
            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => handleRequestAction(req.id, "approved")}
                disabled={processingRequestId === req.id}
                className="p-1.5 rounded-full text-green-600 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
                title="Approve Request"
              >
                {processingRequestId === req.id ? (
                  <FaSpinner className="animate-spin h-4 w-4" />
                ) : (
                  <FaCheck className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleRequestAction(req.id, "rejected")}
                disabled={processingRequestId === req.id}
                className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
                title="Reject Request"
              >
                {processingRequestId === req.id ? (
                  <FaSpinner className="animate-spin h-4 w-4" />
                ) : (
                  <FaBan className="h-4 w-4" />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
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
            Manage Join Requests for "{project?.title || "Project"}"
          </h3>
          <button
            onClick={onClose}
            disabled={!!processingRequestId} // Disable close while processing
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Modal-level Notification Area */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() =>
                  setNotification((prev) => ({ ...prev, show: false }))
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body - Scrollable List */}
        <div className="p-4 overflow-y-auto flex-grow">
          {/* Display general error if list is empty and error occurred */}
          {error && requests.length === 0 && !isLoading && (
            <div className="py-5">
              <ErrorMessage message={error} onClose={() => setError(null)} />
            </div>
          )}
          {/* Render the list or loading/empty state */}
          {renderRequestList()}
        </div>

        {/* Footer (Optional - maybe just a close button) */}
        <div className="flex justify-end p-3 border-t border-gray-200 flex-shrink-0 bg-gray-100 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={!!processingRequestId} // Disable close while processing
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RequestsModal;
