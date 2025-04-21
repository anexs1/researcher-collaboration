// src/pages/MyProjects.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "react-icons/fa";
import { RiTeamFill } from "react-icons/ri";
import { BsGraphUp, BsCalendarCheck } from "react-icons/bs";
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import EditProjectPage from "./EditProjectPage";

// --- Mock API (Keep as is or replace with real calls) ---
const mockApi = {
  fetchMyProjects: (userId) => {
    console.log("Fetching projects for user:", userId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "proj1",
            title: "AI-Powered Drug Discovery Platform",
            category: "Artificial Intelligence",
            description:
              "Developing a platform using deep learning to accelerate the identification of potential drug candidates. Focus on novel protein interactions.",
            collaboratorsNeeded: 5,
            progress: 65,
            status: "Active",
            duration: "18 Months",
            funding: "$250,000",
            skillsNeeded: ["Python", "PyTorch", "Bioinformatics", "MLOps"],
            image: "https://source.unsplash.com/random/400x300/?ai,lab",
            views: 1250,
            likes: 180,
            comments: 35,
          },
          {
            id: "proj2",
            title: "Urban Climate Resilience Study",
            category: "Climate Science",
            description:
              "Analyzing the impact of urban heat islands and developing mitigation strategies using remote sensing data and climate models.",
            collaboratorsNeeded: 3,
            progress: 30,
            status: "Planning",
            duration: "24 Months",
            funding: "Grant Pending",
            skillsNeeded: [
              "GIS",
              "Climate Modeling",
              "Data Analysis",
              "Urban Planning",
            ],
            image: "https://source.unsplash.com/random/400x300/?city,climate",
            views: 800,
            likes: 95,
            comments: 15,
          },
          {
            id: "proj3",
            title: "Personalized Public Health Interventions",
            category: "Public Health",
            description:
              "Utilizing mobile health data and behavioral science to design personalized public health campaigns for promoting healthy lifestyles.",
            collaboratorsNeeded: 4,
            progress: 85,
            status: "Completed",
            duration: "12 Months",
            funding: "$150,000",
            skillsNeeded: [
              "Epidemiology",
              "React Native",
              "Behavioral Science",
              "Statistics",
            ],
            image:
              "https://source.unsplash.com/random/400x300/?health,community",
            views: 1500,
            likes: 250,
            comments: 50,
          },
          {
            id: "proj4",
            title: "Advanced Genome Editing Techniques",
            category: "Biomedical Research",
            description:
              "Researching novel CRISPR-Cas variants for enhanced precision and reduced off-target effects in gene editing applications.",
            collaboratorsNeeded: 2,
            progress: 55,
            status: "Active",
            duration: "36 Months",
            funding: "$500,000",
            skillsNeeded: [
              "CRISPR",
              "Molecular Biology",
              "Genetics",
              "Cell Culture",
            ],
            image: null,
            views: 950,
            likes: 120,
            comments: 22,
          },
        ]);
      }, 1200);
    });
  },
  fetchProjectMembers: (projectId) => {
    console.log("Fetching members for project:", projectId);
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseMembers = [
          {
            id: "u1",
            name: "Dr. Evelyn Reed",
            role: "Lead Researcher",
            institution: "Stanford University",
          },
          {
            id: "u2",
            name: "Kenji Tanaka",
            role: "Data Scientist",
            institution: "MIT",
          },
        ];
        if (projectId === "proj1" || projectId === "proj3") {
          resolve([
            ...baseMembers,
            {
              id: "u3",
              name: "Maria Garcia",
              role: "Software Engineer",
              institution: "Google Research",
            },
          ]);
        } else if (projectId === "proj4") {
          resolve([baseMembers[0]]);
        } else {
          resolve(baseMembers);
        }
      }, 800);
    });
  },
  sendJoinRequest: (projectId, message) => {
    console.log(
      `Sending join request for ${projectId} with message: ${message}`
    );
    return new Promise((resolve) => setTimeout(resolve, 1000));
  },
  updateProjectStatus: (projectId, status) => {
    console.log(`Updating status for ${projectId} to ${status}`);
    return new Promise((resolve) => setTimeout(resolve, 500));
  },
};

