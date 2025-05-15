import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_PROFILE_PIC = "/default-avatar.png"; // Ensure this path is correct in your public folder

function ExplorePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/discoverable?page=${page}&limit=12`
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
        setUsers(result.data); // This data should now include project counts from backend
        setPagination(result.pagination);
        setCurrentPage(result.pagination.currentPage);
      } else {
        throw new Error(result.message || "Failed to fetch users.");
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= (pagination?.totalPages || 1) &&
      newPage !== currentPage &&
      !loading
    ) {
      setCurrentPage(newPage);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="p-6 text-center text-xl text-gray-700">
        Loading users...
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error fetching data: {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Discover Users</h1>

      {users.length === 0 && !loading && (
        <div className="p-6 text-center text-gray-600">No users found.</div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-5 border rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white flex flex-col h-full"
          >
            <div className="flex items-center mb-3">
              <img
                src={
                  user.profilePictureUrl
                    ? `${API_BASE_URL}${user.profilePictureUrl}`
                    : DEFAULT_PROFILE_PIC
                }
                alt={`${user.username}'s profile`}
                className="w-16 h-16 rounded-full mr-4 object-cover border-2 border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PROFILE_PIC;
                }}
              />
              <div>
                <h2 className="text-lg font-semibold text-blue-700">
                  {user.username}
                </h2>
                {user.jobTitle && (
                  <p className="text-xs text-gray-500">{user.jobTitle}</p>
                )}
              </div>
            </div>

            {user.university && (
              <p className="text-sm text-gray-600 mb-1">
                <span role="img" aria-label="institution" className="mr-1">
                  🎓
                </span>
                {user.university}
                {user.department && `, ${user.department}`}
              </p>
            )}
            {user.medicalSpecialty && (
              <p className="text-sm text-gray-600 mb-1">
                <span role="img" aria-label="institution" className="mr-1">
                  🩺
                </span>
                {user.medicalSpecialty}
                {user.hospitalName && ` at ${user.hospitalName}`}
              </p>
            )}
            {user.companyName && !user.university && !user.medicalSpecialty && (
              <p className="text-sm text-gray-600 mb-1">
                <span role="img" aria-label="institution" className="mr-1">
                  🏢
                </span>
                {user.companyName}
              </p>
            )}

            {user.bio && (
              <p className="text-xs text-gray-500 mt-2 mb-3 line-clamp-3 flex-grow min-h-[45px]">
                {user.bio}
              </p>
            )}

            {/* Display Project Counts (assuming backend sends these fields now) */}
            {(user.totalProjects !== undefined ||
              user.activeProjects !== undefined ||
              user.completedProjects !== undefined) && (
              <div className="text-xs text-gray-600 mt-2 space-y-0.5 border-t pt-2">
                <p>
                  <span role="img" aria-label="projects" className="mr-1">
                    📁
                  </span>
                  Total Projects:{" "}
                  <span className="font-medium">{user.totalProjects ?? 0}</span>
                </p>
                <p>
                  <span
                    role="img"
                    aria-label="active projects"
                    className="mr-1"
                  >
                    🚧
                  </span>
                  Active:{" "}
                  <span className="font-medium">
                    {user.activeProjects ?? 0}
                  </span>
                </p>
                <p>
                  <span
                    role="img"
                    aria-label="completed projects"
                    className="mr-1"
                  >
                    ✅
                  </span>
                  Completed:{" "}
                  <span className="font-medium">
                    {user.completedProjects ?? 0}
                  </span>
                </p>
              </div>
            )}

            <div className="mt-auto pt-4 flex gap-2">
              {" "}
              {/* mt-auto pushes to bottom */}
              <Link
                to={`/users/${user.id}/projects`} // <<< UPDATED LINK
                className="flex-1 text-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                View Projects
              </Link>
              {/* You might also have a direct link to a simpler profile page */}
              {/* <Link to={`/profile/${user.id}`} className="flex-1 text-center ...">View Profile</Link> */}
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
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
