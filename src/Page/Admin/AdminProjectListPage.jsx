// src/Page/Admin/AdminProjectListPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash"; // npm install lodash
import {
  FaSearch,
  FaTimes,
  FaTrashAlt,
  FaUser,
  FaCalendarAlt,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEdit,
  FaEye,
  FaProjectDiagram, // Icon for projects
} from "react-icons/fa";

// Common Components - Adjust paths
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import Notification from "../../Component/Common/Notification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ITEMS_PER_PAGE = 15;

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
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (error) {
    return "Invalid Date";
  }
};

// Example project statuses - align with your backend model
const projectStatusOptions = [
  { value: "", label: "All Statuses" },
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const AdminProjectListPage = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
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
  const [filters, setFilters] = useState({ status: "" }); // Filter by project status
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  const fetchAdminProjects = useCallback(
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
      if (filters.status) params.append("status", filters.status);

      try {
        const url = `${API_BASE_URL}/api/admin/projects?${params.toString()}`; // Assumes this endpoint exists
        console.log("[Admin Fetch Projects] Requesting URL:", url);

        const response = await axios.get(url, { headers: getAuthHeaders() });
        if (
          response.data?.success &&
          response.data.data?.projects !== undefined
        ) {
          // Adjusted for projects
          setProjects(response.data.data.projects);
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
              "Failed to load projects. Unexpected response format."
          );
        }
      } catch (err) {
        console.error("Error fetching admin projects:", err);
        let errMsg = "Could not load projects.";
        if (err.response) {
          errMsg =
            err.response.status === 404
              ? `Admin projects endpoint (${
                  err.config?.url || "unknown URL"
                }) not found (404).`
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
        setProjects([]);
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
    fetchAdminProjects(pagination.currentPage);
  }, [fetchAdminProjects, pagination.currentPage]);
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

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete project "${projectTitle}" (ID: ${projectId})?`
      )
    )
      return;
    setDeletingId(projectId);
    try {
      const url = `${API_BASE_URL}/api/admin/projects/${projectId}`; // Assumes this admin delete endpoint
      await axios.delete(url, { headers: getAuthHeaders() });
      showNotification(
        `Project "${projectTitle}" deleted successfully.`,
        "success"
      );
      fetchAdminProjects(pagination.currentPage);
    } catch (err) {
      console.error("Error deleting project:", err);
      showNotification(
        err.response?.data?.message ||
          err.message ||
          "Could not delete project.",
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

  // Columns for the projects table
  const columns = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      render: (proj) => (
        <span className="text-sm text-gray-700">{proj.id}</span>
      ),
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (proj) => (
        <div
          className="text-sm font-medium text-gray-900 truncate w-48 md:w-60"
          title={proj.title}
        >
          {proj.title || "N/A"}
        </div>
      ),
    },
    {
      key: "owner.username",
      label: "Owner",
      sortable: true,
      render: (proj) => (
        <div>
          {" "}
          <div
            className="text-sm text-gray-900 truncate w-32"
            title={proj.owner?.username}
          >
            {proj.owner?.username || "N/A"}
          </div>{" "}
          <div
            className="text-xs text-gray-500 truncate w-32"
            title={proj.owner?.email}
          >
            {proj.owner?.email || ""}
          </div>{" "}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (proj) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            proj.status?.toLowerCase() === "active"
              ? "bg-green-100 text-green-800"
              : proj.status?.toLowerCase() === "completed"
              ? "bg-blue-100 text-blue-800"
              : ["on_hold", "archived"].includes(proj.status?.toLowerCase())
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800" /* Planning or other */
          }`}
        >
          {proj.status ? proj.status.replace("_", " ").toUpperCase() : "N/A"}
        </span>
      ),
    },
    // Add more project-specific columns like 'memberCount', 'lastActivity', etc.
    // { key: "memberCount", label: "Members", sortable: true, render: (proj) => <span className="text-sm text-gray-600">{proj.members?.length ?? 0}</span> },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (proj) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatDate(proj.createdAt, true)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AdminPageHeader title="Manage Projects" />

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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {" "}
            <FaSearch className="h-4 w-4 text-gray-400" />{" "}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search project title, owner..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-red-600"
              aria-label="Clear search"
            >
              {" "}
              <FaTimes className="h-4 w-4" />{" "}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <label
            htmlFor="filter-status"
            className="text-sm text-gray-700 whitespace-nowrap"
          >
            Status:
          </label>
          <select
            id="filter-status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
          >
            {projectStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        {loading && projects.length === 0 ? (
          <div className="p-6 text-center">
            {" "}
            <LoadingSpinner size="lg" />{" "}
            <p className="mt-2 text-gray-500">Loading projects...</p>{" "}
          </div>
        ) : !loading && projects.length === 0 && !error ? (
          <div className="p-6 text-center text-gray-500">
            {" "}
            No projects found matching your criteria.{" "}
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
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-gray-50/50">
                  {columns.map((col) => (
                    <td
                      key={`${col.key}-${proj.id}`}
                      className="px-4 py-3 whitespace-nowrap align-top"
                    >
                      {" "}
                      {col.render(proj)}{" "}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1 align-top">
                    {/* Navigate to PUBLIC Project Edit Page */}
                    <button
                      onClick={() => navigate(`/projects/edit/${proj.id}`)}
                      title="Edit Project (Public Form)"
                      className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50"
                    >
                      {" "}
                      <FaEdit className="h-4 w-4" />{" "}
                    </button>
                    {/* Navigate to PUBLIC Project Detail Page */}
                    <Link
                      to={`/projects/${proj.id}`}
                      title="View Public Project Page"
                      className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50 inline-block"
                    >
                      {" "}
                      <FaEye className="h-4 w-4" />{" "}
                    </Link>
                    {proj.owner?.id && (
                      <Link
                        to={`/admin/users/manage/${proj.owner.id}`}
                        title={`Manage User: ${proj.owner.username || ""}`}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 inline-block"
                      >
                        {" "}
                        <FaUser className="h-4 w-4" />{" "}
                      </Link>
                    )}
                    <button
                      onClick={() => handleDeleteProject(proj.id, proj.title)}
                      disabled={deletingId === proj.id}
                      title="Delete Project"
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1.5 rounded hover:bg-red-50"
                    >
                      {deletingId === proj.id ? (
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

      {!loading && projects.length > 0 && pagination.totalPages > 1 && (
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

export default AdminProjectListPage;
