import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FaSearch,
  FaUniversity,
  FaGraduationCap,
  FaEye,
  FaHeart,
  FaRegBookmark,
  FaBookmark,
  FaShareAlt,
  FaDownload,
  FaComment,
  FaEllipsisH,
  FaUserPlus,
  FaChartLine,
  FaFileAlt,
  FaUsers,
  FaSpinner,
  FaPencilAlt,
  FaPlus,
  FaUserCircle,
} from "react-icons/fa";
import { RiTeamFill } from "react-icons/ri";
import { BsGraphUp, BsCalendarCheck } from "react-icons/bs";

// Components
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";
import ProjectDetailModal from "../Component/projects/ProjectDetailModal";
import MembersModal from "../Component/projects/MembersModal";
import JoinRequestModal from "../Component/projects/JoinRequestModal";
import ReportModal from "../Component/projects/ReportModal";
import ChatModal from "../Component/Projects/ChatModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Projects({ currentUser }) {
  // State
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [savedProjects, setSavedProjects] = useState([]);
  const [likedProjects, setLikedProjects] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const userToken = localStorage.getItem("token"); // Or from your state management
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
  {
    showJoinModal && (
      <JoinRequestModal
        project={selectedProject}
        onClose={() => setShowJoinModal(false)}
        userToken={userToken}
      />
    );
  }
  // Fetch all projects from API
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError("");
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
        const fetchedProjects = response.data.data.map((proj) => ({
          id: proj.id,
          title: proj.title,
          description: proj.description,
          status: proj.status,
          requiredCollaborators: proj.requiredCollaborators,
          ownerId: proj.ownerId,
          owner: proj.owner || null,
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt,
          progress: proj.progress ?? 0,
          views: proj.views ?? 0,
          likes: proj.likes ?? 0,
          comments: proj.comments ?? 0,
          image: proj.imageUrl || null,
        }));

        setProjects(fetchedProjects);
        setTotalPages(Math.ceil(response.data.count / limit));
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(
        err.response?.data?.message ||
          "Could not load projects. Please try again."
      );
      showNotification("Failed to load projects", "error");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterStatus, page, limit, showNotification]);

  // Fetch projects when filters change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  // Modal handlers
  const handleViewProject = (project) => {
    setSelectedProject(project);
    setModalType("details");
  };

  const handleViewMembers = (project) => {
    setSelectedProject(project);
    setModalType("members");
  };

  const handleOpenJoinModal = (project) => {
    setSelectedProject(project);
    setModalType("join");
  };

  const handleOpenReportModal = (project) => {
    const reportContent = `
Project Report: ${project.title || "N/A"} (ID: ${project.id})
=======================================
Status: ${project.status || "N/A"}
Collaborators Needed: ${project.requiredCollaborators || "N/A"}
Owner: ${project.owner?.username || "N/A"} (ID: ${project.ownerId || "N/A"})
Created: ${
      project.createdAt ? new Date(project.createdAt).toLocaleString() : "N/A"
    }
---------------------------------------
Description:
${project.description || "No description."}
    `.trim();
    setReportData(reportContent);
    setSelectedProject(project);
    setModalType("report");
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedProject(null);
    setActiveDropdown(null);
    setReportData("");
  };

  // Join request handler
  const confirmJoinRequest = useCallback(
    async (message) => {
      if (!selectedProject?.id || !currentUser?.id) {
        showNotification("Cannot send request: Missing information.", "error");
        return;
      }

      setIsSubmittingJoin(true);
      const token = localStorage.getItem("authToken");

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/collaboration-requests`,
          { projectId: selectedProject.id, message },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        showNotification(
          response.data?.message || "Join request sent successfully!",
          "success"
        );
        handleCloseModal();
      } catch (err) {
        console.error("Join request failed:", err);
        showNotification(
          err.response?.data?.message || "Failed to send join request.",
          "error"
        );
      } finally {
        setIsSubmittingJoin(false);
      }
    },
    [selectedProject, currentUser, showNotification]
  );

  // Project Card Component
  const ProjectCard = ({ project }) => {
    const isSaved = savedProjects.includes(project.id);
    const isLiked = likedProjects.includes(project.id);
    const isOwner = currentUser?.id === project.ownerId;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 relative flex flex-col"
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
                className="text-gray-500 bg-white/80 hover:bg-white hover:text-blue-600 p-1.5 rounded-full shadow"
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
                e.stopPropagation();
                toggleDropdown(project.id);
              }}
              className="text-gray-500 bg-white/80 hover:bg-white hover:text-gray-800 p-1.5 rounded-full shadow"
              title="More options"
            >
              <FaEllipsisH className="h-4 w-4" />
            </button>
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {activeDropdown === project.id && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-2 top-12 mt-1 bg-white shadow-lg rounded-md z-20 w-48 border border-gray-200 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    handleDownloadProject(project);
                    setActiveDropdown(null);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaDownload className="mr-2 text-blue-500" /> Download
                </button>
                <button
                  onClick={() => {
                    handleOpenReportModal(project);
                    setActiveDropdown(null);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaFileAlt className="mr-2 text-purple-500" /> Report
                </button>
                <button
                  onClick={() => {
                    handleShareProject(project.id);
                    setActiveDropdown(null);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaShareAlt className="mr-2 text-green-500" /> Share
                </button>
                {!isOwner && (
                  <button
                    onClick={() => {
                      handleOpenJoinModal(project);
                      setActiveDropdown(null);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaUserPlus className="mr-2 text-cyan-500" /> Join
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Project Image Placeholder */}
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            {project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUniversity className="text-5xl text-gray-300" />
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Status and Owner */}
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                project.status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : project.status === "Active"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {project.status}
            </span>
            <div className="flex items-center text-xs text-gray-500">
              {project.owner ? (
                <>
                  <span>Owner: </span>
                  {isOwner ? (
                    <span className="ml-1 font-medium text-indigo-600">
                      You
                    </span>
                  ) : (
                    <span className="ml-1 font-medium">
                      {project.owner.username}
                    </span>
                  )}
                  {project.owner.profilePictureUrl ? (
                    <img
                      src={project.owner.profilePictureUrl}
                      alt={project.owner.username}
                      className="w-4 h-4 rounded-full ml-1"
                    />
                  ) : (
                    <FaUserCircle className="ml-1" />
                  )}
                </>
              ) : (
                <span>Owner: Unknown</span>
              )}
            </div>
          </div>

          {/* Title and Description */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {project.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
            {project.description}
          </p>

          {/* Collaborators */}
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <FaUsers className="mr-1.5" />
            <span>Collaborators needed: {project.requiredCollaborators}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mt-auto pt-3 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewProject(project);
              }}
              className="flex-1 bg-indigo-50 text-indigo-700 py-1.5 px-3 rounded-md hover:bg-indigo-100 text-sm font-medium"
            >
              <FaEye className="inline mr-1.5" /> View
            </button>
            {isOwner ? (
              <Link
                to={`/projects/edit/${project.id}`}
                className="flex-1 bg-amber-50 text-amber-700 py-1.5 px-3 rounded-md hover:bg-amber-100 text-sm font-medium text-center"
              >
                <FaPencilAlt className="inline mr-1" /> Edit
              </Link>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenJoinModal(project);
                }}
                className="flex-1 bg-green-50 text-green-700 py-1.5 px-3 rounded-md hover:bg-green-100 text-sm font-medium"
              >
                <FaUserPlus className="inline mr-1.5" /> Join
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Render
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-5 right-5 z-50 w-full max-w-sm"
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
              {isLoading
                ? "Loading projects..."
                : `${projects.length} projects found`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {currentUser && (
              <Link
                to="/projects/new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
              >
                <FaPlus className="mr-1.5" /> New Project
              </Link>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center mt-8 py-12 px-6 bg-white rounded-lg shadow border border-gray-200">
              <FaSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                No Projects Found
              </h3>
              <p className="mt-2 text-gray-600">
                {searchTerm || filterStatus
                  ? "Try adjusting your search or filters"
                  : "There are currently no projects available"}
              </p>
              <div className="mt-6">
                {(searchTerm || filterStatus) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("");
                    }}
                    className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Reset Filters
                  </button>
                )}
                {currentUser && (
                  <Link
                    to="/projects/new"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center"
                  >
                    <FaPlus className="mr-2" /> Create Project
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
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (num) => (
                        <button
                          key={num}
                          onClick={() => setPage(num)}
                          className={`px-3 py-1 rounded border ${
                            page === num
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-gray-300"
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
                      className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                    >
                      Next
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
            project={selectedProject}
            onClose={handleCloseModal}
          />
        )}
        {modalType === "members" && selectedProject && (
          <MembersModal project={selectedProject} onClose={handleCloseModal} />
        )}
        {modalType === "join" && selectedProject && (
          <JoinRequestModal
            project={selectedProject}
            onClose={handleCloseModal}
            onSubmit={confirmJoinRequest}
            isSubmitting={isSubmittingJoin}
          />
        )}
        {modalType === "report" && selectedProject && (
          <ReportModal
            reportData={reportData}
            onClose={handleCloseModal}
            onDownload={downloadReport}
          />
        )}
        {modalType === "chat" && selectedProject && (
          <ChatModal onClose={handleCloseModal} />
        )}
      </AnimatePresence>

      {/* Click away for dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );

  // Helper functions
  function toggleSaveProject(projectId) {
    setSavedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
    showNotification(
      savedProjects.includes(projectId)
        ? "Project removed from saved"
        : "Project saved",
      "success"
    );
  }

  function toggleLikeProject(projectId) {
    setLikedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  }

  function handleShareProject(projectId) {
    const projectUrl = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard
      .writeText(projectUrl)
      .then(() => showNotification("Link copied!", "success"))
      .catch(() => showNotification("Failed to copy.", "error"));
  }

  function handleDownloadProject(project) {
    const { image, ...downloadableData } = project;
    const blob = new Blob([JSON.stringify(downloadableData, null, 2)], {
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
    showNotification("Download started.", "info");
  }

  function downloadReport() {
    if (!selectedProject || !reportData) return;
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
    handleCloseModal();
  }

  function toggleDropdown(projectId) {
    setActiveDropdown((prev) => (prev === projectId ? null : projectId));
  }
}
