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
  FaInbox,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Components
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAuthToken = () => localStorage.getItem("authToken");

const createAxiosInstance = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

function useProjectChats() {
  const [projectChats, setProjectChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => setFetchTrigger((c) => c + 1), []);

  useEffect(() => {
    let isMounted = true;
    const fetchChats = async () => {
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
          const sortedProjects = response.data.data.sort((a, b) =>
            (a.projectName || "").localeCompare(b.projectName || "")
          );
          setProjectChats(sortedProjects);
        } else {
          throw new Error(
            response.data?.message || "Failed to load project chats."
          );
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching project chats:", err);
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
        setProjectChats([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchChats();

    return () => {
      isMounted = false;
    };
  }, [fetchTrigger]);

  return { projectChats, isLoading, error, refetch };
}

const SearchBar = React.memo(({ searchTerm, setSearchTerm }) => (
  <div className="mb-6 px-1">
    <div className="relative max-w-xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
        <FaSearch className="text-gray-400 h-5 w-5" />
      </div>
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search projects by name..."
        className="block w-full pl-12 pr-10 py-3 border border-gray-200 rounded-full text-base leading-6 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all duration-200"
        aria-label="Search projects"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none rounded-full p-1 transition-colors duration-150"
          aria-label="Clear search"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
));

const ProjectListItem = React.memo(({ project, onClick, itemVariants }) => {
  const formatTimestamp = (isoString) => {
    if (!isoString) return "No activity";
    try {
      const date = new Date(isoString);
      const diff = Math.round((new Date() - date) / (1000 * 60 * 60 * 24));
      if (diff === 0) return "Today";
      if (diff === 1) return "Yesterday";
      return `${diff} days ago`;
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <motion.li
      variants={itemVariants}
      layout
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        onClick={() => onClick(project.projectId)}
        className="w-full flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-indigo-50/50 hover:shadow-md hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 text-left group transition-all duration-200"
        aria-label={`Open chat for project ${
          project.projectName || `ID ${project.projectId}`
        }`}
      >
        <div className="flex-shrink-0 mr-4 h-11 w-11 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center shadow-inner border border-indigo-100 group-hover:scale-105 transition-transform duration-150">
          <FaProjectDiagram className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
        </div>

        <div className="flex-grow overflow-hidden mr-3">
          <p className="text-md font-semibold text-gray-800 group-hover:text-indigo-800 truncate transition-colors">
            {project.projectName || `Project ${project.projectId}`}
          </p>
          <p className="text-xs text-gray-500 truncate mt-1 italic">
            {project.lastMessageSnippet || "No messages yet..."}
          </p>
        </div>

        <div className="flex flex-col items-end flex-shrink-0 ml-auto space-y-1 text-right pl-2">
          <span className="text-xs text-gray-500 group-hover:text-gray-700 flex items-center gap-1 whitespace-nowrap transition-colors">
            <FaClock className="w-3 h-3 flex-shrink-0" />
            <span>{formatTimestamp(project.lastMessageAt)}</span>
          </span>
          {project.unreadCount > 0 && (
            <span className="text-xs bg-indigo-600 text-white font-bold rounded-full px-2 py-0.5 shadow-sm self-end">
              {project.unreadCount > 99 ? "99+" : project.unreadCount}
            </span>
          )}
          {!project.unreadCount && <div className="h-[22px]"></div>}
        </div>

        <div className="ml-3 flex-shrink-0 self-center">
          <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-0.5" />
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
      className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-100 mt-6 max-w-2xl mx-auto"
    >
      <FaInbox className="mx-auto h-16 w-16 text-indigo-200 mb-6" />
      <h3 className="text-xl font-semibold text-gray-800">
        {isSearchActive ? "No Projects Found" : "Your Chat List is Empty"}
      </h3>
      <p className="mt-3 text-sm text-gray-600 max-w-lg mx-auto">
        {isSearchActive
          ? "We couldn't find any projects matching your search. Try different keywords or clear the search."
          : "It seems you're not part of any project chats yet. Join or create a project to start collaborating!"}
      </p>
      <div className="mt-8">
        {isSearchActive ? (
          <button
            onClick={clearSearch}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:scale-105"
          >
            Clear Search
          </button>
        ) : (
          <Link
            to={exploreLink}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out inline-block transform hover:scale-105"
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
    className="flex flex-col justify-center items-center py-24 text-center min-h-[300px]"
  >
    <LoadingSpinner size="xl" />
    <p className="mt-4 text-lg font-medium text-gray-500">
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
      icon={FaExclamationTriangle}
    />
  </motion.div>
);

function Messages({ currentUser }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    projectChats,
    isLoading,
    error: fetchError,
    refetch: refetchProjectChats,
  } = useProjectChats();

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projectChats;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return projectChats.filter((project) =>
      project.projectName?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [projectChats, searchTerm]);

  const handleProjectClick = useCallback(
    (projectId) => {
      if (projectId) {
        navigate(`/chat/project/${projectId}`);
      }
    },
    [navigate]
  );

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

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (fetchError)
      return <ErrorState error={fetchError} onRetry={refetchProjectChats} />;
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
        className="space-y-3 mt-4 pb-6"
        variants={listVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {filteredProjects.map((project) => (
          <ProjectListItem
            key={project.projectId}
            project={project}
            onClick={handleProjectClick}
            itemVariants={itemVariants}
          />
        ))}
      </motion.ul>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto px-4 py-6 bg-gradient-to-b from-gray-50 to-white">
      <header className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Project Chats
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Select a project to view its conversation.
        </p>
      </header>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <main className="flex-grow overflow-y-auto custom-scrollbar -mx-4 px-4">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
}

export default Messages;
