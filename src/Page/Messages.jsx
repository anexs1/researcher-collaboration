import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import {
  FaSearch,
  FaProjectDiagram,
  FaComments,
  FaChevronRight,
  FaClock,
  FaInbox, // Changed icon for empty state
  FaExclamationTriangle, // Error icon
  FaTimes, // Clear search icon
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// --- Component Imports ---
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage"; // Assuming this handles retry well

// --- Constants ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Helper Functions ---
const getAuthToken = () => localStorage.getItem("authToken");

const createAxiosInstance = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// --- Type Definitions (Conceptual) ---
/**
 * @typedef {object} ProjectChatInfo
 * @property {string|number} projectId
 * @property {string} projectName
 * @property {string} [lastMessageSnippet]
 * @property {string} [lastMessageAt] // ISO String ideally
 * @property {number} [unreadCount]
 */

// --- Custom Hook for Fetching Project Chats ---
/**
 * Fetches the list of project chats the user is part of.
 * @returns {{
 *   projectChats: ProjectChatInfo[],
 *   isLoading: boolean,
 *   error: string | null,
 *   refetch: () => void
 * }}
 */
function useProjectChats() {
  const [projectChats, setProjectChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0); // To manually trigger refetch

  const refetch = useCallback(() => setFetchTrigger((c) => c + 1), []);

  useEffect(() => {
    let isMounted = true;
    const fetchChats = async () => {
      //   console.log("HOOK useProjectChats: Fetching..."); // Keep commented unless debugging
      setIsLoading(true);
      setError(null);
      const token = getAuthToken();

      if (!token) {
        setError("Authentication required. Please log in.");
        setIsLoading(false);
        setProjectChats([]);
        return;
      }

      try {
        const apiClient = createAxiosInstance(token);
        const response = await apiClient.get("/api/messaging/projects");

        if (!isMounted) return;

        if (response.data?.success && Array.isArray(response.data.data)) {
          // Sort projects alphabetically by name for consistency
          const sortedProjects = response.data.data.sort((a, b) =>
            (a.projectName || "").localeCompare(b.projectName || "")
          );
          // TODO: Process lastMessageAt into a formatted string here if needed, or do it in the item component
          setProjectChats(sortedProjects);
        } else {
          throw new Error(
            response.data?.message || "Failed to load project chats."
          );
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(
          "HOOK useProjectChats: Error fetching project chats:",
          err
        );
        let errorMsg = "Could not load your project chats.";
        if (err instanceof AxiosError) {
          if (err.response?.status === 401)
            errorMsg = "Session expired. Please log in again.";
          else
            errorMsg =
              err.response?.data?.message ||
              `Server Error (${err.response?.status || "Unknown"}).`;
        } else if (err.request) {
          errorMsg = "Network error. Please check your connection.";
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }
        setError(errorMsg);
        setProjectChats([]); // Clear data on error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchChats();

    return () => {
      isMounted = false; // Cleanup function to prevent state updates on unmounted component
      //   console.log("HOOK useProjectChats: Unmounting fetch effect."); // Keep commented unless debugging
    };
  }, [fetchTrigger]); // Depend on fetchTrigger for manual refetch

  return { projectChats, isLoading, error, refetch };
}

// --- Child Components ---

const SearchBar = React.memo(({ searchTerm, setSearchTerm }) => (
  <div className="mb-6 md:mb-8 px-1">
    <div className="relative max-w-xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
        <FaSearch className="text-gray-400 h-5 w-5" />
      </div>
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search projects by name..."
        className="block w-full pl-12 pr-10 py-3 border border-gray-300 rounded-full text-base leading-6 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm hover:shadow transition duration-150 ease-in-out"
        aria-label="Search projects"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
          aria-label="Clear search"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
));

// ***** CORRECTION HERE: Accept itemVariants as a prop *****
const ProjectListItem = React.memo(({ project, onClick, itemVariants }) => {
  // Dummy formatting - replace with actual date-fns logic when data is available
  const formatTimestamp = (isoString) => {
    if (!isoString) return "No activity";
    // Example: return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
    try {
      // Placeholder logic - Replace with actual date formatting
      const date = new Date(isoString);
      // Very basic relative time - replace with date-fns for better results
      const diff = Math.round((new Date() - date) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "Today";
      if (diff === 1) return "Yesterday";
      return `${diff} days ago`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  return (
    // ***** CORRECTION HERE: Use the passed itemVariants prop *****
    <motion.li
      variants={itemVariants} // Use variants defined in the parent
      layout // Animate layout changes smoothly
    >
      <button
        onClick={() => onClick(project.projectId)}
        className="w-full flex items-center p-4 bg-white rounded-lg shadow-md border border-gray-200/80 hover:bg-indigo-50/50 hover:shadow-lg hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 text-left group transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
        aria-label={`Open chat for project ${
          project.projectName || `ID ${project.projectId}`
        }`}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mr-4 h-11 w-11 sm:h-12 sm:w-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-inner border border-indigo-200/50 group-hover:scale-105 transition-transform duration-150">
          <FaProjectDiagram className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
        </div>

        {/* Main Info */}
        <div className="flex-grow overflow-hidden mr-3">
          <p className="text-md sm:text-lg font-semibold text-gray-800 group-hover:text-indigo-800 truncate transition-colors duration-150">
            {project.projectName || `Project ${project.projectId}`}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 truncate mt-1 italic">
            {project.lastMessageSnippet || "No messages yet..."}
          </p>
        </div>

        {/* Right Side Info */}
        <div className="flex flex-col items-end flex-shrink-0 ml-auto space-y-1 text-right pl-2">
          <span className="text-xs text-gray-500 group-hover:text-gray-700 flex items-center gap-1 whitespace-nowrap transition-colors duration-150">
            <FaClock className="w-3 h-3 flex-shrink-0" />
            <span>{formatTimestamp(project.lastMessageAt)}</span>
          </span>
          {/* Unread Count Badge */}
          {project.unreadCount > 0 && (
            <span
              className="text-xs bg-indigo-600 text-white font-bold rounded-full px-2 py-0.5 shadow-sm self-end"
              aria-label={`${project.unreadCount} unread messages`}
            >
              {project.unreadCount > 99 ? "99+" : project.unreadCount}
            </span>
          )}
          {/* Placeholder for alignment when no unread count */}
          {!project.unreadCount && <div className="h-[22px]"></div>}
        </div>

        {/* Chevron */}
        <div className="ml-3 flex-shrink-0 self-center">
          <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors duration-150 transform group-hover:translate-x-0.5" />
        </div>
      </button>
    </motion.li>
  );
});

const EmptyState = React.memo(
  ({ isSearchActive, clearSearch, exploreLink = "/explore" }) => (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="text-center py-16 sm:py-24 px-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-6 max-w-2xl mx-auto"
    >
      <FaInbox className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-indigo-200 mb-6" />
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">
        {isSearchActive ? "No Projects Found" : "Your Chat List is Empty"}
      </h3>
      <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
        {isSearchActive
          ? "We couldn't find any projects matching your search. Try different keywords or clear the search."
          : "It seems you're not part of any project chats yet. Join or create a project to start collaborating!"}
      </p>
      <div className="mt-8">
        {isSearchActive ? (
          <button
            onClick={clearSearch}
            className="px-5 py-2.5 text-sm sm:text-base font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:scale-105"
          >
            Clear Search
          </button>
        ) : (
          <Link
            to={exploreLink}
            className="px-5 py-2.5 text-sm sm:text-base font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out inline-block transform hover:scale-105" // Added inline-block
          >
            Explore Projects
          </Link>
        )}
      </div>
    </motion.div>
  )
);

const LoadingState = () => (
  <motion.div
    key="loading"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="flex flex-col justify-center items-center py-24 text-center min-h-[300px]" // Added min-height
  >
    <LoadingSpinner size="xl" />
    <p className="mt-4 text-lg sm:text-xl font-medium text-gray-500">
      Loading Project Chats...
    </p>
  </motion.div>
);

const ErrorState = ({ error, onRetry }) => (
  <motion.div
    key="error"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="py-10 max-w-2xl mx-auto"
  >
    <ErrorMessage
      title="Failed to Load Chats"
      message={error || "An unexpected error occurred."}
      onRetry={onRetry}
      icon={FaExclamationTriangle} // Use specific icon
    />
  </motion.div>
);

// --- Main Messages Component ---
function Messages({ currentUser }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // --- Data Fetching using Custom Hook ---
  const {
    projectChats,
    isLoading,
    error: fetchError,
    refetch: refetchProjectChats,
  } = useProjectChats();

  // --- Filtering Logic (Memoized) ---
  const filteredProjects = useMemo(() => {
    if (!searchTerm) {
      return projectChats; // Return all if no search term
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return projectChats.filter((project) =>
      project.projectName?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [projectChats, searchTerm]);

  // --- Navigation ---
  const handleProjectClick = useCallback(
    (projectId) => {
      if (projectId) {
        navigate(`/chat/project/${projectId}`);
      } else {
        console.error(
          "Messages.jsx: Attempted navigation with invalid projectId."
        );
      }
    },
    [navigate]
  );

  // --- Animation Variants ---
  const listVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
      },
      exit: { opacity: 0 },
    }),
    []
  );

  // Define itemVariants here so it's in scope for renderContent
  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 15, scale: 0.98 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      },
      exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
    }),
    []
  );

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (fetchError) {
      return <ErrorState error={fetchError} onRetry={refetchProjectChats} />;
    }
    if (filteredProjects.length === 0) {
      return (
        <EmptyState
          isSearchActive={!!searchTerm}
          clearSearch={() => setSearchTerm("")}
        />
      );
    }
    return (
      <motion.ul
        key="project-list"
        className="space-y-3 sm:space-y-4 mt-4 pb-6" // Added padding bottom
        variants={listVariants}
        initial="hidden"
        animate="visible"
        exit="exit" // Use the defined exit variant
      >
        {filteredProjects.map((project) => (
          // ***** CORRECTION HERE: Pass itemVariants prop *****
          <ProjectListItem
            key={project.projectId}
            project={project}
            onClick={handleProjectClick}
            itemVariants={itemVariants} // Pass variants down
          />
        ))}
      </motion.ul>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto px-4 py-6 sm:py-8 md:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      {/* Page Header */}
      <header className="mb-6 md:mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
          Project Chats
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          Select a project to view its conversation.
        </p>
      </header>

      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto custom-scrollbar -mx-4 px-4">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
}

export default Messages;
