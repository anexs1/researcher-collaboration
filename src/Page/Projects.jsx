import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- Icons ---
import {
  FaSearch,
  FaUniversity,
  FaEye,
  FaRegBookmark,
  FaBookmark,
  FaShareAlt,
  FaDownload,
  FaEllipsisH,
  FaUserPlus,
  FaFileAlt,
  FaUsers,
  FaPencilAlt,
  FaPlus,
  FaTrashAlt,
  FaUserCheck,
  FaEyeSlash,
  FaSpinner,
  FaMapMarkerAlt, // Added for potential use
} from "react-icons/fa";
import { FiCalendar } from "react-icons/fi"; // Added for potential use

// --- Components ---
// CRITICAL: Verify these paths are correct relative to Projects.jsx
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
import ProjectDetailModal from "../Component/projects/ProjectDetailModal";
import MembersModal from "../Component/projects/MembersModal";
import JoinRequestModal from "../Component/projects/JoinRequestModal"; // For users sending requests
import RequestsModal from "../Component/projects/RequestsModal"; // << For owners managing requests
import ReportModal from "../Component/projects/ReportModal";
import ChatModal from "../Component/projects/ChatModal"; // Placeholder if not implemented

// --- Constants ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const PROJECTS_PER_PAGE = 9;
// Status options - Align with backend/database ENUMs
const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Planning", label: "Planning" },
  { value: "Active", label: "Active" },
  { value: "Completed", label: "Completed" },
  { value: "On Hold", label: "On Hold" },
  { value: "Archived", label: "Archived" }, // Use this for "Hidden" state
];

