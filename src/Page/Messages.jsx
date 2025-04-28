// src/pages/Messages.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaSearch,
  FaSpinner,
  FaExclamationTriangle,
  FaProjectDiagram, // Icon for projects
  FaComments, // Icon for empty state
} from "react-icons/fa";

// Adjust import paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

// Ensure API_BASE_URL is correctly configured in your .env file
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Messages({ currentUser }) {
  // Accept currentUser if needed for authorization display, etc.
  // State holds the list of projects the user can chat in
  const [projects, setProjects] = useState([]); // Array of { projectId, projectName }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Callback to fetch the list of projects for the chat list
  const fetchProjects = useCallback(async () => {
    console.log("Messages.jsx: Initiating fetch for project chat list...");
    setIsLoading(true);
    setError(null); // Clear previous errors
    const token = localStorage.getItem("authToken"); // Verify this is the correct key for your token

    if (!token) {
      console.error("Messages.jsx: Auth token not found.");
      setError("Authentication required. Please log in to view your chats.");
      setIsLoading(false);
      // Optional: Redirect to login
      // navigate('/login');
      return;
    }

    try {
      // Make API call to the backend endpoint that returns the list of projects
      const response = await axios.get(
        `${API_BASE_URL}/api/messaging/projects`, // Use the updated backend route
        {
          headers: { Authorization: `Bearer ${token}` },
          // Optional: Add timeout
          // timeout: 10000, // 10 seconds
        }
      );

      // Validate the response structure
      if (response.data?.success && Array.isArray(response.data.data)) {
        console.log(
          `Messages.jsx: Successfully fetched ${response.data.data.length} project chats.`
        );
        setProjects(response.data.data);
      } else {
        console.error(
          "Messages.jsx: Received invalid data structure from API.",
          response.data
        );
        throw new Error(
          response.data?.message ||
            "Failed to load project chats or received unexpected data."
        );
      }
    } catch (err) {
      console.error("Messages.jsx: Error fetching project chat list:", err);
      let errorMsg = "Could not load your project chats.";
      if (axios.isCancel(err)) {
        console.log("Request canceled:", err.message);
        errorMsg = "Request timed out."; // Or handle differently
      } else if (err.response) {
        // Handle specific HTTP status codes
        if (err.response.status === 401) {
          errorMsg = "Your session may have expired. Please log in again.";
          // Optional: Clear token and redirect
          // localStorage.removeItem("authToken");
          // navigate('/login');
        } else {
          errorMsg =
            err.response.data?.message ||
            `Error ${err.response.status}: Failed to load chats.`;
        }
      } else if (err.request) {
        errorMsg =
          "Network error. Unable to reach the server. Please check your connection.";
      } else {
        errorMsg = err.message || "An unknown error occurred.";
      }
      setError(errorMsg);
      setProjects([]); // Clear projects on error
    } finally {
      setIsLoading(false); // Ensure loading is always turned off
    }
  }, []); // No external dependencies needed for the callback definition itself

  // Fetch the project list when the component mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // Dependency array ensures fetchProjects is stable

  // Client-side filtering based on the search term (filters project names)
  const filteredProjects = projects.filter((project) =>
    project.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler to navigate to the chat page for a specific project
  const handleProjectClick = (projectId) => {
    if (!projectId) {
      console.error(
        "Messages.jsx: Cannot navigate, invalid projectId:",
        projectId
      );
      return;
    }
    console.log(
      `Messages.jsx: Navigating to chat for project ID: ${projectId}`
    );
    // Navigate to the specific project chat route (ensure this route is defined in your router)
    navigate(`/chat/project/${projectId}`);
  };

  // --- Render Logic ---
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 bg-gray-50">
      {/* Page Header */}
      <div className="mb-6 border-b pb-4 border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Project Chats
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Select a project to view or start a conversation.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sticky top-0 bg-gray-50 py-3 z-10 -mx-4 px-4 border-b border-gray-200">
        <div className="relative max-w-xl mx-auto">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          <input
            type="search" // Use type="search" for better semantics and potential clear button
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm outline-none"
            aria-label="Search projects"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto -mx-4 px-4 pb-4 custom-scrollbar">
        {" "}
        {/* Added custom-scrollbar class if needed */}
        {isLoading ? (
          // Loading State
          <div className="flex justify-center items-center py-20 text-center">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-lg font-medium text-gray-500">
              Loading Chats...
            </span>
          </div>
        ) : error ? (
          // Error State
          <div className="py-10">
            <ErrorMessage
              title="Failed to Load Chats"
              message={error}
              onRetry={fetchProjects} // Allow user to retry fetching
              onClose={() => setError(null)} // Allow user to dismiss error
            />
          </div>
        ) : filteredProjects.length === 0 ? (
          // Empty State (handles both no projects at all, and no search results)
          <div className="text-center py-16 px-6 bg-white rounded-lg shadow border border-gray-100 mt-4">
            <FaComments className="mx-auto h-16 w-16 text-gray-300 mb-5" />
            <h3 className="text-xl font-semibold text-gray-700">
              {searchTerm ? "No Projects Found" : "No Project Chats Yet"}
            </h3>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              {searchTerm
                ? "No projects match your search term. Try searching for something else."
                : "You aren't part of any project chats yet. Join or create a project to start collaborating and chatting with members."}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-5 px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Search
              </button>
            ) : (
              <Link
                to="/projects" // Link to where users can find/create projects
                className="mt-5 inline-block px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Explore Projects
              </Link>
            )}
          </div>
        ) : (
          // List of Project Chats
          <ul className="space-y-3 mt-2">
            {filteredProjects.map((project) => (
              <li key={project.projectId}>
                <button
                  onClick={() => handleProjectClick(project.projectId)}
                  className="w-full flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 text-left group"
                >
                  {/* Project Icon */}
                  <div className="flex-shrink-0 mr-4 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <FaProjectDiagram className="w-5 h-5 text-indigo-600" />
                  </div>
                  {/* Project Name */}
                  <div className="flex-grow overflow-hidden mr-2">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-800">
                      {project.projectName || `Project ${project.projectId}`}
                    </p>
                    {/* Placeholder for last message snippet */}
                    {/* <p className="text-xs text-gray-500 truncate mt-0.5">No messages yet...</p> */}
                  </div>
                  {/* Optional: Unread count indicator */}
                  {/* <span className="ml-auto text-xs bg-red-500 text-white font-bold rounded-full px-2 py-0.5">3</span> */}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Messages;
