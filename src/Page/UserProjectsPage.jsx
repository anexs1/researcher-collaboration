import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ProjectCard from "../Component/ProjectCard"; // Adjust path if needed
import PaginationControls from "../Component/PaginationControls"; // Adjust path if needed

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_PROFILE_PIC = "/default-avatar.png"; // Ensure this is in your public folder

function UserProjectsPage() {
  const { userId } = useParams();
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUserDataAndProjects = useCallback(
    async (pageToFetch) => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user details first
        const userRes = await fetch(
          `${API_BASE_URL}/api/users/public/${userId}`
        );
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success) {
            setUser(userData.data);
          } else {
            console.warn(
              `Could not fetch user data for ID ${userId}: ${userData.message}`
            );
            // Optional: throw an error or set a specific user not found state
          }
        } else {
          console.warn(
            `Could not fetch user data for ID ${userId}, status: ${userRes.status}`
          );
        }

        // Fetch projects for this user
        const projectsRes = await fetch(
          `${API_BASE_URL}/api/projects/user/${userId}?page=${pageToFetch}&limit=9`
        ); // Fetch 9 projects per page
        if (!projectsRes.ok) {
          const errorData = await projectsRes.json().catch(() => ({
            message: "Failed to parse projects error response",
          }));
          throw new Error(
            `HTTP error fetching projects! status: ${
              projectsRes.status
            }, message: ${errorData.message || projectsRes.statusText}`
          );
        }
        const projectsData = await projectsRes.json();
        if (projectsData.success) {
          setProjects(projectsData.data);
          setPagination(projectsData.pagination);
          setCurrentPage(projectsData.pagination.currentPage); // Ensure current page state matches fetched page
        } else {
          throw new Error(
            projectsData.message || "Failed to fetch user projects."
          );
        }
      } catch (err) {
        console.error(
          `Error fetching data for user ${userId}, page ${pageToFetch}:`,
          err
        );
        setError(err.message);
        setProjects([]); // Clear projects on error
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  ); // userId is a dependency

  useEffect(() => {
    if (userId) {
      fetchUserDataAndProjects(currentPage);
    }
  }, [userId, currentPage, fetchUserDataAndProjects]);

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= (pagination?.totalPages || 1) &&
      newPage !== currentPage &&
      !loading
    ) {
      // No need to set projects to [] here, fetchUserDataAndProjects will handle it
      setCurrentPage(newPage); // This will trigger the useEffect
    }
  };

  if (loading && projects.length === 0 && !user) {
    // More precise initial loading
    return (
      <div className="p-6 text-center text-xl text-gray-700">
        Loading user projects...
      </div>
    );
  }

  if (error && !user) {
    // If user data also failed and it's a critical error
    return (
      <div className="p-6 text-center text-red-500">
        Error: {error} <br /> Could not load user information.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 min-h-screen">
      <div className="mb-6">
        <Link
          to="/explore"
          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Back to Explore Users
        </Link>
      </div>

      {user && (
        <div className="flex items-center mb-8 p-4 bg-white shadow rounded-lg">
          <img
            src={
              user.profilePictureUrl
                ? `${API_BASE_URL}${user.profilePictureUrl}`
                : DEFAULT_PROFILE_PIC
            }
            alt={user.username}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-gray-300 mr-4 md:mr-6"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_PROFILE_PIC;
            }}
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {user.username}'s Projects
            </h1>
            {user.jobTitle && <p className="text-gray-600">{user.jobTitle}</p>}
            {user.university && (
              <p className="text-sm text-gray-500">{user.university}</p>
            )}
          </div>
        </div>
      )}
      {!user && !loading && !error && (
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
          Projects for User ID {userId}
        </h1>
      )}
      {error &&
        user && ( // Show error if user data loaded but projects failed
          <div className="p-4 text-center text-red-500 bg-red-50 rounded-md mb-4">
            Error loading projects: {error}
          </div>
        )}

      {loading && (
        <p className="text-center text-gray-600 my-4">Loading projects...</p>
      )}

      {!loading && projects.length === 0 && (
        <p className="text-center text-gray-600 text-lg py-10">
          {user
            ? `${user.username} has no projects to display yet.`
            : "No projects found for this user."}
        </p>
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {!loading && pagination && pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage} // Use the state variable
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          isLoading={loading}
        />
      )}
    </div>
  );
}

export default UserProjectsPage;
