// src/Page/Admin/AdminPublicationManagementPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash"; // Ensure lodash is installed: npm install lodash
import {
  FaSearch, // For search input
  FaTimes, // For clear search button
  FaTrashAlt, // For delete button
  FaUser, // For owner link / manage user
  FaCalendarAlt, // For dates
  FaFilter, // For filter section (if you add an icon there)
  FaSort, // For sort icon base
  FaSortUp, // For sort up icon
  FaSortDown, // For sort down icon
  FaEdit, // For edit button
  FaEye, // For view button
  FaGlobe, // Potentially for language column if you add it
  FaCodeBranch, // Potentially for version column
  FaCheckCircle, // For peer reviewed column
  FaBalanceScale, // Potentially for license column
  FaStar, // Potentially for rating column
  FaDownload, // Potentially for download count column
  FaHistory, // Potentially for last reviewed at column
} from "react-icons/fa";

// Common Components - Adjust paths as per your project structure
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import Notification from "../../Component/Common/Notification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ITEMS_PER_PAGE = 15;

// Helper Functions
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "N/A";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
      dateString.length === 10 &&
      !includeTime
    ) {
      const [year, month, day] = dateString.split("-");
      const utcDate = new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day))
      );
      options.timeZone = "UTC";
      return utcDate.toLocaleDateString(undefined, options);
    }
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
};

