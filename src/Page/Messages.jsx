// src/pages/Messages.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSearch, // Search icon
  FaProjectDiagram, // Project icon
  FaComments, // Empty state icon
  FaChevronRight, // Navigation indicator
  FaClock, // Placeholder for time
  FaInfoCircle, // Placeholder for info/last message
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; // For animations

// Adjust import paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Messages Component ---
// Lists projects available for chatting
function Messages({ currentUser }) {
  // --- State ---
  const [projects, setProjects] = useState([]); // Array of { projectId, projectName, (optional future: lastMessageSnippet, lastMessageAt, unreadCount) }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // --- Data Fetching ---
  const fetchProjects = useCallback(async () => {
    // console.log("Messages.jsx: Fetching project chat list...");
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken"); // Ensure this key is correct
    if (!token) {
      setError("Authentication required. Please log in.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/messaging/projects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Sort projects alphabetically by name for consistent display
        const sortedProjects = response.data.data.sort((a, b) =>
          (a.projectName || "").localeCompare(b.projectName || "")
        );
        setProjects(sortedProjects);
      } else {
        throw new Error(
          response.data?.message || "Failed to load project chats."
        );
      }
    } catch (err) {
      console.error("Messages.jsx: Error fetching project chat list:", err);
      let errorMsg = "Could not load your project chats.";
      // Basic error message handling
      if (axios.isCancel(err)) {
        errorMsg = "Request timed out.";
      } else if (err.response) {
        if (err.response.status === 401)
          errorMsg = "Session expired. Please log in again.";
        else
          errorMsg =
            err.response.data?.message || `Error ${err.response.status}.`;
      } else if (err.request) {
        errorMsg = "Network error. Please check connection.";
      } else {
        errorMsg = err.message || "An unknown error occurred.";
      }
      setError(errorMsg);
      setProjects([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, []); // fetchProjects is stable, no external dependencies

  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- Filtering Logic ---
  // Filters the fetched projects based on the search term (client-side)
  const filteredProjects = projects.filter((project) =>
    project.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Navigation Handler ---
  const handleProjectClick = (projectId) => {
    if (!projectId) {
      console.error("Messages.jsx: Invalid projectId for navigation.");
      return;
    }
    navigate(`/chat/project/${projectId}`); // Navigate to the project's chat page
  };

  // --- Animation Variants (for Framer Motion) ---
  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }, // Stagger children animation
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      {" "}
      {/* Adjusted background */}
      {/* Page Header */}
      <div className="mb-8 pb-5 border-b border-gray-300">
        {" "}
        {/* Slightly darker border */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Project Chats
        </h1>
        <p className="text-base text-gray-600 mt-2">
          Access conversations within your collaborative projects.
        </p>
      </div>
      {/* Search Bar - Centered, Rounded */}
      <div className="mb-6 px-2">
        <div className="relative max-w-lg mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {" "}
            {/* Adjusted padding */}
            <FaSearch className="text-gray-400 h-5 w-5" />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name..."
            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full text-base leading-6 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150 ease-in-out" // Increased padding/size
            aria-label="Search projects"
          />
        </div>
      </div>
      {/* Main Content Area: Loading / Error / Empty / List */}
      <div className="flex-grow overflow-y-auto custom-scrollbar -mx-4 px-4 pb-4">
        <AnimatePresence mode="wait">
          {" "}
          {/* Use mode="wait" for smoother transitions between states */}
          {isLoading ? (
            // Loading State
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col justify-center items-center py-24 text-center"
            >
              <LoadingSpinner size="xl" />
              <p className="mt-4 text-xl font-medium text-gray-500">
                Loading Project Chats...
              </p>
            </motion.div>
          ) : error ? (
            // Error State
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10"
            >
              <ErrorMessage
                title="Failed to Load Chats"
                message={error}
                onRetry={fetchProjects}
                onClose={() => setError(null)}
              />
            </motion.div>
          ) : filteredProjects.length === 0 ? (
            // Empty State (Handles both no projects and no search results)
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 px-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-6"
            >
              <FaComments className="mx-auto h-20 w-20 text-indigo-200 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-800">
                {searchTerm
                  ? "No Matching Projects"
                  : "No Project Chats Available"}
              </h3>
              <p className="mt-3 text-base text-gray-600 max-w-lg mx-auto">
                {searchTerm
                  ? "Your search didn't match any project names. Clear the search or try different keywords."
                  : "It looks like you haven't joined or created any projects yet. Find a project to start collaborating!"}
              </p>
              <div className="mt-8">
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-6 py-2.5 text-base font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  >
                    Clear Search
                  </button>
                ) : (
                  <Link
                    to="/explore"
                    /* Changed link to /explore */ className="px-6 py-2.5 text-base font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  >
                    Explore Projects
                  </Link>
                )}
              </div>
            </motion.div>
          ) : (
            // List of Project Chats
            <motion.ul
              key="project-list"
              className="space-y-4 mt-4"
              variants={listVariants}
              initial="hidden"
              animate="visible"
              exit="hidden" // Add exit animation
            >
              {filteredProjects.map((project) => (
                <motion.li key={project.projectId} variants={itemVariants}>
                  <button
                    onClick={() => handleProjectClick(project.projectId)}
                    className="w-full flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 hover:bg-indigo-50 hover:shadow-lg hover:border-indigo-400 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left group"
                  >
                    {/* Project Icon */}
                    <div className="flex-shrink-0 mr-5 h-12 w-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <FaProjectDiagram className="w-6 h-6 text-indigo-700" />
                    </div>
                    {/* Project Info */}
                    <div className="flex-grow overflow-hidden mr-3">
                      <p className="text-lg font-semibold text-gray-900 truncate group-hover:text-indigo-800 transition-colors">
                        {project.projectName || `Project ${project.projectId}`}
                      </p>
                      {/* Placeholder for last message snippet - styled */}
                      <p className="text-sm text-gray-500 truncate mt-1 italic flex items-center gap-1.5">
                        <FaInfoCircle className="flex-shrink-0 w-3 h-3 text-gray-400" />
                        <span>
                          {project.lastMessageSnippet || "No messages yet..."}
                        </span>
                        {/* TODO: Replace above line with actual data when backend provides it */}
                      </p>
                    </div>
                    {/* Right Side Info (Timestamp Placeholder, Unread Badge Placeholder, Chevron) */}
                    <div className="flex flex-col items-end flex-shrink-0 ml-auto space-y-1.5 text-right">
                      {/* Placeholder for Timestamp - styled */}
                      <span className="text-xs text-gray-500 group-hover:text-gray-700 flex items-center gap-1">
                        <FaClock className="w-3 h-3" />
                        <span>
                          {project.lastMessageAtFormatted || "No activity"}
                        </span>
                        {/* TODO: Replace above line with formatted timestamp */}
                      </span>
                      {/* Placeholder for Unread Count Badge - styled */}
                      {project.unreadCount > 0 && ( // Example conditional rendering
                        <span className="text-xs bg-indigo-600 text-white font-bold rounded-full px-2 py-0.5 shadow-sm">
                          {project.unreadCount > 9 ? "9+" : project.unreadCount}
                        </span>
                      )}
                      {/* Chevron moved below other items */}
                      <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors mt-1" />
                    </div>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Messages;
