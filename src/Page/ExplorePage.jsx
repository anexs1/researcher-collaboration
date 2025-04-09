import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ClockIcon,
  InboxArrowDownIcon,
  PaperAirplaneIcon as SentIcon,
  CalendarDaysIcon, // Added for date
  ChatBubbleLeftEllipsisIcon, // Added for message
} from "@heroicons/react/24/outline";
import { formatDistanceToNow, parseISO } from "date-fns"; // For formatting dates

// --- API Client Setup (Matches your backend base URL) ---
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// --- End API Client Setup ---

// Research areas (Keep consistent or fetch from backend if dynamic)
const researchAreas = [
  "All Disciplines",
  "Computer Science",
  "Physics",
  "Engineering",
  "Biology",
  "Health Sciences",
  "Social Sciences",
  "Humanities",
  "Ethics",
];

// --- Debounce Utility ---
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// --- Helper to format date nicely ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    // Handles both full ISO strings and DATEONLY strings
    const date = parseISO(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    console.warn("Could not parse date:", dateString, e);
    return dateString; // Fallback
  }
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch (e) {
    console.warn("Could not parse relative date:", dateString, e);
    return ""; // Fallback
  }
};

// --- Helper function to safely parse and render tags ---
const RenderTags = ({ tagsData }) => {
  let tagsArray = [];

  if (Array.isArray(tagsData)) {
    // Already an array
    tagsArray = tagsData;
  } else if (typeof tagsData === "string" && tagsData.trim()) {
    try {
      // Attempt to parse as JSON array first (e.g., "[\"tag1\", \"tag2\"]")
      const parsed = JSON.parse(tagsData);
      if (Array.isArray(parsed)) {
        tagsArray = parsed;
      } else {
        // If JSON.parse results in non-array (e.g., just a string "tag1"), treat as single tag
        // Or fallback to comma-separated logic if applicable
        console.warn("Parsed tags data is not an array:", parsed);
        // Fallback: attempt split (adjust if your strings are different)
        tagsArray = tagsData
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } catch (e) {
      // If JSON.parse fails, assume comma-separated (e.g., "tag1,tag2")
      tagsArray = tagsData
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean); // filter(Boolean) removes empty strings
    }
  }
  // Handles null, undefined, empty string, or failed parsing

  if (tagsArray.length === 0) {
    return <span className="text-xs text-gray-400 italic">No tags</span>;
  }

  return tagsArray.map((tag, index) => (
    // Use tag itself in key for better stability if tags can change order slightly
    <span
      key={`${tag}-${index}`}
      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200"
    >
      {tag}
    </span>
  ));
};
// --- End Helper function ---

