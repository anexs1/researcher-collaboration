import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PaginationControls from "../Component/PaginationControls"; // <<< CORRECTED IMPORT PATH

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_PROFILE_PIC = "/default-avatar.png"; // Ensure this is in your public folder

// Updated USER_ROLES to exclude 'admin' for the filter dropdown
const USER_ROLES = [
  "academic",
  "medical",
  "corporate",
  "non-researcher",
  "user",
  // "admin", // Admin role removed from frontend filter options
];

// Simple debounce function (keep as is)
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
  // currentPage will be derived from searchParams in useEffect to ensure consistency
  const currentPageFromUrl = parseInt(searchParams.get("page") || "1", 10);

  const fetchUsers = useCallback(
    async (pageToFetch, currentSearchTerm, currentRole, currentUniversity) => {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("page", pageToFetch.toString());
      queryParams.append("limit", "12");
      if (currentSearchTerm) queryParams.append("search", currentSearchTerm);
      if (currentRole) queryParams.append("role", currentRole); // Backend handles if 'admin' is passed
      if (currentUniversity)
        queryParams.append("university", currentUniversity);

      // Update URL immediately to reflect current fetching state
      // This also makes sure that if fetchUsers is called directly (e.g. on mount), the URL is in sync
      const currentUrlParams = new URLSearchParams(searchParams.toString());
      currentUrlParams.set("page", pageToFetch.toString());
      if (currentSearchTerm) currentUrlParams.set("search", currentSearchTerm);
      else currentUrlParams.delete("search");
      if (currentRole) currentUrlParams.set("role", currentRole);
      else currentUrlParams.delete("role");
      if (currentUniversity)
        currentUrlParams.set("university", currentUniversity);
      else currentUrlParams.delete("university");
      setSearchParams(currentUrlParams, { replace: true });

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
          // The actual page number is now part of searchParams and handled by useEffect dependency
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
  ); // API_BASE_URL is static, not needed as dependency

  useEffect(() => {
    // This effect now correctly reads all filter states from the URL (searchParams)
    // and triggers fetchUsers when any of them change.
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const university = searchParams.get("university") || "";

    // Update local state for input fields if they differ from URL (e.g., on back/forward navigation)
    if (search !== searchTerm) setSearchTerm(search);
    if (role !== selectedRole) setSelectedRole(role);
    if (university !== selectedUniversity) setSelectedUniversity(university);

    fetchUsers(page, search, role, university);
  }, [searchParams, fetchUsers, searchTerm, selectedRole, selectedUniversity]); // Add local state vars for inputs to sync them

  const updateUrlParamsAndFetch = (newParamsData) => {
    const newParams = new URLSearchParams(searchParams.toString()); // Preserve existing params like limit
    newParams.set("page", "1"); // Reset to page 1 for new filters/search

    Object.entries(newParamsData).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key); // Remove if value is empty
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm); // Update local state for controlled input
    // Debounce the actual URL update and fetch
    debouncedUpdateUrl({ search: newSearchTerm });
  };

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setSelectedRole(newRole);
    updateUrlParamsAndFetch({
      role: newRole,
      search: searchTerm,
      university: selectedUniversity,
    });
  };

  const handleUniversityChange = (event) => {
    const newUniversity = event.target.value;
    setSelectedUniversity(newUniversity);
    // Debounce the actual URL update and fetch
    debouncedUpdateUrl({ university: newUniversity });
  };

  // Debounced function to update URL params for search/university to avoid too many API calls while typing
  const debouncedUpdateUrl = useCallback(
    debounce((filterUpdates) => {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("page", "1"); // Reset to page 1
      for (const key in filterUpdates) {
        if (filterUpdates[key]) {
          newParams.set(key, filterUpdates[key]);
        } else {
          newParams.delete(key);
        }
      }
      setSearchParams(newParams, { replace: true });
    }, 700), // 700ms debounce
    [searchParams, setSearchParams]
  );

  const handlePageChange = (newPage) => {
    const currentUrlPage = parseInt(searchParams.get("page") || "1", 10);
    if (
      newPage >= 1 &&
      newPage <= (pagination?.totalPages || 1) &&
      newPage !== currentUrlPage && // Compare with URL page
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
    // Only keep page and limit if they were part of default, or just reset to page 1
    const defaultParams = new URLSearchParams();
    defaultParams.set("page", "1");
    defaultParams.set("limit", "12"); // Assuming 12 is your default limit
    setSearchParams(defaultParams, { replace: true });
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <input
            type="text"
            placeholder="Search by name, institution..."
            value={searchTerm} // Controlled component
            onChange={handleSearchChange}
            className="sm:col-span-2 md:col-span-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={selectedRole} // Controlled component
            onChange={handleRoleChange}
            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            {USER_ROLES.map(
              (
                role // USER_ROLES now excludes 'admin'
              ) => (
                <option key={role} value={role} className="capitalize">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              )
            )}
          </select>
          <input
            type="text"
            placeholder="Filter by University"
            value={selectedUniversity} // Controlled component
            onChange={handleUniversityChange}
            className="sm:col-span-2 md:col-span-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={clearFilters}
            className="md:col-start-3 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </header>

      {loading && (
        <p className="text-center text-gray-600 my-4">Updating user list...</p>
      )}
      {error && !loading && (
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
                  {user.role &&
                    user.role !== "admin" && ( // Don't display 'admin' role on card
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
                {" "}
                View Projects{" "}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && pagination && pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={currentPageFromUrl} // Use page from URL for PaginationControls
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          isLoading={loading}
        />
      )}
    </div>
  );
}
export default ExplorePage;
