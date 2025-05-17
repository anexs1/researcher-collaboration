import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ProjectCard from "../Component/ProjectCard"; // Adjust path if needed
import PaginationControls from "../Component/PaginationControls"; // Adjust path if needed

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_PROFILE_PIC = "/default-avatar.png"; // Ensure this is in your public folder
const DEBOUNCE_DELAY = 500; // milliseconds

function UserProjectsPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userError, setUserError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState(""); // Live input from the search box
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // Term used for API calls

  const abortControllerRef = useRef(null); // For aborting fetch requests

  // --- User Data Fetching ---
  useEffect(() => {
    if (!userId) return;
    console.log("[User Effect] Fetching user data for userId:", userId);
    setUserLoading(true);
    setUserError(null);
    const fetchUser = async () => {
      try {
        const userRes = await fetch(
          `${API_BASE_URL}/api/users/public/${userId}`
        );
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success) {
            setUser(userData.data);
            console.log("[User Effect] User data fetched:", userData.data);
          } else {
            setUser(null);
            setUserError(userData.message || "Failed to load user data.");
            console.warn(
              `[User Effect] API error fetching user ${userId}: ${userData.message}`
            );
          }
        } else {
          const errorData = await userRes
            .json()
            .catch(() => ({ message: "Failed to parse user error response" }));
          setUser(null);
          setUserError(errorData.message || `Error ${userRes.status}`);
          console.warn(
            `[User Effect] HTTP error fetching user ${userId}, status: ${userRes.status}`
          );
        }
      } catch (err) {
        setUser(null);
        setUserError(err.message || "An unexpected error occurred.");
        console.error(`[User Effect] Exception fetching user ${userId}:`, err);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // --- Project Data Fetching ---
  const fetchProjects = useCallback(
    async (pageToFetch, currentSearchQuery) => {
      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log("[FetchProjects] Aborted previous fetch request.");
      }
      // Create a new AbortController for the new request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      console.log(
        `[FetchProjects CALLED] For userId: ${userId}, Page: ${pageToFetch}, Search: "${currentSearchQuery}"`
      );
      setLoadingProjects(true);
      setError(null);

      try {
        let projectsApiUrl = `${API_BASE_URL}/api/projects/user/${userId}?page=${pageToFetch}&limit=9`;
        if (currentSearchQuery) {
          projectsApiUrl += `&search=${encodeURIComponent(currentSearchQuery)}`;
        }
        console.log("[FetchProjects] Fetching URL:", projectsApiUrl);

        const projectsRes = await fetch(projectsApiUrl, { signal });

        if (signal.aborted) {
          console.log(
            "[FetchProjects] Fetch aborted (checked after await fetch). Will not process response."
          );
          return;
        }

        if (!projectsRes.ok) {
          const errorData = await projectsRes
            .json()
            .catch(() => ({
              message: "Failed to parse projects error response",
            }));
          throw new Error(
            `HTTP error fetching projects! status: ${
              projectsRes.status
            }, message: ${errorData.message || projectsRes.statusText}`
          );
        }

        const projectsData = await projectsRes.json();

        if (signal.aborted) {
          // Check again after .json()
          console.log(
            "[FetchProjects] Fetch aborted (checked after await .json()). Will not process response."
          );
          return;
        }

        if (projectsData.success) {
          console.log(
            "[FetchProjects] Success. Data:",
            projectsData.data,
            "Pagination:",
            projectsData.pagination
          );
          setProjects(projectsData.data);
          setPagination(projectsData.pagination);
          // setCurrentPage(projectsData.pagination.currentPage); // Sync current page, ensure it doesn't cause loops if backend page differs slightly
        } else {
          throw new Error(
            projectsData.message ||
              "Failed to fetch user projects (API reported not success)."
          );
        }
        setLoadingProjects(false); // Success, set loading false
      } catch (err) {
        if (err.name === "AbortError") {
          console.log(
            "[FetchProjects] CATCH: Fetch aborted by AbortController. This is expected if a new request was made."
          );
          // Do not set error or loading false, as this was intentional.
          // The next non-aborted request will handle loading state.
          return;
        }
        // Handle other errors
        console.error(
          `[FetchProjects] ERROR for user ${userId}, page ${pageToFetch}, search "${currentSearchQuery}":`,
          err
        );
        setError(err.message);
        setProjects([]);
        setPagination(null);
        setLoadingProjects(false); // Error (not abort), set loading false
      } finally {
        // Clean up the controller ref if this fetch completes (successfully or with non-abort error)
        // and it's the one currently in the ref.
        if (
          abortControllerRef.current &&
          abortControllerRef.current.signal === signal
        ) {
          abortControllerRef.current = null;
        }
      }
    },
    [userId] // API_BASE_URL is effectively constant from env
  );

  // --- Effect to reset search/pagination when userId changes ---
  useEffect(() => {
    console.log(
      "[UserId Change Effect] userId changed to:",
      userId,
      "Resetting search and pagination."
    );
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setCurrentPage(1);
    // Abort any ongoing fetches for the old user
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log(
        "[UserId Change Effect] Aborted ongoing fetch for previous user."
      );
    }
  }, [userId]);

  // --- Debounce searchTerm into debouncedSearchTerm & handle page reset ---
  useEffect(() => {
    console.log(
      `[Debounce Effect Setup] searchTerm: "${searchTerm}", debouncedSearchTerm: "${debouncedSearchTerm}", currentPage: ${currentPage}`
    );
    const handler = setTimeout(() => {
      console.log(
        `[Debounce Timer FIRED] For searchTerm: "${searchTerm}". Current debounced: "${debouncedSearchTerm}"`
      );
      // Only update if the live input (searchTerm) has actually resulted in a new search query
      if (searchTerm !== debouncedSearchTerm) {
        console.log(
          `[Debounce Logic] Updating debouncedSearchTerm from "${debouncedSearchTerm}" to "${searchTerm}".`
        );
        setDebouncedSearchTerm(searchTerm);
        if (currentPage !== 1) {
          console.log(
            `[Debounce Logic] New search term, resetting currentPage from ${currentPage} to 1.`
          );
          setCurrentPage(1);
        } else {
          console.log(
            `[Debounce Logic] New search term, currentPage is already 1.`
          );
        }
      } else {
        console.log(
          `[Debounce Logic] searchTerm "${searchTerm}" is same as debouncedSearchTerm. No change to debouncedSearchTerm or currentPage from debounce logic.`
        );
      }
    }, DEBOUNCE_DELAY);

    return () => {
      console.log(
        `[Debounce Cleanup] Clearing timeout for searchTerm: "${searchTerm}"`
      );
      clearTimeout(handler);
    };
    // Dependencies:
    // - searchTerm: User input, triggers the debounce.
    // - debouncedSearchTerm: To compare against searchTerm to see if a real change for API call is needed.
    // - currentPage: To decide if page reset is needed.
  }, [searchTerm, debouncedSearchTerm, currentPage]);

  // --- Main data fetching trigger effect for projects ---
  useEffect(() => {
    console.log(
      `[Main Fetch Effect] Triggered. userId: ${userId}, currentPage: ${currentPage}, debouncedSearchTerm: "${debouncedSearchTerm}"`
    );
    if (userId) {
      // This effect runs when userId, currentPage, or debouncedSearchTerm changes.
      fetchProjects(currentPage, debouncedSearchTerm);
    } else {
      console.log("[Main Fetch Effect] No userId, not fetching projects.");
    }
    // Cleanup for this effect: abort fetch if dependencies change before fetch completes
    // This is largely handled by fetchProjects itself and the userId change effect.
    // return () => {
    //   if (abortControllerRef.current) {
    //     abortControllerRef.current.abort();
    //     console.log("[Main Fetch Effect Cleanup] Aborted fetch due to dependency change.");
    //   }
    // };
  }, [userId, currentPage, debouncedSearchTerm, fetchProjects]); // fetchProjects is memoized

  const handlePageChange = (newPage) => {
    console.log(
      `[Handle Page Change] To page: ${newPage}. Current: ${currentPage}, Loading: ${loadingProjects}`
    );
    if (
      newPage >= 1 &&
      newPage <= (pagination?.totalPages || 1) &&
      newPage !== currentPage &&
      !loadingProjects
    ) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchInputChange = (e) => {
    console.log("[Search Input Change] Value:", e.target.value);
    setSearchTerm(e.target.value);
  };

  // --- Render Logic ---
  if (userLoading && loadingProjects && !user && projects.length === 0) {
    return (
      <div className="p-6 text-center text-xl text-gray-700">
        Loading user and project data...
      </div>
    );
  }

  if (userError && !user) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading user information: {userError}
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
            {" "}
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />{" "}
          </svg>
          Back to Explore Users
        </Link>
      </div>

      {userLoading && !user && (
        <div className="p-4 text-center text-gray-600">
          Loading user profile...
        </div>
      )}
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
              {" "}
              {user.username}'s Projects{" "}
            </h1>
            {user.jobTitle && <p className="text-gray-600">{user.jobTitle}</p>}
            {user.university && (
              <p className="text-sm text-gray-500">{user.university}</p>
            )}
          </div>
        </div>
      )}
      {!user && !userLoading && !userError && (
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
          {" "}
          Projects for User ID {userId}{" "}
        </h1>
      )}
      {userError && user && (
        <p className="text-sm text-red-500 mb-4">
          Note: There was an issue updating user details: {userError}
        </p>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search projects by name..."
          value={searchTerm}
          onChange={handleSearchInputChange}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          disabled={userLoading} // Or disable if projects are loading: loadingProjects
        />
      </div>

      {error && (
        <div className="p-4 text-center text-red-500 bg-red-50 rounded-md mb-4">
          {" "}
          Error loading projects: {error}{" "}
        </div>
      )}
      {loadingProjects && (
        <p className="text-center text-gray-600 my-4">Loading projects...</p>
      )}

      {!loadingProjects && projects.length === 0 && (
        <p className="text-center text-gray-600 text-lg py-10">
          {debouncedSearchTerm
            ? user
              ? `${user.username} has no projects matching "${debouncedSearchTerm}".`
              : `No projects found for this user matching "${debouncedSearchTerm}".`
            : user
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

      {!loadingProjects && pagination && pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          isLoading={loadingProjects}
        />
      )}
    </div>
  );
}

export default UserProjectsPage;
