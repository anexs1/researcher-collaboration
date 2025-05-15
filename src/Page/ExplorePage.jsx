import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom"; // useSearchParams for URL state
import PaginationControls from "../Component/PaginationControls"; // <<<--- CORRECTED IMPORT PATH

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_PROFILE_PIC = "/default-avatar.png";

// Example roles - fetch these from an API or define statically if fixed
const USER_ROLES = [
  "academic",
  "medical",
  "corporate",
  "non-researcher",
  "user",
  "admin",
];

// Simple debounce function
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

function ExplorePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // --- Filter and Search State ---
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedRole, setSelectedRole] = useState(
    searchParams.get("role") || ""
  );
  const [selectedUniversity, setSelectedUniversity] = useState(
    searchParams.get("university") || ""
  );
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const fetchUsers = useCallback(
    async (pageToFetch, currentSearchTerm, currentRole, currentUniversity) => {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("page", pageToFetch.toString());
      queryParams.append("limit", "12"); // Or your preferred limit
      if (currentSearchTerm) queryParams.append("search", currentSearchTerm);
      if (currentRole) queryParams.append("role", currentRole);
      if (currentUniversity)
        queryParams.append("university", currentUniversity);

      // Update URL search params without causing a full page reload
      setSearchParams(queryParams, { replace: true });

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/discoverable?${queryParams.toString()}`
        );
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to parse error response" }));
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${
              errorData.message || response.statusText
            }`
          );
        }
        const result = await response.json();
        if (result.success) {
          setUsers(result.data);
          setPagination(result.pagination);
        } else {
          throw new Error(result.message || "Failed to fetch users.");
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(err.message);
        setUsers([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [setSearchParams]
  );

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
    const searchFromUrl = searchParams.get("search") || "";
    const roleFromUrl = searchParams.get("role") || "";
    const uniFromUrl = searchParams.get("university") || "";

    fetchUsers(pageFromUrl, searchFromUrl, roleFromUrl, uniFromUrl);
  }, [searchParams, fetchUsers]);

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("search", newSearchTerm);
    newParams.set("page", "1");
    setSearchParams(newParams, { replace: true });
  };

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setSelectedRole(newRole);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("role", newRole);
    newParams.set("page", "1");
    setSearchParams(newParams, { replace: true });
  };

  const handleUniversityChange = (event) => {
    const newUniversity = event.target.value;
    setSelectedUniversity(newUniversity);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("university", newUniversity);
    newParams.set("page", "1");
    setSearchParams(newParams, { replace: true });
  };

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= (pagination?.totalPages || 1) &&
      newPage !== currentPage &&
      !loading
    ) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", newPage.toString());
      setSearchParams(newParams, { replace: true });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRole("");
    setSelectedUniversity("");
    setSearchParams({ page: "1", limit: "12" }, { replace: true });
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-6 text-center text-xl text-gray-700">
        Loading users...
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Discover Users
        </h1>
        <p className="text-red-500 bg-red-100 p-4 rounded-md">
          Error fetching data: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <header className="mb-8 p-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Discover Users
        </h1>
        <p className="text-gray-600 mb-6">
          Find and connect with researchers and professionals in various fields.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name, institution..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="col-span-1 md:col-span-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            {USER_ROLES.map((role) => (
              <option key={role} value={role} className="capitalize">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter by University"
            value={selectedUniversity}
            onChange={handleUniversityChange}
            className="col-span-1 md:col-span-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={clearFilters}
            className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </header>

      {loading && (
        <p className="text-center text-gray-600 my-4">Updating user list...</p>
      )}
      {error &&
        !loading && ( // Show error only if not loading
          <p className="text-center text-red-500 my-4 bg-red-50 p-3 rounded-md">
            Error: {error}
          </p>
        )}

      {!loading && users.length === 0 && (
        <div className="text-center text-gray-500 py-10 text-lg">
          <p>No users found matching your criteria.</p>
          <p className="mt-2 text-sm">Try adjusting your search or filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col h-full group"
          >
            <div className="p-5">
              <div className="flex items-start mb-4">
                <img
                  src={
                    user.profilePictureUrl
                      ? `${API_BASE_URL}${user.profilePictureUrl}`
                      : DEFAULT_PROFILE_PIC
                  }
                  alt={`${user.username}'s profile`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 group-hover:border-blue-500 transition-colors duration-300 mr-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_PROFILE_PIC;
                  }}
                />
                <div className="flex-1">
                  <Link to={`/profile/${user.id}`} className="block">
                    <h2
                      className="text-lg font-semibold text-blue-700 group-hover:text-blue-800 transition-colors duration-300 truncate"
                      title={user.username}
                    >
                      {user.username}
                    </h2>
                  </Link>
                  {user.jobTitle && (
                    <p
                      className="text-xs text-gray-500 truncate"
                      title={user.jobTitle}
                    >
                      {user.jobTitle}
                    </p>
                  )}
                  {user.role && (
                    <p className="text-xs text-blue-500 capitalize mt-0.5">
                      {user.role}
                    </p>
                  )}
                </div>
              </div>

              {(user.university ||
                user.medicalSpecialty ||
                user.companyName) && (
                <div className="text-sm text-gray-600 mb-3 space-y-1">
                  {user.university && (
                    <p
                      className="flex items-center truncate"
                      title={`${user.university}${
                        user.department ? ", " + user.department : ""
                      }`}
                    >
                      <span
                        role="img"
                        aria-label="institution"
                        className="mr-2 opacity-70"
                      >
                        🎓
                      </span>
                      {user.university}
                      {user.department && `, ${user.department}`}
                    </p>
                  )}
                  {user.medicalSpecialty && (
                    <p
                      className="flex items-center truncate"
                      title={`${user.medicalSpecialty}${
                        user.hospitalName ? " at " + user.hospitalName : ""
                      }`}
                    >
                      <span
                        role="img"
                        aria-label="specialty"
                        className="mr-2 opacity-70"
                      >
                        🩺
                      </span>
                      {user.medicalSpecialty}
                      {user.hospitalName && ` at ${user.hospitalName}`}
                    </p>
                  )}
                  {user.companyName &&
                    !user.university &&
                    !user.medicalSpecialty && (
                      <p
                        className="flex items-center truncate"
                        title={user.companyName}
                      >
                        <span
                          role="img"
                          aria-label="company"
                          className="mr-2 opacity-70"
                        >
                          🏢
                        </span>
                        {user.companyName}
                      </p>
                    )}
                </div>
              )}

              {user.bio && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-grow min-h-[30px]">
                  {user.bio}
                </p>
              )}
            </div>

            {(user.totalProjects !== undefined ||
              user.activeProjects !== undefined ||
              user.completedProjects !== undefined) && (
              <div className="px-5 py-3 bg-gray-50 border-t border-b border-gray-200 text-xs text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span>
                    <span role="img" aria-label="projects" className="mr-1">
                      📁
                    </span>
                    Total Projects:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {user.totalProjects ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    <span role="img" aria-label="active" className="mr-1">
                      🚧
                    </span>
                    Active:
                  </span>
                  <span className="font-semibold text-green-600">
                    {user.activeProjects ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    <span role="img" aria-label="completed" className="mr-1">
                      ✅
                    </span>
                    Completed:
                  </span>
                  <span className="font-semibold text-blue-600">
                    {user.completedProjects ?? 0}
                  </span>
                </div>
              </div>
            )}

            <div className="p-5 mt-auto">
              <Link
                to={`/users/${user.id}/projects`}
                className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
              >
                View Projects
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && pagination && pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          isLoading={loading}
        />
      )}
    </div>
  );
}

export default ExplorePage;
