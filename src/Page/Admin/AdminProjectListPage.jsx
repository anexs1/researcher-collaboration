// src/Page/Admin/AdminProjectListPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate
import axios from "axios";
import {
  FaEye,
  FaPencilAlt,
  FaTrashAlt,
  FaExternalLinkAlt,
} from "react-icons/fa"; // Import icons

// --- Component Imports ---
// Adjust paths as needed
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import Notification from "../../Component/Common/Notification"; // Assuming you want notifications
// import PaginationControls from '../../Component/Common/PaginationControls'; // Optional: If you have pagination

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AdminProjectListPage = () => {
  // --- State ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  // Optional: Add state for search, filters, pagination if needed
  // const [searchTerm, setSearchTerm] = useState('');
  // const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate(); // Hook for navigation (e.g., after delete)

  // --- Functions ---

  // Notification handler
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
    return () => clearTimeout(timer);
  }, []);

  // Fetch projects function
  const fetchAdminProjects = useCallback(
    async () => {
      setIsLoading(true);
      setError(null);
      console.log("Fetching projects for admin...");

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required. Please log in.");
        setIsLoading(false);
        // Optionally redirect to login
        // navigate('/login');
        return;
      }

      try {
        // --- Use the correct ADMIN endpoint ---
        const response = await axios.get(`${API_BASE_URL}/api/admin/projects`, {
          // <<< Verify this endpoint
          headers: { Authorization: `Bearer ${token}` },
          params: {
            // Add any query params for filtering/pagination if backend supports them
            // page: currentPage,
            // search: searchTerm
          },
          timeout: 10000,
        });

        if (response.data?.success && Array.isArray(response.data.data)) {
          console.log(`Fetched ${response.data.data.length} projects.`);
          setProjects(response.data.data);
          // Set pagination data if available
          // setTotalPages(response.data.totalPages || 1);
          // setCurrentPage(response.data.currentPage || 1);
        } else {
          throw new Error(
            response.data?.message || "Invalid data received from server."
          );
        }
      } catch (err) {
        console.error("Error fetching admin projects:", err);
        const errorMsg =
          err.response?.status === 403
            ? "Access Denied: You do not have permission to view admin projects."
            : err.response?.data?.message ||
              err.message ||
              "Failed to load projects.";
        setError(errorMsg);
        setProjects([]); // Clear projects on error
      } finally {
        setIsLoading(false);
      }
    },
    [
      /* Add dependencies like currentPage, searchTerm if used */
    ]
  ); // Dependency array

  // Fetch projects on component mount
  useEffect(() => {
    fetchAdminProjects();
  }, [fetchAdminProjects]);

  // --- Delete Handler ---
  const handleDeleteProject = useCallback(
    async (projectId) => {
      if (!projectId) return;

      if (
        !window.confirm(
          `Are you sure you want to delete project ID ${projectId}? This cannot be undone.`
        )
      ) {
        return;
      }

      console.log(`Attempting to delete project ID: ${projectId} (Admin)`);
      setError(null); // Clear previous errors
      const token = localStorage.getItem("authToken");
      if (!token) {
        showNotification("Authentication required.", "error");
        return;
      }

      try {
        // --- Use the correct ADMIN delete endpoint ---
        const response = await axios.delete(
          `${API_BASE_URL}/api/admin/projects/${projectId}`,
          {
            // <<< Verify endpoint
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          showNotification(
            response.data.message ||
              `Project ${projectId} deleted successfully.`,
            "success"
          );
          // Remove project from state
          setProjects((prev) => prev.filter((p) => p.id !== projectId));
          // Optionally refetch or adjust pagination count here
        } else {
          throw new Error(response.data?.message || "Delete operation failed.");
        }
      } catch (err) {
        console.error(`Error deleting project ID ${projectId}:`, err);
        const errorMsg =
          err.response?.status === 403
            ? "Access Denied: You do not have permission to delete this project."
            : err.response?.data?.message ||
              err.message ||
              "Could not delete project.";
        setError(errorMsg); // Show error specific to this action
        showNotification(errorMsg, "error");
      }
    },
    [showNotification]
  ); // Include setProjects if modifying state directly

  // --- Render Logic ---

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner size="lg" />{" "}
          <span className="ml-3 text-gray-500">Loading Projects...</span>
        </div>
      );
    }

    if (error) {
      // Keep the error message visible until manually closed or new fetch attempted
      return <ErrorMessage message={error} onClose={() => setError(null)} />;
    }

    if (projects.length === 0) {
      return (
        <p className="text-center text-gray-500 py-10">No projects found.</p>
      );
    }

    // --- Render Project Table ---
    return (
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Owner
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Collaborators
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created At
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {project.id}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 max-w-xs truncate"
                  title={project.title}
                >
                  {/* Link to public view or admin detail view */}
                  <Link
                    to={`/projects/${project.id}`}
                    className="hover:text-indigo-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.title || "N/A"}{" "}
                    <FaExternalLinkAlt className="inline h-3 w-3 ml-1 text-gray-400" />
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.owner?.username ? (
                    <Link
                      to={`/admin/users/${project.owner.id}`}
                      className="hover:text-indigo-600"
                    >
                      {" "}
                      {/* Link to admin user view */}
                      {project.owner.username} (ID: {project.owner.id})
                    </Link>
                  ) : (
                    `ID: ${project.ownerId}` || "Unknown"
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      project.status?.toLowerCase() === "active" ||
                      project.status?.toLowerCase() === "open"
                        ? "bg-green-100 text-green-800"
                        : project.status?.toLowerCase() === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : project.status?.toLowerCase() === "archived" ||
                          project.status?.toLowerCase() === "on hold"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800" /* Default/Planning */
                    }`}
                  >
                    {project.status || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  {project.requiredCollaborators ?? "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {/* Actions: View (Public), Edit (Admin?), Delete (Admin) */}
                  <Link
                    to={`/projects/${project.id}`}
                    target="_blank"
                    className="text-indigo-600 hover:text-indigo-900"
                    title="View Public Page"
                  >
                    <FaEye className="inline h-4 w-4" />
                  </Link>
                  {/* Link to admin edit page */}
                  <Link
                    to={`/admin/projects/edit/${project.id}`}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Edit Project (Admin)"
                  >
                    <FaPencilAlt className="inline h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Project"
                  >
                    <FaTrashAlt className="inline h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Component Return ---
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <AdminPageHeader title="Manage Projects" />

      {/* Notification Area */}
      <div className="relative h-10">
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
          className="absolute top-0 left-0 right-0 z-40" // Position relative to container
        />
      </div>

      {/* Optional Filters/Search Bar */}
      {/* <div className="bg-white p-4 rounded-lg shadow border"> ... Search/Filter inputs ... </div> */}

      {/* Main Content Area */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
        {renderContent()}
      </div>

      {/* Optional Pagination Controls */}
      {/* <div className="mt-6"> <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /> </div> */}
    </div>
  );
};

export default AdminProjectListPage;
