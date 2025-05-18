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
  const currentPageFromUrl = parseInt(searchParams.get("page") || "1", 10);

  const fetchUsers = useCallback(
    async (pageToFetch, currentSearchTerm, currentRole, currentUniversity) => {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("page", pageToFetch.toString());
      queryParams.append("limit", "12");
      if (currentSearchTerm) queryParams.append("search", currentSearchTerm);
      if (currentRole) queryParams.append("role", currentRole);
      if (currentUniversity)
        queryParams.append("university", currentUniversity);

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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const university = searchParams.get("university") || "";

    if (search !== searchTerm) setSearchTerm(search);
    if (role !== selectedRole) setSelectedRole(role);
    if (university !== selectedUniversity) setSelectedUniversity(university);

    fetchUsers(page, search, role, university);
  }, [searchParams, fetchUsers, searchTerm, selectedRole, selectedUniversity]);

  const updateUrlParamsAndFetch = (newParamsData) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", "1");

    Object.entries(newParamsData).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
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
    debouncedUpdateUrl({ university: newUniversity });
  };

  const debouncedUpdateUrl = useCallback(
    debounce((filterUpdates) => {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("page", "1");
      for (const key in filterUpdates) {
        if (filterUpdates[key]) {
          newParams.set(key, filterUpdates[key]);
        } else {
          newParams.delete(key);
        }
      }
      setSearchParams(newParams, { replace: true });
    }, 700),
    [searchParams, setSearchParams]
  );

  const handlePageChange = (newPage) => {
    const currentUrlPage = parseInt(searchParams.get("page") || "1", 10);
    if (
      newPage >= 1 &&
      newPage <= (pagination?.totalPages || 1) &&
      newPage !== currentUrlPage &&
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
    const defaultParams = new URLSearchParams();
    defaultParams.set("page", "1");
    defaultParams.set("limit", "12");
    setSearchParams(defaultParams, { replace: true });
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-6 text-center text-xl text-sky-700 font-semibold">
        Loading Users...
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">
          Discover Users
        </h1>
        <div
          className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-md"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <header className="mb-8 p-6 bg-white rounded-xl shadow-xl border border-slate-200">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Discover Users
        </h1>
        <p className="text-slate-600 mb-6">
          Find and connect with researchers and professionals in various fields.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <input
            type="text"
            placeholder="Search by name, institution..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="sm:col-span-2 md:col-span-1 p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-150 hover:border-slate-400"
          />
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-150 hover:border-slate-400"
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
            className="sm:col-span-2 md:col-span-1 p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-150 hover:border-slate-400"
          />
          <button
            onClick={clearFilters}
            className="md:col-start-3 p-3 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors shadow-sm font-medium focus:ring-2 focus:ring-sky-400 focus:outline-none"
          >
            Clear Filters
          </button>
        </div>
      </header>

      {loading && (
        <p className="text-center text-sky-600 my-4 font-medium">
          Updating user list...
        </p>
      )}
      {error && !loading && (
        <div
          className="my-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-md text-center"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {!loading && users.length === 0 && (
        <div className="text-center text-slate-500 py-10 px-6 border-2 border-dashed border-slate-300 rounded-lg my-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-slate-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8V4m0 16v-4m-4-4H4m16 0h-4M6.343 6.343l-1.414-1.414m12.728 12.728l-1.414-1.414M4.929 19.071l1.414-1.414m11.274-11.274l1.414-1.414"
            />{" "}
            {/* More detailed empty icon */}
          </svg>
          <p className="text-xl font-semibold text-slate-700">
            No users found.
          </p>
          <p className="mt-2 text-sm">Try adjusting your search or filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-xl shadow-xl hover:shadow-2xl hover:shadow-sky-200/50 border border-transparent group transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 flex flex-col h-full"
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
                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-200 group-hover:border-sky-400 group-hover:scale-105 transition-all duration-300 mr-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_PROFILE_PIC;
                  }}
                />
                <div className="flex-1 min-w-0">
                  {" "}
                  {/* Added min-w-0 for better truncation */}
                  <Link to={`/profile/${user.id}`} className="block">
                    <h2
                      className="text-lg font-semibold text-sky-700 group-hover:text-sky-800 transition-colors duration-300 truncate"
                      title={user.username}
                    >
                      {user.username}
                    </h2>
                  </Link>
                  {user.jobTitle && (
                    <p
                      className="text-xs text-slate-500 truncate"
                      title={user.jobTitle}
                    >
                      {user.jobTitle}
                    </p>
                  )}
                  {user.role && user.role !== "admin" && (
                    <p className="text-xs text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full inline-block capitalize mt-1">
                      {user.role}
                    </p>
                  )}
                </div>
              </div>
              {(user.university ||
                user.medicalSpecialty ||
                user.companyName) && (
                <div className="text-sm text-slate-600 mb-3 space-y-1.5">
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
                        className="mr-2 text-sky-500 opacity-80"
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
                        className="mr-2 text-sky-500 opacity-80"
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
                          className="mr-2 text-sky-500 opacity-80"
                        >
                          🏢
                        </span>
                        {user.companyName}
                      </p>
                    )}
                </div>
              )}
              {user.bio && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2 flex-grow min-h-[30px]">
                  {user.bio}
                </p>
              )}
            </div>

            {(user.totalProjects !== undefined ||
              user.activeProjects !== undefined ||
              user.completedProjects !== undefined) && (
              <div className="px-5 py-3 bg-slate-50 border-t border-b border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span
                      role="img"
                      aria-label="projects"
                      className="mr-1.5 text-base"
                    >
                      📁
                    </span>
                    Total Projects:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {user.totalProjects ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span
                      role="img"
                      aria-label="active"
                      className="mr-1.5 text-base"
                    >
                      🚧
                    </span>
                    Active:
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {user.activeProjects ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span
                      role="img"
                      aria-label="completed"
                      className="mr-1.5 text-base"
                    >
                      ✅
                    </span>
                    Completed:
                  </span>
                  <span className="font-semibold text-sky-600">
                    {user.completedProjects ?? 0}
                  </span>
                </div>
              </div>
            )}
            <div className="p-5 mt-auto">
              <Link
                to={`/users/${user.id}/projects`}
                className="w-full block text-center px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all duration-150 text-sm font-medium shadow-lg hover:shadow-xl"
              >
                View Projects
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && pagination && pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={currentPageFromUrl}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          isLoading={loading}
          // You might want to pass theme-related props to PaginationControls if it supports them
          // e.g., activeClass="bg-sky-600 text-white"
        />
      )}
    </div>
  );
}

export default ExplorePage;
