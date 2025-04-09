// src/Page/Admin/AdminPublicationManagementPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  FaSearch,
  FaTimes,
  FaTrashAlt,
  FaUser,
  FaCalendarAlt,
  FaTag,
  FaFilter,
  FaSort, // Generic sort icon
  FaSortUp,
  FaSortDown,
  FaExternalLinkAlt, // To link to user profile maybe
  FaEye, // To view details
} from "react-icons/fa";

// Common Components (Ensure paths are correct)
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import Notification from "../../Component/Common/Notification";
// You might create a dedicated Pagination component or include logic here
// import PaginationControls from '../../Component/Common/PaginationControls';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ITEMS_PER_PAGE = 15; // Or make this configurable

// Helper Functions
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Basic Date Formatting (Adjust as needed)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
};

// Debounce utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// --- Component ---
const AdminPublicationManagementPage = () => {
  const navigate = useNavigate();

  // --- State ---
  const [publications, setPublications] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General fetch/page error
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [deletingId, setDeletingId] = useState(null); // Track which item is being deleted

  // Search, Filter, Sort State
  const [searchQuery, setSearchQuery] = useState(""); // Input value
  const [searchTerm, setSearchTerm] = useState(""); // Debounced value for API call
  const [filters, setFilters] = useState({
    status: "", // Example: '', 'open', 'closed', 'in_progress'
    // Add other filters like 'area' if needed
  });
  const [sortBy, setSortBy] = useState("createdAt"); // Default sort column
  const [sortOrder, setSortOrder] = useState("desc"); // Default sort order

  // --- Notification Handler ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // --- Data Fetching ---
  const fetchPublications = useCallback(
    async (
      page = 1,
      search = searchTerm,
      currentFilters = filters,
      currentSort = sortBy,
      currentOrder = sortOrder
    ) => {
      setLoading(true);
      setError(null); // Clear previous errors on new fetch

      // Construct query parameters
      const params = new URLSearchParams({
        page: page,
        limit: ITEMS_PER_PAGE,
        sortBy: currentSort,
        sortOrder: currentOrder,
      });
      if (search) params.append("search", search);
      if (currentFilters.status) params.append("status", currentFilters.status);
      // Append other filters if added

      try {
        const url = `${API_BASE_URL}/api/admin/publications?${params.toString()}`;
        const response = await axios.get(url, { headers: getAuthHeaders() });

        if (response.data?.success && response.data.data) {
          setPublications(response.data.data.publications || []);
          setPagination(
            response.data.data.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
            }
          );
        } else {
          throw new Error(
            response.data?.message || "Failed to load publications."
          );
        }
      } catch (err) {
        console.error("Error fetching publications:", err);
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Could not load publications.";
        setError(errMsg);
        setPublications([]); // Clear data on error
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 }); // Reset pagination
        if (err.response?.status === 401 || err.response?.status === 403) {
          showNotification(
            "Session expired or unauthorized. Please log in.",
            "error"
          );
          // Consider redirecting to login
          // setTimeout(() => navigate('/login'), 2000);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, filters, sortBy, sortOrder, navigate, showNotification]
  ); // Include dependencies that trigger re-fetch

  // Debounced search term update
  const debouncedSetSearchTerm = useCallback(debounce(setSearchTerm, 500), []);

  useEffect(() => {
    // Fetch when page loads or critical parameters change
    fetchPublications(
      pagination.currentPage,
      searchTerm,
      filters,
      sortBy,
      sortOrder
    );
    // IMPORTANT: Do NOT include pagination.currentPage in the dependency array
    // if fetchPublications itself updates it based on API response.
    // Only include things that SHOULD trigger a new API call from the user's perspective.
  }, [
    fetchPublications,
    pagination.currentPage,
    searchTerm,
    filters,
    sortBy,
    sortOrder,
  ]); // Correct dependencies

  // --- Handlers ---

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchTerm(value);
    // Reset to page 1 when search changes
    if (pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    if (pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    // Reset to page 1 when filters change
    if (pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  };

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newOrder);
    // Reset to page 1 when sort changes
    if (pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  };

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== pagination.currentPage
    ) {
      // Set the desired page, useEffect will trigger fetchPublications
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleDelete = async (id, title) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the publication "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const url = `${API_BASE_URL}/api/admin/publications/${id}`;
      await axios.delete(url, { headers: getAuthHeaders() });
      showNotification(
        `Publication "${title}" deleted successfully.`,
        "success"
      );
      // Refetch data for the current page after deletion
      fetchPublications(
        pagination.currentPage,
        searchTerm,
        filters,
        sortBy,
        sortOrder
      );
    } catch (err) {
      console.error("Error deleting publication:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not delete publication.";
      showNotification(errMsg, "error");
      setError(errMsg); // Optionally show persistent error too
    } finally {
      setDeletingId(null);
    }
  };

  // --- Render Sort Icons ---
  const renderSortIcon = (column) => {
    if (sortBy !== column) {
      return <FaSort className="inline-block ml-1 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <FaSortUp className="inline-block ml-1 text-blue-600" />
    ) : (
      <FaSortDown className="inline-block ml-1 text-blue-600" />
    );
  };

  // --- Render ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
        Manage Publications
      </h1>

      {/* Notification Area */}
      <div className="fixed top-20 right-5 z-50 w-full max-w-sm">
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        />
      </div>

      {/* Display general errors */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Controls: Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search title, author, summary..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-600"
              aria-label="Clear search"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <FaFilter
            className="h-4 w-4 text-gray-500"
            title="Filter by Status"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
            aria-label="Filter by collaboration status"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Publication Table Area */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        {loading && publications.length === 0 ? (
          // Initial Load Skeleton (Optional: more detailed skeleton)
          <div className="p-6 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-gray-500">Loading publications...</p>
          </div>
        ) : !loading && publications.length === 0 ? (
          // Empty State
          <div className="p-6 text-center text-gray-500">
            No publications found matching your criteria.
          </div>
        ) : (
          // Table
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Add more columns as needed */}
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("title")}
                >
                  Title {renderSortIcon("title")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("user.name")}
                >
                  {" "}
                  {/* Adjust field name based on API */}
                  Author {renderSortIcon("user.name")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("publicationDate")}
                >
                  Date {renderSortIcon("publicationDate")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("collaborationStatus")}
                >
                  Status {renderSortIcon("collaborationStatus")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`bg-white divide-y divide-gray-200 ${
                loading ? "opacity-50 transition-opacity" : ""
              }`}
            >
              {publications.map((pub) => (
                <tr key={pub.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div
                      className="text-sm font-medium text-gray-900 truncate w-60"
                      title={pub.title}
                    >
                      {pub.title || "N/A"}
                    </div>
                    {/* Optional: Show tags or area */}
                    {/* <div className="text-xs text-gray-500">{pub.area || ''}</div> */}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {/* Adjust according to your user data structure */}
                    <div className="text-sm text-gray-900">
                      {pub.user?.name || pub.author || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pub.user?.email || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(pub.publicationDate || pub.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {/* Add status badge styling if desired */}
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pub.collaborationStatus === "open"
                          ? "bg-green-100 text-green-800"
                          : pub.collaborationStatus === "in_progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : pub.collaborationStatus === "closed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {pub.collaborationStatus?.replace("_", " ") || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* Action Buttons */}
                    <button
                      onClick={() => navigate(`/publications/edit/${pub.id}`)} // Example: Link to standard edit page (maybe disable for admin?)
                      title="View/Edit Publication Details"
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                      // disabled={true} // Example: Maybe admin can't edit content directly here
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/admin/users/${pub.user?.id}`} // Example: Link to the user's admin page
                      title={`View User: ${pub.user?.name || ""}`}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <FaUser className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(pub.id, pub.title)}
                      disabled={deletingId === pub.id}
                      title="Delete Publication"
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                    >
                      {deletingId === pub.id ? (
                        <LoadingSpinner size="xs" color="text-red-600" />
                      ) : (
                        <FaTrashAlt className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && publications.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {(pagination.currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>
            to{" "}
            <span className="font-medium">
              {Math.min(
                pagination.currentPage * ITEMS_PER_PAGE,
                pagination.totalItems
              )}
            </span>{" "}
            of <span className="font-medium">{pagination.totalItems}</span>{" "}
            results
          </span>
          <div>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="relative inline-flex items-center px-3 py-1.5 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {/* Optional: Add page number display/input */}
            {/* <span className="px-3 py-1.5 border-t border-b border-gray-300 bg-white text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span> */}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage >= pagination.totalPages || loading
              }
              className="relative -ml-px inline-flex items-center px-3 py-1.5 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPublicationManagementPage;
