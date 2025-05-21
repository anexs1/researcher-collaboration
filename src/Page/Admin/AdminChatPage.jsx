// src/Page/Admin/AdminProjectChatViewer.jsx (or AdminChatPage.jsx)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  FaSearch,
  FaSpinner,
  FaTrash,
  FaProjectDiagram,
  FaComments,
  FaCheck,
  FaTimes,
  FaUserCircle,
  FaCalendarAlt,
  FaWifi,
  FaExclamationCircle,
  FaLock,
  FaUsers,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { format, isToday, isYesterday, parseISO } from "date-fns";

import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import MemberListModal from "../../Component/chat/MemberListModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_TIMEOUT = 15000;

const getRoomName = (projectId) => (projectId ? `project-${projectId}` : null);
const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  try {
    return format(parseISO(isoString), "p");
  } catch (e) { return ""; }
};
const formatDateSeparator = (isoString) => {
  if (!isoString) return null;
  try {
    const d = parseISO(isoString);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
  } catch (e) { return null; }
};

function AdminProjectChatViewer({ currentUser }) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, count: 0 });
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const currentAdminId = currentUser?.id;
  const selectedProjectId = selectedProject?.projectId;

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) scrollToBottom("auto");
  }, [messages, isLoadingMessages, scrollToBottom]);

  const fetchAdminProjects = useCallback(async () => {
    console.log("ADMIN: Attempting to fetch projects list...");
    setIsLoadingProjects(true);
    setError(null);
    setProjects([]);
    setFilteredProjects([]);
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Authentication token not found. Please login.");
      setIsLoadingProjects(false);
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/admin/projects`;
      console.log(`ADMIN: Fetching projects from URL: ${url}`);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("ADMIN: Raw projects response (from axios):", response);
      console.log("ADMIN: response.data structure:", response.data);


      let projectsArray = null;

      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          console.log("ADMIN: Found projects directly in response.data.data (Array)");
          projectsArray = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          // Defensive check: if response.data.data is an object,
          // try to find an array within it (e.g., response.data.data.projects)
          console.warn("ADMIN: response.data.data is an OBJECT, not an Array. Inspecting its keys...");
          const keysInDataObject = Object.keys(response.data.data);
          console.log("ADMIN: Keys in response.data.data object:", keysInDataObject);
          for (const key of keysInDataObject) {
            if (Array.isArray(response.data.data[key])) {
              console.log(`ADMIN: Found an array in response.data.data.${key}. Using this as projectsArray.`);
              projectsArray = response.data.data[key];
              break;
            }
          }
          if (!projectsArray) {
             // Common case: if data is an object, but pagination is sibling to data array.
             // So, if response.data looks like { success: true, data: [...], pagination: {...} }
             // This case is already handled by Array.isArray(response.data.data) directly.
             // This else-if is for cases like { success: true, data: { projects: [...], otherInfo: "..." } }
            console.error("ADMIN: response.data.data was an object, but no array found within its properties.");
          }
        }
      }


      if (projectsArray) { // Check if we successfully extracted an array
        const projectList = projectsArray.map((p) => ({
          projectId: p.id,
          projectName: p.title,
        })).filter(p => p.projectId && p.projectName); // Filter out malformed entries

        if (projectList.length === 0 && projectsArray.length > 0) {
            console.warn("ADMIN: projectsArray had items, but projectList is empty after mapping. Check 'id' and 'title' fields in raw project items.");
        }

        projectList.sort((a, b) =>
          (a.projectName || "").localeCompare(b.projectName || "")
        );
        setProjects(projectList);
        setFilteredProjects(projectList);
        setError(null);
      } else {
        const errorMessage = response.data?.message || "Unexpected response structure or no project data found.";
        console.error("ADMIN: Failed to process projects response. Final projectsArray is null or empty. Response data:", response.data);
        throw new Error(`Data format error: ${errorMessage}`);
      }
    } catch (err) {
      console.error("ADMIN: Fetch projects error OBJECT:", err);
      if (err.config) console.error("ADMIN: Fetch projects error config:", err.config);
      if (err.request) console.error("ADMIN: Fetch projects error request:", err.request);
      if (err.response) console.error("ADMIN: Fetch projects error response:", err.response);
      console.error("ADMIN: Fetch projects error message (from err.message):", err.message);
      console.error("ADMIN: Fetch projects error isAxiosError:", err.isAxiosError);

      let eMsg = "Could not load projects. Please check console for details.";
      if (err.response) {
        console.error("ADMIN: Server responded with status:", err.response.status);
        console.error("ADMIN: Server response data:", err.response.data);
        if (err.response.status === 401) {
          eMsg = "Unauthorized: Invalid or expired token. Please login again.";
        } else if (err.response.status === 403) {
          eMsg = "Forbidden: You do not have permission to access these projects.";
        } else if (err.response.data && err.response.data.message) {
          eMsg = `Server Error (${err.response.status}): ${err.response.data.message}`;
        } else {
          eMsg = `Server responded with status ${err.response.status}.`;
        }
      } else if (err.request) {
        console.error("ADMIN: No response received for project fetch.");
        eMsg = "No response from server. Please check network connection and server status.";
      } else if (err.message && err.message.startsWith("Data format error:")) {
        eMsg = err.message;
      } else {
        console.error("ADMIN: Error setting up project fetch request:", err.message);
        eMsg = `Error fetching projects: ${err.message || "An unknown error occurred."}`;
      }
      setError(eMsg);
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchAdminProjects();
  }, [fetchAdminProjects]); // fetchAdminProjects is memoized by useCallback

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(
        projects.filter((p) =>
          p.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, projects]);

  const fetchProjectMessages = useCallback(
    async (projectIdToFetch, page = 1) => {
      if (!projectIdToFetch) return;
      setIsLoadingMessages(true);
      // setError(null); // Clears general error, message-specific errors handled below
      if (page === 1) setMessages([]);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Auth token required to fetch messages."); // More specific error for message context
        setIsLoadingMessages(false);
        return;
      }
      try {
        const url = `${API_BASE_URL}/api/admin/messages/project/${projectIdToFetch}?page=${page}&limit=50`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data?.success && Array.isArray(response.data.messages)) {
          const fetched = response.data.messages.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          setMessages(fetched);
          setPagination({
            currentPage: response.data.currentPage || 1,
            totalPages: response.data.totalPages || 1,
            count: response.data.count || 0,
          });
          setError(null); // Clear message-specific error on success
        } else {
          throw new Error(response.data?.message || "Failed to load messages from server.");
        }
      } catch (err) {
        console.error(`Fetch messages error for project ${projectIdToFetch}:`, err);
        setError(err.response?.data?.message || "Error fetching messages for this project.");
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [API_BASE_URL]
  );

  const fetchMembers = useCallback(async () => {
    if (!selectedProjectId) {
      setMembersError("No project selected to fetch members.");
      return;
    }
    setLoadingMembers(true);
    setMembersError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setMembersError("Auth token required to fetch members.");
      setLoadingMembers(false);
      return;
    }
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/projects/${selectedProjectId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success && Array.isArray(res.data.members)) {
        const owner = res.data.owner;
        let actualMembers = res.data.members.map((m) => ({
          ...m,
          id: m.user?.id || m.id,
          username: m.user?.username || m.username,
          profilePictureUrl: m.user?.profilePictureUrl || m.profilePictureUrl,
          role: m.role || "Member",
        }));
        if (owner) {
          if (!actualMembers.some((m) => m.id === owner.id)) {
            actualMembers.unshift({ ...owner, id: owner.id, username: owner.username, profilePictureUrl: owner.profilePictureUrl, role: "Owner" });
          } else {
            actualMembers = actualMembers.map((m) =>
              m.id === owner.id ? { ...m, role: "Owner" } : m
            );
          }
        }
        actualMembers.sort((a, b) => {
          if (a.role === "Owner" && b.role !== "Owner") return -1;
          if (a.role !== "Owner" && b.role === "Owner") return 1;
          return (a.username || "").localeCompare(b.username || "");
        });
        setMemberList(actualMembers);
      } else throw new Error(res.data?.message || "Failed to load project members.");
    } catch (err) {
      console.error("Fetch members error:", err);
      setMembersError(err.response?.data?.message || "Error fetching project members.");
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedProjectId, API_BASE_URL]);

  const handleOpenMembersModal = () => {
    setShowMembersModal(true);
    if (
      memberList.length === 0 &&
      !loadingMembers &&
      !membersError &&
      selectedProjectId
    ) {
      fetchMembers();
    }
  };

  useEffect(() => {
    const currentSelectedId = selectedProject?.projectId;
    const currentRoomName = getRoomName(currentSelectedId);

    if (currentSelectedId) {
      setError(null);
      fetchProjectMessages(currentSelectedId);
      if (socketRef.current?.connected && currentRoomName) {
        socketRef.current.emit("joinChatRoom", { roomName: currentRoomName });
      }
    } else {
      setMessages([]);
    }

    return () => {
      if (socketRef.current?.connected && currentRoomName) {
        socketRef.current.emit("leaveChatRoom", { roomName: currentRoomName });
      }
    };
  }, [selectedProject, fetchProjectMessages]);

  useEffect(() => {
    if (!currentAdminId) {
      console.warn("ADMIN CHAT: currentAdminId is missing, socket not initialized.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("ADMIN CHAT: Auth token is missing, socket not initialized.");
      setSocketError("Auth token missing for chat.");
      return;
    }
    if (socketRef.current) {
      console.log("ADMIN CHAT: Socket already initialized.");
      return;
    }

    console.log("ADMIN CHAT: Initializing Global Socket Connection...");
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      query: { userId: currentAdminId },
      reconnectionAttempts: 3,
      timeout: SOCKET_TIMEOUT,
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("ADMIN CHAT: Socket CONNECTED:", newSocket.id);
      setIsConnected(true);
      setSocketError(null);
      const currentRoom = getRoomName(selectedProject?.projectId);
      if (currentRoom) newSocket.emit("joinChatRoom", { roomName: currentRoom });
    });
    newSocket.on("disconnect", (reason) => {
      console.log("ADMIN CHAT: Socket DISCONNECTED:", reason);
      setIsConnected(false);
      // Only clear ref if it's the same instance that disconnected.
      if (socketRef.current?.id === newSocket.id) socketRef.current = null; 
      if (reason !== "io client disconnect") setSocketError("Disconnected from chat service.");
    });
    newSocket.on("connect_error", (err) => {
      console.error("ADMIN CHAT: Socket Connect Error:", err.message, err);
      setIsConnected(false);
      setSocketError(`Chat connection failed: ${err.message}. Check server and network.`);
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });
    newSocket.on("newMessage", (message) => {
      console.log("ADMIN CHAT: newMessage event received:", message);
      if (message?.projectId?.toString() === selectedProject?.projectId?.toString()) {
        const msg = { ...message, sender: message.sender || { id: message.senderId } };
        setMessages((prev) => [...prev, msg]);
      }
    });
    newSocket.on("messageDeleted", (payload) => {
      console.log("ADMIN CHAT: messageDeleted event received:", payload);
      if (payload?.projectId?.toString() === selectedProject?.projectId?.toString()) {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.messageId));
      }
    });

    return () => {
      const socketInstanceToClean = newSocket; // Capture the socket instance from this effect's closure
      console.log("ADMIN CHAT: Unmount Cleanup for socket:", socketInstanceToClean.id);
      try {
        socketInstanceToClean.off("connect");
        socketInstanceToClean.off("disconnect");
        socketInstanceToClean.off("connect_error");
        socketInstanceToClean.off("newMessage");
        socketInstanceToClean.off("messageDeleted");
        socketInstanceToClean.disconnect();
      } catch (e) { console.warn("ADMIN CHAT: Error during socket cleanup:", e); }
      // Only nullify ref if it's the one we are cleaning up
      if (socketRef.current?.id === socketInstanceToClean.id) {
        socketRef.current = null;
      }
    };
  }, [currentAdminId, API_BASE_URL, selectedProject?.projectId]);

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
  };
  const cancelDeleteMessage = () => {
    if (isDeletingMessage) return;
    setMessageToDelete(null);
    setError(null);
  };
  const confirmDeleteMessage = useCallback(async () => {
    if (!messageToDelete || !currentAdminId || isDeletingMessage) return;
    const msgIdToDelete = messageToDelete.id;
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Auth token required for deletion.");
      return;
    }
    setIsDeletingMessage(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/admin/messages/${msgIdToDelete}`;
      const response = await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "API deletion failed.");
      }
      setMessageToDelete(null);
    } catch (err) {
      console.error(`ADMIN: Delete message error for ${msgIdToDelete}:`, err);
      setError(err.response?.data?.message || "Error deleting message. Please try again.");
    } finally {
      setIsDeletingMessage(false);
    }
  }, [messageToDelete, currentAdminId, isDeletingMessage, API_BASE_URL]);

  if (isLoadingProjects && projects.length === 0) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Project Chat Viewer" />
        <LoadingSpinner message="Loading Projects..." />
      </div>
    );
  }

  if (error && projects.length === 0 && !isLoadingProjects && !selectedProject) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Project Chat Viewer" />
        <ErrorMessage message={error} onRetry={fetchAdminProjects} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader title="Project Chat Viewer" />

        {error && !isLoadingMessages && !messageToDelete && !selectedProject && (
          <ErrorMessage message={error} onClose={() => setError(null)} isDismissible={true} />
        )}
        {projects.length === 0 && !isLoadingProjects && !error && (
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-10 text-center">
                <FaProjectDiagram className="mx-auto text-5xl text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Projects Found</h3>
                <p className="text-gray-500 mb-6">
                    Could not load any projects. Please ensure the server is running and you have appropriate permissions.
                </p>
                <button
                    onClick={fetchAdminProjects}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center justify-center mx-auto"
                    disabled={isLoadingProjects}
                >
                    {isLoadingProjects ? <FaSpinner className="animate-spin mr-2" /> : <FaSearch className="mr-2" /> }
                    {isLoadingProjects ? 'Retrying...' : 'Retry Loading Projects'}
                </button>
            </div>
        )}

        {projects.length > 0 && (
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 h-[calc(100vh-16rem)] flex overflow-hidden">
            <div className="w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col">
                <div className="p-3 border-b border-gray-200">
                <div className="relative">
                    <input
                    type="search"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoadingProjects && projects.length > 0 && (
                    <div className="p-4 flex justify-center items-center">
                        <FaSpinner className="animate-spin text-indigo-500 mr-2" />
                        <span className="text-sm text-gray-500">Refreshing projects...</span>
                    </div>
                )}
                {!isLoadingProjects && filteredProjects.length === 0 && (
                    <p className="p-4 text-sm text-center text-gray-500">
                    {searchTerm ? "No projects match your search." : (projects.length > 0 ? "No projects found (this should not happen if list is populated)." : "No projects available.")}
                    </p>
                )}
                {filteredProjects.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                    {filteredProjects.map((proj) => (
                        <li
                        key={proj.projectId}
                        onClick={() => { setSelectedProject(proj); setError(null); }}
                        className={`p-3 flex items-center gap-3 cursor-pointer text-sm transition-colors ${
                            selectedProject?.projectId === proj.projectId
                            ? "bg-indigo-100 font-semibold text-indigo-800"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                        >
                        <FaProjectDiagram
                            className={`w-4 h-4 flex-shrink-0 ${
                            selectedProject?.projectId === proj.projectId
                                ? "text-indigo-600"
                                : "text-gray-400"
                            }`}
                        />
                        <span className="truncate" title={proj.projectName}>{proj.projectName}</span>
                        </li>
                    ))}
                    </ul>
                )}
                </div>
            </div>

            <div className="w-2/3 lg:w-3/4 flex flex-col bg-gray-50">
                {!selectedProject ? (
                <div className="flex-1 flex justify-center items-center text-center text-gray-500 p-5">
                    <FaComments className="w-10 h-10 text-gray-300 mb-2 mr-2" />
                    <p>Select a project from the list to view its chat messages.</p>
                </div>
                ) : (
                <>
                    <div className="flex items-center p-3 border-b border-gray-200 bg-white gap-3 sticky top-0 z-10 shadow-sm">
                    <div className="flex-shrink-0 h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <FaProjectDiagram size="1.1em" />
                    </div>
                    <h2
                        className="font-semibold text-lg text-gray-800 truncate"
                        title={selectedProject.projectName}
                    >
                        {selectedProject.projectName}
                    </h2>
                    <button
                        onClick={handleOpenMembersModal}
                        className="ml-auto mr-1 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="View Members" >
                        <FaUsers size="1.1em" />
                    </button>
                    <div className={`text-xs flex items-center gap-1 ${isConnected ? "text-green-600" : "text-red-500"}`}>
                        <FaWifi size="0.8em" /> {isConnected ? "Live" : socketError ? "Chat Error" : "Chat Offline"}
                    </div>
                    </div>

                    <div className="flex-grow p-4 overflow-y-auto bg-gradient-to-br from-gray-100 to-blue-50 relative custom-scrollbar">
                    {isLoadingMessages && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                        <LoadingSpinner message="Loading messages..." />
                        </div>
                    )}
                    {socketError && !isLoadingMessages && (
                        <ErrorMessage message={socketError} onClose={() => setSocketError(null)} isDismissible={true} type="warning" />
                    )}
                    {error && selectedProject && !isLoadingMessages && (
                         <ErrorMessage message={error} onClose={() => setError(null)} isDismissible={true} type="error" />
                    )}

                    {messages.length > 0 ? (
                        <ul className="space-y-1">
                        {messages.map((msg, index) => {
                            const prevMessage = messages[index - 1];
                            const showDateSeparator =
                            !prevMessage ||
                            formatDateSeparator(msg.createdAt) !==
                                formatDateSeparator(prevMessage.createdAt);
                            const isSenderAdmin = msg.senderId === currentAdminId;

                            return (
                            <React.Fragment key={msg.id || `msg-${msg.senderId}-${msg.createdAt}-${index}`}> {/* Added index for more unique key */}
                                {showDateSeparator && formatDateSeparator(msg.createdAt) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="text-center my-3">
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                    {formatDateSeparator(msg.createdAt)}
                                    </span>
                                </motion.div>
                                )}
                                <motion.li
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex items-start gap-2.5 my-1.5 group relative pr-10 ${isSenderAdmin ? 'justify-end' : ''}`}
                                >
                                {!isSenderAdmin && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden" title={msg.sender?.username}>
                                    {msg.sender?.profilePictureUrl ? (
                                        <img src={msg.sender.profilePictureUrl} alt={msg.sender.username || 'User'} className="w-full h-full object-cover" />
                                    ) : ( <FaUserCircle className="w-6 h-6 text-gray-500" /> )}
                                    </div>
                                )}
                                <div
                                    className={`max-w-[70%] p-2.5 rounded-lg shadow-sm ${
                                    isSenderAdmin
                                        ? "bg-indigo-500 text-white rounded-br-none"
                                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                                    }`} >
                                    {!isSenderAdmin && (
                                    <p className="text-xs font-semibold text-indigo-700 mb-0.5">
                                        {msg.sender?.username || `User ${msg.senderId}`}
                                    </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                    <p
                                    className={`text-[10px] mt-1 ${isSenderAdmin ? 'text-indigo-200' : 'text-gray-400'} text-right`}
                                    title={ msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "" } >
                                    {formatMessageTime(msg.createdAt)}
                                    </p>
                                </div>
                                {isSenderAdmin && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden" title={msg.sender?.username || "You"}>
                                    {currentUser?.profilePictureUrl ? (
                                        <img src={currentUser.profilePictureUrl} alt="You" className="w-full h-full object-cover" />
                                    ) : ( <FaUserCircle className="w-6 h-6 text-gray-500" /> )}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleDeleteClick(msg)}
                                    title="Delete Message"
                                    className="absolute right-1 bottom-1 p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 rounded-full hover:bg-red-100" >
                                    <FaTrash size="0.8em" />
                                </button>
                                </motion.li>
                            </React.Fragment>
                            );
                        })}
                        </ul>
                    ) : (
                        !isLoadingMessages && !error && !socketError && (
                        <p className="text-center text-sm text-gray-500 pt-10 italic">
                            No messages found for this project. Be the first to send one!
                        </p>
                        )
                    )}
                    <div ref={messagesEndRef} />
                    </div>
                </>
                )}
            </div>
            </div>
        )}
      </div>

      <AnimatePresence>
        {messageToDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !isDeletingMessage) cancelDeleteMessage(); }} >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-300" >
              <h3 className="text-lg font-semibold text-red-700 mb-2 flex items-center">
                <FaExclamationCircle className="mr-2" /> Delete Message?
              </h3>
              <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded border border-gray-200 break-all max-h-32 overflow-y-auto custom-scrollbar">
                "{messageToDelete.content?.substring(0, 150)}
                {messageToDelete.content?.length > 150 ? "..." : ""}"
              </p>
              <div className="text-xs text-gray-500 mb-1">
                Sender:{" "}
                <span className="font-medium text-gray-700">
                  {messageToDelete.sender?.username || `User ID: ${messageToDelete.senderId}`}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Time:{" "}
                <span className="font-medium text-gray-700">
                  {messageToDelete.createdAt ? new Date(messageToDelete.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>

              {error && messageToDelete && (
                <div className="mb-4">
                  <ErrorMessage message={error} type="error" onClose={() => setError(null)} isDismissible={!isDeletingMessage}/>
                </div>
              )}
              
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded mb-5">
                This action cannot be undone. The message will be permanently deleted.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDeleteMessage}
                  disabled={isDeletingMessage}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50" >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMessage}
                  disabled={isDeletingMessage}
                  className={`px-4 py-2 rounded-md text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center min-w-[110px] ${
                    isDeletingMessage
                      ? "bg-red-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`} >
                  {isDeletingMessage ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaTrash size="0.9em" className="mr-2" />
                  )}
                  {isDeletingMessage ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MemberListModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={memberList}
        isLoading={loadingMembers}
        error={membersError}
        projectName={selectedProject?.projectName}
        onRetry={fetchMembers}
        currentUserId={currentAdminId}
      />
    </>
  );
}

export default AdminProjectChatViewer;