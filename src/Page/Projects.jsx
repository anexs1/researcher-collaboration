// src/pages/Projects.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; // For navigation links
import axios from "axios"; // For making API requests
import { motion, AnimatePresence } from "framer-motion"; // For animations

// --- Import Icons ---
import {
  FaSearch,
  FaUniversity,
  FaGraduationCap,
  FaTimes,
  FaEye,
  FaHeart,
  FaRegBookmark,
  FaBookmark,
  FaShareAlt,
  FaDownload,
  FaComment,
  FaEllipsisH,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUserPlus,
  FaChartLine,
  FaFileAlt,
  FaUsers,
  FaSpinner,
  FaExclamationTriangle,
  FaPencilAlt,
  FaPlus,
} from "react-icons/fa";
import { RiTeamFill } from "react-icons/ri";
import { BsGraphUp, BsCalendarCheck } from "react-icons/bs";

// --- Import Common Components (Corrected Paths) ---
// Make sure these components exist at these locations
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import Notification from "../Component/Common/Notification";

// --- Import Modal Components (Create these files in src/Component/Project/) ---
import ProjectDetailModal from "../Component/projects/ProjectDetailModal";
import MembersModal from "../Component/projects/MembersModal";
import JoinRequestModal from "../Component/projects/JoinRequestModal";
import ReportModal from "../Component/projects/ReportModal";
import ChatModal from "../Component/projects/ChatModal";

