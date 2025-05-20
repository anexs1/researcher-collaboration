import React, { useState, useEffect, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- Icons ---
import {
  FaSearch,
  FaUniversity, // Or FaProjectDiagram if you prefer a different generic icon
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
  FaUserCircle,
  FaRunning,
  FaExclamationTriangle, // For report icon
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

// --- Constants ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const PROJECTS_PER_PAGE = 9;
const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Planning", label: "Planning" },
  { value: "Active", label: "Active" },
  { value: "Ongoing", label: "Ongoing" },
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
const getStatusBadgeClasses = (status, isTeamFull = false) => {
  // Enhanced colors for better visual appeal
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "active":
    case "ongoing":
      return "bg-sky-100 text-sky-700 border-sky-300";
    case "planning":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "on hold":
      return "bg-rose-100 text-rose-700 border-rose-300";
    case "archived":
      return "bg-slate-100 text-slate-600 border-slate-300";
    default:
      return "bg-slate-100 text-slate-600 border-slate-300";
  }
};

// --- ProfileImage Sub-Component (No changes here, assuming it's fine) ---
const ProfileImage = memo(
  ({ src, alt, fallbackUsername, className = "h-6 w-6 rounded-full" }) => {
    const [hasError, setHasError] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
      setHasError(false);
      if (src) {
        if (src.startsWith("http") || src.startsWith("blob:")) {
          setImageSrc(src);
        } else {
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
      return (
        <span
          className={`${className} bg-slate-300 flex items-center justify-center text-slate-600 font-semibold uppercase`}
          title={alt}
        >
          {fallbackUsername ? (
            fallbackUsername.charAt(0)
          ) : (
            <FaUserCircle className="w-[80%] h-[80%] text-slate-400" />
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

const ProjectCard = memo(
  ({
    project,
    currentUser,
    isSaved,
    activeDropdown,
    isUpdatingStatus,
    hasPendingRequests,
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
        ? `${API_BASE_URL}${project.image}`
        : `${API_BASE_URL}/${project.image}`
      : null;

    const isHidden = project?.status === "Archived";
    const requiredSpots = parseInt(project?.requiredCollaborators, 10) || 0;
    const currentSpotsFilled = parseInt(project?.currentCollaborators, 10) || 0;
    const isTeamFull = requiredSpots > 0 && currentSpotsFilled >= requiredSpots;
    const displayStatus = project?.status;

    const renderNonOwnerAction = () => {
      if (!currentUser) return null;

      const baseButtonClass =
        "flex-1 py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1";

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
              className={`${baseButtonClass} bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-400`}
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
              className={`${baseButtonClass} bg-amber-400 text-amber-900 opacity-90 cursor-not-allowed`}
              title="Your join request is pending approval"
            >
              <FaClock /> Pending
            </button>
          );
        default:
          if (isTeamFull) {
            return (
              <button
                disabled
                onMouseEnter={handleChildMouseEnter}
                onMouseLeave={handleChildMouseLeave}
                className={`${baseButtonClass} bg-slate-200 text-slate-500 cursor-not-allowed`}
                title="This project team is currently full."
              >
                <FaRunning /> Team Full
              </button>
            );
          }
          return (
            <button
              onMouseEnter={handleChildMouseEnter}
              onMouseLeave={handleChildMouseLeave}
              onClick={(e) => {
                e.stopPropagation();
                onOpenJoinModal(project);
              }}
              className={`${baseButtonClass} bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400`}
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
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.25 } }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={
          isHoveringChild
            ? {}
            : {
                scale: 1.015,
                y: -4,
                boxShadow:
                  "0 10px 20px -5px rgba(0,0,0,0.07), 0 4px 8px -6px rgba(0,0,0,0.05)", // Softer, more spread shadow
              }
        }
        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-slate-200/70 relative flex flex-col h-full"
      >
        <div className="relative">
          <div className="absolute top-3.5 right-3.5 z-10 flex space-x-2">
            {!isOwner && currentUser && (
              <button
                onMouseEnter={handleChildMouseEnter}
                onMouseLeave={handleChildMouseLeave}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(project.id);
                }}
                className="text-slate-600 bg-white/80 backdrop-blur-sm hover:bg-white hover:text-sky-600 p-2 rounded-full shadow-md border border-slate-200/50 transition-all"
                title={isSaved ? "Unsave Project" : "Save Project"}
                aria-label={isSaved ? "Unsave Project" : "Save Project"}
              >
                {isSaved ? (
                  <FaBookmark className="text-sky-500 h-4 w-4" />
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
                className="text-slate-600 bg-white/80 backdrop-blur-sm hover:bg-white hover:text-slate-800 p-2 rounded-full shadow-md border border-slate-200/50 transition-all"
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
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1 } }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-3 top-14 mt-1 bg-white/90 backdrop-blur-md shadow-xl rounded-lg z-20 w-56 border border-slate-200/70 py-1.5 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby={`options-menu-${project.id}`}
              >
                {[
                  {
                    label: "Download Info",
                    icon: <FaDownload className="mr-2.5 text-sky-500" />,
                    action: () => onDownloadProject(project),
                  },
                  {
                    label: "Report Project",
                    icon: <FaExclamationTriangle className="mr-2.5 text-orange-500" />,
                    action: () => onOpenReportModal(project),
                  },
                  {
                    label: "Share Project",
                    icon: <FaShareAlt className="mr-2.5 text-emerald-500" />,
                    action: () => onShareProject(project.id),
                  },
                  {
                    label: "View Members",
                    icon: <FaUsers className="mr-2.5 text-purple-500" />,
                    action: () => onViewMembers(project),
                  },
                  ...(!isOwner &&
                  project.currentUserMembershipStatus !== "approved" &&
                  project.currentUserMembershipStatus !== "pending" &&
                  !isTeamFull
                    ? [
                        {
                          label: "Request to Join",
                          icon: <FaUserPlus className="mr-2.5 text-teal-500" />,
                          action: () => onOpenJoinModal(project),
                        },
                      ]
                    : []),
                  ...(isOwner
                    ? [
                        { type: "divider" },
                        {
                          label: isHidden ? "Unhide Project" : "Hide Project",
                          icon: isUpdatingStatus ? (
                            <FaSpinner className="animate-spin h-4 w-4 mr-2.5" />
                          ) : isHidden ? (
                            <FaEye className="mr-2.5 text-emerald-500" />
                          ) : (
                            <FaEyeSlash className="mr-2.5 text-amber-600" />
                          ),
                          action: () =>
                            onUpdateProjectStatus(
                              project,
                              isHidden ? "Active" : "Archived"
                            ),
                          disabled: isUpdatingStatus,
                        },
                      ]
                    : []),
                ].map((item, idx) =>
                  item.type === "divider" ? (
                    <div
                      key={`divider-${idx}`}
                      className="border-t my-1.5 mx-2 border-slate-200/80"
                    ></div>
                  ) : (
                    <button
                      key={item.label}
                      onClick={item.action}
                      disabled={item.disabled}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      role="menuitem"
                    >
                      {item.icon} {item.label}
                    </button>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className="h-52 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={() => onViewProject(project)}
          >
            {imageSource ? (
              <img
                src={imageSource}
                alt={`Cover for ${project?.title || "Project"}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none'; // Hide broken image
                  e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-slate-400"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg></div>`;
                }}
              />
            ) : (
              <FaUniversity className="text-7xl text-slate-400 group-hover:scale-110 transition-transform duration-300 ease-out" />
            )}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-2.5 text-xs">
            <span
              className={`font-semibold px-3 py-1 rounded-full border text-xs ${getStatusBadgeClasses(
                displayStatus,
                isTeamFull
              )}`}
            >
              {displayStatus || "Unknown"}
              {isTeamFull &&
                (project.status === "Active" ||
                  project.status === "Planning") && (
                  <span className="ml-1 font-normal opacity-80">(Full)</span>
                )}
            </span>
            <div
              className="flex items-center text-slate-500"
              title={`Owner: ${project?.owner?.username || "Unknown"}`}
            >
              {project?.owner ? (
                <>
                  <span className="hidden sm:inline mr-1.5">By:</span>
                  {isOwner ? (
                    <span className="font-semibold text-sky-600">You</span>
                  ) : (
                    <Link
                      to={
                        project.owner.id ? `/profile/${project.owner.id}` : "#"
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium hover:text-sky-600 hover:underline truncate max-w-[90px] sm:max-w-[140px]"
                    >
                      {project.owner.username || "User"}
                    </Link>
                  )}
                  <ProfileImage
                    src={project.owner.profilePictureUrl}
                    alt={project.owner.username || "Owner"}
                    fallbackUsername={project.owner.username}
                    className="ml-2 h-5 w-5 rounded-full object-cover flex-shrink-0 border border-slate-200"
                  />
                </>
              ) : (
                <span className="text-slate-400 italic">Owner unknown</span>
              )}
            </div>
          </div>
          <h3
            className="text-lg md:text-xl font-semibold text-slate-800 mb-2 line-clamp-2 hover:text-sky-600 cursor-pointer transition-colors"
            onClick={() => onViewProject(project)}
          >
            {project?.title || "Untitled Project"}
          </h3>
          <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">
            {project?.description || (
              <span className="italic text-slate-400">No description provided.</span>
            )}
          </p>
          <div className="flex items-center text-sm text-slate-500 mb-5">
            <FaUsers className="mr-2 text-slate-400" />
            {isTeamFull ? (
              <span className="font-semibold text-emerald-600">
                Team Full ({currentSpotsFilled}/{requiredSpots})
              </span>
            ) : requiredSpots > 0 ? (
              <>
                <span>Needs:</span>
                <span className="font-semibold text-slate-700 mx-1">
                  {Math.max(0, requiredSpots - currentSpotsFilled)}
                </span>
                <span>of</span>
                <span className="font-semibold text-slate-700 mx-1">
                  {requiredSpots}
                </span>
              </>
            ) : (
              <span>
                Needs: <span className="font-semibold text-slate-700">N/A</span>
              </span>
            )}
            <span className="mx-1.5 text-slate-300">·</span>
            <span>Members:</span>
            <span className="font-semibold text-slate-700 ml-1">
              {currentSpotsFilled}
            </span>
          </div>

          <div
            className={`flex mt-auto pt-4 border-t border-slate-200/60 ${
              isOwner ? "gap-2" : "space-x-2" // Ensure consistent gap
            }`}
          >
            {isOwner ? (
              <>
                {[
                  {
                    label: "View",
                    icon: <FaEye className="flex-shrink-0" />,
                    action: (e) => {
                      e.stopPropagation();
                      onViewProject(project);
                    },
                    style: "bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-400",
                    title: "View Details",
                  },
                  {
                    label: "Edit",
                    icon: <FaPencilAlt className="flex-shrink-0" />,
                    to: `/projects/edit/${project?.id}`,
                    style: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
                    title: "Edit Project",
                  },
                  {
                    label: "Requests",
                    icon: <FaUserCheck className="flex-shrink-0" />,
                    action: (e) => {
                      e.stopPropagation();
                      onOpenRequestsModal(project);
                    },
                    disabled: !hasPendingRequests,
                    style: hasPendingRequests
                      ? "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-400"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed opacity-80",
                    title: hasPendingRequests
                      ? "Manage Join Requests"
                      : "No Pending Requests",
                  },
                  {
                    label: "Delete",
                    icon: <FaTrashAlt className="flex-shrink-0" />,
                    action: (e) => {
                      e.stopPropagation();
                      onDeleteProject(project?.id);
                    },
                    style: "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-400",
                    title: "Delete Project",
                  },
                ].map((btn) =>
                  btn.to ? (
                    <Link
                      key={btn.label}
                      to={btn.to}
                      onClick={(e) => e.stopPropagation()}
                      className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200 flex-grow shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 ${btn.style}`}
                      title={btn.title}
                    >
                      {btn.icon}
                      <span className="hidden sm:inline">{btn.label}</span>
                    </Link>
                  ) : (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      disabled={btn.disabled}
                      className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200 flex-grow shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 ${btn.style}`}
                      title={btn.title}
                    >
                      {btn.icon}
                      <span className="hidden sm:inline">{btn.label}</span>
                    </button>
                  )
                )}
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
            currentCollaborators:
              proj.currentCollaborators ?? proj.membersCount ?? 0,
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
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    fetchProjects(page);
  }, [page, fetchProjects]);

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
    setReportData(`Reporting project: ${project.title}`); // More specific placeholder
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
        showNotification("Join request sent successfully!", "success");
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProject.id
              ? { ...p, currentUserMembershipStatus: "pending" }
              : p
          )
        );
        handleCloseModal();
      } catch (err) {
        showNotification(
          err.response?.data?.message || "Failed to send join request.",
          "error"
        );
      } finally {
        setIsSubmittingJoin(false);
      }
    },
    [selectedProject, currentUser?.id, showNotification, handleCloseModal]
  );

  const toggleSaveProject = useCallback(
    (projectId) => {
      setSavedProjects((prev) => {
        const newSaved = new Set(prev);
        if (newSaved.has(projectId)) {
          newSaved.delete(projectId);
          showNotification("Project unsaved!", "info");
        } else {
          newSaved.add(projectId);
          showNotification("Project saved!", "success");
        }
        return newSaved;
      });
      setActiveDropdown(null);
    },
    [showNotification]
  );

  const handleShareProject = useCallback(
    (projectId) => {
      navigator.clipboard
        .writeText(`${window.location.origin}/projects/${projectId}`) // Assuming project detail pages exist
        .then(
          () => showNotification("Project link copied to clipboard!", "success"),
          () => showNotification("Failed to copy project link.", "error")
        );
      setActiveDropdown(null);
    },
    [showNotification]
  );

  const handleDownloadProject = useCallback(
    (project) => {
      const data = `Project Title: ${project.title}\nStatus: ${
        project.status
      }\nOwner: ${project.owner?.username || "N/A"}\n\nDescription:\n${
        project.description
      }\n\nRequired Collaborators: ${
        project.requiredCollaborators
      }\nCurrent Collaborators: ${project.currentCollaborators}`;
      const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "_")}_project_info.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("Project information downloaded.", "info");
      setActiveDropdown(null);
    },
    [showNotification]
  );

  const downloadReport = useCallback( // Keep this if ReportModal uses it
    (reportText, projectName) => {
      const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${projectName
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("Report content downloaded.", "info");
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
      setSelectedProject(projectToUpdate); // Keep track for UI updates if needed
      setActiveDropdown(null);

      // Optimistic UI Update
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
          `Project "${projectToUpdate.title}" status successfully updated to ${newStatus}.`,
          "success"
        );
      } catch (err) {
        showNotification(
          err.response?.data?.message || "Failed to update project status.",
          "error"
        );
        // Revert UI on error
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectToUpdate.id ? { ...p, status: oldStatus } : p
          )
        );
      } finally {
        setIsUpdatingStatus(false);
        setSelectedProject(null); // Clear selected project after operation
      }
    },
    [showNotification]
  );

  const handleDeleteProject = useCallback(
    async (projectId) => {
      if (!projectId || !window.confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) {
        setActiveDropdown(null);
        return;
      }
      const originalProjects = [...projects];
      // Optimistic UI Update
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setActiveDropdown(null);

      try {
        await apiClient.delete(`/api/projects/${projectId}`);
        showNotification("Project successfully deleted.", "success");
        // If on last page and it becomes empty, go to previous page
        if (projects.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else if (projects.length > 1) {
          fetchProjects(page); // Refetch current page to maintain item count
        } else if (page === 1) {
           // if it was the only project on page 1
           // fetchProjects(1) will be called implicitly by useEffect if page doesn't change,
           // or explicitly if needed. No, projects state is already empty.
        }

      } catch (err) {
        showNotification(
          err.response?.data?.message || "Failed to delete project.",
          "error"
        );
        // Revert UI on error
        setProjects(originalProjects);
      }
    },
    [projects, page, showNotification, fetchProjects] // Added fetchProjects
  );


  const handleRequestsHandled = useCallback((projectId) => {
      setProjectsWithNoPending((prev) => new Set(prev).add(projectId));
      // Optionally, refetch the specific project or all projects if its status/collaborator count might have changed
       fetchProjects(page); // Or a more targeted update
    }, [fetchProjects, page]);


  return (
    <div className="bg-slate-100 min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fixed top-6 right-6 z-[100] w-full max-w-md"> {/* Adjusted width and positioning */}
          <AnimatePresence>
            {notification.show && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }} // Smoother exit
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

        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6"> {/* Increased bottom margin and gap */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
              Discover Projects
            </h1>
            <p className="text-base text-slate-600 mt-1.5">
              Explore, collaborate, and bring ideas to life.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, owner..."
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm text-sm transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm text-sm transition-colors"
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
                className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all text-sm font-medium"
              >
                <FaPlus className="mr-2 h-4 w-4" /> Create Project
              </Link>
            )}
          </div>
        </div>

        {error && !isLoading && (
          <div className="mb-8">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}

        <div className="mt-6 pb-10">
          {isLoading && projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <LoadingSpinner size="xl" />
              <span className="ml-3 text-xl font-medium text-slate-600 mt-6">
                Loading Projects...
              </span>
            </div>
          ) : !isLoading && projects.length === 0 ? (
            <div className="text-center mt-10 py-16 px-6 bg-white rounded-xl shadow-lg border border-slate-200">
              <FaSearch className="mx-auto h-16 w-16 text-slate-300 mb-6" />
              <h3 className="text-2xl font-semibold text-slate-700">
                No Projects Found
              </h3>
              <p className="mt-3 text-slate-600 max-w-md mx-auto">
                {searchTerm || filterStatus
                  ? "We couldn't find any projects matching your search or filter criteria. Try adjusting them!"
                  : "It looks a bit empty here. Be the first to create an innovative project!"}
              </p>
              {currentUser && !searchTerm && !filterStatus && (
                <Link
                  to="/projects/new"
                  className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all"
                >
                  <FaPlus className="mr-2 -ml-1 h-5 w-5" /> Start a New Project
                </Link>
              )}
            </div>
          ) : (
            <>
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8" // Adjusted gap
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
                        project.ownerId === currentUser?.id &&
                        !projectsWithNoPending.has(project.id) &&
                        (project.status === "Active" || project.status === "Planning") // Only show if project is in a state to accept requests
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
              {isLoading && projects.length > 0 && (
                <div className="flex justify-center items-center py-10">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-slate-600">Loading more projects...</span>
                </div>
              )}
              {totalPages > 1 && !isLoading && (
                <div
                  className="flex justify-center items-center mt-12 space-x-2"
                  role="navigation"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isLoading}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isLoading}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

        {/* Modals: Assuming these are styled well internally or are next on the list! */}
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
              itemName={selectedProject?.title}
              itemType="project"
              onClose={handleCloseModal}
              onSubmit={(reportContent) => {
                // Actual report submission logic would go here
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

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-[15] bg-transparent" // z-index lower than dropdown but higher than card
          onClick={() => setActiveDropdown(null)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}