// src/components/Explore.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaPaperPlane,
  FaDownload,
  FaUserClock,
  FaInbox,
} from "react-icons/fa";
import axios from "axios"; // Using axios for consistency
// Assuming these helpers are available from the previous example or separate files
import ConfirmationModal from "../Component/ConfirmationModal";

import "../index.css"; // Assuming Tailwind is set up

// --- Helper Components (or import) ---

// Publication Card Component
const PublicationCard = ({
  publication,
  onSendRequest,
  isRequestPending,
  actionLoading,
  currentUser,
}) => {
  const shortAbstract =
    publication.abstract && publication.abstract.length > 150
      ? publication.abstract.substring(0, 150) + "..."
      : publication.abstract;

  // Disable request button if user is the author or a request is pending/approved
  const isAuthor = currentUser?.id === publication.authorId; // Assuming authorId exists
  const disableRequestButton = isRequestPending || isAuthor || actionLoading;
  let requestButtonText = "Request Collaboration";
  if (isAuthor) requestButtonText = "Your Publication";
  else if (isRequestPending) requestButtonText = "Request Sent";

  return (
    <div className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between transition-shadow duration-300 hover:shadow-lg h-full">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {publication.title}
        </h3>
        <p className="text-sm text-gray-600 mb-1">
          <strong>Author:</strong> {publication.author || "N/A"}
        </p>
        {publication.journal && (
          <p className="text-sm text-gray-500 mb-1">
            <em>{publication.journal}</em>
          </p>
        )}
        {publication.publishDate && (
          <p className="text-xs text-gray-500 mb-2">
            Published: {new Date(publication.publishDate).toLocaleDateString()}
          </p>
        )}
        {shortAbstract && (
          <p className="text-sm text-gray-700 mb-3">{shortAbstract}</p>
        )}
        {publication.keywords && (
          <p className="text-xs text-gray-600 mb-4">
            <strong>Keywords:</strong> {publication.keywords}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        {publication.file && (
          <a
            href={publication.file} // Ensure this URL is correct and accessible
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded transition-colors"
            title="Download Publication PDF"
          >
            <FaDownload className="mr-1" /> Download
          </a>
        )}
        <button
          onClick={() => onSendRequest(publication.id)}
          className={`inline-flex items-center text-sm font-bold py-2 px-3 rounded transition-colors ${
            disableRequestButton
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
          disabled={disableRequestButton}
          title={
            isAuthor
              ? "This is your publication"
              : isRequestPending
              ? "Collaboration request already sent"
              : "Request to collaborate"
          }
        >
          {actionLoading === publication.id ? (
            <FaSpinner className="animate-spin mr-1" />
          ) : (
            <FaPaperPlane className="mr-1" />
          )}
          {actionLoading === publication.id ? "Sending..." : requestButtonText}
        </button>
      </div>
    </div>
  );
};

// Request List Item Component
const RequestListItem = ({
  request,
  onAction,
  actionLoading,
  type /* 'received' or 'sent' */,
}) => {
  const isLoading = actionLoading === request.id; // Check if action is loading for this specific request

  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200 gap-2">
      <div className="flex-grow">
        <span className="font-medium text-gray-800">
          {request.Publication?.title || "Publication Not Found"}
        </span>
        <span
          className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
            request.status === "approved"
              ? "bg-green-100 text-green-800"
              : request.status === "denied"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {request.status}
        </span>
        {type === "received" && request.Requester && (
          <p className="text-sm text-gray-600">
            From:{" "}
            {request.Requester?.name ||
              request.Requester?.username ||
              "Unknown User"}
          </p>
        )}
        {type === "sent" && request.Publication?.author && (
          <p className="text-sm text-gray-600">
            To: {request.Publication.author}
          </p>
        )}
        {/* Optionally show request date */}
        {/* <p className="text-xs text-gray-500">Requested: {new Date(request.createdAt).toLocaleString()}</p> */}
      </div>
      <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0">
        {type === "received" && request.status === "pending" && (
          <>
            <button
              onClick={() => onAction("approve", request.id)}
              className="btn-action bg-green-500 hover:bg-green-600 text-white"
              disabled={isLoading}
              title="Approve Request"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              <span className="ml-1 hidden sm:inline">Approve</span>
            </button>
            <button
              onClick={() => onAction("deny", request.id)}
              className="btn-action bg-red-500 hover:bg-red-600 text-white"
              disabled={isLoading}
              title="Deny Request"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaTimes />}
              <span className="ml-1 hidden sm:inline">Deny</span>
            </button>
          </>
        )}
        {type === "sent" && request.status === "pending" && (
          <button
            onClick={() => onAction("cancel", request.id)}
            className="btn-action bg-yellow-500 hover:bg-yellow-600 text-white"
            disabled={isLoading}
            title="Cancel Request"
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : <FaTimes />}
            <span className="ml-1 hidden sm:inline">Cancel</span>
          </button>
        )}
        {/* Add view details button if needed */}
      </div>
    </li>
  );
};

// --- Main Explore Component ---

const Explore = ({ currentUser }) => {
  // Expect currentUser prop { id, name, ... }
  const [publications, setPublications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title"); // 'title', 'author', 'publishDate'
  const [loading, setLoading] = useState({
    publications: true,
    requests: true,
    action: null,
  }); // action stores ID or boolean
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    action: null,
    itemId: null,
    message: "",
  });

  const API_BASE_URL = "http://localhost:5000/api"; // Base URL for APIs

  // --- Utility Functions ---
  const showNotification = (message, type = "error", duration = 4000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), duration);
  };

  const openConfirmationModal = (action, itemId, message) => {
    setConfirmModalState({ isOpen: true, action, itemId, message });
  };

  const closeConfirmationModal = () => {
    setConfirmModalState({
      isOpen: false,
      action: null,
      itemId: null,
      message: "",
    });
  };

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, publications: true, requests: true }));
    setNotification({ message: "", type: "" }); // Clear notification on fresh load
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [pubResponse, reqResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/publications`, { headers }),
        axios.get(`${API_BASE_URL}/requests`, { headers }), // Assumes this gets requests relevant to the user
      ]);

      setPublications(pubResponse.data || []);
      setRequests(reqResponse.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load data.";
      showNotification(errorMessage); // Show error notification
    } finally {
      setLoading((prev) => ({ ...prev, publications: false, requests: false }));
    }
  }, []); // No dependencies other than context/constants

  useEffect(() => {
    if (!currentUser?.id) {
      showNotification(
        "User information is missing. Please log in again.",
        "error"
      );
      setLoading({ publications: false, requests: false, action: null }); // Stop loading if no user
      return;
    }
    fetchData();
  }, [fetchData, currentUser]); // Refetch if user changes

  const filteredAndSortedPublications = useMemo(() => {
    return publications
      .filter((pub) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          !searchTerm ||
          pub.title?.toLowerCase().includes(lowerSearchTerm) ||
          pub.author?.toLowerCase().includes(lowerSearchTerm) ||
          pub.keywords?.toLowerCase().includes(lowerSearchTerm) ||
          pub.abstract?.toLowerCase().includes(lowerSearchTerm)
        );
      })
      .sort((a, b) => {
        const valA = a[sortBy] || "";
        const valB = b[sortBy] || "";
        if (sortBy === "publishDate") {
          // Sort dates descending (newest first)
          return (new Date(valB) || 0) - (new Date(valA) || 0);
        }
        return valA.toString().localeCompare(valB.toString()); // Default string compare
      });
  }, [publications, searchTerm, sortBy]);

  const { receivedRequests, sentRequests, pendingSentRequestIds } =
    useMemo(() => {
      const received = [];
      const sent = [];
      const pendingSentIds = new Set();
      requests.forEach((req) => {
        // Assuming Publication object has an authorId or similar
        if (req.Publication?.authorId === currentUser?.id) {
          received.push(req);
        } else if (req.requesterId === currentUser?.id) {
          sent.push(req);
          if (req.status === "pending" || req.status === "approved") {
            // Consider approved as "request sent/active"
            pendingSentIds.add(req.publicationId);
          }
        }
      });
      // Sort requests maybe by date? (Optional)
      received.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      sent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return {
        receivedRequests: received,
        sentRequests: sent,
        pendingSentRequestIds: pendingSentIds,
      };
    }, [requests, currentUser?.id]);

  // --- Action Handlers ---

  const handleSendRequest = async (publicationId) => {
    if (!currentUser?.id) {
      showNotification("Cannot send request: User ID not found.", "error");
      return;
    }
    // Optional: Confirmation before sending
    // openConfirmationModal('send', publicationId, 'Send collaboration request for this publication?');
    // If using confirmation, move the logic below into handleConfirmAction

    setLoading((prev) => ({ ...prev, action: publicationId })); // Indicate loading for this specific publication card
    try {
      const response = await axios.post(
        `${API_BASE_URL}/requests`,
        { publicationId, userId: currentUser.id }, // Send correct userId
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.status === 201 || response.status === 200) {
        showNotification("Request sent successfully!", "success");
        // Refetch requests to get the updated list and statuses
        const reqResponse = await axios.get(`${API_BASE_URL}/requests`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setRequests(reqResponse.data || []);
      } else {
        // Axios throws for non-2xx, so this might not be reached often unless configured differently
        throw new Error(
          response.data?.message ||
            `Failed to send request (Status: ${response.status})`
        );
      }
    } catch (error) {
      console.error("Error sending request:", error);
      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to send request."
      );
    } finally {
      setLoading((prev) => ({ ...prev, action: null }));
    }
  };

  const handleRequestAction = (actionType, requestId) => {
    let message = "";
    switch (actionType) {
      case "approve":
        message =
          "Are you sure you want to approve this collaboration request?";
        break;
      case "deny":
        message = "Are you sure you want to deny this collaboration request?";
        break;
      case "cancel":
        message = "Are you sure you want to cancel your collaboration request?";
        break;
      default:
        return;
    }
    openConfirmationModal(actionType, requestId, message);
  };

  const handleConfirmAction = async () => {
    const { action, itemId } = confirmModalState;
    if (!action || !itemId) return;

    closeConfirmationModal();
    setLoading((prev) => ({ ...prev, action: itemId })); // Show loading on the specific request item
    let apiCall;
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };

    try {
      switch (action) {
        case "approve":
          apiCall = axios.put(
            `${API_BASE_URL}/requests/${itemId}/approve`,
            {},
            { headers }
          );
          break;
        case "deny":
          // Assuming a PUT endpoint, adjust if it's DELETE or different
          apiCall = axios.put(
            `${API_BASE_URL}/requests/${itemId}/deny`,
            {},
            { headers }
          );
          break;
        case "cancel":
          apiCall = axios.delete(`${API_BASE_URL}/requests/${itemId}`, {
            headers,
          });
          break;
        default:
          throw new Error("Invalid action");
      }

      const response = await apiCall;

      // Check for successful status codes (200 OK, 204 No Content)
      if (response.status === 200 || response.status === 204) {
        showNotification(
          `Request ${
            action === "cancel" ? "cancelled" : action + "d"
          } successfully!`,
          "success"
        );
        // Refetch requests after successful action
        const reqResponse = await axios.get(`${API_BASE_URL}/requests`, {
          headers,
        });
        setRequests(reqResponse.data || []);
      } else {
        throw new Error(
          response.data?.message ||
            `Failed to ${action} request (Status: ${response.status})`
        );
      }
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      showNotification(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${action} request.`
      );
    } finally {
      setLoading((prev) => ({ ...prev, action: null }));
    }
  };

  // --- Render ---

  return (
    <div className="container mx-auto p-4 md:p-6">
      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        title={`Confirm ${
          confirmModalState.action?.charAt(0).toUpperCase() +
          confirmModalState.action?.slice(1)
        }`}
        message={confirmModalState.message}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmationModal}
        // Optional: Style confirm button based on action (e.g., red for deny/cancel)
      />

      <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800">
        Explore Publications
      </h1>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />

      {/* --- Filters --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <div className="relative w-full md:w-1/2 lg:w-2/5">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
            <FaSearch />
          </span>
          <input
            type="text"
            placeholder="Search title, author, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 w-full" // Reusing form-input class
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label
            htmlFor="sort"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input w-full md:w-auto" // Reusing form-input class
          >
            <option value="title">Title (A-Z)</option>
            <option value="author">Author (A-Z)</option>
            <option value="publishDate">Date (Newest First)</option>
          </select>
          {/* Optional: Add Asc/Desc toggle for Title/Author */}
        </div>
      </div>

      {/* --- Publications Section --- */}
      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4 text-gray-700">
        Available Publications
      </h2>
      {loading.publications ? (
        <div className="loading text-center py-10 text-gray-600 flex items-center justify-center">
          <FaSpinner className="animate-spin mr-2 text-xl" /> Loading
          publications...
        </div>
      ) : filteredAndSortedPublications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPublications.map((pub) => (
            <PublicationCard
              key={pub.id || pub._id}
              publication={pub}
              onSendRequest={handleSendRequest}
              isRequestPending={pendingSentRequestIds.has(pub.id)}
              actionLoading={loading.action} // Pass the ID being loaded
              currentUser={currentUser}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">
          No publications found matching your criteria.
        </p>
      )}

      {/* --- Requests Sections (Combined or Separate) --- */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Received Requests */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
            <FaInbox className="mr-2 text-blue-600" />
            Received Collaboration Requests
          </h2>
          {loading.requests ? (
            <div className="mini-loading flex items-center text-gray-500">
              <FaSpinner className="animate-spin mr-1 text-sm" />
              Loading...
            </div>
          ) : receivedRequests.length > 0 ? (
            <ul className="space-y-2">
              {receivedRequests.map((req) => (
                <RequestListItem
                  key={req.id}
                  request={req}
                  onAction={handleRequestAction}
                  actionLoading={loading.action} // Pass ID being loaded
                  type="received"
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              You have no pending incoming requests.
            </p>
          )}
        </div>

        {/* Sent Requests */}
        <div className="bg-white p-5 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
            <FaUserClock className="mr-2 text-purple-600" />
            Your Sent Requests
          </h2>
          {loading.requests ? (
            <div className="mini-loading flex items-center text-gray-500">
              <FaSpinner className="animate-spin mr-1 text-sm" />
              Loading...
            </div>
          ) : sentRequests.length > 0 ? (
            <ul className="space-y-2">
              {sentRequests.map((req) => (
                <RequestListItem
                  key={req.id}
                  request={req}
                  onAction={handleRequestAction}
                  actionLoading={loading.action} // Pass ID being loaded
                  type="sent"
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              You haven't sent any collaboration requests yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