// --- API Base URL ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Main Projects Page Component ---
export default function Projects({ currentUser }) {
  // --- State Definitions ---
  const [projects, setProjects] = useState([]); // Holds the list of projects fetched from API
  const [isLoading, setIsLoading] = useState(true); // Loading indicator state
  const [error, setError] = useState(""); // Stores API or other errors for display
  const [searchTerm, setSearchTerm] = useState(""); // State for the search input
  const [filterCategory, setFilterCategory] = useState(""); // State for the category filter dropdown
  const [selectedProject, setSelectedProject] = useState(null); // Holds the project object for the active modal
  const [modalType, setModalType] = useState(null); // Type of modal currently open ('details', 'members', etc.) or null
  const [savedProjects, setSavedProjects] = useState([]); // Example state for saved status (replace with API)
  const [likedProjects, setLikedProjects] = useState([]); // Example state for liked status (replace with API)
  const [activeDropdown, setActiveDropdown] = useState(null); // ID of the project whose dropdown is open
  const [reportData, setReportData] = useState(""); // Data for the report modal
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    show: false,
  }); // For user feedback

  // --- Research Categories (Static or Fetch from Backend) ---
  const researchCategories = [
    {
      name: "Artificial Intelligence",
      icon: <BsGraphUp />,
      color: "bg-purple-100 text-purple-800",
    },
    {
      name: "Data Science",
      icon: <FaGraduationCap />,
      color: "bg-blue-100 text-blue-800",
    },
    {
      name: "Climate Science",
      icon: <BsCalendarCheck />,
      color: "bg-green-100 text-green-800",
    },
    {
      name: "Biomedical Research",
      icon: <FaUniversity />,
      color: "bg-red-100 text-red-800",
    },
    {
      name: "Public Health",
      icon: <RiTeamFill />,
      color: "bg-teal-100 text-teal-800",
    },
    {
      name: "Engineering",
      icon: <FaChartLine />,
      color: "bg-orange-100 text-orange-800",
    },
    {
      name: "Social Sciences",
      icon: <FaUsers />,
      color: "bg-pink-100 text-pink-800",
    },
    { name: "Other", icon: <FaFileAlt />, color: "bg-gray-100 text-gray-800" },
  ];

  // --- Function to display notifications ---
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, show: true });
    const timer = setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      5000
    );
    return () => clearTimeout(timer); // Cleanup timer on unmount or re-call
  }, []);

  // --- Fetch User's Projects from API ---
  const fetchProjects = useCallback(async () => {
    if (!currentUser?.id) {
      // Error handled by ProtectedRoute, just prevent fetching
      setIsLoading(false);
      setProjects([]);
      return;
    }

    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Authentication error. Please log in again.");
      showNotification("Authentication error.", "error");
      setIsLoading(false);
      setProjects([]);
      return;
    }

    try {
      console.log(
        `Fetching projects for user ID: ${currentUser.id} from API: ${API_BASE_URL}/api/projects/my`
      );
      const response = await axios.get(`${API_BASE_URL}/api/projects/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Project Response:", response.data);

      if (response.data?.success && Array.isArray(response.data.data)) {
        const fetchedProjects = response.data.data.map((proj) => ({
          // Map backend fields to frontend fields if names differ
          // ** ADJUST THIS MAPPING BASED ON YOUR ACTUAL API RESPONSE & MODEL **
          id: proj.id,
          title: proj.title,
          description: proj.description,
          category: proj.category,
          status: proj.status,
          progress: proj.progress ?? 0,
          // Use the actual field name from your DB/API response
          collaboratorsNeeded:
            proj.requiredCollaborators ?? proj.collaboratorsNeeded ?? 1,
          duration: proj.duration,
          funding: proj.funding,
          skillsNeeded: proj.skillsNeeded ?? [],
          image: proj.imageUrl || null, // Map backend 'imageUrl' to frontend 'image'
          views: proj.views ?? 0,
          likes: proj.likes ?? 0,
          comments: proj.comments ?? 0,
          ownerId: proj.ownerId,
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt,
        }));
        setProjects(fetchedProjects);
      } else {
        throw new Error(
          response.data?.message ||
            "Failed to fetch projects: Invalid data format received."
        );
      }
    } catch (err) {
      console.error(
        "Failed to fetch projects:",
        err.response?.data || err.message
      );
      const errorMsg =
        err.response?.data?.message ||
        "Could not load your projects. Please try again later.";
      setError(errorMsg);
      showNotification(`Error: ${errorMsg}`, "error");
      setProjects([]); // Clear projects on error
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, showNotification]); // Dependencies

  // --- Effect to Fetch Projects on mount or user change ---
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // fetchProjects is memoized

  // --- Data Filtering & Enhancing ---
  // Add default values for fields used in rendering to prevent errors if API data is missing them
  const enhanceProjectData = (projectsToEnhance = []) => {
    return projectsToEnhance.map((project) => ({
      ...project, // Spread existing data
      status: project.status || "Planning",
      category: project.category || "Other",
      progress: project.progress ?? 0,
      views: project.views ?? 0,
      likes: project.likes ?? 0,
      comments: project.comments ?? 0,
      collaboratorsNeeded: project.collaboratorsNeeded ?? 1,
      skillsNeeded: Array.isArray(project.skillsNeeded)
        ? project.skillsNeeded
        : [],
      description: project.description || "No description provided.",
      title: project.title || "Untitled Project",
      image: project.image || null, // Ensure image has a value (can be null)
    }));
  };

  const filteredProjects = enhanceProjectData(projects).filter((project) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const titleMatch = project.title?.toLowerCase().includes(lowerSearchTerm);
    const descMatch = project.description
      ?.toLowerCase()
      .includes(lowerSearchTerm);
    const categoryMatch = project.category
      ?.toLowerCase()
      .includes(lowerSearchTerm);
    const matchesSearch =
      !searchTerm || titleMatch || descMatch || categoryMatch;
    const matchesCategory =
      !filterCategory || project.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Action Handlers ---
  // Modal Openers
  const handleViewProject = (project) => {
    setSelectedProject(project);
    setModalType("details");
  };
  const handleViewMembers = (project) => {
    setSelectedProject(project);
    setModalType("members"); /* TODO: Fetch members */
  };
  const handleOpenJoinModal = (project) => {
    setSelectedProject(project);
    setModalType("join");
  };
  const handleOpenReportModal = (project) => {
    const reportContent = `Report for: ${project.title}\nStatus: ${project.status}\n...more data...`; // Example
    setReportData(reportContent);
    setSelectedProject(project);
    setModalType("report");
  };
  const handleOpenChatModal = (project) => {
    setSelectedProject(project);
    setModalType("chat");
  };
  // Modal Closer
  const handleCloseModal = () => {
    setModalType(null);
    setSelectedProject(null);
  };

  // Placeholders needing API calls
  const toggleSaveProject = (projectId) => {
    console.log("API CALL NEEDED: Toggle save for:", projectId);
    // Optimistic UI update (example)
    setSavedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
    showNotification(`Project save status toggled (locally).`, "info");
  };
  const toggleLikeProject = (projectId) => {
    console.log("API CALL NEEDED: Toggle like for:", projectId);
    // Optimistic UI update (example)
    setLikedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
    showNotification(`Project like status toggled (locally).`, "info");
  };
  const handleShareProject = (projectId) => {
    const projectUrl = `${window.location.origin}/projects/${projectId}`; // Adjust if detail route is different
    navigator.clipboard
      .writeText(projectUrl)
      .then(() => showNotification("Project link copied!", "success"))
      .catch(() => showNotification("Failed to copy link.", "error"));
  };
  const handleDownloadProject = (project) => {
    console.log("Generating download for:", project.title);
    // Create data object, remove sensitive/large fields if needed
    const { image, ...downloadableData } = project; // Example: remove image
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
    showNotification("Project details download started.", "info");
  };
  const confirmJoinRequest = async (message) => {
    if (!selectedProject) return;
    console.log(
      `API CALL NEEDED: Send join request for project ID: ${selectedProject.id} with message: "${message}"`
    );
    // Example API call structure:
    // try {
    //    const token = localStorage.getItem('authToken');
    //    await axios.post(`${API_BASE_URL}/api/collaboration-requests`,
    //       { projectId: selectedProject.id, message },
    //       { headers: { 'Authorization': `Bearer ${token}` } }
    //    );
    //    showNotification(`Join request sent for "${selectedProject.title}".`, "success");
    // } catch (reqError) {
    //    console.error("Join request failed:", reqError);
    //    showNotification(reqError.response?.data?.message || "Failed to send join request.", "error");
    // }
    showNotification(
      `Join request sent for "${selectedProject.title}" (simulated).`,
      "success"
    ); // Keep simulation for now
    handleCloseModal();
  };
  const downloadReport = () => {
    if (!selectedProject || !reportData) return;
    console.log("Downloading report for:", selectedProject.title);
    // ... (blob creation and download link logic remains the same) ...
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
  };
  const toggleDropdown = (projectId) =>
    setActiveDropdown((prev) => (prev === projectId ? null : projectId));

  // --- Project Card Component ---
  const ProjectCard = ({ project }) => {
    // Ensure project object is valid before accessing properties
    if (!project || !project.id) {
      console.warn("ProjectCard received invalid project data", project);
      return null; // Don't render card if project data is bad
    }

    const isSaved = savedProjects.includes(project.id);
    const isLiked = likedProjects.includes(project.id);
    const categoryStyle =
      researchCategories.find((c) => c.name === project.category)?.color ||
      "bg-gray-100 text-gray-800";
    const collaboratorsDisplay = project.collaboratorsNeeded ?? "?"; // Use mapped/defaulted value

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        whileHover={{
          y: -5,
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
        className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden border border-gray-100 relative flex flex-col group transition-shadow duration-300"
      >
        {/* Card Header */}
        <div className="relative">
          {/* Dropdown & Icons */}
          <div className="absolute top-3 right-3 z-10 flex space-x-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveProject(project.id);
              }}
              className="..."
              title={isSaved ? "Unsave" : "Save"}
            >
              {isSaved ? (
                <FaBookmark className="text-blue-600 ..." />
              ) : (
                <FaRegBookmark className="..." />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown(project.id);
              }}
              className="..."
              title="More options"
            >
              <FaEllipsisH />
            </button>
          </div>
          {activeDropdown === project.id && (
            <motion.div
              /* Dropdown menu */ onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadProject(project);
                  setActiveDropdown(null);
                }}
                className="flex items-center ..."
              >
                <FaDownload /> Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenReportModal(project);
                  setActiveDropdown(null);
                }}
                className="flex items-center ..."
              >
                <FaFileAlt /> Report
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareProject(project.id);
                  setActiveDropdown(null);
                }}
                className="flex items-center ..."
              >
                <FaShareAlt /> Share
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenChatModal(project);
                  setActiveDropdown(null);
                }}
                className="flex items-center ..."
              >
                <FaComment /> Chat
              </button>
            </motion.div>
          )}

          {/* Image */}
          <div className="h-48 bg-gray-100 relative group overflow-hidden">
            {" "}
            {/* Added bg */}
            {project.image ? (
              <img
                src={project.image}
                alt={project.title ?? "Project Image"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-50 to-indigo-100 flex items-center justify-center">
                <FaUniversity className="text-5xl text-gray-300" />
              </div>
            )}
            {/* Interactions Overlay */}
            <div className="absolute bottom-2 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLikeProject(project.id);
                }}
                className="bg-white/90 ..."
              >
                <FaHeart
                  className={isLiked ? "text-red-500" : "text-gray-500"}
                />{" "}
                {project.likes}
              </button>
              <span className="bg-white/90 ...">
                <FaComment /> {project.comments}
              </span>
              <span className="bg-white/90 ...">
                <FaEye /> {project.views}
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 md:p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded ${categoryStyle}`}
            >
              {project.category}
            </span>
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
          </div>
          <h3
            className="text-base md:text-lg font-semibold text-gray-800 mb-1.5 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2"
            title={project.title}
          >
            {project.title}
          </h3>
          <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-3 flex-grow">
            {project.description}
          </p>
          <div className="flex items-center justify-start text-xs md:text-sm text-gray-500 mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewMembers(project);
              }}
              className="flex items-center space-x-1.5 hover:text-blue-600 group/members"
              title="View Members"
            >
              <FaUsers className="group-hover/members:text-blue-500" />
              {/* Placeholder for actual member count */}
              <span> ? / {collaboratorsDisplay} members </span>
              {/* Add loading/error state for members later */}
            </button>
          </div>
          {/* Progress Bar - Render only if progress > 0 ? */}
          {(project.progress ?? 0) > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex space-x-2 mt-auto pt-3 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewProject(project);
              }}
              className="flex-1 bg-indigo-50 text-indigo-700 ..."
            >
              <FaEye /> View
            </button>
            {currentUser?.id === project.ownerId && (
              <Link
                to={`/projects/edit/${project.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-amber-50 text-amber-700 ..."
              >
                <FaPencilAlt /> Edit
              </Link>
            )}
            {currentUser?.id !== project.ownerId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenJoinModal(project);
                }}
                className="flex-1 bg-green-50 text-green-700 ..."
              >
                <FaUserPlus /> Join
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // --- Main Component Render ---
  return (
    <div className="bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notification Area */}
        <AnimatePresence>
          {notification.show && (
            <motion.div /* ... */>
              <Notification /* ... */ />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-10 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold ...">
              My Research Projects
            </h1>
            <p className="text-sm ...">
              {isLoading
                ? "Loading..."
                : `${filteredProjects.length} projects found`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <FaSearch className="..." />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="..."
                placeholder="Search projects..."
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="..."
            >
              <option value="">All Categories</option>
              {researchCategories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <Link
              to="/projects/new"
              className="bg-indigo-600 hover:bg-indigo-700 ..."
            >
              <FaPlus /> New Project
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            {" "}
            <ErrorMessage message={error} onClose={() => setError("")} />{" "}
          </div>
        )}

        {/* Content Area: Loading / Empty / Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredProjects.length === 0 && !error ? (
            <div className="text-center mt-8 py-12 px-6 bg-white rounded-lg shadow border">
              <FaSearch className="mx-auto h-16 w-16 text-gray-300 mb-5" />
              <h3 className="text-xl font-semibold text-gray-800">
                No Projects Found
              </h3>
              <p className="mt-2 text-base text-gray-500">
                {searchTerm || filterCategory
                  ? "Try adjusting your search/filter."
                  : "You haven't created any projects yet."}
              </p>
              <div className="mt-6">
                {(searchTerm || filterCategory) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterCategory("");
                    }}
                    className="..."
                  >
                    Reset Filters
                  </button>
                )}
                <Link
                  to="/projects/new"
                  className="inline-flex items-center bg-indigo-600 ..."
                >
                  <FaPlus /> Create New Project
                </Link>
              </div>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* --- Modal Rendering Area --- */}
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

      {/* Dropdown Click-Away Listener */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setActiveDropdown(null)}
        ></div>
      )}
    </div>
  );
}

// --- Placeholder TagInput Component (if not imported) ---
// Remove this if you have a real TagInput component in ../Component/Common/TagInput.jsx
// const TagInput = ({ tags, setTags, placeholder, disabled }) => {
//    console.warn("Using Placeholder TagInput Component!");
//    return <input type="text" placeholder={placeholder || "Tag Input Placeholder"} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" disabled={disabled} onChange={(e) => setTags(e.target.value.split(',').map(t=>t.trim()).filter(Boolean))}/>;
// };