// --- Helper Function for Status Badge ---
const getStatusBadgeClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "active":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "planning":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "on hold":
    case "archived": // Treat Archived as a distinct inactive state
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// --- ProjectCard Sub-Component ---
const ProjectCard = React.memo(
  ({
    project,
    currentUser,
    isSaved,
    activeDropdown,
    isUpdatingStatus, // For hide/unhide loading
    hasPendingRequests, // <<< PROP: Boolean indicating if there are pending requests
    // Callback Props
    onToggleDropdown,
    onToggleSave,
    onViewProject,
    onViewMembers,
    onOpenJoinModal,
    onOpenRequestsModal, // This still opens the modal
    onOpenReportModal,
    onShareProject,
    onDownloadProject,
    onUpdateProjectStatus,
    onDeleteProject,
  }) => {
    const isOwner = currentUser?.id === project.ownerId;
    const [isHoveringChild, setIsHoveringChild] = useState(false);
    const handleChildMouseEnter = useCallback(
      () => setIsHoveringChild(true),
      []
    );
    const handleChildMouseLeave = useCallback(
      () => setIsHoveringChild(false),
      []
    );
    // Handle image source potentially relative or absolute
    const imageSource = project.image
      ? project.image.startsWith("http") || project.image.startsWith("blob:")
        ? project.image
        : project.image.startsWith("/")
        ? `${API_BASE_URL}${project.image}` // Prepend base URL if it starts with /
        : project.image // Assume relative path or data URI if needed
      : null;
    // Determine if the project is considered hidden (using 'Archived' status)
    const isHidden = project.status === "Archived";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
        transition={{ duration: 0.3 }}
        whileHover={
          isHoveringChild
            ? {}
            : {
                y: -5,
                boxShadow:
                  "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
              }
        }
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 relative flex flex-col h-full"
      >
        {/* Header */}
        <div className="relative">
          {/* Icons */}
          <div className="absolute top-3 right-3 z-10 flex space-x-1.5">
            {!isOwner && (
              <button
                onMouseEnter={handleChildMouseEnter}
                onMouseLeave={handleChildMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(project.id);
                }}
                className="text-gray-500 bg-white/80 hover:bg-white hover:text-blue-600 p-1.5 rounded-full shadow-sm border border-gray-200/50"
                title={isSaved ? "Unsave" : "Save"}
                aria-label={isSaved ? "Unsave" : "Save"}
              >
                {isSaved ? (
                  <FaBookmark className="text-blue-600 h-4 w-4" />
                ) : (
                  <FaRegBookmark className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onMouseEnter={handleChildMouseEnter}
              onMouseLeave={handleChildMouseLeave}
              onClick={(e) => {
                e.stopPropagation();
                onToggleDropdown(project.id);
              }}
              className="text-gray-500 bg-white/80 hover:bg-white hover:text-gray-800 p-1.5 rounded-full shadow-sm border border-gray-200/50"
              title="More options"
              aria-label="More options"
              aria-haspopup="true"
              aria-expanded={activeDropdown === project.id}
              id={`options-menu-${project.id}`}
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
                className="absolute right-2 top-12 mt-1 bg-white shadow-lg rounded-md z-20 w-52 border border-gray-200 py-1 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby={`options-menu-${project.id}`}
              >
                <button
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={() => onDownloadProject(project)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  <FaDownload className="mr-2 text-blue-500" /> Download Info
                </button>
                <button
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={() => onOpenReportModal(project)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  <FaFileAlt className="mr-2 text-purple-500" /> Report
                </button>
                <button
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={() => onShareProject(project.id)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  <FaShareAlt className="mr-2 text-green-500" /> Share
                </button>
                <button
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={() => onViewMembers(project)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  <FaUsers className="mr-2 text-orange-500" /> View Members
                </button>
                {!isOwner && (
                  <button
                    onMouseEnter={handleChildMouseEnter}
                    onMouseLeave={handleChildMouseLeave}
                    onClick={() => onOpenJoinModal(project)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <FaUserPlus className="mr-2 text-cyan-500" /> Request to
                    Join
                  </button>
                )}
                {isOwner && (
                  <>
                    <div className="border-t my-1 mx-2 border-gray-100"></div>
                    <button
                      onMouseEnter={handleChildMouseEnter}
                      onMouseLeave={handleChildMouseLeave}
                      // Use 'Archived' for hiding, toggle back to 'Active' or 'Planning' (choose one as default visible state)
                      onClick={() =>
                        onUpdateProjectStatus(
                          project,
                          isHidden ? "Active" : "Archived"
                        )
                      }
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      role="menuitem"
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? (
                        <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                      ) : isHidden ? (
                        <FaEye className="mr-2 text-green-500" />
                      ) : (
                        <FaEyeSlash className="mr-2 text-yellow-600" />
                      )}
                      {isHidden ? "Unhide Project" : "Hide Project"}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Image */}
          <div
            className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => onViewProject(project)}
          >
            {imageSource ? (
              <img
                src={imageSource}
                alt={`Cover for ${project.title}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                }}
              /> // Provide a placeholder
            ) : (
              <FaUniversity className="text-6xl text-gray-300" />
            )}
          </div>
        </div>
        {/* Card Body */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Status/Owner Row */}
          <div className="flex justify-between items-center mb-2 text-xs">
            <span
              className={`font-medium px-2.5 py-0.5 rounded-full border ${getStatusBadgeClasses(
                project.status
              )}`}
            >
              {project.status || "Unknown"}
            </span>
            <div
              className="flex items-center text-gray-500"
              title={`Owner: ${project.owner?.username || "Unknown"}`}
            >
              {project.owner ? (
                <>
                  <span className="hidden sm:inline mr-1">By:</span>
                  {isOwner ? (
                    <span className="font-medium text-indigo-600">You</span>
                  ) : (
                    <Link
                      to={
                        project.owner.id ? `/profile/${project.owner.id}` : "#"
                      }
                      onMouseEnter={handleChildMouseEnter}
                      onMouseLeave={handleChildMouseLeave}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium hover:text-indigo-600 hover:underline"
                    >
                      {project.owner.username || "User"}
                    </Link>
                  )}
                  {/* Simple Avatar Placeholder */}
                  {project.owner.profilePictureUrl ? (
                    <img
                      src={project.owner.profilePictureUrl}
                      alt="Owner"
                      className="ml-1.5 h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <span className="ml-1.5 bg-gray-200 rounded-full h-4 w-4 flex items-center justify-center text-gray-500 text-[8px] font-bold uppercase">
                      {project.owner.username ? project.owner.username[0] : "?"}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400 italic">Owner unknown</span>
              )}
            </div>
          </div>
          {/* Title */}
          <h3
            className="text-base md:text-lg font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-indigo-600 cursor-pointer"
            onClick={() => onViewProject(project)}
          >
            {project.title}
          </h3>
          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
            {project.description || (
              <span className="italic text-gray-400">No description.</span>
            )}
          </p>
          {/* Collaborators */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <FaUsers className="mr-1.5 text-gray-400" />
            <span>
              Needs:{" "}
              <span className="font-medium text-gray-700">
                {project.requiredCollaborators ?? "N/A"}
              </span>{" "}
              collaborator(s)
            </span>
          </div>

          {/* === Footer Buttons === */}
          <div
            className={`flex mt-auto pt-3 border-t border-gray-100 ${
              isOwner ? "gap-1 sm:gap-1.5" : "space-x-2"
            }`}
          >
            {/* View Button */}
            <button
              onMouseEnter={handleChildMouseEnter}
              onMouseLeave={handleChildMouseLeave}
              onClick={(e) => {
                e.stopPropagation();
                onViewProject(project);
              }}
              className={`py-1.5 px-2 sm:px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                isOwner ? "flex-grow" : "flex-1"
              } bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
              title="View Details"
            >
              <FaEye className="flex-shrink-0" />{" "}
              <span className="hidden sm:inline">View</span>
            </button>
            {/* Owner/Non-Owner Buttons */}
            {isOwner ? (
              <>
                <Link
                  to={`/projects/edit/${project.id}`}
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={(e) => e.stopPropagation()}
                  className="py-1.5 px-2 sm:px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors flex-grow bg-amber-50 text-amber-700 hover:bg-amber-100"
                  title="Edit Project"
                >
                  <FaPencilAlt className="flex-shrink-0" />{" "}
                  <span className="hidden sm:inline">Edit</span>
                </Link>
                {/* Manage Requests Button - Conditionally Styled/Disabled */}
                <button
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRequestsModal(project);
                  }}
                  disabled={!hasPendingRequests} // <<< Use prop to disable
                  className={`py-1.5 px-2 sm:px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors flex-grow ${
                    hasPendingRequests // <<< Use prop for styling
                      ? "bg-teal-50 text-teal-700 hover:bg-teal-100" // Active style
                      : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70" // Disabled style
                  }`}
                  title={
                    hasPendingRequests
                      ? "Manage Join Requests"
                      : "No Pending Requests"
                  }
                >
                  <FaUserCheck className="flex-shrink-0" />{" "}
                  <span className="hidden sm:inline">Requests</span>
                </button>
                <button
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className="py-1.5 px-2 sm:px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors flex-grow bg-red-50 text-red-700 hover:bg-red-100"
                  title="Delete Project"
                >
                  <FaTrashAlt className="flex-shrink-0" />{" "}
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            ) : (
              <button
                onMouseEnter={handleChildMouseEnter}
                onMouseLeave={handleChildMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenJoinModal(project);
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
  }
);

// --- Main Projects Page Component ---
export default function Projects({ currentUser }) {
  // --- State ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [savedProjects, setSavedProjects] = useState(new Set()); // Use Set for efficiency
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [reportData, setReportData] = useState("");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [projectsWithNoPending, setProjectsWithNoPending] = useState(new Set()); // Stores IDs of projects with 0 pending requests
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = PROJECTS_PER_PAGE;

  // --- Callbacks ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
    return () => clearTimeout(timer);
  }, []);

  // Fetch projects API call
  const fetchProjects = useCallback(
    async (currentPage = 1) => {
      console.log(
        `Fetching projects: page=${currentPage}, limit=${limit}, status=${filterStatus}, search=${searchTerm}`
      );
      setIsLoading(true);
      setError("");
      const authToken = localStorage.getItem("authToken");
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          params: {
            status: filterStatus || undefined,
            search: searchTerm || undefined,
            page: currentPage,
            limit,
          },
        });
        if (response.data?.success && Array.isArray(response.data.data)) {
          const fetchedProjects = response.data.data.map((proj) => ({
            id: proj.id,
            title: proj.title ?? "Untitled Project",
            description: proj.description ?? "No description available.",
            status: proj.status ?? "Unknown",
            requiredCollaborators: proj.requiredCollaborators ?? 0,
            ownerId: proj.ownerId ?? null,
            owner: proj.owner
              ? {
                  id: proj.owner.id,
                  username: proj.owner.username ?? "Unknown User",
                  profilePictureUrl: proj.owner.profilePictureUrl || null,
                }
              : null,
            createdAt: proj.createdAt,
            updatedAt: proj.updatedAt,
            image: proj.imageUrl || null, // Example mapping
          }));
          setProjects(fetchedProjects);
          setTotalPages(response.data.totalPages || 1);
        } else {
          throw new Error(
            response.data?.message || "Failed to fetch projects."
          );
        }
      } catch (err) {
        console.error("Fetch projects error:", err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Could not load projects.";
        setError(errorMsg);
        showNotification(errorMsg, "error");
        setProjects([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, filterStatus, limit, showNotification]
  ); // Added showNotification dependency

  // Fetch on initial load and when filters/search change (reset page)
  useEffect(() => {
    setPage(1); // Reset to page 1 when filters change
    setProjectsWithNoPending(new Set()); // Reset pending state on filter change
    fetchProjects(1); // Fetch page 1
  }, [searchTerm, filterStatus, fetchProjects]); // Includes limit indirectly

  // Fetch when page changes (but avoid re-fetching on initial load if filters changed)
  useEffect(() => {
    // Check if this page change is *not* the one triggered by filter reset
    if (page !== 1 || projects.length === 0) {
      // Fetch if page > 1 or if page 1 is empty (initial load after filter reset)
      fetchProjects(page);
    }
  }, [page]); // Only depend on page here

  // --- Modal Handlers ---
  const handleCloseModal = useCallback(() => {
    setModalType(null);
    setSelectedProject(null);
    setReportData("");
    setActiveDropdown(null);
  }, []);
  const handleViewProject = useCallback((project) => {
    setSelectedProject(project);
    setModalType("details");
    setActiveDropdown(null);
  }, []);
  const handleViewMembers = useCallback((project) => {
    setSelectedProject(project);
    setModalType("members");
    setActiveDropdown(null);
  }, []);
  const handleOpenJoinModal = useCallback((project) => {
    setSelectedProject(project);
    setModalType("join");
    setActiveDropdown(null);
  }, []);
  const handleOpenRequestsModal = useCallback((project) => {
    setSelectedProject(project);
    setModalType("requests");
    setActiveDropdown(null);
  }, []);
  const handleOpenReportModal = useCallback((project) => {
    const reportContent = `Project Report:\nTitle: ${project.title}\nStatus: ${
      project.status
    }\nOwner: ${project.owner?.username || "N/A"}\n...more data...`;
    setReportData(reportContent);
    setSelectedProject(project);
    setModalType("report");
    setActiveDropdown(null);
  }, []);

  // --- Action Handlers ---
  const confirmJoinRequest = useCallback(
    async (message) => {
      if (!selectedProject || !currentUser?.id) {
        showNotification("Cannot send request.", "error");
        return;
      }
      setIsSubmittingJoin(true);
      const authToken = localStorage.getItem("authToken");
      try {
        await axios.post(
          `${API_BASE_URL}/api/collaboration-requests`,
          { projectId: selectedProject.id, message },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        showNotification("Join request sent successfully!", "success");
        handleCloseModal();
      } catch (err) {
        console.error("Join request error:", err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Could not send request.";
        showNotification(errorMsg, "error");
      } finally {
        setIsSubmittingJoin(false);
      }
    },
    [selectedProject, currentUser?.id, showNotification, handleCloseModal]
  );

  const toggleSaveProject = useCallback(
    (projectId) => {
      setSavedProjects((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(projectId)) {
          newSet.delete(projectId);
          showNotification("Project unsaved.", "info");
        } else {
          newSet.add(projectId);
          showNotification("Project saved!", "success");
        }
        return newSet;
      });
      setActiveDropdown(null);
    },
    [showNotification]
  );

  const handleShareProject = useCallback(
    (projectId) => {
      const projectUrl = `${window.location.origin}/projects/${projectId}`;
      navigator.clipboard
        .writeText(projectUrl)
        .then(() => showNotification("Project link copied!", "success"))
        .catch(() => showNotification("Could not copy link.", "error"));
      setActiveDropdown(null);
    },
    [showNotification]
  );

  const handleDownloadProject = useCallback(
    (project) => {
      const data = `Project Title: ${project.title}\nDescription: ${project.description}\nStatus: ${project.status}\nOwner: ${project.owner?.username}`;
      const blob = new Blob([data], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.title.replace(/\s+/g, "_")}_details.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification("Project info downloaded.", "info");
      setActiveDropdown(null);
    },
    [showNotification]
  );

  const downloadReport = useCallback(() => {
    if (!reportData || !selectedProject) return;
    const blob = new Blob([reportData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedProject.title.replace(/\s+/g, "_")}_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Report downloaded.", "info");
    handleCloseModal();
  }, [selectedProject, reportData, showNotification, handleCloseModal]);

  const toggleDropdown = useCallback((projectId) => {
    setActiveDropdown((prev) => (prev === projectId ? null : projectId));
  }, []);

  const handleUpdateProjectStatus = useCallback(
    async (projectToUpdate, newStatus) => {
      if (!projectToUpdate || !newStatus) {
        showNotification("Missing data.", "error");
        return;
      }
      const oldStatus = projectToUpdate.status;
      setActiveDropdown(null);
      setIsUpdatingStatus(true);
      setSelectedProject(projectToUpdate);
      setError("");
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        showNotification("Authentication required.", "error");
        setIsUpdatingStatus(false);
        setSelectedProject(null);
        return;
      }
      console.log(
        `Updating project ${projectToUpdate.id} status to ${newStatus}`
      );
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectToUpdate.id ? { ...p, status: newStatus } : p
        )
      ); // Optimistic Update
      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/projects/${projectToUpdate.id}`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Update failed.");
        }
        showNotification(`Project status updated.`, "success");
      } catch (err) {
        console.error(`Error updating status:`, err);
        const errorMsg =
          err.response?.data?.message || err.message || "Could not update.";
        showNotification(errorMsg, "error");
        setError(errorMsg);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectToUpdate.id ? { ...p, status: oldStatus } : p
          )
        );
      } finally {
        // Revert UI
        setIsUpdatingStatus(false);
        setSelectedProject(null);
      }
    },
    [showNotification]
  );

  const handleDeleteProject = useCallback(
    async (projectIdToDelete) => {
      if (
        !projectIdToDelete ||
        !window.confirm("Delete this project permanently?")
      ) {
        setActiveDropdown(null);
        return;
      }
      setActiveDropdown(null);
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        showNotification("Auth required.", "error");
        return;
      }
      const currentProjects = [...projects];
      const currentPage = page;
      const currentTotalPages = totalPages; // Store state
      setProjects((prev) => prev.filter((p) => p.id !== projectIdToDelete)); // Optimistic UI
      try {
        console.log(`Deleting project ID: ${projectIdToDelete}`);
        const response = await axios.delete(
          `${API_BASE_URL}/api/projects/${projectIdToDelete}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Delete failed.");
        }
        showNotification(
          response.data.message || "Project deleted!",
          "success"
        );
        fetchProjects(currentPage); // Refetch current page after delete
      } catch (err) {
        console.error(`Delete error:`, err);
        const errorMsg =
          err.response?.data?.message || err.message || "Could not delete.";
        showNotification(errorMsg, "error");
        setError(errorMsg);
        setProjects(currentProjects);
        setTotalPages(currentTotalPages);
        setPage(currentPage);
      } // Revert state
    },
    [projects, page, totalPages, limit, showNotification, fetchProjects]
  ); // Added fetchProjects dependency

  // --- Callback from RequestsModal ---
  const handleRequestsHandled = useCallback((handledProjectId) => {
    console.log(
      `Callback received: All pending requests handled for project ID: ${handledProjectId}`
    );
    setProjectsWithNoPending((prevSet) => {
      const newSet = new Set(prevSet); // Create a new Set to trigger state update
      newSet.add(handledProjectId);
      return newSet;
    });
  }, []);

  // --- Main Render ---
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification Area */}
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
          <AnimatePresence>
            {notification.show && (
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {" "}
                <Notification
                  message={notification.message}
                  type={notification.type}
                  onClose={() =>
                    setNotification((prev) => ({ ...prev, show: false }))
                  }
                />{" "}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            {" "}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Research Projects
            </h1>{" "}
            <p className="text-sm text-gray-600 mt-1">
              Discover, Collaborate, Innovate.
            </p>{" "}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              {" "}
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />{" "}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title or description..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />{" "}
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500"
              aria-label="Filter by status"
            >
              {" "}
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}{" "}
            </select>
            {currentUser && (
              <Link
                to="/projects/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center shadow-sm text-sm font-medium transition-colors"
              >
                {" "}
                <FaPlus className="mr-1.5 text-xs" /> New Project{" "}
              </Link>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && !isLoading && (
          <div className="mb-6">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}

        {/* Content Area */}
        <div className="mt-6 pb-10">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              {" "}
              <LoadingSpinner size="lg" />{" "}
              <span className="ml-3 text-gray-500">Loading Projects...</span>{" "}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center mt-8 py-12 px-6 bg-white rounded-lg shadow border border-gray-200">
              <FaSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />{" "}
              <h3 className="text-xl font-semibold">No Projects Found</h3>{" "}
              <p className="mt-2 text-gray-600">
                {searchTerm || filterStatus
                  ? "No projects match your current filters."
                  : "No projects have been created yet."}
              </p>
              <div className="mt-6 space-x-4">
                {(searchTerm || filterStatus) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("");
                      setPage(1);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-200"
                  >
                    {" "}
                    Clear Filters{" "}
                  </button>
                )}
                {currentUser && (
                  <Link
                    to="/projects/new"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center shadow-sm"
                  >
                    {" "}
                    <FaPlus className="mr-2" /> Create Project{" "}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      currentUser={currentUser}
                      isSaved={savedProjects.has(project.id)}
                      activeDropdown={activeDropdown}
                      hasPendingRequests={
                        !projectsWithNoPending.has(project.id)
                      } // <<< Pass state
                      onToggleDropdown={toggleDropdown}
                      onToggleSave={toggleSaveProject}
                      onViewProject={handleViewProject}
                      onViewMembers={handleViewMembers}
                      onOpenJoinModal={handleOpenJoinModal}
                      onOpenRequestsModal={handleOpenRequestsModal} // Pass handler
                      onOpenReportModal={handleOpenReportModal}
                      onShareProject={handleShareProject}
                      onDownloadProject={handleDownloadProject}
                      onUpdateProjectStatus={handleUpdateProjectStatus}
                      onDeleteProject={handleDeleteProject}
                      isUpdatingStatus={
                        isUpdatingStatus && selectedProject?.id === project.id
                      }
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex justify-center items-center mt-10"
                  role="navigation"
                  aria-label="Pagination"
                >
                  <nav className="flex items-center gap-1 rounded-lg shadow-sm border border-gray-200 p-1 bg-white">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                      className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      {" "}
                      Prev{" "}
                    </button>
                    {[...Array(totalPages).keys()]
                      .map((i) => i + 1)
                      .map((num) =>
                        num === 1 ||
                        num === totalPages ||
                        Math.abs(num - page) < 3 ? (
                          <button
                            key={num}
                            onClick={() => setPage(num)}
                            disabled={isLoading}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                              page === num
                                ? "bg-indigo-600 text-white font-semibold shadow-inner"
                                : "text-gray-600 hover:bg-gray-100 disabled:opacity-75"
                            }`}
                            aria-current={page === num ? "page" : undefined}
                            aria-label={`Page ${num}`}
                          >
                            {" "}
                            {num}{" "}
                          </button>
                        ) : (num === 2 && page > 4) ||
                          (num === totalPages - 1 && page < totalPages - 3) ? (
                          <span
                            key={num}
                            className="px-3 py-1.5 text-sm text-gray-400"
                          >
                            ...
                          </span>
                        ) : null
                      )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages || isLoading}
                      className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      {" "}
                      Next{" "}
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalType === "details" && selectedProject && (
          <ProjectDetailModal
            key={`detail-${selectedProject.id}`}
            project={selectedProject}
            currentUser={currentUser}
            onClose={handleCloseModal}
          />
        )}
        {modalType === "members" && selectedProject && (
          <MembersModal
            key={`members-${selectedProject.id}`}
            project={selectedProject}
            currentUser={currentUser}
            onClose={handleCloseModal}
          />
        )}
        {modalType === "join" && selectedProject && (
          <JoinRequestModal
            key={`join-${selectedProject.id}`}
            project={selectedProject}
            onClose={handleCloseModal}
            onSubmit={confirmJoinRequest}
            isSubmitting={isSubmittingJoin}
          />
        )}
        {modalType === "requests" && selectedProject && (
          <RequestsModal
            key={`requests-${selectedProject.id}`}
            project={selectedProject}
            currentUser={currentUser}
            onClose={handleCloseModal}
            onAllRequestsHandled={handleRequestsHandled} // <<< Pass callback
          />
        )}
        {modalType === "report" && selectedProject && (
          <ReportModal
            key={`report-${selectedProject.id}`}
            reportData={reportData}
            projectName={selectedProject?.title}
            onClose={handleCloseModal}
            onDownload={downloadReport}
          />
        )}
        {modalType === "chat" && selectedProject && (
          <ChatModal
            key={`chat-${selectedProject.id}`}
            project={selectedProject}
            currentUser={currentUser}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>

      {/* Dropdown Click Away Listener */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setActiveDropdown(null)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