const AdminPublicationManagementPage = () => {
  const navigate = useNavigate();

  const [publications, setPublications] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    isPeerReviewed: "",
    language: "",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  const fetchPublications = useCallback(
    async (pageToFetch = 1) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(pageToFetch),
        limit: String(ITEMS_PER_PAGE),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      if (searchTerm) params.append("search", searchTerm);
      if (filters.isPeerReviewed !== "")
        params.append("isPeerReviewed", filters.isPeerReviewed);
      if (filters.language.trim())
        params.append("language", filters.language.trim());

      try {
        const url = `${API_BASE_URL}/api/admin/publications?${params.toString()}`;
        console.log("[Admin Fetch List] Requesting URL:", url);

        const response = await axios.get(url, { headers: getAuthHeaders() });
        if (
          response.data?.success &&
          response.data.data?.publications !== undefined
        ) {
          setPublications(response.data.data.publications);
          setPagination(
            response.data.data.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              limit: ITEMS_PER_PAGE,
            }
          );
        } else {
          throw new Error(
            response.data?.message ||
              "Failed to load publications. Unexpected response format."
          );
        }
      } catch (err) {
        console.error("Error fetching admin publications:", err);
        let errMsg = "Could not load publications.";
        if (err.response) {
          errMsg =
            err.response.status === 404
              ? `Admin publications endpoint (${
                  err.config?.url || "unknown URL"
                }) not found (404). Check backend routes.`
              : err.response.data?.message || err.message;
          if (err.response.status === 401 || err.response.status === 403) {
            showNotification(
              "Session expired or unauthorized. Please log in.",
              "error"
            );
            navigate("/login");
          }
        } else if (err.request) {
          errMsg = "No response from server.";
        } else {
          errMsg = err.message;
        }
        setError(errMsg);
        setPublications([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: ITEMS_PER_PAGE,
        });
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, filters, sortBy, sortOrder, showNotification, navigate]
  );

  const debouncedSetSearchTerm = useMemo(
    () =>
      debounce((term) => {
        setSearchTerm(term);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      }, 500),
    []
  );

  useEffect(() => {
    fetchPublications(pagination.currentPage);
  }, [fetchPublications, pagination.currentPage]);
  useEffect(() => {
    return () => {
      debouncedSetSearchTerm.cancel();
    };
  }, [debouncedSetSearchTerm]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearchTerm(value);
  };
  const handleClearSearch = () => {
    setSearchQuery("");
    debouncedSetSearchTerm("");
  };
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };
  const handleSort = (columnKey) => {
    const newOrder =
      sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(columnKey);
    setSortOrder(newOrder);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== pagination.currentPage
    ) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleDelete = async (id, title) => {
    if (
      !window.confirm(`Are you sure you want to permanently delete "${title}"?`)
    )
      return;
    setDeletingId(id);
    try {
      const url = `${API_BASE_URL}/api/admin/publications/${id}`;
      await axios.delete(url, { headers: getAuthHeaders() });
      showNotification(
        `Publication "${title}" deleted successfully.`,
        "success"
      );
      fetchPublications(pagination.currentPage);
    } catch (err) {
      console.error("Error deleting publication:", err);
      showNotification(
        err.response?.data?.message ||
          err.message ||
          "Could not delete publication.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const renderSortIcon = (columnKey) => {
    if (sortBy !== columnKey)
      return <FaSort className="inline-block ml-1 text-gray-400" />;
    return sortOrder === "asc" ? (
      <FaSortUp className="inline-block ml-1 text-blue-600" />
    ) : (
      <FaSortDown className="inline-block ml-1 text-blue-600" />
    );
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (pub) => (
        <div
          className="text-sm font-medium text-gray-900 truncate w-48 md:w-60"
          title={pub.title}
        >
          {pub.title || "N/A"}
        </div>
      ),
    },
    {
      key: "owner.username",
      label: "Owner",
      sortable: true,
      render: (pub) => (
        <div>
          {" "}
          <div
            className="text-sm text-gray-900 truncate w-32"
            title={pub.owner?.username}
          >
            {pub.owner?.username || "N/A"}
          </div>{" "}
          <div
            className="text-xs text-gray-500 truncate w-32"
            title={pub.owner?.email}
          >
            {pub.owner?.email || ""}
          </div>{" "}
        </div>
      ),
    },
    {
      key: "author",
      label: "Listed Author",
      sortable: true,
      render: (pub) => (
        <div className="text-sm text-gray-900 truncate w-32" title={pub.author}>
          {pub.author || "N/A"}
        </div>
      ),
    },
    {
      key: "publicationDate",
      label: "Pub. Date",
      sortable: true,
      render: (pub) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDate(pub.publicationDate)}
        </span>
      ),
    },
    {
      key: "isPeerReviewed",
      label: "Peer Rev.",
      sortable: true,
      render: (pub) =>
        pub.isPeerReviewed ? (
          <FaCheckCircle
            className="text-green-500 h-5 w-5 mx-auto"
            title="Peer Reviewed"
          />
        ) : (
          <FaTimes
            className="text-red-500 h-5 w-5 mx-auto"
            title="Not Peer Reviewed"
          />
        ),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (pub) => (
        <span className="text-sm text-gray-600">
          {pub.rating?.toFixed(1) ?? "0.0"}
        </span>
      ),
    },
    {
      key: "views",
      label: "Views",
      sortable: true,
      render: (pub) => (
        <span className="text-sm text-gray-600">{pub.views ?? 0}</span>
      ),
    },
    {
      key: "downloadCount",
      label: "DLs",
      sortable: true,
      render: (pub) => (
        <span className="text-sm text-gray-600">{pub.downloadCount ?? 0}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (pub) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDate(pub.createdAt, true)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
        Manage Publications
      </h1>

      <div className="fixed top-20 right-5 z-50 w-full max-w-sm">
        {" "}
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        />{" "}
      </div>
      {error && !loading && (
        <ErrorMessage message={error} onClose={() => setError(null)} />
      )}

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow">
          {" "}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {" "}
            <FaSearch className="h-4 w-4 text-gray-400" />{" "}
          </div>{" "}
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search title, author, owner, summary..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          />{" "}
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-600"
              aria-label="Clear search"
            >
              {" "}
              <FaTimes className="h-4 w-4" />{" "}
            </button>
          )}{" "}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {" "}
          <label
            htmlFor="filter-isPeerReviewed"
            className="text-sm text-gray-700 whitespace-nowrap"
          >
            Peer Reviewed:
          </label>{" "}
          <select
            id="filter-isPeerReviewed"
            name="isPeerReviewed"
            value={filters.isPeerReviewed}
            onChange={handleFilterChange}
            className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
          >
            {" "}
            <option value="">Any</option> <option value="true">Yes</option>{" "}
            <option value="false">No</option>{" "}
          </select>{" "}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {" "}
          <label htmlFor="filter-language" className="text-sm text-gray-700">
            Language:
          </label>{" "}
          <input
            type="text"
            id="filter-language"
            name="language"
            value={filters.language}
            onChange={handleFilterChange}
            placeholder="e.g., English"
            className="py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm w-32"
          />{" "}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        {loading && publications.length === 0 ? (
          <div className="p-6 text-center">
            {" "}
            <LoadingSpinner size="lg" />{" "}
            <p className="mt-2 text-gray-500">Loading publications...</p>{" "}
          </div>
        ) : !loading && publications.length === 0 && !error ? (
          <div className="p-6 text-center text-gray-500">
            {" "}
            No publications found matching your criteria.{" "}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    onClick={
                      col.sortable ? () => handleSort(col.key) : undefined
                    }
                    style={{ cursor: col.sortable ? "pointer" : "default" }}
                  >
                    {" "}
                    {col.label} {col.sortable && renderSortIcon(col.key)}{" "}
                  </th>
                ))}
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
                loading ? "opacity-50" : ""
              }`}
            >
              {publications.map((pub) => (
                <tr key={pub.id} className="hover:bg-gray-50/50">
                  {columns.map((col) => (
                    <td
                      key={`${col.key}-${pub.id}`}
                      className="px-4 py-3 whitespace-nowrap align-top"
                    >
                      {" "}
                      {col.render(pub)}{" "}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1 align-top">
                    {/* Action 1: Navigate to ADMIN Detail Page */}
                    <button
                      onClick={() =>
                        navigate(`/admin/publications/${pub.id}/view`)
                      } // <<< MODIFIED HERE
                      title="View Publication Details (Admin)"
                      className="text-sky-600 hover:text-sky-800 p-1.5 rounded hover:bg-sky-50"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>

                    {/* Action 2: Navigate to Public Edit Page */}
                    <button
                      onClick={() => navigate(`/publications/edit/${pub.id}`)}
                      title="Edit Publication (Public Form)"
                      className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>

                    {/* Action 3: Link to Admin User Management Page (if applicable) */}
                    {pub.owner?.id && (
                      <Link
                        to={`/admin/users/manage/${pub.owner.id}`} // Ensure this admin route exists
                        title={`Manage User: ${pub.owner.username || ""}`}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 inline-block"
                      >
                        <FaUser className="h-4 w-4" />
                      </Link>
                    )}
                    {/* Action 4: Delete Publication (Admin Action) */}
                    <button
                      onClick={() => handleDelete(pub.id, pub.title)}
                      disabled={deletingId === pub.id}
                      title="Delete Publication"
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1.5 rounded hover:bg-red-50"
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

      {!loading && publications.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          {" "}
          {/* Pagination */}
          <span className="text-sm text-gray-700">
            {" "}
            Showing{" "}
            <span className="font-medium">
              {(pagination.currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                pagination.currentPage * ITEMS_PER_PAGE,
                pagination.totalItems
              )}
            </span>{" "}
            of <span className="font-medium">{pagination.totalItems}</span>{" "}
            results{" "}
          </span>
          <div>
            {" "}
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="relative inline-flex items-center px-3 py-1.5 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              {" "}
              Previous{" "}
            </button>{" "}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage >= pagination.totalPages || loading
              }
              className="relative -ml-px inline-flex items-center px-3 py-1.5 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              {" "}
              Next{" "}
            </button>{" "}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPublicationManagementPage;