// --- ExplorePage Component ---
const ExplorePage = ({ currentUser }) => {
  // --- State ---
  const [publications, setPublications] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [isLoadingPublications, setIsLoadingPublications] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [errorPublications, setErrorPublications] = useState(null);
  const [errorRequests, setErrorRequests] = useState(null);

  const [sendingRequestId, setSendingRequestId] = useState(null);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [pendingSentRequestPubIds, setPendingSentRequestPubIds] = useState(
    new Set()
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("All Disciplines");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Should match backend default limit if not passed
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Total matching publications from backend

  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    action: null,
    message: "",
    targetId: null,
    itemTitle: "",
  });
  const [notification, setNotification] = useState(null);

  // --- Handlers ---
  const showNotification = (message, type = "success", duration = 4000) => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), duration);
  };

  const closeConfirmationModal = () => {
    setConfirmModalState({
      isOpen: false,
      action: null,
      message: "",
      targetId: null,
      itemTitle: "",
    });
  };

  const clearNotification = () => setNotification(null);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const debouncedSearchHandler = useCallback(
    debounce(handleSearchChange, 500),
    []
  );

  // --- Data Fetching ---
  const fetchPublications = useCallback(
    async (signal) => {
      setIsLoadingPublications(true);
      setErrorPublications(null); // Clear previous errors
      try {
        const params = {
          search: searchTerm || undefined, // Send undefined if empty
          area: selectedArea === "All Disciplines" ? undefined : selectedArea,
          sortBy: sortBy,
          page: currentPage,
          limit: itemsPerPage,
        };
        // Remove undefined params before sending
        Object.keys(params).forEach(
          (key) => params[key] === undefined && delete params[key]
        );

        const response = await apiClient.get("/publications/explore", {
          params,
          signal,
        });

        if (response.data?.success) {
          setPublications(response.data.data || []); // Use 'data' field from backend response
          setTotalPages(response.data.totalPages || 1);
          setTotalItems(response.data.totalItems || 0); // Use 'totalItems' field
        } else {
          throw new Error(
            response.data?.message || "Failed to fetch publications"
          );
        }
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("Error fetching publications:", error);
          // Use the specific error message from the backend if available (like 401)
          const errorMsg =
            error.response?.data?.message ||
            error.message ||
            "Could not load publications.";
          setErrorPublications(errorMsg);
          setPublications([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } finally {
        if (!signal?.aborted) setIsLoadingPublications(false);
      }
    },
    [searchTerm, selectedArea, sortBy, currentPage, itemsPerPage]
  );

  const fetchRequests = useCallback(async (signal) => {
    setIsLoadingRequests(true);
    setErrorRequests(null); // Clear previous errors
    let receivedError = null;
    let sentError = null;
    let tempReceived = [];
    let tempSent = [];

    try {
      // Use Promise.allSettled to handle potential individual failures
      const results = await Promise.allSettled([
        apiClient.get("/collaboration-requests/received", { signal }),
        apiClient.get("/collaboration-requests/sent", { signal }),
      ]);

      // Process Received Requests Result
      if (results[0].status === "fulfilled" && results[0].value.data?.success) {
        tempReceived = results[0].value.data.data || [];
      } else if (results[0].status === "fulfilled") {
        // API call succeeded but backend reported failure
        receivedError =
          results[0].value.data?.message || "Failed to fetch received requests";
      } else {
        // API call itself failed (network error, 4xx/5xx without specific backend message)
        receivedError =
          results[0].reason?.response?.data?.message ||
          results[0].reason?.message ||
          "Error fetching received requests";
        console.error("Error fetching received requests:", results[0].reason);
      }

      // Process Sent Requests Result
      if (results[1].status === "fulfilled" && results[1].value.data?.success) {
        tempSent = results[1].value.data.data || [];
        const pendingPubIds = new Set(
          tempSent
            .filter((req) => req.status === "pending")
            .map((req) => req.publicationId)
        );
        setPendingSentRequestPubIds(pendingPubIds);
      } else if (results[1].status === "fulfilled") {
        sentError =
          results[1].value.data?.message || "Failed to fetch sent requests";
      } else {
        sentError =
          results[1].reason?.response?.data?.message ||
          results[1].reason?.message ||
          "Error fetching sent requests";
        console.error("Error fetching sent requests:", results[1].reason);
      }

      // Update state after processing both
      setReceivedRequests(tempReceived);
      setSentRequests(tempSent);

      // Combine errors if any occurred
      const combinedError = [receivedError, sentError]
        .filter(Boolean)
        .join("; ");
      if (combinedError) {
        setErrorRequests(combinedError);
      }
    } catch (error) {
      // Catch errors not handled by Promise.allSettled (should be rare)
      if (error.name !== "CanceledError") {
        console.error("Unexpected error fetching requests:", error);
        setErrorRequests(
          error.message || "Could not load collaboration requests."
        );
        setReceivedRequests([]);
        setSentRequests([]);
      }
    } finally {
      if (!signal?.aborted) setIsLoadingRequests(false);
    }
  }, []); // Dependencies remain the same

  // --- Effects ---
  useEffect(() => {
    const controller = new AbortController();
    fetchPublications(controller.signal);
    return () => controller.abort();
  }, [fetchPublications]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRequests(controller.signal);
    return () => controller.abort();
  }, [fetchRequests]); // Fetch requests only on initial load or manual trigger needed

  // --- Action Handlers ---

  const handleSendRequest = async (publicationId, publicationTitle) => {
    if (pendingSentRequestPubIds.has(publicationId)) return;
    setSendingRequestId(publicationId);
    try {
      // Backend expects { publicationId } in body
      const response = await apiClient.post("/collaboration-requests", {
        publicationId,
      });
      if (response.data?.success) {
        showNotification(
          `Collaboration request sent for "${publicationTitle}".`,
          "success"
        );
        // Optimistic UI update
        setPendingSentRequestPubIds((prev) => new Set(prev).add(publicationId));
        // Add the new request to the *start* of the sent list locally for immediate feedback
        // Backend returns the populated request in response.data.data
        if (response.data.data) {
          setSentRequests((prev) => [response.data.data, ...prev]);
        } else {
          // Fallback if data isn't returned: refetch all
          fetchRequests(); // Consider creating AbortController here if needed
        }
      } else {
        throw new Error(response.data?.message || "Failed to send request");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to send request.",
        "error"
      );
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleConfirmRequestAction = async () => {
    const { action, targetId, itemTitle } = confirmModalState;
    if (!action || !targetId) return;

    setProcessingRequestId(targetId);
    closeConfirmationModal();

    // Backend uses PATCH /:requestId/accept, /:requestId/reject, /:requestId/cancel
    const url = `/collaboration-requests/${targetId}/${action}`;

    try {
      const response = await apiClient.patch(url);
      if (response.data?.success) {
        const successMessages = {
          accept: `Accepted collaboration request regarding "${itemTitle}".`,
          reject: `Rejected collaboration request regarding "${itemTitle}".`,
          cancel: `Cancelled collaboration request for "${itemTitle}".`,
        };
        showNotification(
          successMessages[action] || `Request ${action}ed successfully.`,
          "success"
        );
        // Crucial: Refetch requests to update lists after action
        fetchRequests(); // Consider creating AbortController here if needed
      } else {
        throw new Error(
          response.data?.message || `Failed to ${action} request`
        );
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      showNotification(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${action} request.`,
        "error"
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Trigger modal, uses publicationTitle from request data
  const handleRequestActionTrigger = (
    requestId,
    actionType,
    itemTitle = "this item"
  ) => {
    const messages = {
      accept: `Are you sure you want to accept the collaboration request regarding "${itemTitle}"?`,
      reject: `Are you sure you want to reject the collaboration request regarding "${itemTitle}"?`,
      cancel: `Are you sure you want to cancel your collaboration request for "${itemTitle}"?`,
    };
    setConfirmModalState({
      isOpen: true,
      action: actionType,
      message: messages[actionType] || `Confirm action for "${itemTitle}"?`,
      targetId: requestId,
      itemTitle: itemTitle,
    });
  };

  // --- Render ---
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* --- Notification --- */}
      {notification && (
        <div
          key={notification.id} // Use key for animation/transition tracking if needed
          className={`fixed top-4 right-4 w-auto max-w-md p-4 rounded-md shadow-lg text-sm font-medium z-50 border-l-4 ${
            notification.type === "success"
              ? "bg-green-50 border-green-400 text-green-800"
              : notification.type === "error"
              ? "bg-red-50 border-red-400 text-red-800"
              : "bg-blue-50 border-blue-400 text-blue-800" // Info/default style
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{notification.message}</span>
            <button onClick={clearNotification} className="ml-4">
              <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>
      )}
      {/* --- Confirmation Modal --- */}
      {confirmModalState.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4 transition-opacity duration-200 ease-out"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full transform transition-all duration-200 ease-out scale-95 opacity-0 animate-fade-in-scale">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Action
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmModalState.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmationModal}
                type="button"
                className="px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRequestAction}
                type="button"
                className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-white text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  confirmModalState.action === "reject" ||
                  confirmModalState.action === "cancel"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500" // Using blue for accept
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={processingRequestId === confirmModalState.targetId}
              >
                {
                  processingRequestId === confirmModalState.targetId ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null // Don't show icon when not loading
                }
                {processingRequestId === confirmModalState.targetId
                  ? "Processing..."
                  : `Confirm ${confirmModalState.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- Page Header --- */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">
          Discover Research & Connect
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Browse publications and initiate collaborations.
        </p>
      </div>
      {/* --- Filters & Sorting Row --- */}
      <div className="mb-8 p-4 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="relative col-span-1 md:col-span-2 lg:col-span-2">
            <label
              htmlFor="search-input"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Search Publications
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="search-input"
                defaultValue={searchTerm}
                onChange={debouncedSearchHandler}
                placeholder="Keywords, title, author, area..." // Updated placeholder
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Filter by Area */}
          <div className="col-span-1">
            <label
              htmlFor="area-select"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Discipline
            </label>
            <select
              id="area-select"
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              {researchAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="col-span-1">
            <label
              htmlFor="sort-select"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Sort By
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="date_desc">Date Published (Newest)</option>
              <option value="date_asc">Date Published (Oldest)</option>
              <option value="title_asc">Title (A-Z)</option>
              {/* Add more relevant sort options like 'citations_desc', 'reads_desc' if data exists */}
            </select>
          </div>
        </div>
      </div>
      {/* --- Main Content Area --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Publications List (Main Column) */}
        <section className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-1 text-gray-800 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
            Research Feed
          </h2>
          {/* Display total items from backend */}
          <p className="text-xs text-gray-500 mb-4">
            Showing {isLoadingPublications ? "..." : publications.length} of{" "}
            {isLoadingPublications ? "..." : totalItems} results.
            {!isLoadingPublications &&
              totalPages > 1 &&
              ` Page ${currentPage} of ${totalPages}.`}
          </p>

          {/* Display Errors */}
          {errorPublications && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span>{errorPublications}</span>
            </div>
          )}

          {isLoadingPublications ? (
            <div className="space-y-4">
              {[...Array(5)].map(
                (
                  _,
                  index // Show fewer skeletons
                ) => (
                  <div
                    key={index}
                    className="bg-white p-4 border border-gray-200 rounded-md shadow-sm animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>{" "}
                    {/* Area/Type */}
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>{" "}
                    {/* Title */}
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>{" "}
                    {/* Author */}
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>{" "}
                    {/* Date */}
                    <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>{" "}
                    {/* Summary */}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <div className="h-4 bg-gray-200 rounded w-10"></div>{" "}
                        {/* Tag 1 */}
                        <div className="h-4 bg-gray-200 rounded w-16"></div>{" "}
                        {/* Tag 2 */}
                      </div>
                      <div className="h-8 bg-gray-300 rounded w-1/3"></div>{" "}
                      {/* Action Button */}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : publications.length > 0 ? (
            <>
              <div className="space-y-4">
                {publications.map((pub) => (
                  <div
                    key={pub.id}
                    className="bg-white p-4 border border-gray-200 rounded-md shadow-sm hover:shadow-md transition duration-150 ease-in-out flex flex-col"
                  >
                    <div className="flex-grow">
                      <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">
                        {pub.area || "General Research"}
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-700 cursor-pointer">
                        {/* Link to publication detail page if available */}
                        {pub.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {/* Link to author profile if available */}
                        {/* Prefer owner username, fallback to author string */}
                        By:{" "}
                        <span className="font-medium text-gray-700">
                          {pub.owner?.username ||
                            pub.author ||
                            "Unknown Author"}
                        </span>
                      </p>
                      {/* Display Publication Date */}
                      <p className="text-xs text-gray-500 mb-2 flex items-center">
                        <CalendarDaysIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        Published:{" "}
                        {formatDate(pub.publicationDate || pub.createdAt)}
                      </p>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                        {pub.summary || "No summary available."}
                      </p>

                      {/* Tags and Actions */}
                      <div className="mt-auto pt-3 border-t border-gray-100">
                        {/* --- USE THE HELPER COMPONENT HERE --- */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          <RenderTags tagsData={pub.tags} />
                        </div>
                        {/* --- END OF TAGS CHANGE --- */}

                        {/* Actions */}
                        <div className="flex justify-end items-center">
                          {currentUser?.id !== pub.ownerId ? ( // Check against ownerId from backend
                            <button
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap`}
                              onClick={() =>
                                handleSendRequest(pub.id, pub.title)
                              }
                              disabled={
                                pendingSentRequestPubIds.has(pub.id) ||
                                sendingRequestId === pub.id
                              }
                            >
                              {sendingRequestId === pub.id ? (
                                <svg
                                  className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                              ) : (
                                <UserGroupIcon
                                  className="-ml-0.5 mr-1.5 h-4 w-4"
                                  aria-hidden="true"
                                />
                              )}
                              {sendingRequestId === pub.id
                                ? "Sending..."
                                : pendingSentRequestPubIds.has(pub.id)
                                ? "Request Sent"
                                : "Request Collaboration"}
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-gray-500 italic">
                              Your Publication
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* --- Pagination --- */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 pt-4 border-t border-gray-200 space-x-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoadingPublications}
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {" "}
                    Previous{" "}
                  </button>
                  <span className="text-sm text-gray-700 px-2">
                    {" "}
                    Page {currentPage} of {totalPages}{" "}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={
                      currentPage === totalPages || isLoadingPublications
                    }
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {" "}
                    Next{" "}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12 bg-white rounded-md border border-gray-200 shadow-sm">
              <MagnifyingGlassIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p className="font-semibold text-gray-700">
                No publications found matching your criteria.
              </p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </section>

        {/* Collaboration Requests Sidebar/Column */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Display Request Errors */}
          {errorRequests && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span>{errorRequests}</span>
            </div>
          )}

          {/* Received Requests */}
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2 flex items-center">
              <InboxArrowDownIcon className="h-5 w-5 mr-2 text-gray-500" />
              Received Requests (
              {isLoadingRequests
                ? "..."
                : receivedRequests.filter((r) => r.status === "pending").length}
              ) {/* Show pending count */}
            </h3>
            {isLoadingRequests ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-gray-50 rounded border border-gray-100"
                  >
                    <div className="h-4 bg-gray-200 rounded w-2/5 mb-1.5"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5 mb-2.5"></div>
                    <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>{" "}
                    {/* Message Placeholder */}
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>{" "}
                      {/* Timestamp Placeholder */}
                      <div className="flex space-x-2">
                        <div className="h-5 w-10 bg-gray-300 rounded"></div>
                        <div className="h-5 w-10 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : receivedRequests.length > 0 ? (
              <ul className="space-y-3">
                {receivedRequests.filter((req) => req.status === "pending")
                  .length === 0 &&
                  !isLoadingRequests && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {" "}
                      No pending received requests.{" "}
                    </p>
                  )}
                {/* Only show pending requests prominently */}
                {receivedRequests
                  .filter((req) => req.status === "pending")
                  .map((req) => (
                    <li
                      key={req.id}
                      className="p-2.5 bg-blue-50 border border-blue-200 rounded"
                    >
                      {" "}
                      {/* Highlight pending */}
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-gray-800">
                          From:{" "}
                          <span className="font-semibold">
                            {req.senderName}
                          </span>{" "}
                          {/* Use senderName */}
                        </p>
                        {/* Timestamp */}
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatRelativeTime(req.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        Regarding:{" "}
                        <span className="italic">"{req.publicationTitle}"</span>{" "}
                        {/* Use publicationTitle */}
                      </p>
                      {/* Display Message if present */}
                      {req.message && (
                        <div className="text-xs text-gray-700 bg-white border border-gray-200 p-2 rounded mb-2 flex items-start gap-1.5">
                          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{req.message}</span>
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <button
                          className={`text-xs font-medium text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                            processingRequestId === req.id
                              ? "animate-pulse"
                              : ""
                          }`}
                          onClick={() =>
                            handleRequestActionTrigger(
                              req.id,
                              "accept",
                              req.publicationTitle
                            )
                          }
                          disabled={processingRequestId === req.id}
                          title="Accept Request"
                        >
                          {" "}
                          Accept{" "}
                        </button>
                        <button
                          className={`text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                            processingRequestId === req.id
                              ? "animate-pulse"
                              : ""
                          }`}
                          onClick={() =>
                            handleRequestActionTrigger(
                              req.id,
                              "reject",
                              req.publicationTitle
                            )
                          }
                          disabled={processingRequestId === req.id}
                          title="Reject Request"
                        >
                          {" "}
                          Reject{" "}
                        </button>
                      </div>
                    </li>
                  ))}
                {/* Optionally show non-pending received requests differently or not at all */}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {" "}
                No received requests found.{" "}
              </p>
            )}
          </div>

          {/* Sent Requests */}
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2 flex items-center">
              <SentIcon className="h-5 w-5 mr-2 text-gray-500" />
              Sent Requests ({isLoadingRequests ? "..." : sentRequests.length})
            </h3>
            {isLoadingRequests ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(1)].map((_, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-gray-50 rounded border border-gray-100"
                  >
                    <div className="h-4 bg-gray-200 rounded w-2/5 mb-1.5"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5 mb-2.5"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-12 bg-gray-300 rounded"></div>{" "}
                      {/* Status */}
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>{" "}
                      {/* Timestamp */}
                      <div className="h-5 w-10 bg-gray-300 rounded"></div>{" "}
                      {/* Action */}
                    </div>
                  </div>
                ))}
              </div>
            ) : sentRequests.length > 0 ? (
              <ul className="space-y-3">
                {sentRequests.map((req) => (
                  <li
                    key={req.id}
                    className="p-2.5 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-gray-800">
                        To:{" "}
                        <span className="font-semibold">
                          {req.receiverName}
                        </span>{" "}
                        {/* Use receiverName */}
                      </p>
                      {/* Timestamp */}
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatRelativeTime(req.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Regarding:{" "}
                      <span className="italic">"{req.publicationTitle}"</span>{" "}
                      {/* Use publicationTitle */}
                    </p>
                    <div className="flex justify-between items-center">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : req.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : req.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : req.status === "cancelled"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-gray-100 text-gray-800" // Default/fallback
                        }`}
                      >
                        {req.status === "pending" && (
                          <ClockIcon className="h-3 w-3 mr-1 opacity-75" />
                        )}
                        {req.status}
                      </span>
                      {/* Cancel Action */}
                      {req.status === "pending" && (
                        <button
                          className={`text-xs font-medium text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                            processingRequestId === req.id
                              ? "animate-pulse"
                              : ""
                          }`}
                          onClick={() =>
                            handleRequestActionTrigger(
                              req.id,
                              "cancel",
                              req.publicationTitle
                            )
                          }
                          disabled={processingRequestId === req.id}
                          title="Cancel Request"
                        >
                          {" "}
                          Cancel{" "}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {" "}
                You haven't sent any collaboration requests yet.{" "}
              </p>
            )}
          </div>
        </aside>
      </div>{" "}
      {/* End Main Grid */}
      {/* Add CSS for Animations if not using a library */}
      <style jsx>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
        /* Add styles for line-clamp if not using tailwind plugin */
        .line-clamp-3 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }
      `}</style>
    </div> // End Container
  );
};

export default ExplorePage;
