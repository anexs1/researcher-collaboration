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
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  LockClosedIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { formatDistanceToNow, parseISO } from "date-fns";

// --- API Client Setup ---
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

// --- Utility Functions ---
const researchAreas = [
  "All Disciplines",
  "Computer Science",
  "Biology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Engineering",
  "Medicine",
  "Psychology",
  "Economics",
  "Sociology",
];

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const formatDate = (dateString) => {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid date";
  }
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "some time ago";
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch (e) {
    return "some time ago";
  }
};

const RenderTags = ({ tagsData }) => {
  if (!tagsData || !tagsData.length) return null;
  return tagsData.map((tag, index) => (
    <span
      key={index}
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
    >
      {tag}
    </span>
  ));
};

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

  const [userSentRequestPubIds, setUserSentRequestPubIds] = useState(new Set());

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("All Disciplines");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    action: null,
    targetId: null,
    itemTitle: null,
  });
  const [notification, setNotification] = useState(null);

  // --- Handlers ---
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const closeConfirmationModal = () => {
    setConfirmModalState({
      isOpen: false,
      action: null,
      targetId: null,
      itemTitle: null,
    });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const debouncedSearchHandler = useCallback(
    debounce(handleSearchChange, 500),
    []
  );

  const handleRequestActionTrigger = (requestId, action, publicationTitle) => {
    setConfirmModalState({
      isOpen: true,
      action,
      targetId: requestId,
      itemTitle: publicationTitle,
    });
  };

  // --- Data Fetching ---
  const fetchPublications = useCallback(
    async (signal) => {
      setIsLoadingPublications(true);
      setErrorPublications(null);
      try {
        const params = {
          search: searchTerm || undefined,
          area: selectedArea === "All Disciplines" ? undefined : selectedArea,
          sortBy: sortBy,
          page: currentPage,
          limit: itemsPerPage,
        };
        Object.keys(params).forEach(
          (key) => params[key] === undefined && delete params[key]
        );

        const response = await apiClient.get("/publications/explore", {
          params,
          signal,
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
          console.error("Error fetching publications:", error);
          const errorMsg =
            error.response?.data?.message ||
            error.message ||
            "Could not load publications.";
          setErrorPublications(errorMsg);
          setPublications([]);
          setTotalPages(1);
          setTotalItems(0);
          if (error.response?.status === 401) {
            console.warn("Unauthorized: Redirecting to login might be needed.");
          }
        }
      } finally {
        if (!signal?.aborted) setIsLoadingPublications(false);
      }
    },
    [searchTerm, selectedArea, sortBy, currentPage, itemsPerPage]
  );

  const fetchRequests = useCallback(async (signal) => {
    setIsLoadingRequests(true);
    setErrorRequests(null);
    let receivedError = null;
    let sentError = null;
    let tempReceived = [];
    let tempSent = [];
    const sentPubIds = new Set();

    try {
      const results = await Promise.allSettled([
        apiClient.get("/collaboration-requests/received", { signal }),
        apiClient.get("/collaboration-requests/sent", { signal }),
      ]);

      // Process Received
      if (results[0].status === "fulfilled" && results[0].value.data?.success) {
        tempReceived = results[0].value.data.data || [];
      } else {
        receivedError =
          results[0].reason?.response?.data?.message ||
          results[0].reason?.message ||
          "Error fetching received requests";
      }

      // Process Sent
      if (results[1].status === "fulfilled" && results[1].value.data?.success) {
        tempSent = results[1].value.data.data || [];
        tempSent.forEach((req) => {
          if (req.status === "pending" || req.status === "accepted") {
            sentPubIds.add(req.publicationId);
          }
        });
      } else {
        sentError =
          results[1].reason?.response?.data?.message ||
          results[1].reason?.message ||
          "Error fetching sent requests";
      }

      setReceivedRequests(tempReceived);
      setSentRequests(tempSent);
      setUserSentRequestPubIds(sentPubIds);

      const combinedError = [receivedError, sentError]
        .filter(Boolean)
        .join("; ");
      if (combinedError) setErrorRequests(combinedError);
    } catch (error) {
      if (error.name !== "CanceledError") {
        setErrorRequests(
          error.message || "Could not load collaboration requests."
        );
      }
    } finally {
      if (!signal?.aborted) setIsLoadingRequests(false);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    const controller = new AbortController();
    if (currentUser?.id) {
      fetchPublications(controller.signal);
      fetchRequests(controller.signal);
    } else {
      setIsLoadingPublications(false);
      setIsLoadingRequests(false);
      setErrorPublications("Please log in to view publications and requests.");
      setPublications([]);
      setReceivedRequests([]);
      setSentRequests([]);
    }
    return () => controller.abort();
  }, [fetchPublications, fetchRequests, currentUser?.id]);

  // --- Action Handlers ---
  const handleSendRequest = async (publicationId, publicationTitle) => {
    if (userSentRequestPubIds.has(publicationId)) return;
    setSendingRequestId(publicationId);
    try {
      const response = await apiClient.post("/collaboration-requests", {
        publicationId,
      });
      if (response.data?.success) {
        showNotification(
          `Collaboration request sent for "${publicationTitle}".`,
          "success"
        );
        if (response.data.data) {
          const newReq = {
            ...response.data.data,
            receiverName: response.data.data.receiver?.username || "Unknown",
            publicationTitle:
              response.data.data.publication?.title || "Unknown",
          };
          setSentRequests((prev) => [newReq, ...prev]);
          setUserSentRequestPubIds((prev) => new Set(prev).add(publicationId));
        } else {
          fetchRequests();
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

    const url = `/collaboration-requests/${targetId}/${action}`;

    try {
      let response;
      if (action === "accept" || action === "reject" || action === "cancel") {
        response = await apiClient.patch(url);
      } else {
        throw new Error("Invalid action type");
      }

      if (response.data?.success) {
        const successMessages = {
          accept: `Request accepted for "${itemTitle}".`,
          reject: `Request rejected for "${itemTitle}".`,
          cancel: `Request cancelled for "${itemTitle}".`,
        };
        showNotification(
          successMessages[action] || `Request ${action}ed successfully.`,
          "success"
        );

        fetchRequests();

        if (action === "accept" && response.data.updatedPublication) {
          const updatedPubData = response.data.updatedPublication;
          console.log(
            "Accept succeeded, updating publication state:",
            updatedPubData
          );
          setPublications((prevPubs) =>
            prevPubs.map((p) =>
              p.id === updatedPubData.id
                ? {
                    ...p,
                    approvedCollaboratorsCount:
                      updatedPubData.approvedCollaboratorsCount,
                    collaborationStatus: updatedPubData.collaborationStatus,
                  }
                : p
            )
          );
          if (
            updatedPubData.collaborationStatus === "full" ||
            updatedPubData.collaborationStatus === "active"
          ) {
            showNotification(
              `Collaboration for "${itemTitle}" is now ${updatedPubData.collaborationStatus}!`,
              "info"
            );
          }
        }
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
      if (error.response?.status === 401) {
        console.warn("Unauthorized action.");
      }
    } finally {
      setProcessingRequestId(null);
    }
  };

  // --- Helper to get Button Text/State based on Publication and User ---
  const getCollaborationButtonState = (pub) => {
    if (!currentUser || currentUser.id === pub.ownerId) {
      return { text: "Your Publication", disabled: true, icon: null };
    }
    if (sendingRequestId === pub.id) {
      return { text: "Sending...", disabled: true, icon: "loading" };
    }
    if (userSentRequestPubIds.has(pub.id)) {
      const sentReq = sentRequests.find((r) => r.publicationId === pub.id);
      if (sentReq?.status === "accepted") {
        return {
          text: "Request Accepted",
          disabled: true,
          icon: CheckCircleIcon,
        };
      }
      return { text: "Request Sent", disabled: true, icon: SentIcon };
    }

    switch (pub.collaborationStatus) {
      case "full":
        return {
          text: "Collaboration Full",
          disabled: true,
          icon: LockClosedIcon,
        };
      case "active":
        return {
          text: "View Collaboration",
          disabled: false,
          icon: CheckBadgeIcon,
          action: () => console.log("Navigate to collab page for", pub.id),
        };
      case "closed":
        return {
          text: "Collaboration Closed",
          disabled: true,
          icon: LockClosedIcon,
        };
      case "recruiting":
        if (
          pub.collaboratorsNeeded > 0 &&
          (pub.approvedCollaboratorsCount ?? 0) >= pub.collaboratorsNeeded
        ) {
          return {
            text: "Collaboration Full",
            disabled: true,
            icon: LockClosedIcon,
          };
        }
        return {
          text: "Request Collaboration",
          disabled: false,
          icon: UserGroupIcon,
        };
      default:
        return { text: "Status Unknown", disabled: true, icon: null };
    }
  };

  // --- Render ---
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Notifications */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
            notification.type === "error"
              ? "bg-red-100 border-red-400 text-red-700"
              : notification.type === "success"
              ? "bg-green-100 border-green-400 text-green-700"
              : "bg-blue-100 border-blue-400 text-blue-700"
          } border`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === "error" ? (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              ) : notification.type === "success" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={clearNotification}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalState.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm {confirmModalState.action}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to {confirmModalState.action} the request
              for "{confirmModalState.itemTitle}"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmationModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRequestAction}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  confirmModalState.action === "reject" ||
                  confirmModalState.action === "cancel"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={processingRequestId === confirmModalState.targetId}
              >
                {processingRequestId === confirmModalState.targetId ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                    Processing...
                  </>
                ) : (
                  confirmModalState.action.charAt(0).toUpperCase() +
                  confirmModalState.action.slice(1)
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          Explore Research Collaborations
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Discover open research projects and connect with researchers worldwide
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 p-4 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Title, keywords..."
                onChange={debouncedSearchHandler}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="area"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Research Area
            </label>
            <select
              id="area"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              {researchAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="sort"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sort By
            </label>
            <select
              id="sort"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="collaborators_asc">Fewest Collaborators</option>
              <option value="collaborators_desc">Most Collaborators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Login Prompt */}
      {!currentUser?.id && !isLoadingPublications && (
        <div className="text-center text-red-600 py-12 bg-red-50 rounded-md border border-red-200 shadow-sm">
          <XCircleIcon className="mx-auto h-10 w-10 text-red-400 mb-2" />
          <p className="font-semibold">Authentication Required</p>
          <p className="text-sm mt-1">
            Please log in to explore publications and manage collaboration
            requests.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Publications List */}
        <section className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-1 text-gray-800 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
            Research Feed
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Showing {isLoadingPublications ? "..." : publications.length} of{" "}
            {isLoadingPublications ? "..." : totalItems} results.
            {!isLoadingPublications &&
              totalPages > 1 &&
              ` Page ${currentPage} of ${totalPages}.`}
          </p>

          {errorPublications && !isLoadingPublications && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorPublications}</p>
                </div>
              </div>
            </div>
          )}

          {isLoadingPublications ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white p-4 border border-gray-200 rounded-md shadow-sm animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <div className="h-4 bg-gray-200 rounded w-10"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : publications.length > 0 ? (
            <>
              <div className="space-y-4">
                {publications.map((pub) => {
                  const buttonState = getCollaborationButtonState(pub);

                  return (
                    <div
                      key={pub.id}
                      className="bg-white p-4 border border-gray-200 rounded-md shadow-sm hover:shadow-md transition duration-150 ease-in-out flex flex-col"
                    >
                      <div className="flex-grow">
                        <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-1">
                          {pub.area || "General"}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-700 cursor-pointer">
                          {pub.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          By:{" "}
                          <span className="font-medium text-gray-700">
                            {pub.owner?.username || "Unknown Author"}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mb-2 flex items-center">
                          <CalendarDaysIcon className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          Published:{" "}
                          {formatDate(pub.publicationDate || pub.createdAt)}
                        </p>

                        {pub.collaboratorsNeeded > 0 && (
                          <div className="mt-1 mb-3 text-sm text-gray-600 flex items-center flex-wrap gap-x-4 gap-y-1">
                            <div
                              className="flex items-center"
                              title="Collaborators Status"
                            >
                              <UserGroupIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                              <span>
                                <span className="font-medium">
                                  {pub.approvedCollaboratorsCount ?? 0} /{" "}
                                  {pub.collaboratorsNeeded}
                                </span>{" "}
                                Collaborators
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                pub.collaborationStatus === "recruiting"
                                  ? "bg-blue-100 text-blue-800"
                                  : pub.collaborationStatus === "full"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : pub.collaborationStatus === "active"
                                  ? "bg-green-100 text-green-800"
                                  : pub.collaborationStatus === "closed"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                              title={`Status: ${pub.collaborationStatus}`}
                            >
                              {pub.collaborationStatus === "recruiting" && (
                                <ClockIcon className="h-3 w-3 mr-1 opacity-75" />
                              )}
                              {pub.collaborationStatus === "full" && (
                                <LockClosedIcon className="h-3 w-3 mr-1 opacity-75" />
                              )}
                              {pub.collaborationStatus === "active" && (
                                <CheckBadgeIcon className="h-3 w-3 mr-1 opacity-75" />
                              )}
                              {pub.collaborationStatus === "closed" && (
                                <XCircleIcon className="h-3 w-3 mr-1 opacity-75" />
                              )}
                              {pub.collaborationStatus === "full"
                                ? "Ready to Start"
                                : pub.collaborationStatus}
                            </span>
                          </div>
                        )}

                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                          {pub.summary || "No summary available."}
                        </p>

                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1 mb-3">
                            <RenderTags tagsData={pub.tags} />
                          </div>
                          <div className="flex justify-end items-center">
                            {currentUser?.id === pub.ownerId ? (
                              <span className="text-xs font-medium text-gray-500 italic">
                                Your Publication
                              </span>
                            ) : (
                              <button
                                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition whitespace-nowrap ${
                                  buttonState.disabled
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : buttonState.action
                                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                                onClick={() => {
                                  if (buttonState.action) {
                                    buttonState.action();
                                  } else if (
                                    !buttonState.disabled &&
                                    buttonState.icon === UserGroupIcon
                                  ) {
                                    handleSendRequest(pub.id, pub.title);
                                  }
                                }}
                                disabled={
                                  buttonState.disabled ||
                                  buttonState.icon === "loading"
                                }
                              >
                                {buttonState.icon === "loading" ? (
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
                                ) : buttonState.icon ? (
                                  <buttonState.icon
                                    className="-ml-0.5 mr-1.5 h-4 w-4"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                {buttonState.text}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-12 bg-white rounded-md border border-gray-200 shadow-sm">
              <DocumentTextIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p className="font-semibold">No publications found</p>
              <p className="text-sm mt-1">
                {errorPublications
                  ? "Error loading publications"
                  : "Try adjusting your search filters"}
              </p>
            </div>
          )}
        </section>

        {/* Collaboration Requests Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {errorRequests && !isLoadingRequests && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorRequests}</p>
                </div>
              </div>
            </div>
          )}

          {/* Received Requests */}
          <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2 flex items-center">
              <InboxArrowDownIcon className="h-5 w-5 mr-2 text-gray-500" />
              Received (Pending:{" "}
              {isLoadingRequests
                ? "..."
                : receivedRequests.filter((r) => r.status === "pending").length}
              )
            </h3>
            {isLoadingRequests ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-blue-50 border border-blue-200 rounded"
                  >
                    <div className="h-4 bg-blue-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-blue-100 rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-blue-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : receivedRequests.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {receivedRequests.filter((req) => req.status === "pending")
                  .length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No pending received requests.
                  </p>
                )}
                {receivedRequests
                  .filter((req) => req.status === "pending")
                  .map((req) => (
                    <li
                      key={req.id}
                      className="p-2.5 bg-blue-50 border border-blue-200 rounded"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-gray-800">
                          From:{" "}
                          <span className="font-semibold">
                            {req.senderName || "..."}
                          </span>
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatRelativeTime(req.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        Regarding:{" "}
                        <span className="italic">
                          "{req.publicationTitle || "..."}"
                        </span>
                      </p>
                      {req.message && (
                        <div className="text-xs text-gray-700 bg-white border border-gray-200 p-2 rounded mb-2 flex items-start gap-1.5">
                          <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{req.message}</span>
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            handleRequestActionTrigger(
                              req.id,
                              "accept",
                              req.publicationTitle
                            )
                          }
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRequestActionTrigger(
                              req.id,
                              "reject",
                              req.publicationTitle
                            )
                          }
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                {receivedRequests.filter((req) => req.status !== "pending")
                  .length > 0 && (
                  <>
                    <li className="pt-3 mt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-400 font-medium uppercase text-center">
                        History
                      </p>
                    </li>
                    {receivedRequests
                      .filter((req) => req.status !== "pending")
                      .map((req) => (
                        <li key={req.id} className="p-2 opacity-70">
                          <p className="text-xs text-gray-700">
                            Request from{" "}
                            <span className="font-medium">
                              {req.senderName}
                            </span>{" "}
                            regarding "{req.publicationTitle}" was{" "}
                            <span className="font-semibold">{req.status}</span>{" "}
                            {formatRelativeTime(req.updatedAt)}.
                          </p>
                        </li>
                      ))}
                  </>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No received requests found.
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
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded"
                  >
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : sentRequests.length > 0 ? (
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {sentRequests.map((req) => (
                  <li
                    key={req.id}
                    className="p-2.5 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-gray-800">
                        To:{" "}
                        <span className="font-semibold">
                          {req.receiverName || "..."}
                        </span>
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatRelativeTime(req.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      Regarding:{" "}
                      <span className="italic">
                        "{req.publicationTitle || "..."}"
                      </span>
                    </p>
                    <div className="flex justify-between items-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : req.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : req.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : req.status === "canceled"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {req.status === "pending" && (
                          <ClockIcon className="h-3 w-3 mr-1 opacity-75" />
                        )}
                        {req.status === "accepted" && (
                          <CheckCircleIcon className="h-3 w-3 mr-1 opacity-75" />
                        )}
                        {req.status === "rejected" && (
                          <XCircleIcon className="h-3 w-3 mr-1 opacity-75" />
                        )}
                        {req.status.charAt(0).toUpperCase() +
                          req.status.slice(1)}
                      </span>
                      {req.status === "pending" && (
                        <button
                          onClick={() =>
                            handleRequestActionTrigger(
                              req.id,
                              "cancel",
                              req.publicationTitle
                            )
                          }
                          className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                      )}
                      {req.status === "accepted" && (
                        <span className="text-xs text-green-600">Accepted</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                You haven't sent any requests.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* CSS for Animations */}
      <style jsx>{`
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ExplorePage;
