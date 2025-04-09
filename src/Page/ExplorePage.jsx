import React, { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios"; // Import axios
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BarsArrowUpIcon,
  // Import icons for notifications/modals if using separate components
  // CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon
} from "@heroicons/react/24/solid";

// --- API Client Setup (Recommended) ---
// It's best practice to create a dedicated API client instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api", // Adjust baseURL
});

// Add a request interceptor to include the token
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

// Define research areas (could also be fetched from backend)
const researchAreas = [
  "All",
  "Computer Science",
  "Physics",
  "Engineering",
  "Biology",
  "Health", // Added from data
  "Ethics", // Added from data
];

const ExplorePage = ({ currentUser }) => {
  // --- State ---
  const [publications, setPublications] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [isLoadingPublications, setIsLoadingPublications] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [errorPublications, setErrorPublications] = useState(null);
  const [errorRequests, setErrorRequests] = useState(null);

  // Action-specific loading states (store ID of item being processed)
  const [sendingRequestId, setSendingRequestId] = useState(null); // For Send Request button
  const [processingRequestId, setProcessingRequestId] = useState(null); // For Accept/Reject/Cancel

  // Keep track of requests the user has already sent (optional, helps disable button immediately)
  const [pendingSentRequestPubIds, setPendingSentRequestPubIds] = useState(
    new Set()
  );

  // Filters and Sorting State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Total matching publications

  // Modal and Notification State
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    action: null,
    message: "",
    targetId: null,
  });
  const [notification, setNotification] = useState(null);

  // --- Handlers ---
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000); // Auto-clear after 4s
  };

  const closeConfirmationModal = () => {
    setConfirmModalState({
      isOpen: false,
      action: null,
      message: "",
      targetId: null,
    });
  };

  const clearNotification = () => setNotification(null); // Manual clear

  // Debounce search input (optional but recommended for performance)
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const debouncedSearchChange = useCallback(
    debounce(handleSearchChange, 500),
    []
  );

  // --- Data Fetching ---

  // Fetch Publications based on filters/sort/page
  const fetchPublications = useCallback(
    async (abortSignal) => {
      setIsLoadingPublications(true);
      setErrorPublications(null);
      try {
        const params = {
          search: searchTerm,
          area: selectedArea,
          sortBy: sortBy,
          page: currentPage,
          limit: 9, // Adjust limit as needed (e.g., 3x3 grid)
        };
        const response = await apiClient.get("/publications/explore", {
          params,
          signal: abortSignal, // Pass the abort signal
        });

        if (response.data?.success) {
          setPublications(response.data.data || []);
          setTotalPages(response.data.totalPages || 1);
          setTotalItems(response.data.totalItems || 0);
        } else {
          throw new Error(
            response.data?.message || "Failed to fetch publications"
          );
        }
      } catch (error) {
        if (error.name !== "CanceledError") {
          // Don't show error if request was cancelled
          console.error("Error fetching publications:", error);
          setErrorPublications(
            error.response?.data?.message ||
              error.message ||
              "Could not load publications."
          );
          setPublications([]); // Clear publications on error
          setTotalPages(1);
          setTotalItems(0);
        }
      } finally {
        if (!abortSignal || !abortSignal.aborted) {
          setIsLoadingPublications(false);
        }
      }
    },
    [searchTerm, selectedArea, sortBy, currentPage]
  ); // Dependencies for refetching

  // Fetch user's collaboration requests
  const fetchRequests = useCallback(async (abortSignal) => {
    setIsLoadingRequests(true);
    setErrorRequests(null);
    setPendingSentRequestPubIds(new Set()); // Reset pending set on fetch

    try {
      // Fetch received and sent requests concurrently
      const [receivedRes, sentRes] = await Promise.all([
        apiClient.get("/collaboration-requests/received", {
          signal: abortSignal,
        }),
        apiClient.get("/collaboration-requests/sent", { signal: abortSignal }),
      ]);

      if (receivedRes.data?.success) {
        setReceivedRequests(receivedRes.data.data || []);
      } else {
        throw new Error(
          receivedRes.data?.message || "Failed to fetch received requests"
        );
      }
      if (sentRes.data?.success) {
        setSentRequests(sentRes.data.data || []);
        const pendingPubIds = new Set();
        (sentRes.data.data || []).forEach((req) => {
          if (req.status === "pending") {
            pendingPubIds.add(req.publicationId);
          }
        });
        setPendingSentRequestPubIds(pendingPubIds);
      } else {
        throw new Error(
          sentRes.data?.message || "Failed to fetch sent requests"
        );
      }
    } catch (error) {
      if (error.name !== "CanceledError") {
        console.error("Error fetching requests:", error);
        setErrorRequests(
          error.response?.data?.message ||
            error.message ||
            "Could not load collaboration requests."
        );
        setReceivedRequests([]);
        setSentRequests([]);
      }
    } finally {
      if (!abortSignal || !abortSignal.aborted) {
        setIsLoadingRequests(false);
      }
    }
  }, []); // Fetch requests typically once or when actions occur

  // --- Effects ---
  useEffect(() => {
    const abortController = new AbortController();
    fetchPublications(abortController.signal);
    // Cleanup function to cancel request if component unmounts or dependencies change
    return () => abortController.abort();
  }, [fetchPublications]); // fetchPublications is stable due to useCallback

  useEffect(() => {
    const abortController = new AbortController();
    fetchRequests(abortController.signal);
    // Cleanup function
    return () => abortController.abort();
  }, [fetchRequests]); // fetchRequests is stable due to useCallback

  // --- Action Handlers (with API calls) ---

  const handleSendRequest = async (publicationId, publicationTitle) => {
    setSendingRequestId(publicationId); // Set loading state for this button
    try {
      const response = await apiClient.post("/collaboration-requests", {
        publicationId,
      });
      if (response.data?.success) {
        showNotification(`Request sent for "${publicationTitle}"!`, "success");
        // Add to local pending set immediately for UI feedback
        setPendingSentRequestPubIds((prev) => new Set(prev).add(publicationId));
        // Optionally refetch sent requests to get the official status, or rely on local set
        // fetchRequests(); // Could refetch, but might be overkill
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
      setSendingRequestId(null); // Clear loading state for this button
    }
  };

  const handleConfirmRequestAction = async () => {
    const { action, targetId } = confirmModalState;
    if (!action || !targetId) return;

    setProcessingRequestId(targetId); // Set loading state for this request item
    closeConfirmationModal(); // Close modal immediately

    let url = `/collaboration-requests/${targetId}/${action}`; // e.g., /123/accept

    try {
      const response = await apiClient.patch(url); // Use PATCH for updates
      if (response.data?.success) {
        showNotification(`Request ${action}ed successfully!`, "success");
        // Refetch requests to update lists after action
        fetchRequests(); // Refetch both lists
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
      setProcessingRequestId(null); // Clear loading state for this item
    }
  };

  // Trigger opening the confirmation modal
  const handleRequestActionTrigger = (requestId, actionType) => {
    let message = `Are you sure you want to ${actionType} this request?`;
    if (actionType === "accept") message = "Accept this collaboration request?";
    if (actionType === "reject") message = "Reject this collaboration request?";
    if (actionType === "cancel")
      message = "Cancel your sent collaboration request?";

    setConfirmModalState({
      isOpen: true,
      action: actionType,
      message: message,
      targetId: requestId,
    });
  };

  // --- Render ---
  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-100 min-h-screen">
      {/* Notification Area (Consider a dedicated component) */}
      {notification && (
        <div
          className={`fixed top-5 right-5 p-4 rounded shadow-lg text-white ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } z-50`}
        >
          {notification.message}
          <button onClick={clearNotification} className="ml-4 font-bold">
            X
          </button>
        </div>
      )}

      {/* Confirmation Modal (Consider a dedicated component) */}
      {confirmModalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="mb-6">{confirmModalState.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmationModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                {" "}
                Cancel{" "}
              </button>
              <button
                onClick={handleConfirmRequestAction} // This now calls the async handler
                className={`px-4 py-2 text-white rounded transition ${
                  confirmModalState.action === "reject" ||
                  confirmModalState.action === "cancel"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } disabled:opacity-50`}
                // Disable button while processing THIS specific request
                disabled={processingRequestId === confirmModalState.targetId}
              >
                {processingRequestId === confirmModalState.targetId
                  ? "Processing..."
                  : `Confirm ${confirmModalState.action}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 md:mb-0">
          Explore Research
        </h1>
      </div>

      {/* Filters & Sorting */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Search */}
          <div className="relative col-span-1 md:col-span-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                id="search"
                defaultValue={searchTerm} // Use defaultValue with debounced onChange
                onChange={debouncedSearchChange} // Use debounced handler
                placeholder="Keywords, title, author..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Filter by Area */}
          <div className="col-span-1 md:col-span-1">
            <label
              htmlFor="area"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Research Area
            </label>
            <select
              id="area"
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setCurrentPage(1);
              }} // Reset page on change
              className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {researchAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="col-span-1 md:col-span-1">
            <label
              htmlFor="sort"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }} // Reset page on change
              className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Display Errors */}
      {errorPublications && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          {errorPublications}
        </div>
      )}
      {errorRequests && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          {errorRequests}
        </div>
      )}

      {/* Publications Section */}
      <section className="mb-12">
        <h2 className="text-xl md:text-2xl font-semibold mb-1 text-gray-700">
          {" "}
          Available Publications{" "}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Showing {publications.length} of {totalItems} matching publications
        </p>

        {isLoadingPublications ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Skeleton Loader Example (repeat 3-6 times) */}
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white p-5 shadow rounded-lg animate-pulse"
              >
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-300 rounded w-full mb-4"></div>
                <div className="flex flex-wrap gap-1 mb-4">
                  <div className="h-4 bg-gray-300 rounded-full w-12"></div>
                  <div className="h-4 bg-gray-300 rounded-full w-16"></div>
                </div>
                <div className="h-10 bg-gray-400 rounded w-full mt-auto"></div>
              </div>
            ))}
          </div>
        ) : publications.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publications.map((pub) => (
                <div
                  key={pub.id}
                  className="bg-white p-5 shadow rounded-lg hover:shadow-xl transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      {pub.area || "N/A"}
                    </span>
                    <h3 className="text-lg font-bold mt-1 mb-2 text-gray-800">
                      {pub.title}
                    </h3>
                    {/* Display fetched owner username or fallback to author string */}
                    <p className="text-sm text-gray-600 mb-2">
                      By: {pub.owner?.username || pub.author}
                    </p>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                      {pub.summary}
                    </p>{" "}
                    {/* Limit summary lines */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(pub.tags || []).map(
                        (
                          tag,
                          index // Handle null tags
                        ) => (
                          <span
                            key={`${tag}-${index}`}
                            className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <button
                    className={`w-full mt-auto bg-blue-500 text-white px-4 py-2 rounded font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={() => handleSendRequest(pub.id, pub.title)}
                    disabled={
                      pendingSentRequestPubIds.has(pub.id) || // Check if request is known to be pending
                      sendingRequestId === pub.id || // Check if THIS button is loading
                      currentUser?.id === pub.ownerId // Check if current user is the owner
                    }
                  >
                    {sendingRequestId === pub.id
                      ? "Sending..."
                      : pendingSentRequestPubIds.has(pub.id)
                      ? "Request Pending"
                      : "Send Collaboration Request"}
                  </button>
                </div>
              ))}
            </div>
            {/* --- Pagination Controls --- */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoadingPublications}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-400"
                >
                  {" "}
                  Previous{" "}
                </button>
                <span className="text-gray-700">
                  {" "}
                  Page {currentPage} of {totalPages}{" "}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || isLoadingPublications}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-400"
                >
                  {" "}
                  Next{" "}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 py-10 bg-white rounded-md shadow-sm">
            <p className="font-semibold">
              No publications match your criteria.
            </p>
            <p className="text-sm mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </section>

      {/* Requests Section */}
      <section>
        <h2 className="text-xl md:text-2xl font-semibold mb-5 text-gray-700">
          {" "}
          Your Collaboration Requests{" "}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* RECEIVED */}
          <div className="bg-white p-5 rounded-lg shadow-md min-h-[200px] flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
              {" "}
              Received Requests{" "}
            </h3>
            {isLoadingRequests ? (
              <div className="space-y-3 flex-grow animate-pulse pt-2">
                {/* Skeleton */}
                <div className="p-3 bg-gray-100 rounded flex justify-between items-center">
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-48"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-12 bg-gray-300 rounded"></div>
                    <div className="h-6 w-12 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="p-3 bg-gray-100 rounded flex justify-between items-center">
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-40"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-12 bg-gray-300 rounded"></div>
                    <div className="h-6 w-12 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ) : receivedRequests.length > 0 ? (
              <ul className="space-y-3 flex-grow">
                {receivedRequests.map((req) => (
                  <li
                    key={req.id}
                    className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">
                        From: {req.senderName}
                      </span>
                      <p className="text-sm text-gray-600">
                        {" "}
                        Regarding: "
                        {req.publicationTitle || "Unknown Publication"}"{" "}
                      </p>
                    </div>
                    <div className="space-x-2 flex-shrink-0">
                      <button
                        className={`text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={() =>
                          handleRequestActionTrigger(req.id, "accept")
                        }
                        disabled={processingRequestId === req.id}
                      >
                        {processingRequestId === req.id &&
                        confirmModalState.action === "accept"
                          ? "Accepting..."
                          : "Accept"}
                      </button>
                      <button
                        className={`text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={() =>
                          handleRequestActionTrigger(req.id, "reject")
                        }
                        disabled={processingRequestId === req.id}
                      >
                        {processingRequestId === req.id &&
                        confirmModalState.action === "reject"
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 flex-grow flex items-center justify-center">
                {" "}
                No received requests.{" "}
              </p>
            )}
          </div>

          {/* SENT */}
          <div className="bg-white p-5 rounded-lg shadow-md min-h-[200px] flex flex-col">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
              {" "}
              Sent Requests{" "}
            </h3>
            {isLoadingRequests ? (
              <div className="space-y-3 flex-grow animate-pulse pt-2">
                {/* Skeleton */}
                <div className="p-3 bg-gray-100 rounded flex justify-between items-center">
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-48"></div>
                  </div>
                  <div className="h-6 w-12 bg-gray-300 rounded"></div>
                </div>
              </div>
            ) : sentRequests.length > 0 ? (
              <ul className="space-y-3 flex-grow">
                {sentRequests.map((req) => (
                  <li
                    key={req.id}
                    className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">
                        To: {req.receiverName || "Unknown"}
                      </span>
                      <p className="text-sm text-gray-600">
                        {" "}
                        Regarding: "
                        {req.publicationTitle || "Unknown Publication"}"{" "}
                      </p>
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ml-2 ${
                          req.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : req.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : req.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : req.status === "cancelled"
                            ? "bg-gray-200 text-gray-700"
                            : ""
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    {/* Only allow cancelling PENDING requests */}
                    {req.status === "pending" && (
                      <button
                        className={`text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={() =>
                          handleRequestActionTrigger(req.id, "cancel")
                        }
                        disabled={processingRequestId === req.id}
                      >
                        {processingRequestId === req.id &&
                        confirmModalState.action === "cancel"
                          ? "Cancelling..."
                          : "Cancel"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 flex-grow flex items-center justify-center">
                {" "}
                You haven't sent any requests yet.{" "}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExplorePage;
