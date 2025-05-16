import React, { useState, useEffect, useCallback, memo } from "react"; // Import memo
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
  FaClock,
  FaUserCircle, // Added for profile image fallback
} from "react-icons/fa";

// --- Components ---
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
import ProjectDetailModal from "../Component/projects/ProjectDetailModal";
import MembersModal from "../Component/projects/MembersModal";
import JoinRequestModal from "../Component/projects/JoinRequestModal";
import RequestsModal from "../Component/projects/RequestsModal";
import ReportModal from "../Component/projects/ReportModal";
// import ChatModal from "../Component/projects/ChatModal";

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

// --- ProfileImage Sub-Component ---
const ProfileImage = memo(
  ({ src, alt, fallbackUsername, className = "h-6 w-6 rounded-full" }) => {
    const [hasError, setHasError] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
      setHasError(false); // Reset error on src change
      if (src) {
        if (src.startsWith("http") || src.startsWith("blob:")) {
          setImageSrc(src);
        } else {
          // Prepend API_BASE_URL if it's a relative path
          let fullUrl = API_BASE_URL;
          if (API_BASE_URL.endsWith("/") && src.startsWith("/")) {
            fullUrl += src.substring(1);
          } else if (!API_BASE_URL.endsWith("/") && !src.startsWith("/")) {
            fullUrl += "/";
            fullUrl += src;
          } else {
            fullUrl += src;
          }
          setImageSrc(fullUrl);
        }
      } else {
        setImageSrc(null);
      }
    }, [src]);

    if (!imageSrc || hasError) {
      // Fallback to initials or a generic icon
      return (
        <span
          className={`${className} bg-gray-300 flex items-center justify-center text-gray-600 font-semibold uppercase`}
          title={alt} // Add title for accessibility on fallback
        >
          {fallbackUsername ? (
            fallbackUsername.charAt(0)
          ) : (
            <FaUserCircle className="w-[80%] h-[80%] text-gray-400" />
          )}
        </span>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    );
  }
);
// --- End of ProfileImage Sub-Component ---

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
    const isOwner = currentUser?.id === project?.ownerId;
    const [isHoveringChild, setIsHoveringChild] = useState(false);
    const handleChildMouseEnter = useCallback(
      () => setIsHoveringChild(true),
      []
    );
    const handleChildMouseLeave = useCallback(
      () => setIsHoveringChild(false),
      []
    );

    const imageSource = project?.image
      ? project.image.startsWith("http") || project.image.startsWith("blob:")
        ? project.image
        : project.image.startsWith("/")
        ? `${API_BASE_URL}${project.image}` // Assuming project.image is like /path/to/image.png
        : `${API_BASE_URL}/${project.image}` // Assuming project.image is like image.png
      : null;

    const isHidden = project?.status === "Archived";

    const renderNonOwnerAction = () => {
      if (!currentUser) return null;
      switch (project?.currentUserMembershipStatus) {
        case "approved":
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
          );
        case "pending":
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
          );
        default:
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
        <div className="relative">
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
                  e.target.src = "/placeholder-image.png"; // Ensure this is in your public folder
                }}
              />
            ) : (
              <FaUniversity className="text-6xl text-gray-300" />
            )}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
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
                      className="font-medium hover:text-indigo-600 hover:underline truncate max-w-[100px] sm:max-w-[150px]"
                    >
                      {project.owner.username || "User"}
                    </Link>
                  )}
                  {/* MODIFIED: Use ProfileImage component */}
                  <ProfileImage
                    src={project.owner.profilePictureUrl}
                    alt={project.owner.username || "Owner"}
                    fallbackUsername={project.owner.username}
                    className="ml-1.5 h-4 w-4 rounded-full object-cover flex-shrink-0"
                  />
                </>
              ) : (
                <span className="text-gray-400 italic">Owner unknown</span>
              )}
            </div>
          </div>
          <h3
            className="text-base md:text-lg font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-indigo-600 cursor-pointer"
            onClick={() => onViewProject(project)}
          >
            {project?.title || "Untitled Project"}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
            {project?.description || (
              <span className="italic text-gray-400">No description.</span>
            )}
          </p>
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

          <div
            className={`flex mt-auto pt-3 border-t border-gray-100 ${
              isOwner ? "gap-1 sm:gap-1.5" : "space-x-2"
            }`}
          >
            {isOwner ? (
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
              renderNonOwnerAction()
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

export default function Projects({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [savedProjects, setSavedProjects] = useState(new Set());
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [reportData, setReportData] = useState("");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [projectsWithNoPending, setProjectsWithNoPending] = useState(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = PROJECTS_PER_PAGE;

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
  }, []);

  const fetchProjects = useCallback(
    async (currentPage = 1) => {
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
        });

        if (response.data?.success && Array.isArray(response.data.data)) {
          const fetchedProjects = response.data.data.map((proj) => ({
            id: proj.id,
            title: proj.title ?? "Untitled Project",
            description: proj.description ?? "No description.",
            status: proj.status ?? "Unknown",
            requiredCollaborators: proj.requiredCollaborators ?? 0,
            ownerId: proj.ownerId ?? null,
            owner: proj.owner // Ensure owner object is passed as is
              ? {
                  id: proj.owner.id,
                  username: proj.owner.username ?? "Unknown",
                  profilePictureUrl: proj.owner.profilePictureUrl || null, // This will be used by ProfileImage
                }
              : null,
            createdAt: proj.createdAt,
            updatedAt: proj.updatedAt,
            image: proj.imagePath || proj.imageUrl || null,
            currentUserMembershipStatus:
              proj.currentUserMembershipStatus || null,
          }));
          setProjects(fetchedProjects);
          setTotalPages(response.data.totalPages || 1);
        } else {
          throw new Error(response.data?.message || "Invalid data format.");
        }
      } catch (err) {
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
  );

  useEffect(() => {
    setPage(1);
    setProjectsWithNoPending(new Set());
    // fetchProjects(1); // fetchProjects is now a dependency, this line is removed to prevent double call
  }, [searchTerm, filterStatus]);

  // useEffect to call fetchProjects when page or other dependencies change
  useEffect(() => {
    fetchProjects(page);
  }, [page, fetchProjects]); // Added fetchProjects as dependency

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

  const toggleSaveProject = useCallback(
    (projectId) => {
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
      navigator.clipboard
        .writeText(`${window.location.origin}/projects/${projectId}`) // Adjusted to share project specific URL
        .then(
          () => showNotification("Project link copied!", "success"),
          () => showNotification("Copy failed.", "error")
        );
      setActiveDropdown(null);
    },
    [showNotification]
  );
  const handleDownloadProject = useCallback(
    (project) => {
      const data = `Title: ${project.title}\nDescription: ${project.description}\nStatus: ${project.status}\nRequired Collaborators: ${project.requiredCollaborators}`;
      const blob = new Blob([data], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, "_")}_project_info.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("Project info downloaded.", "info");
      setActiveDropdown(null);
    },
    [showNotification]
  );
  const downloadReport = useCallback(
    (reportText, projectName) => {
      const blob = new Blob([reportText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${projectName.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("Report downloaded.", "info");
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
      const oldStatus = projectToUpdate.status;
      setIsUpdatingStatus(true);
      setSelectedProject(projectToUpdate); // Keep track of which project is being updated
      setActiveDropdown(null);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectToUpdate.id ? { ...p, status: newStatus } : p
        )
      );
      try {
        await apiClient.patch(`/api/projects/${projectToUpdate.id}/status`, {
          status: newStatus,
        });
        showNotification(
          `Project "${projectToUpdate.title}" status updated to ${newStatus}.`,
          "success"
        );
      } catch (err) {
        showNotification(
          err.response?.data?.message || "Status update failed.",
          "error"
        );
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectToUpdate.id ? { ...p, status: oldStatus } : p
          )
        );
      } finally {
        setIsUpdatingStatus(false);
        setSelectedProject(null); // Clear selected project after update
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
      const originalProjects = [...projects];
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setActiveDropdown(null);
      try {
        await apiClient.delete(`/api/projects/${projectId}`);
        showNotification("Project deleted.", "success");
        if (projects.length === 1 && page > 1) {
          setPage((p) => p - 1); // Go to previous page if current becomes empty
        } else {
          fetchProjects(page); // Refetch current page data
        }
      } catch (err) {
        showNotification(
          err.response?.data?.message || "Delete failed.",
          "error"
        );
        setProjects(originalProjects);
      }
    },
    [projects, page, showNotification, fetchProjects]
  );

  const handleRequestsHandled = useCallback((projectId) => {
    setProjectsWithNoPending((prev) => new Set(prev).add(projectId));
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
          <AnimatePresence>
            {notification.show && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "circOut" }}
              >
                <Notification
                  message={notification.message}
                  type={notification.type}
                  show={notification.show}
                  onClose={() =>
                    setNotification((prev) => ({ ...prev, show: false }))
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Research Projects
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Discover, Collaborate, Innovate.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, owner..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {currentUser && (
              <Link
                to="/projects/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center shadow-sm"
              >
                <FaPlus className="mr-1.5" /> New Project
              </Link>
            )}
          </div>
        </div>

        {error && !isLoading && (
          <div className="mb-6">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}

        <div className="mt-6 pb-10">
          {isLoading && projects.length === 0 ? ( // Show full page spinner only if no projects are yet displayed
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-lg font-medium text-gray-600 mt-4">
                Loading Projects...
              </span>
            </div>
          ) : !isLoading && projects.length === 0 ? (
            <div className="text-center mt-8 py-12 px-6 bg-white rounded-lg shadow border">
              <FaSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">
                No Projects Found
              </h3>
              <p className="mt-2 text-gray-600">
                {searchTerm || filterStatus
                  ? "No projects match your current filters."
                  : "There are no projects to display at the moment."}
              </p>
              {currentUser && !searchTerm && !filterStatus && (
                <Link
                  to="/projects/new"
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaPlus className="mr-2 -ml-1 h-5 w-5" />
                  Create Your First Project
                </Link>
              )}
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
                        project.ownerId === currentUser?.id && // Only owners see this for their projects
                        !projectsWithNoPending.has(project.id) // And if requests haven't been marked as handled
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
              {isLoading &&
                projects.length > 0 && ( // Show a smaller loading indicator if projects are already there but more are loading (e.g. pagination)
                  <div className="flex justify-center items-center py-8">
                    <LoadingSpinner size="md" />
                    <span className="ml-2 text-gray-600">Loading more...</span>
                  </div>
                )}
              {totalPages > 1 && !isLoading && (
                <div
                  className="flex justify-center items-center mt-10"
                  role="navigation"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isLoading}
                    className="px-4 py-2 mx-1 rounded-md border bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isLoading}
                    className="px-4 py-2 mx-1 rounded-md border bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
            reportData={reportData} // You might want to pass the project ID or more context
            itemName={selectedProject?.title} // Use itemName for consistency if ReportModal expects it
            itemType="project"
            onClose={handleCloseModal}
            onSubmit={(reportContent) => {
              // Placeholder for report submission logic
              console.log(
                "Submitting report for project:",
                selectedProject.id,
                "Content:",
                reportContent
              );
              showNotification("Report submitted (simulated).", "success");
              handleCloseModal();
            }}
            onDownload={(text) => downloadReport(text, selectedProject?.title)}
          />
        )}
      </AnimatePresence>

      {activeDropdown && (
        <div
          className="fixed inset-0 z-10 bg-transparent" // Click away to close dropdown
          onClick={() => setActiveDropdown(null)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
