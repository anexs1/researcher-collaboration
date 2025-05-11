// frontend/src/Page/Admin/AdminContactSubmissionsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  adminFetchContactSubmissions,
  adminGetContactSubmissionById, // Added this if you plan to use it for a detail view
  adminToggleResolveSubmission,
} from "../../services/apiService"; // Path to apiService.js
import useAuth from "../../hooks/useAuth"; // ^^^^ --- THIS IS THE LINE IN QUESTION --- ^^^^
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelopeOpenText,
  FaFilter,
} from "react-icons/fa";

const AdminContactSubmissionsPage = () => {
  const { token, user } = useAuth(); // This line uses the import
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [filterResolved, setFilterResolved] = useState(null);

  console.log(
    "[AdminPage] Initializing - Token:",
    token ? "Exists" : "MISSING",
    "User:",
    user
  );

  const fetchSubmissions = useCallback(
    async (page = 1, resolvedFilter = null) => {
      console.log(
        "[AdminPage] fetchSubmissions called. Token:",
        token ? "Exists" : "MISSING",
        "User Role:",
        user?.role
      );
      if (!token) {
        setError(
          "Authentication token not found. Please ensure you are logged in as an admin."
        );
        setIsLoading(false);
        return;
      }
      if (user?.role !== "admin") {
        setError(
          "Access Denied. Admin privileges required to view submissions."
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const data = await adminFetchContactSubmissions(
          token,
          page,
          itemsPerPage,
          resolvedFilter
        );
        console.log("[AdminPage] Submissions data from API:", data);
        setSubmissions(data.submissions || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
        setCurrentPage(data.page || 1);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch contact submissions."
        );
        console.error("[AdminPage] Error in fetchSubmissions:", err);
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [token, user]
  ); // Include user in dependencies

  useEffect(() => {
    console.log(
      "[AdminPage] useEffect triggered. Token:",
      token ? "Exists" : "MISSING",
      "User Role:",
      user?.role
    );
    if (token && user && user.role === "admin") {
      fetchSubmissions(currentPage, filterResolved);
    } else if (token && user && user.role !== "admin") {
      setError("Access denied. Admin privileges required.");
      setIsLoading(false);
    } else if (!token) {
      setError("Not authenticated. Please log in as an admin.");
      setIsLoading(false);
    }
  }, [fetchSubmissions, currentPage, filterResolved, token, user]);

  const handleToggleResolve = async (submissionId, currentStatus) => {
    console.log(
      "[AdminPage] handleToggleResolve called for ID:",
      submissionId,
      "Current status:",
      currentStatus
    );
    if (!token) {
      setError("Action requires authentication.");
      return;
    }
    try {
      const updatedData = await adminToggleResolveSubmission(
        submissionId,
        !currentStatus,
        token
      );
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId ? updatedData.submission : sub
        )
      );
      setSelectedSubmission((prev) =>
        prev && prev.id === submissionId ? updatedData.submission : prev
      );
      console.log(
        "[AdminPage] Submission status updated:",
        updatedData.submission
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to update submission ${submissionId}.`
      );
      console.error("[AdminPage] Error in handleToggleResolve:", err);
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterResolved(value === "all" ? null : value === "true");
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Initial loading state for the whole page before any data/error
  if (isLoading && submissions.length === 0 && !error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-theme(space.20))]">
        {" "}
        {/* Adjust 20 based on header height */}
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-lg text-gray-600">
          Loading Submissions...
        </span>
      </div>
    );
  }

  // If there's an error and no submissions yet (e.g. auth error before first fetch)
  if (error && submissions.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Support Inbox
          </h1>
          <p className="text-red-600 bg-red-100 p-4 rounded-md shadow-sm">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 border-b pb-4">
          Support Inbox - Contact Submissions
        </h1>

        {error &&
          submissions.length > 0 && ( // Show error above table if some data was previously loaded
            <p className="text-red-600 bg-red-100 p-3 rounded mb-4 text-sm">
              {error}
            </p>
          )}

        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <FaFilter className="text-gray-500 h-5 w-5" />
            <label
              htmlFor="resolvedFilter"
              className="text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              Filter by Status:
            </label>
            <select
              id="resolvedFilter"
              value={filterResolved === null ? "all" : String(filterResolved)}
              onChange={handleFilterChange}
              className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="all">All</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>
          {isLoading && <LoadingSpinner size="sm" color="text-indigo-600" />}
        </div>

        {!isLoading && submissions.length === 0 ? (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z"
              />
            </svg>
            <p className="text-xl font-semibold text-gray-700 mt-2">
              No Submissions Found
            </p>
            <p className="text-gray-500">
              There are no contact submissions matching the current filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Submitted
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Issue Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Preview
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sub.submitted_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sub.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a
                        href={`mailto:${sub.email}`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {sub.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.issue_type || "N/A"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate"
                      title={sub.message}
                    >
                      {sub.message_preview ||
                        (sub.message
                          ? sub.message.substring(0, 50) + "..."
                          : "No message")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {sub.is_resolved ? (
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
                          Resolved
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-300">
                          Unresolved
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 transition-colors duration-150"
                        title="View Full Message"
                      >
                        <FaEnvelopeOpenText size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleToggleResolve(sub.id, sub.is_resolved)
                        }
                        className={`p-1.5 rounded-md transition-colors duration-150 ${
                          sub.is_resolved
                            ? "text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100"
                            : "text-green-500 hover:text-green-700 hover:bg-green-100"
                        }`}
                        title={
                          sub.is_resolved
                            ? "Mark as Unresolved"
                            : "Mark as Resolved"
                        }
                      >
                        {sub.is_resolved ? (
                          <FaTimesCircle size={16} />
                        ) : (
                          <FaCheckCircle size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
              <span className="hidden sm:inline">
                {" "}
                (Total: {totalItems} submissions)
              </span>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Modal to view full message */}
        {selectedSubmission && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={() => setSelectedSubmission(null)} // Close on backdrop click
          >
            <div
              className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside modal
            >
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">
                  Support Message Details
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1 rounded-full"
                >
                  <FaTimesCircle size={24} />
                </button>
              </div>
              <div className="overflow-y-auto space-y-3 pr-2 -mr-2">
                {" "}
                {/* Added padding for scrollbar */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                  <strong className="col-span-1 text-gray-600">From:</strong>
                  <span className="col-span-2 text-gray-800">
                    {selectedSubmission.name}
                  </span>
                  <strong className="col-span-1 text-gray-600">Email:</strong>
                  <a
                    href={`mailto:${selectedSubmission.email}`}
                    className="col-span-2 text-indigo-600 hover:underline truncate"
                  >
                    {selectedSubmission.email}
                  </a>
                  <strong className="col-span-1 text-gray-600">Date:</strong>
                  <span className="col-span-2 text-gray-800">
                    {formatDate(selectedSubmission.submitted_at)}
                  </span>
                  <strong className="col-span-1 text-gray-600">
                    Issue Type:
                  </strong>
                  <span className="col-span-2 text-gray-800">
                    {selectedSubmission.issue_type || "N/A"}
                  </span>
                  <strong className="col-span-1 text-gray-600">Status:</strong>
                  <span
                    className={`col-span-2 font-semibold ${
                      selectedSubmission.is_resolved
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedSubmission.is_resolved ? "Resolved" : "Unresolved"}
                    {selectedSubmission.is_resolved &&
                    selectedSubmission.resolved_at
                      ? ` (on ${formatDate(selectedSubmission.resolved_at)})`
                      : ""}
                  </span>
                </div>
                <hr className="my-3 border-gray-200" />
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Message:
                </p>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-gray-700 text-sm leading-relaxed max-h-80 overflow-y-auto border border-gray-200">
                  {selectedSubmission.message}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => {
                    handleToggleResolve(
                      selectedSubmission.id,
                      selectedSubmission.is_resolved
                    );
                  }}
                  disabled={isLoading} // Disable while any loading is happening
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-md text-sm font-medium shadow-sm transition-all duration-150 ease-in-out transform active:scale-95
                                ${
                                  selectedSubmission.is_resolved
                                    ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-white"
                                    : "bg-green-500 hover:bg-green-600 focus:ring-green-400 text-white"
                                }`}
                >
                  {isLoading
                    ? "Updating..."
                    : selectedSubmission.is_resolved
                    ? "Mark as Unresolved"
                    : "Mark as Resolved"}
                </button>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContactSubmissionsPage;
