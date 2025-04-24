import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Icons (assuming all are used or might be used later)
import {
  FaSearch,
  FaUniversity,
  // FaGraduationCap, // Removed if definitely unused
  FaEye,
  // FaHeart, // Removed if definitely unused
  FaRegBookmark,
  FaBookmark,
  FaShareAlt,
  FaDownload,
  // FaComment, // Removed if definitely unused
  FaEllipsisH,
  FaUserPlus,
  // FaChartLine, // Removed if definitely unused
  FaFileAlt,
  FaUsers,
  FaSpinner,
  FaPencilAlt,
  FaPlus,
  FaUserCircle,
} from "react-icons/fa";
// import { RiTeamFill } from "react-icons/ri"; // Removed if definitely unused
// import { BsGraphUp, BsCalendarCheck } from "react-icons/bs"; // Removed if definitely unused

// Components
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
// Ensure these paths are correct relative to this file's location
import ProjectDetailModal from "../Component/projects/ProjectDetailModal";
import MembersModal from "../Component/projects/MembersModal";
import JoinRequestModal from "../Component/projects/JoinRequestModal";
import ReportModal from "../Component/projects/ReportModal";
import ChatModal from "../Component/projects/ChatModal"; // Corrected path potentially

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Projects({ currentUser }) {
  // State
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState(null); // Project data for modal
  const [modalType, setModalType] = useState(null); // Determines which modal is open ('details', 'members', 'join', 'report', 'chat')
  const [savedProjects, setSavedProjects] = useState([]); // Example state, needs persistence
  const [likedProjects, setLikedProjects] = useState([]); // Example state, needs persistence
  const [activeDropdown, setActiveDropdown] = useState(null); // Controls which card's dropdown is open
  // Removed 'showJoinModal' state as it's redundant; modalType handles all modal visibility
  const userToken = localStorage.getItem("authToken"); // Renamed from 'token' for clarity if needed elsewhere, or use 'authToken' directly
  const [reportData, setReportData] = useState("");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 9;

  // Status options for filtering
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "Planning", label: "Planning" },
    { value: "Active", label: "Active" },
    { value: "Completed", label: "Completed" },
    { value: "On Hold", label: "On Hold" },
  ];

  // Notification handler
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
    return () => clearTimeout(timer);
  }, []);

  // --- Removed the stray JoinRequestModal rendering block from here ---

  // Fetch all projects from API
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError("");
    // Ensure you are consistently using the token name ('authToken' used here)
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: filterStatus,
          search: searchTerm,
          page,
          limit,
        },
      });

      if (response.data?.success) {
        // Enhanced mapping to prevent errors if properties are missing
        const fetchedProjects = response.data.data.map((proj) => ({
          id: proj.id,
          title: proj.title ?? "Untitled Project",
          description: proj.description ?? "No description available.",
          status: proj.status ?? "Unknown",
          requiredCollaborators: proj.requiredCollaborators ?? 0,
          ownerId: proj.ownerId ?? null,
          owner: proj.owner || null, // Keep owner object if available
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt,
          progress: proj.progress ?? 0,
          views: proj.views ?? 0,
          likes: proj.likes ?? 0,
          comments: proj.comments ?? 0,
          image: proj.imageUrl || null, // Use imageUrl field if that's what API sends
        }));

        setProjects(fetchedProjects);
        setTotalPages(Math.ceil(response.data.count / limit));
      } else {
        // Handle cases where API returns success: false
        throw new Error(
          response.data?.message || "Failed to fetch projects data."
        );
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      const message =
        err.response?.data?.message ||
        err.message || // Use err.message if no response message
        "Could not load projects. Please try again.";
      setError(message);
      showNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterStatus, page, limit, showNotification]); // Dependencies look correct

  // Fetch projects on initial load and when dependencies change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // fetchProjects is memoized, so this is safe

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  // --- Modal Handlers ---
  // These correctly set the state to trigger modal rendering later
  const handleViewProject = useCallback((project) => {
    setSelectedProject(project);
    setModalType("details");
  }, []); // No dependencies needed if it only sets state

  const handleViewMembers = useCallback((project) => {
    setSelectedProject(project);
    setModalType("members");
  }, []);

  const handleOpenJoinModal = useCallback((project) => {
    setSelectedProject(project);
    setModalType("join");
  }, []);

  const handleOpenReportModal = useCallback((project) => {
    // Generate report data when opening the modal
    const reportContent = `
Project Report: ${project?.title || "N/A"} (ID: ${project?.id || "N/A"})
=======================================
Status: ${project?.status || "N/A"}
Collaborators Needed: ${project?.requiredCollaborators || "N/A"}
Owner: ${project?.owner?.username || "N/A"} (ID: ${project?.ownerId || "N/A"})
Created: ${
      project?.createdAt ? new Date(project.createdAt).toLocaleString() : "N/A"
    }
---------------------------------------
Description:
${project?.description || "No description."}
    `.trim();
    setReportData(reportContent);
    setSelectedProject(project);
    setModalType("report");
  }, []); // Depends only on project argument, no need for useCallback deps? (Check React lint rules)

  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setSelectedProject(null);
    setActiveDropdown(null); // Close dropdown when closing modal
    setReportData("");
  }, []);

  // --- Action Handlers ---

  // Join request handler - uses confirmJoinRequest passed to modal
  const confirmJoinRequest = useCallback(
    async (message) => {
      if (!selectedProject?.id || !currentUser?.id) {
        showNotification("Cannot send request: Missing information.", "error");
        console.error("Missing selected project ID or current user ID", {
          selectedProjectId: selectedProject?.id,
          currentUserId: currentUser?.id,
        });
        return;
      }

      setIsSubmittingJoin(true);
      const token = localStorage.getItem("authToken"); // Use consistent token name

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/collaboration-requests`,
          { projectId: selectedProject.id, message: message || null }, // Send message or null
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Assuming API returns a meaningful message on success
        showNotification(
          response.data?.message || "Join request sent successfully!",
          "success"
        );
        handleCloseModal(); // Close modal on success
      } catch (err) {
        console.error("Join request failed:", err);
        showNotification(
          err.response?.data?.message || "Failed to send join request.",
          "error"
        );
        // Optionally keep the modal open on error:
        // handleCloseModal();
      } finally {
        setIsSubmittingJoin(false);
      }
    },
    [selectedProject, currentUser, showNotification, handleCloseModal] // Add handleCloseModal dependency
  );

  // Toggle save (example - needs API integration)
  const toggleSaveProject = useCallback(
    (projectId) => {
      setSavedProjects((prev) =>
        prev.includes(projectId)
          ? prev.filter((id) => id !== projectId)
          : [...prev, projectId]
      );
      showNotification(
        savedProjects.includes(projectId)
          ? "Project removed from saved"
          : "Project saved",
        "info" // Use 'info' or 'success' as appropriate
      );
    },
    [savedProjects, showNotification]
  ); // Depends on savedProjects state

  // Toggle like (example - needs API integration)
  const toggleLikeProject = useCallback(
    (projectId) => {
      setLikedProjects((prev) =>
        prev.includes(projectId)
          ? prev.filter((id) => id !== projectId)
          : [...prev, projectId]
      );
      // Optionally add notification
    },
    [likedProjects] // Depends on likedProjects state
  );

  // Share project
  const handleShareProject = useCallback(
    (projectId) => {
      const projectUrl = `${window.location.origin}/projects/${projectId}`; // Adjust path if needed
      navigator.clipboard
        .writeText(projectUrl)
        .then(() => showNotification("Project link copied!", "success"))
        .catch((err) => {
          console.error("Failed to copy link:", err);
          showNotification("Could not copy link.", "error");
        });
    },
    [showNotification]
  ); // Depends on showNotification

  // Download project details as JSON
  const handleDownloadProject = useCallback(
    (project) => {
      if (!project) return;
      // Exclude potentially large or unnecessary fields like the full owner object if desired
      const { image, owner, ...downloadableData } = project;
      const dataToDownload = {
        ...downloadableData,
        ownerUsername: owner?.username, // Include specific owner info if needed
      };
      const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        project.title?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "project"
      }_details.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification("Project details download started.", "info");
    },
    [showNotification]
  );

  // Download generated report text
  const downloadReport = useCallback(() => {
    // Use reportData state which was set in handleOpenReportModal
    if (!selectedProject || !reportData) {
      showNotification("No report data to download.", "error");
      return;
    }
    const blob = new Blob([reportData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      selectedProject.title?.replace(/[^a-z0-9]/gi, "_").toLowerCase() ||
      "project"
    }_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleCloseModal(); // Close modal after download
  }, [selectedProject, reportData, showNotification, handleCloseModal]); // Depends on these states/callbacks

  // Toggle dropdown menu visibility
  const toggleDropdown = useCallback((projectId) => {
    setActiveDropdown((prev) => (prev === projectId ? null : projectId));
  }, []);

  // --- Project Card Sub-Component ---
  // Defined inside Projects to easily access its state and handlers
  const ProjectCard = ({ project }) => {
    // Check states based on current data
    const isSaved = savedProjects.includes(project.id);
    // const isLiked = likedProjects.includes(project.id); // Uncomment if like feature is used
    const isOwner = currentUser?.id === project.ownerId;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 relative flex flex-col" // Added hover shadow
      >
        {/* Card Header */}
        <div className="relative">
          {/* Dropdown & Icons */}
          <div className="absolute top-3 right-3 z-10 flex space-x-1.5">
            {!isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveProject(project.id);
                }}
                className="text-gray-500 bg-white/80 hover:bg-white hover:text-blue-600 p-1.5 rounded-full shadow transition-colors"
                title={isSaved ? "Remove from saved" : "Save project"}
              >
                {isSaved ? (
                  <FaBookmark className="text-blue-600 h-4 w-4" />
                ) : (
                  <FaRegBookmark className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                toggleDropdown(project.id);
              }}
              className="text-gray-500 bg-white/80 hover:bg-white hover:text-gray-800 p-1.5 rounded-full shadow transition-colors"
              title="More options"
            >
              <FaEllipsisH className="h-4 w-4" />
            </button>
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {activeDropdown === project.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-2 top-12 mt-1 bg-white shadow-lg rounded-md z-20 w-48 border border-gray-200 py-1"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
              >
                {/* Ensure project data is passed correctly */}
                <button
                  onClick={() => {
                    handleDownloadProject(project);
                    setActiveDropdown(null); // Close dropdown after action
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaDownload className="mr-2 text-blue-500" /> Download Info
                </button>
                <button
                  onClick={() => {
                    handleOpenReportModal(project);
                    // Dropdown closes via handleCloseModal called by ReportModal
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaFileAlt className="mr-2 text-purple-500" /> Report
                </button>
                <button
                  onClick={() => {
                    handleShareProject(project.id);
                    setActiveDropdown(null); // Close dropdown after action
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaShareAlt className="mr-2 text-green-500" /> Share
                </button>
                {/* Join button only if not owner */}
                {!isOwner && (
                  <button
                    onClick={() => {
                      handleOpenJoinModal(project);
                      // Dropdown closes via handleCloseModal called by JoinRequestModal
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <FaUserPlus className="mr-2 text-cyan-500" /> Request to
                    Join
                  </button>
                )}
                {/* Optional: View Members Button */}
                <button
                  onClick={() => {
                    handleViewMembers(project);
                    // Dropdown closes via handleCloseModal called by MembersModal
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaUsers className="mr-2 text-orange-500" /> View Members
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Project Image Placeholder */}
          <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
            {project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              // Placeholder Icon
              <FaUniversity className="text-6xl text-gray-300" />
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Status and Owner */}
          <div className="flex justify-between items-center mb-2 text-xs">
            <span
              className={`font-medium px-2.5 py-0.5 rounded-full ${
                project.status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : project.status === "Active"
                  ? "bg-blue-100 text-blue-800"
                  : project.status === "Planning"
                  ? "bg-yellow-100 text-yellow-800"
                  : project.status === "On Hold"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800" // Default/Unknown status
              }`}
            >
              {project.status}
            </span>
            <div className="flex items-center text-gray-500">
              {project.owner ? (
                <>
                  <span className="hidden sm:inline mr-1">Owner:</span>
                  {isOwner ? (
                    <span className="font-medium text-indigo-600">You</span>
                  ) : (
                    <span className="font-medium">
                      {project.owner.username || "Unknown"}
                    </span>
                  )}
                  {/* Simple avatar placeholder */}
                  <span className="ml-1.5 bg-gray-200 rounded-full h-4 w-4 flex items-center justify-center text-gray-500 text-[8px] font-bold">
                    {project.owner.username
                      ? project.owner.username[0].toUpperCase()
                      : "?"}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Owner: Unknown</span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
            {/* Wrap title in Link if desired, or rely on View button */}
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
            {project.description}
          </p>

          {/* Collaborators Info */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <FaUsers className="mr-1.5 text-gray-400" />
            <span>
              Needs:{" "}
              <span className="font-medium text-gray-700">
                {project.requiredCollaborators}
              </span>{" "}
              collaborator(s)
            </span>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex space-x-2 mt-auto pt-3 border-t border-gray-100">
            {/* --- VIEW BUTTON --- */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Important if card itself becomes clickable
                handleViewProject(project); // Calls the correct handler
              }}
              className="flex-1 bg-indigo-50 text-indigo-700 py-1.5 px-3 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <FaEye /> View Details
            </button>

            {/* --- EDIT / JOIN BUTTON --- */}
            {isOwner ? (
              <Link
                to={`/projects/edit/${project.id}`} // Ensure this route exists in your router
                onClick={(e) => e.stopPropagation()} // Prevent card click if Link is used
                className="flex-1 bg-amber-50 text-amber-700 py-1.5 px-3 rounded-md hover:bg-amber-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <FaPencilAlt /> Edit
              </Link>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenJoinModal(project); // Calls the correct handler
                }}
                className="flex-1 bg-green-50 text-green-700 py-1.5 px-3 rounded-md hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <FaUserPlus /> Join
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }; // End of ProjectCard component

  // --- Main Render ---
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification Area */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-5 right-5 z-[100] w-full max-w-sm" // Increased z-index
            >
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() =>
                  setNotification((prev) => ({ ...prev, show: false }))
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Research Projects
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {
                isLoading
                  ? "Loading projects..."
                  : // Provide more accurate count if available from API
                    `${projects.length} project${
                      projects.length !== 1 ? "s" : ""
                    } shown`
                // : `${response.data.count} projects found` // Requires saving count state
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white" // Added bg-white
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {/* New Project Button */}
            {currentUser && ( // Only show if user is logged in
              <Link
                to="/projects/new" // Ensure this route exists
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors shadow-sm"
              >
                <FaPlus className="mr-1.5 text-sm" /> New Project
              </Link>
            )}
          </div>
        </div>

        {/* Error Message Display */}
        {error &&
          !isLoading && ( // Show error only if not loading
            <div className="mb-6">
              <ErrorMessage message={error} onClose={() => setError("")} />
            </div>
          )}

        {/* Main Content Area */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            // Empty State Display
            <div className="text-center mt-8 py-12 px-6 bg-white rounded-lg shadow border border-gray-200">
              <FaSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                No Projects Found
              </h3>
              <p className="mt-2 text-gray-600">
                {searchTerm || filterStatus
                  ? "Try adjusting your search or filters."
                  : "There are currently no projects to display."}
              </p>
              <div className="mt-6 space-x-4">
                {(searchTerm || filterStatus) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("");
                      // fetchProjects will refetch due to state change
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
                {currentUser && (
                  <Link
                    to="/projects/new"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center transition-colors"
                  >
                    <FaPlus className="mr-2" /> Create New Project
                  </Link>
                )}
              </div>
            </div>
          ) : (
            // Projects Grid and Pagination
            <>
              <motion.div
                layout // Enable layout animation for the grid container
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {projects.map((project) => (
                  // ProjectCard handles its own animation
                  <ProjectCard key={project.id} project={project} />
                ))}
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-10">
                  <nav className="flex items-center gap-1 rounded-lg shadow-sm border border-gray-200 p-1 bg-white">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {/* Consider limiting number of page buttons shown for many pages */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (num) => (
                        <button
                          key={num}
                          onClick={() => setPage(num)}
                          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                            page === num
                              ? "bg-indigo-600 text-white font-semibold shadow-inner"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {num}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>{" "}
      {/* End max-w-7xl */}
      {/* --- Modal Rendering Section --- */}
      {/* This is the correct place for all modal rendering logic */}
      <AnimatePresence>
        {modalType === "details" && selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={handleCloseModal}
            // Add any other props ProjectDetailModal needs
          />
        )}
        {modalType === "members" && selectedProject && (
          <MembersModal
            project={selectedProject}
            onClose={handleCloseModal}
            // Add any other props MembersModal needs
          />
        )}
        {modalType === "join" && selectedProject && (
          <JoinRequestModal
            project={selectedProject} // Pass the whole project object
            onClose={handleCloseModal}
            onSubmit={confirmJoinRequest} // Pass the submission handler
            isSubmitting={isSubmittingJoin} // Pass the loading state
          />
        )}
        {modalType === "report" && selectedProject && (
          <ReportModal
            reportData={reportData} // Pass the generated report text
            onClose={handleCloseModal}
            onDownload={downloadReport} // Pass the download handler
          />
        )}
        {/* Example for Chat Modal if implemented */}
        {modalType === "chat" && selectedProject && (
          <ChatModal
            // Pass necessary props like projectId, currentUser, etc.
            projectId={selectedProject.id}
            currentUser={currentUser}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
      {/* Click away listener for dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-10" // Ensure z-index is below dropdown menu (z-20) but above content
          onClick={() => setActiveDropdown(null)} // Close dropdown when clicking outside
        />
      )}
    </div> // End main container div
  );
} // End of Projects component
///
