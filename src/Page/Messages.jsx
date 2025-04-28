// src/pages/Messages.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSearch,
  FaSpinner,
  FaExclamationTriangle,
  FaProjectDiagram,
  FaComments,
  FaChevronRight, // Added for visual cue
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; // For animations

// Adjust import paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Messages({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    // console.log("Messages.jsx: Initiating fetch for project chat list...");
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken");
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
        // Sort projects alphabetically by name
        const sortedProjects = response.data.data.sort((a, b) =>
          a.projectName.localeCompare(b.projectName)
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
      if (axios.isCancel(err)) {
        errorMsg = "Request timed out.";
      } else if (err.response) {
        if (err.response.status === 401)
          errorMsg = "Session expired. Please log in.";
        else
          errorMsg =
            err.response.data?.message || `Error ${err.response.status}.`;
      } else if (err.request) errorMsg = "Network error. Check connection.";
      else errorMsg = err.message || "Unknown error.";
      setError(errorMsg);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter((project) =>
    project.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectClick = (projectId) => {
    if (!projectId) return;
    // console.log(`Messages.jsx: Navigating to chat for project ID: ${projectId}`);
    navigate(`/chat/project/${projectId}`);
  };

  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Stagger effect for list items
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Page Header */}
      <div className="mb-8 pb-5 border-b border-gray-200">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Project Chats
        </h1>
        <p className="text-base text-gray-600 mt-2">
          Access conversations within your collaborative projects.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-lg mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400 h-5 w-5" />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project name..."
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-base leading-6 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition duration-150 ease-in-out"
            aria-label="Search projects"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto custom-scrollbar -mx-4 px-4 pb-4">
        <AnimatePresence>
          {isLoading ? (
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
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 px-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-6"
            >
              <FaComments className="mx-auto h-20 w-20 text-indigo-200 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-800">
                {searchTerm ? "No Matching Projects" : "No Project Chats"}
              </h3>
              <p className="mt-3 text-base text-gray-600 max-w-lg mx-auto">
                {searchTerm
                  ? "Your search didn't match any project names. Try a different search."
                  : "Join projects or start your own to begin chatting with collaborators."}
              </p>
              <div className="mt-8">
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-6 py-2.5 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  >
                    Clear Search
                  </button>
                ) : (
                  <Link
                    to="/projects"
                    className="px-6 py-2.5 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  >
                    Find Projects
                  </Link>
                )}
              </div>
            </motion.div>
          ) : (
            // List of Project Chats with animation
            <motion.ul
              key="project-list"
              className="space-y-4 mt-4"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredProjects.map((project) => (
                <motion.li key={project.projectId} variants={itemVariants}>
                  <button
                    onClick={() => handleProjectClick(project.projectId)}
                    className="w-full flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200 hover:bg-indigo-50 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left group"
                  >
                    {/* Project Icon */}
                    <div className="flex-shrink-0 mr-5 h-12 w-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <FaProjectDiagram className="w-6 h-6 text-indigo-600" />
                    </div>
                    {/* Project Info */}
                    <div className="flex-grow overflow-hidden mr-3">
                      <p className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-700">
                        {project.projectName || `Project ${project.projectId}`}
                      </p>
                      {/* Placeholder for last message snippet */}
                      <p className="text-xs text-gray-500 truncate mt-1 italic">
                        {/* TODO: Fetch last message from API: project.lastMessageSnippet || 'No messages yet...' */}
                        No recent activity...
                      </p>
                    </div>
                    {/* Indicators (Placeholder) */}
                    <div className="flex flex-col items-end flex-shrink-0 ml-auto space-y-1">
                      {/* Placeholder for Timestamp */}
                      <span className="text-xs text-gray-400 group-hover:text-gray-600">
                        {/* TODO: Fetch last message time: formatTimestamp(project.lastMessageAt) || '' */}
                        Yesterday
                      </span>
                      {/* Placeholder for Unread Count Badge */}
                      {/* {project.unreadCount > 0 && (
                            <span className="text-xs bg-red-500 text-white font-bold rounded-full px-2 py-0.5 animate-pulse">
                                {project.unreadCount}
                            </span>
                        )} */}
                      {/* Always show chevron for navigation affordance */}
                      <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
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