// --- Main Component ---
export default function MyProjects({ currentUser }) {
  // --- State Definitions (Keep as is) ---
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [likedProjects, setLikedProjects] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [projectToJoin, setProjectToJoin] = useState(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState("");
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMembers, setChatMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState({});
  const [memberErrors, setMemberErrors] = useState({});

  // --- Research Categories (Keep as is) ---
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
  ];

  // --- Fetch Functions & Effects (Keep as is) ---
  const fetchProjectMembers = useCallback(
    async (projectId) => {
      if (!projectId || members[projectId]) return;
      setLoadingMembers((prev) => ({ ...prev, [projectId]: true }));
      setMemberErrors((prev) => ({ ...prev, [projectId]: "" }));
      try {
        const fetchedMembers = await mockApi.fetchProjectMembers(projectId);
        setMembers((prev) => ({ ...prev, [projectId]: fetchedMembers || [] }));
      } catch (err) {
        console.error(`Failed to fetch members for project ${projectId}:`, err);
        setMemberErrors((prev) => ({
          ...prev,
          [projectId]: "Failed to load members",
        }));
        setMembers((prev) => ({ ...prev, [projectId]: [] }));
      } finally {
        setLoadingMembers((prev) => ({ ...prev, [projectId]: false }));
      }
    },
    [members]
  );

  const fetchProjects = useCallback(async () => {
    if (!currentUser?.id) {
      setError("Please log in to view your projects.");
      setIsLoading(false);
      setProjects([]);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const fetchedProjects = await mockApi.fetchMyProjects(currentUser.id);
      setProjects(fetchedProjects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Could not load your projects. Please try again later.");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- Data Enhancement & Filtering (Keep as is) ---
  const enhanceProjectData = (projectsToEnhance) => {
    return (projectsToEnhance || []).map((project) => ({
      ...project,
      members: members[project.id] || [],
      memberCount: members[project.id]?.length || 0,
      description:
        project.description ||
        `This ${
          project.category || "research"
        } project aims to advance knowledge in its field.`,
      progress: project.progress ?? Math.floor(Math.random() * 100),
      views: project.views ?? Math.floor(Math.random() * 500),
      likes: project.likes ?? Math.floor(Math.random() * 100),
      comments: project.comments ?? Math.floor(Math.random() * 50),
      status: project.status || "Planning",
    }));
  };
  const filteredProjects = enhanceProjectData(projects).filter((project) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      project.title.toLowerCase().includes(lowerSearchTerm) ||
      project.description.toLowerCase().includes(lowerSearchTerm) ||
      project.category?.toLowerCase().includes(lowerSearchTerm);
    const matchesCategory =
      !filterCategory || project.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // --- Action Handlers (Keep as is) ---
  const handleViewProject = (project) => {
    fetchProjectMembers(project.id);
    setSelectedProject(project);
    setShowProjectModal(true);
  };
  const toggleSaveProject = (projectId) => {
    setSavedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };
  const toggleLikeProject = (projectId) => {
    setLikedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };
  const handleShareProject = (projectId) => {
    const projectUrl = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard
      .writeText(projectUrl)
      .then(() => alert("Project link copied!"))
      .catch(() => alert("Failed to copy."));
  };
  const handleDownloadProject = (project) => {
    const downloadableData = {
      ...project,
      members: undefined,
      image: undefined,
    };
    const blob = new Blob([JSON.stringify(downloadableData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_details.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleJoinRequest = (project) => {
    setProjectToJoin(project);
    setShowJoinModal(true);
  };
  const confirmJoinRequest = async () => {
    if (!projectToJoin) return;
    try {
      await mockApi.sendJoinRequest(projectToJoin.id, joinMessage);
      alert(`Join request sent for: ${projectToJoin.title}`);
      setShowJoinModal(false);
      setJoinMessage("");
    } catch (err) {
      alert("Failed to send join request.");
      console.error("Join request failed:", err);
    }
  };
  const handleStatusChange = async (projectId, newStatus) => {
    const originalProjects = [...projects];
    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === projectId ? { ...p, status: newStatus } : p
      )
    );
    if (selectedProject?.id === projectId) {
      setSelectedProject((prev) => ({ ...prev, status: newStatus }));
    }
    try {
      await mockApi.updateProjectStatus(projectId, newStatus);
      console.log(
        `Project ${projectId} status updated to ${newStatus} (Simulated).`
      );
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed to update project status.");
      setProjects(originalProjects);
      if (selectedProject?.id === projectId) {
        const originalProject = originalProjects.find(
          (p) => p.id === projectId
        );
        setSelectedProject(originalProject);
      }
    }
  };
  const handleGenerateReport = (project) => {
    const projectMembers = members[project.id] || [];
    const memberList =
      projectMembers.length > 0
        ? projectMembers
            .map(
              (m) =>
                `- ${m.name} (${m.role || "Member"}) @ ${
                  m.institution || "N/A"
                }`
            )
            .join("\n")
        : "No members data available or loaded.";
    const reportContent = `... (report content generation) ...`;
    setReportData(reportContent);
    setSelectedProject(project);
    setShowReportModal(true);
  };
  const downloadReport = () => {
    if (!selectedProject || !reportData) return;
    const blob = new Blob([reportData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedProject.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowReportModal(false);
  };
  const handleViewMembers = (projectId) => {
    const projectData = projects.find((p) => p.id === projectId);
    if (!projectData) return;
    setSelectedProject(enhanceProjectData([projectData])[0]);
    setShowMembersModal(true);
    if (!members[projectId] || memberErrors[projectId]) {
      fetchProjectMembers(projectId);
    }
  };
  const toggleDropdown = (projectId) => {
    setActiveDropdown((prev) => (prev === projectId ? null : projectId));
  };

  // --- Sub-Components ---

  // **** CORRECTED Chat Modal Placeholder Component ****
  const ChatModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      {" "}
      {/* Ensure z-index is high */}
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Project Team Chat (Placeholder)
            </h3>
            <button
              onClick={() => setShowChatModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            This feature is under development.
          </p>
          {/* Placeholder Content */}
          <div className="border border-gray-200 rounded-lg p-4 mb-4 h-64 overflow-y-auto bg-gray-50">
            <div className="text-center text-gray-400 py-8">
              Future chat messages will appear here.
            </div>
          </div>
          <div className="flex">
            <input
              type="text"
              placeholder="Type message (disabled)..."
              disabled
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg bg-gray-100 cursor-not-allowed"
            />
            <button
              disabled
              className="bg-blue-300 text-white px-4 py-2 rounded-r-lg cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  ); // **** REMOVED the incorrect semicolon ****

  // **** EDITED ProjectCard Component (Includes Edit Link) ****
  const ProjectCard = ({ project }) => {
    const isSaved = savedProjects.includes(project.id);
    const isLiked = likedProjects.includes(project.id);
    const categoryStyle =
      researchCategories.find((c) => c.name === project.category)?.color ||
      "bg-gray-100 text-gray-800";
    const currentMembers = members[project.id] || [];
    const memberCount = currentMembers.length;
    const isLoadingProjectMembers = loadingMembers[project.id];
    const memberLoadError = memberErrors[project.id];

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
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 relative flex flex-col group"
        // Removed main onClick, rely on buttons now
      >
        <div className="relative">
          {/* Dropdown Menu */}
          {activeDropdown === project.id && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-2 top-12 mt-1 bg-white shadow-lg rounded-md z-20 w-48 border border-gray-200 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadProject(project);
                  setActiveDropdown(null);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FaDownload className="mr-2 text-blue-500" /> Download Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateReport(project);
                  setActiveDropdown(null);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FaFileAlt className="mr-2 text-purple-500" /> Generate Report
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareProject(project.id);
                  setActiveDropdown(null);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FaShareAlt className="mr-2 text-green-500" /> Share Project
              </button>
            </motion.div>
          )}

          {/* Top Right Icons */}
          <div className="absolute top-3 right-3 z-10 flex space-x-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSaveProject(project.id);
              }}
              className="text-gray-600 bg-white/80 hover:bg-white p-1.5 rounded-full shadow backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={isSaved ? "Remove from saved" : "Save project"}
            >
              <span className="sr-only">{isSaved ? "Unsave" : "Save"}</span>
              {isSaved ? (
                <FaBookmark className="text-blue-600 h-4 w-4" />
              ) : (
                <FaRegBookmark className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown(project.id);
              }}
              className="text-gray-600 bg-white/80 hover:bg-white p-1.5 rounded-full shadow backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="More options"
            >
              <span className="sr-only">More options</span>
              <FaEllipsisH className="h-4 w-4" />
            </button>
          </div>

          {/* Project Image or Placeholder */}
          <div className="h-48 bg-gray-200 relative group overflow-hidden">
            {project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-indigo-100 flex items-center justify-center">
                <FaUniversity className="text-5xl text-gray-300" />
              </div>
            )}
            {/* Interaction counts overlay */}
            <div className="absolute bottom-2 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLikeProject(project.id);
                }}
                className="bg-white/80 px-2 py-1 rounded-full text-xs font-medium flex items-center shadow hover:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                title={isLiked ? "Unlike" : "Like"}
              >
                <FaHeart
                  className={`mr-1 h-3 w-3 ${
                    isLiked ? "text-red-500" : "text-gray-500"
                  }`}
                />{" "}
                {project.likes + (isLiked ? 1 : 0)}
              </button>
              <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-medium flex items-center shadow">
                <FaComment className="mr-1 h-3 w-3 text-gray-500" />{" "}
                {project.comments}
              </span>
              <span className="bg-white/80 px-2 py-1 rounded-full text-xs font-medium flex items-center shadow">
                <FaEye className="mr-1 h-3 w-3 text-gray-500" /> {project.views}
              </span>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 md:p-5 flex flex-col flex-grow">
          {/* ... category, status, title, description, member count, progress ... */}
          <div className="flex justify-between items-center mb-2">
            {" "}
            {project.category && (
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded ${categoryStyle}`}
              >
                {project.category}
              </span>
            )}{" "}
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
            className="text-base md:text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2"
            title={project.title}
          >
            {project.title || "Untitled Project"}
          </h3>
          <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-3 flex-grow">
            {project.description}
          </p>
          <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 mb-3">
            {" "}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewMembers(project.id);
              }}
              className="flex items-center space-x-1.5 hover:text-blue-600 group/members"
              title="View Members"
            >
              {" "}
              <FaUsers className="group-hover/members:text-blue-500" />{" "}
              {isLoadingProjectMembers ? (
                <FaSpinner className="animate-spin h-3 w-3" />
              ) : memberLoadError ? (
                <FaExclamationTriangle
                  className="text-red-500 h-3 w-3"
                  title={memberLoadError}
                />
              ) : (
                <span>
                  {memberCount} / {project.collaboratorsNeeded ?? "?"} members
                </span>
              )}{" "}
            </button>{" "}
          </div>
          {project.progress !== undefined && (
            <div className="mb-3">
              {" "}
              <div className="flex justify-between text-[10px] md:text-xs text-gray-500 mb-0.5">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>{" "}
              <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.5 }}
                ></motion.div>
              </div>{" "}
            </div>
          )}

          {/* --- Action Buttons (With EDIT Link) --- */}
          <div className="flex space-x-2 mt-auto pt-2 border-t border-gray-100">
            {/* View Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewProject(project);
              }}
              className="flex-1 bg-indigo-50 text-indigo-700 py-1.5 px-3 rounded-md hover:bg-indigo-100 transition-colors duration-200 flex items-center justify-center text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title="View Details"
            >
              <FaEye className="mr-1 h-3 w-3" /> View
            </button>

            {/* Edit Button/Link */}
            <Link
              to={`/projects/edit/${project.id}`} // <<<< EDIT LINK
              onClick={(e) => e.stopPropagation()} // Prevent card click if card itself is clickable
              className="flex-1 bg-yellow-50 text-yellow-700 py-1.5 px-3 rounded-md hover:bg-yellow-100 transition-colors duration-200 flex items-center justify-center text-xs md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-yellow-500"
              title="Edit Project"
            >
              <FaPencilAlt className="mr-1 h-3 w-3" /> Edit
            </Link>
          </div>
          {/* --- End Action Buttons --- */}
        </div>
      </motion.div>
    );
  };

  // --- Other Modals (Keep definitions as they were) ---
  const ProjectModal = ({ project, onClose }) => {
    /* ... Project Modal JSX ... */
  };
  const MembersModal = ({ project, onClose }) => {
    /* ... Members Modal JSX ... */
  };
  const JoinRequestModal = () => {
    /* ... Join Request Modal JSX ... */
  };
  const ReportModal = () => {
    /* ... Report Modal JSX ... */
  };

  // --- Main Component Render (Keep as is) ---
  return (
    <div className="bg-gradient-to-br from-gray-50 to-indigo-50 min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
              My Research Projects
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {isLoading
                ? "Loading projects..."
                : `${filteredProjects.length} ${
                    filteredProjects.length === 1 ? "project" : "projects"
                  } found`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm shadow-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {researchCategories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onClose={() => setError("")} />
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-8">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
              <FaSearch className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">
              No projects found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm || filterCategory
                ? "Try adjusting your search or filter."
                : "You are not currently part of any projects."}
            </p>
            {(searchTerm || filterCategory) && (
              <button
                className="mt-5 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("");
                }}
              >
                Reset Filters
              </button>
            )}
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

      {/* Modals */}
      {showProjectModal && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
        />
      )}
      {showJoinModal && projectToJoin && <JoinRequestModal />}
      {showReportModal && selectedProject && <ReportModal />}
      {showMembersModal && selectedProject && (
        <MembersModal
          project={selectedProject}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedProject(null);
          }}
        />
      )}
      {showChatModal && <ChatModal />}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveDropdown(null)}
        ></div>
      )}
    </div>
  );
}
