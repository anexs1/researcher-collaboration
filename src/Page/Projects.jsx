// src/Page/Projects.jsx

import React, { useState, useEffect, useCallback, memo } from "react"; // Import memo
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- Icons --- (Ensure you have react-icons installed: npm install react-icons)
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
  FaClock,
} from "react-icons/fa";

// --- Components --- (Verify these paths are correct)
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
import ProjectDetailModal from "../Component/projects/ProjectDetailModal";
import MembersModal from "../Component/projects/MembersModal";
import JoinRequestModal from "../Component/projects/JoinRequestModal";
import RequestsModal from "../Component/projects/RequestsModal";
import ReportModal from "../Component/projects/ReportModal";
// import ChatModal from "../Component/projects/ChatModal"; // Uncomment if you have this

// --- Constants ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const PROJECTS_PER_PAGE = 9;
const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Planning", label: "Planning" },
  { value: "Active", label: "Active" },
  { value: "Completed", label: "Completed" },
  { value: "On Hold", label: "On Hold" },
  { value: "Archived", label: "Archived" },
];

// --- Axios Instance ---
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
    case "archived":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// ========================================================================
// --- ProjectCard Sub-Component ---
// ========================================================================
// Use React.memo for performance optimization if props don't change often
const ProjectCard = memo(
  ({
    project,
    currentUser,
    isSaved,
    activeDropdown,
    isUpdatingStatus,
    hasPendingRequests,
    // Callback Props
    onToggleDropdown,
    onToggleSave,
    onViewProject,
    onViewMembers,
    onOpenJoinModal,
    onOpenRequestsModal,
    onOpenReportModal,
    onShareProject,
    onDownloadProject,
    onUpdateProjectStatus,
    onDeleteProject,
  }) => {
    // Determine if the current user is the owner of the project
    const isOwner = currentUser?.id === project?.ownerId;

    // State to manage hover on interactive child elements (like buttons) to prevent card hover effect
    const [isHoveringChild, setIsHoveringChild] = useState(false);
    const handleChildMouseEnter = useCallback(
      () => setIsHoveringChild(true),
      []
    );
    const handleChildMouseLeave = useCallback(
      () => setIsHoveringChild(false),
      []
    );

    // Construct image source URL, handling relative/absolute paths and potential base URL prefixing
    const imageSource = project?.image
      ? project.image.startsWith("http") || project.image.startsWith("blob:")
        ? project.image
        : project.image.startsWith("/")
        ? `${API_BASE_URL}${project.image}`
        : project.image
      : null; // Default to null if no image provided

    // Check if the project status indicates it's hidden/archived
    const isHidden = project?.status === "Archived";

    // --- Render function for non-owner actions ---
    const renderNonOwnerAction = () => {
      // Don't render action buttons if user is not logged in
      if (!currentUser) return null;

      switch (project?.currentUserMembershipStatus) {
        case "approved": // User is an approved member
          return (
            <button
              onMouseEnter={handleChildMouseEnter}
              onMouseLeave={handleChildMouseLeave}
              onClick={(e) => {
                e.stopPropagation();
                onViewProject(project);
              }}
              className="flex-1 bg-indigo-50 text-indigo-700 py-1.5 px-3 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
              title="View Project Details"
            >
              <FaEye /> View
            </button>
            // Placeholder: Add Leave button/logic here if needed later
            // <button onClick={onLeaveProject}>Leave</button>
          );
        case "pending": // User has a pending request
          return (
            <button
              disabled
              onMouseEnter={handleChildMouseEnter}
              onMouseLeave={handleChildMouseLeave}
              className="flex-1 bg-yellow-50 text-yellow-700 py-1.5 px-3 rounded-md opacity-80 cursor-not-allowed text-sm font-medium flex items-center justify-center gap-1.5"
              title="Your join request is pending approval"
            >
              <FaClock /> Pending
            </button>
            // Placeholder: Add Cancel Request button/logic here if needed later
            // <button onClick={onCancelRequest}>Cancel Request</button>
          );
        default: // User can join (not owner, not approved, not pending)
          return (
            <button
              onMouseEnter={handleChildMouseEnter}
              onMouseLeave={handleChildMouseLeave}
              onClick={(e) => {
                e.stopPropagation();
                onOpenJoinModal(project);
              }}
              className="flex-1 bg-green-50 text-green-700 py-1.5 px-3 rounded-md hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
              title="Request to Join Project"
            >
              <FaUserPlus /> Join
            </button>
          );
      }
    };
    // --- End renderNonOwnerAction ---

    // Main card return
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
        {/* Header Section */}
        <div className="relative">
          {/* Top Right Icons */}
          <div className="absolute top-3 right-3 z-10 flex space-x-1.5">
            {!isOwner && currentUser && (
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
            {currentUser && (
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
            )}
          </div>
          {/* Dropdown Menu */}
          <AnimatePresence>
            {activeDropdown === project.id && currentUser && (
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
                {/* Dropdown Items */}
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
                {/* Show "Request to Join" only if applicable */}
                {!isOwner &&
                  project.currentUserMembershipStatus !== "approved" &&
                  project.currentUserMembershipStatus !== "pending" && (
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
                {/* Owner-specific dropdown items */}
                {isOwner && (
                  <>
                    <div className="border-t my-1 mx-2 border-gray-100"></div>
                    <button
                      onMouseEnter={handleChildMouseEnter}
                      onMouseLeave={handleChildMouseLeave}
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
                      )}{" "}
                      {isHidden ? "Unhide Project" : "Hide Project"}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Project Image */}
          <div
            className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => onViewProject(project)}
          >
            {imageSource ? (
              <img
                src={imageSource}
                alt={`Cover for ${project?.title || "Project"}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                }}
              />
            ) : (
              <FaUniversity className="text-6xl text-gray-300" />
            )}
          </div>
        </div>

        {/* Card Body Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Status & Owner Info */}
          <div className="flex justify-between items-center mb-2 text-xs">
            <span
              className={`font-medium px-2.5 py-0.5 rounded-full border ${getStatusBadgeClasses(
                project?.status
              )}`}
            >
              {project?.status || "Unknown"}
            </span>
            <div
              className="flex items-center text-gray-500"
              title={`Owner: ${project?.owner?.username || "Unknown"}`}
            >
              {project?.owner ? (
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
            {project?.title || "Untitled Project"}
          </h3>
          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
            {project?.description || (
              <span className="italic text-gray-400">No description.</span>
            )}
          </p>
          {/* Collaborators Info */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <FaUsers className="mr-1.5 text-gray-400" />
            <span>
              Needs:{" "}
              <span className="font-medium text-gray-700">
                {project?.requiredCollaborators ?? "N/A"}
              </span>{" "}
              collaborator(s)
            </span>
          </div>

          {/* Footer Buttons */}
          <div
            className={`flex mt-auto pt-3 border-t border-gray-100 ${
              isOwner ? "gap-1 sm:gap-1.5" : "space-x-2"
            }`}
          >
            {isOwner ? ( // Owner Buttons
              <>
                <button
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProject(project);
                  }}
                  className="py-1.5 px-2 sm:px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors flex-grow bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  title="View Details"
                >
                  <FaEye className="flex-shrink-0" />{" "}
                  <span className="hidden sm:inline">View</span>
                </button>
                <Link
                  to={`/projects/edit/${project?.id}`}
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={(e) => e.stopPropagation()}
                  className="py-1.5 px-2 sm:px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors flex-grow bg-amber-50 text-amber-700 hover:bg-amber-100"
                  title="Edit Project"
                >
                  <FaPencilAlt className="flex-shrink-0" />{" "}
                  <span className="hidden sm:inline">Edit</span>
                </Link>
                <button
                  onMouseEnter={handleChildMouseEnter}
                  onMouseLeave={handleChildMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRequestsModal(project);
                  }}
                  disabled={!hasPendingRequests}
                  className={`py-1.5 px-2 sm:px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors flex-grow ${
                    hasPendingRequests
                      ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
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
                    onDeleteProject(project?.id);
                  }}
                  className="py-1.5 px-2 sm:px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors flex-grow bg-red-50 text-red-700 hover:bg-red-100"
                  title="Delete Project"
                >
                  <FaTrashAlt className="flex-shrink-0" />{" "}
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            ) : (
              // Non-Owner Buttons (Rendered by function)
              renderNonOwnerAction()
            )}
          </div>
        </div>
      </motion.div>
    );
  }
); // End of ProjectCard component

// ========================================================================
// --- Main Projects Page Component ---
// ========================================================================
export default function Projects({ currentUser }) {
  // --- State ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [savedProjects, setSavedProjects] = useState(new Set()); // Placeholder state
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [reportData, setReportData] = useState(""); // Placeholder state
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false); // Loading state for join request
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Loading state for hide/unhide
  const [projectsWithNoPending, setProjectsWithNoPending] = useState(new Set()); // Tracks projects with no pending reqs
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = PROJECTS_PER_PAGE;

  // --- Callbacks ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
  }, []);

  // Fetch projects API call
  const fetchProjects = useCallback(
    async (currentPage = 1) => {
      console.log(
        `Fetching projects: page=${currentPage}, limit=${limit}, status=${filterStatus}, search=${searchTerm}`
      );
      setIsLoading(true);
      setError("");
      try {
        const response = await apiClient.get(`/api/projects`, {
          params: {
            status: filterStatus || undefined,
            search: searchTerm || undefined,
            page: currentPage,
            limit,
          },
          // Auth token added by interceptor
        });

        if (response.data?.success && Array.isArray(response.data.data)) {
          const fetchedProjects = response.data.data.map((proj) => ({
            id: proj.id,
            title: proj.title ?? "Untitled Project",
            description: proj.description ?? "No description.",
            status: proj.status ?? "Unknown",
            requiredCollaborators: proj.requiredCollaborators ?? 0,
            ownerId: proj.ownerId ?? null,
            owner: proj.owner
              ? {
                  id: proj.owner.id,
                  username: proj.owner.username ?? "Unknown",
                  profilePictureUrl: proj.owner.profilePictureUrl || null,
                }
              : null,
            createdAt: proj.createdAt,
            updatedAt: proj.updatedAt,
            image: proj.imagePath || proj.imageUrl || null, // Use correct image field from backend
            currentUserMembershipStatus:
              proj.currentUserMembershipStatus || null, // Expect this field
          }));
          setProjects(fetchedProjects);
          setTotalPages(response.data.totalPages || 1);
          console.log(
            `Fetched ${fetchedProjects.length} projects. Total pages: ${
              response.data.totalPages || 1
            }`
          );
        } else {
          throw new Error(response.data?.message || "Invalid data format.");
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
        setTotalPages(1); // Reset on error
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, filterStatus, limit, showNotification]
  ); // Added showNotification back

  // Effect for initial load and filter changes
  useEffect(() => {
    setPage(1); // Reset to page 1 when filters change
    setProjectsWithNoPending(new Set()); // Reset pending knowledge
    fetchProjects(1); // Fetch page 1
  }, [searchTerm, filterStatus]); // fetchProjects removed to avoid double call on mount

  // Effect for pagination changes
  useEffect(() => {
    // Fetch only when page number changes *after* the initial load/filter change
    // We need a way to distinguish initial load/filter from actual pagination click
    // This simple check fetches if page > 1, assuming filters always reset to 1
    if (page > 1) {
      fetchProjects(page);
    }
  }, [page, fetchProjects]);

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
    setReportData(`Report content for ${project.title}`);
    setSelectedProject(project);
    setModalType("report");
    setActiveDropdown(null);
  }, []);

  // --- Action Handlers ---
  const confirmJoinRequest = useCallback(
    async (message) => {
      if (!selectedProject || !currentUser?.id) return;
      setIsSubmittingJoin(true);
      try {
        await apiClient.post(`/api/collaboration-requests`, {
          projectId: selectedProject.id,
          message,
        });
        showNotification("Request sent!", "success");
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProject.id
              ? { ...p, currentUserMembershipStatus: "pending" }
              : p
          )
        );
        handleCloseModal();
      } catch (err) {
        showNotification(err.response?.data?.message || "Failed.", "error");
      } finally {
        setIsSubmittingJoin(false);
      }
    },
    [selectedProject, currentUser?.id, showNotification, handleCloseModal]
  );

  // Placeholder - Implement API calls
  const toggleSaveProject = useCallback(
    (projectId) => {
      console.log("Toggle save:", projectId);
      showNotification("Save toggled (UI only)", "info");
      setSavedProjects((prev) => {
        const ns = new Set(prev);
        if (ns.has(projectId)) ns.delete(projectId);
        else ns.add(projectId);
        return ns;
      });
      setActiveDropdown(null);
    },
    [showNotification]
  );
  const handleShareProject = useCallback(
    (projectId) => {
      console.log("Share:", projectId);
      navigator.clipboard
        .writeText(`${window.location.origin}/projects/${projectId}`)
        .then(
          () => showNotification("Link copied!", "success"),
          () => showNotification("Copy failed.", "error")
        );
      setActiveDropdown(null);
    },
    [showNotification]
  );
  const handleDownloadProject = useCallback(
    (project) => {
      console.log("Download:", project.id);
      const data = `Title: ${project.title}\nDesc: ${project.description}`;
      const blob = new Blob([data], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification("Downloaded.", "info");
      setActiveDropdown(null);
    },
    [showNotification]
  );
  const downloadReport = useCallback(
    (reportText, projectName) => {
      console.log("Download report:", projectName);
      /* ... download logic ... */ showNotification(
        "Report downloaded.",
        "info"
      );
      handleCloseModal();
    },
    [showNotification, handleCloseModal]
  );
  const toggleDropdown = useCallback((projectId) => {
    setActiveDropdown((prev) => (prev === projectId ? null : projectId));
  }, []);

  const handleUpdateProjectStatus = useCallback(
    async (projectToUpdate, newStatus) => {
      if (!projectToUpdate) return;
      console.log(
        `Updating project ${projectToUpdate.id} status to ${newStatus}`
      );
      const oldStatus = projectToUpdate.status; // Store old status for revert
      setIsUpdatingStatus(true);
      setSelectedProject(projectToUpdate);
      setActiveDropdown(null);
      // Optimistic UI Update
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectToUpdate.id ? { ...p, status: newStatus } : p
        )
      );
      try {
        // --- IMPORTANT: Use the correct endpoint for status update ---
        // Option A: General PUT/PATCH to /api/projects/:id
        // await apiClient.put(`/api/projects/${projectToUpdate.id}`, { status: newStatus });
        // Option B: Specific PATCH to /api/projects/:id/status (if you created one)
        await apiClient.patch(`/api/projects/${projectToUpdate.id}/status`, {
          status: newStatus,
        }); // Example using PATCH
        showNotification(`Status updated to ${newStatus}.`, "success");
      } catch (err) {
        console.error("Update status error:", err);
        showNotification(
          err.response?.data?.message || "Update failed.",
          "error"
        );
        // Revert Optimistic Update on error
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectToUpdate.id ? { ...p, status: oldStatus } : p
          )
        );
      } finally {
        setIsUpdatingStatus(false);
        setSelectedProject(null);
      }
    },
    [showNotification]
  );

  const handleDeleteProject = useCallback(
    async (projectId) => {
      if (!projectId || !window.confirm("Delete this project permanently?")) {
        setActiveDropdown(null);
        return;
      }
      console.log("Deleting project:", projectId);
      const originalProjects = [...projects];
      setProjects((prev) => prev.filter((p) => p.id !== projectId)); // Optimistic remove
      setActiveDropdown(null);
      try {
        await apiClient.delete(`/api/projects/${projectId}`);
        showNotification("Project deleted.", "success");
        // Consider refetching current page if deletion affects pagination
        if (projects.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchProjects(page); // Refetch current page
      } catch (err) {
        showNotification(
          err.response?.data?.message || "Delete failed.",
          "error"
        );
        setProjects(originalProjects);
      } // Revert on error
    },
    [projects, page, showNotification, fetchProjects]
  ); // Added fetchProjects

  const handleRequestsHandled = useCallback((projectId) => {
    console.log("All requests handled callback:", projectId);
    setProjectsWithNoPending((prev) => new Set(prev).add(projectId));
  }, []);

  // --- Main Render ---
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification Area */}
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
          <AnimatePresence>
            {notification.show && (
              <motion.div /* ... */>
                {" "}
                <Notification /* ... */ />{" "}
              </motion.div>
            )}{" "}
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
                placeholder="Search title..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
              />{" "}
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-white"
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                {" "}
                <FaPlus className="mr-1.5" /> New
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
            <div className="flex justify-center py-24">
              <LoadingSpinner size="lg" />
              <span className="ml-3">Loading...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center mt-8 py-12 px-6 bg-white rounded-lg shadow border">
              {" "}
              <FaSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />{" "}
              <h3 className="text-xl font-semibold">No Projects Found</h3>{" "}
              <p className="mt-2 text-gray-600">
                {searchTerm || filterStatus
                  ? "No projects match filters."
                  : "No projects yet."}
              </p>{" "}
              {/* ... buttons ... */}{" "}
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
                      }
                      onToggleDropdown={toggleDropdown}
                      onToggleSave={toggleSaveProject}
                      onViewProject={handleViewProject}
                      onViewMembers={handleViewMembers}
                      onOpenJoinModal={handleOpenJoinModal}
                      onOpenRequestsModal={handleOpenRequestsModal}
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
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isLoading}
                    className="px-3 py-1.5 mx-1 rounded border bg-white disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="px-2 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isLoading}
                    className="px-3 py-1.5 mx-1 rounded border bg-white disabled:opacity-50"
                  >
                    Next
                  </button>
                  {/* Consider a more advanced pagination component for many pages */}
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
            onAllRequestsHandled={handleRequestsHandled}
          />
        )}
        {modalType === "report" && selectedProject && (
          <ReportModal
            key={`report-${selectedProject.id}`}
            reportData={reportData}
            projectName={selectedProject?.title}
            onClose={handleCloseModal}
            onDownload={(text) => downloadReport(text, selectedProject?.title)}
          />
        )}
        {/* Uncomment if ChatModal is ready: */}
        {/* {modalType === "chat" && selectedProject && (<ChatModal key={`chat-${selectedProject.id}`} project={selectedProject} currentUser={currentUser} onClose={handleCloseModal}/>)} */}
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
