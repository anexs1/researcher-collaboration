// src/Page/Admin/AdminChatPage.jsx (or AdminProjectChatViewer.jsx)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added Link
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

// Adjust import paths as needed
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import MemberListModal from "../../Component/chat/MemberListModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_TIMEOUT = 15000;

// Helpers
const getRoomName = (projectId) => (projectId ? `project-${projectId}` : null);
const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  try {
    return format(parseISO(isoString), "p");
  } catch (e) {
    return "";
  }
};
const formatDateSeparator = (isoString) => {
  if (!isoString) return null;
  try {
    const d = parseISO(isoString);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
  } catch (e) {
    return null;
  }
};

// --- Component Renamed ---
function AdminProjectChatViewer({ currentUser }) {
  const navigate = useNavigate(); // Keep if needed

  // --- State ---
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null); // Stores { projectId, projectName }
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: 0,
  });
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState(null); // Combined error state
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);
  // No longer need canAttemptConnect, socket useEffect guards handle it

  // --- Refs ---
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- Derived Values ---
  const currentAdminId = currentUser?.id;
  // Get projectId ONLY from the selectedProject state when needed
  const selectedProjectId = selectedProject?.projectId;
  const roomName = getRoomName(selectedProjectId); // Room name depends on selection

  // --- Callbacks & Effects ---
  const scrollToBottom = useCallback((behavior = "smooth") => {
    /* ... */
  }, []);
  useEffect(() => {
    if (messages.length > 0) scrollToBottom("smooth");
  }, [messages, scrollToBottom]);

  // Fetch Projects List (Admin View) - Runs once on mount
  useEffect(() => {
    const fetchAdminProjects = async () => {
      console.log("ADMIN: Fetching projects list...");
      setIsLoadingProjects(true);
      setError(null);
      setProjects([]);
      setFilteredProjects([]);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Auth required.");
        setIsLoadingProjects(false);
        return;
      }
      try {
        const url = `${API_BASE_URL}/api/admin/projects`; // Use admin projects route
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data?.success && Array.isArray(response.data.data)) {
          const projectList = response.data.data.map((p) => ({
            projectId: p.id,
            projectName: p.title,
          }));
          projectList.sort((a, b) =>
            (a.projectName || "").localeCompare(b.projectName || "")
          );
          setProjects(projectList);
          setFilteredProjects(projectList);
        } else {
          throw new Error(response.data?.message || "Failed to load projects.");
        }
      } catch (err) {
        console.error("ADMIN: Fetch projects error:", err);
        let eMsg = "Could not load projects.";
        /* ... error msg determination ... */ setError(eMsg);
        setProjects([]);
        setFilteredProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchAdminProjects();
  }, []); // Empty dependency array - runs once

  // Filter Projects based on search term
  useEffect(() => {
    if (!searchTerm) setFilteredProjects(projects);
    else
      setFilteredProjects(
        projects.filter((p) =>
          p.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
  }, [searchTerm, projects]);

  // Fetch Messages for the *Selected* Project
  const fetchProjectMessages = useCallback(
    async (projectIdToFetch, page = 1) => {
      if (!projectIdToFetch) return; // Need a project ID
      console.log(
        `ADMIN: Fetching messages page ${page} for project ${projectIdToFetch}`
      );
      setIsLoadingMessages(true);
      setError(null);
      if (page === 1) setMessages([]); // Clear only on first page load

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Auth required.");
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
          setMessages(fetched); // Replace messages for simplicity
          setPagination({
            currentPage: response.data.currentPage || 1,
            totalPages: response.data.totalPages || 1,
            count: response.data.count || 0,
          });
        } else {
          throw new Error(response.data?.message || "Failed to load messages.");
        }
      } catch (err) {
        console.error(`Fetch messages error project ${projectIdToFetch}:`, err);
        setError(err.response?.data?.message || "Error fetching messages.");
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    []
  ); // No dependencies needed as projectId is passed as arg

  // Fetch Members for the *Selected* Project
  const fetchMembers = useCallback(async () => {
    // --- *** USE selectedProjectId from state *** ---
    if (!selectedProjectId) {
      setMembersError("No project selected.");
      return;
    }
    console.log(`MEMBERS: Fetching members for project ${selectedProjectId}`);
    // -----------------------------------------------
    setLoadingMembers(true);
    setMembersError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      /* ... */ setLoadingMembers(false);
      return;
    }
    try {
      // *** Use selectedProjectId in URL ***
      const res = await axios.get(
        `${API_BASE_URL}/api/projects/${selectedProjectId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success && Array.isArray(res.data.members)) {
        /* ... process members ... */
        const owner = res.data.owner;
        let members = res.data.members.map((m) => ({
          ...m,
          id: m.user?.id || m.id,
          username: m.user?.username || m.username,
          profilePictureUrl: m.user?.profilePictureUrl || m.profilePictureUrl,
          role: m.role || "Member",
        }));
        if (owner && !members.some((m) => m.id === owner.id))
          members.unshift({ ...owner, role: "Owner" });
        else
          members = members.map((m) =>
            m.id === owner?.id ? { ...m, role: "Owner" } : m
          );
        members.sort((a, b) => {
          if (a.role === "Owner" && b.role !== "Owner") return -1;
          if (a.role !== "Owner" && b.role === "Owner") return 1;
          return (a.username || "").localeCompare(b.username || "");
        });
        setMemberList(members);
      } else throw new Error(res.data?.message || "Failed load members.");
    } catch (err) {
      /* ... handle error ... */
    } finally {
      setLoadingMembers(false);
    }
    // --- *** Depend on selectedProjectId *** ---
  }, [selectedProjectId]);

  // Open Members Modal - uses fetchMembers which now uses selectedProjectId
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

  // Effect to Fetch Messages & Join/Leave Room on Project Selection Change
  useEffect(() => {
    const currentSelectedId = selectedProject?.projectId; // Get ID for this render
    const currentRoomName = getRoomName(currentSelectedId);

    if (currentSelectedId) {
      console.log(
        `ADMIN: Project selected: ${currentSelectedId}. Fetching messages.`
      );
      fetchProjectMessages(currentSelectedId); // Fetch for the selected project
      // Join room if socket connected
      if (socketRef.current?.connected && currentRoomName) {
        console.log(`ADMIN Socket: Joining room ${currentRoomName}`);
        socketRef.current.emit("joinChatRoom", { roomName: currentRoomName });
      }
    } else {
      setMessages([]); // Clear messages if no project is selected
    }

    // Cleanup function: Leave the room associated with the project selected *before* this effect ran
    return () => {
      if (socketRef.current?.connected && currentRoomName) {
        // Use room name captured in effect closure
        console.log(
          `ADMIN Socket: Leaving room ${currentRoomName} on project change/unmount.`
        );
        socketRef.current.emit("leaveChatRoom", { roomName: currentRoomName });
      }
    };
    // Run when selectedProject changes OR fetchProjectMessages callback changes (should be stable)
  }, [selectedProject, fetchProjectMessages]);

  // --- WebSocket Connection & Global Listeners (Runs once per admin session) ---
  useEffect(() => {
    // Guards
    if (!currentAdminId) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    if (socketRef.current) return; // Connect only once

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
      if (currentRoom)
        newSocket.emit("joinChatRoom", { roomName: currentRoom });
    }); // Join current room on connect/reconnect
    newSocket.on("disconnect", (reason) => {
      console.log("ADMIN CHAT: Socket DISCONNECTED:", reason);
      setIsConnected(false);
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
      if (reason !== "io client disconnect") setSocketError("Disconnected");
    });
    newSocket.on("connect_error", (err) => {
      console.error("ADMIN CHAT: Socket Connect Error:", err.message);
      setIsConnected(false);
      setSocketError("Connection Failed.");
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });

    // Listen for NEW messages
    newSocket.on("newMessage", (message) => {
      console.log("ADMIN CHAT: newMessage event received:", message);
      // Check if the message belongs to the *currently selected* project
      if (
        message?.projectId?.toString() ===
        selectedProject?.projectId?.toString()
      ) {
        const msg = {
          ...message,
          sender: message.sender || { id: message.senderId },
        };
        setMessages((prev) => [...prev, msg]); // Append new messages for the current view
      } else {
        // Message is for a different project, maybe update a notification count elsewhere?
        console.log(
          `ADMIN CHAT: Received message for other project (${message.projectId})`
        );
      }
    });

    // Listen for DELETED messages
    newSocket.on("messageDeleted", (payload) => {
      console.log("ADMIN CHAT: messageDeleted event received:", payload);
      if (
        payload?.projectId?.toString() ===
        selectedProject?.projectId?.toString()
      ) {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== payload.messageId)
        ); // Remove deleted message
      }
    });

    // Cleanup on component unmount
    return () => {
      const socketInstanceToClean = newSocket;
      console.log("ADMIN CHAT: Unmount Cleanup", socketInstanceToClean.id);
      try {
        socketInstanceToClean.off();
        socketInstanceToClean.disconnect();
      } catch (e) {
        /* ignore */
      } finally {
        if (socketRef.current?.id === socketInstanceToClean.id)
          socketRef.current = null;
      }
    };
    // Only depends on the admin ID to establish the connection
  }, [currentAdminId, API_BASE_URL]);

  // --- Delete Message Handlers ---
  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
  };
  const cancelDeleteMessage = () => {
    setMessageToDelete(null);
  };
  const confirmDeleteMessage = useCallback(async () => {
    if (!messageToDelete || !currentAdminId) return;
    const msgIdToDelete = messageToDelete.id;
    setMessageToDelete(null); // Close modal
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Auth required.");
      return;
    }
    console.log(`ADMIN: Attempting delete for message ID: ${msgIdToDelete}`);
    try {
      const url = `${API_BASE_URL}/api/admin/messages/${msgIdToDelete}`;
      const response = await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "API deletion failed.");
      }
      console.log(
        `ADMIN: API confirmed deletion for message ${msgIdToDelete}. Socket event should update UI.`
      );
      // UI update primarily relies on the messageDeleted socket event now
    } catch (err) {
      console.error(`ADMIN: Delete message error for ${msgIdToDelete}:`, err);
      setError(err.response?.data?.message || "Error deleting message.");
    }
  }, [messageToDelete, currentAdminId]);

  // --- Render Logic ---

  // Loading state for initial project list fetch
  if (isLoadingProjects) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Project Chat Viewer" />
        <LoadingSpinner message="Loading Projects..." />
      </div>
    );
  }

  // Fatal project list fetch error state
  if (error && projects.length === 0 && !isLoadingProjects) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Project Chat Viewer" />
        <ErrorMessage message={error} onRetry={fetchInitialData} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader title="Project Chat Viewer" />

        {/* Display General Errors (e.g., non-fatal fetch errors after initial load) */}
        {error && (
          <ErrorMessage
            message={error}
            onClose={() => setError("")}
            isDismissible={true}
          />
        )}

        <div className="bg-white rounded-lg shadow-xl border border-gray-200 h-[calc(100vh-16rem)] flex overflow-hidden">
          {/* Left Panel: Project List */}
          <div className="w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border rounded-md pl-9 pr-3 py-1.5 text-sm ..."
                />
                <FaSearch className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 ..." />
              </div>
            </div>
            {/* Project List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ul className="divide-y divide-gray-100">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((proj) => (
                    <li
                      key={proj.projectId}
                      onClick={() => setSelectedProject(proj)}
                      className={`p-3 flex items-center gap-3 cursor-pointer text-sm ${
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
                      <span className="truncate">{proj.projectName}</span>
                    </li>
                  ))
                ) : (
                  <p className="p-4 text-sm text-center text-gray-500">
                    {searchTerm ? "No matches." : "No projects."}
                  </p>
                )}
              </ul>
            </div>
          </div>

          {/* Right Panel: Message Area */}
          <div className="w-2/3 lg:w-3/4 flex flex-col bg-gray-50">
            {!selectedProject ? (
              <div className="flex-1 flex justify-center items-center text-center text-gray-500 p-5">
                {" "}
                <p>Select a project to view chat.</p>{" "}
              </div>
            ) : (
              <>
                {/* Message Area Header */}
                <div className="flex items-center p-3 border-b bg-white gap-3 sticky top-0 z-10 shadow-sm">
                  <div className="flex-shrink-0 h-9 w-9 bg-indigo-100 ...">
                    <FaProjectDiagram />
                  </div>
                  <h2
                    className="font-semibold text-lg text-gray-800 truncate"
                    title={selectedProject.projectName}
                  >
                    {selectedProject.projectName}
                  </h2>
                  <button
                    onClick={handleOpenMembersModal}
                    className="ml-auto mr-3 p-1.5 text-gray-500 ..."
                    title="View Members"
                  >
                    <FaUsers />
                  </button>
                  <div className={`text-xs ... ${isConnected ? "..." : "..."}`}>
                    {" "}
                    <FaWifi size="0.7em" /> {isConnected ? "Live" : "Offline"}{" "}
                  </div>
                </div>

                {/* Message Display Area */}
                <div className="flex-grow p-4 overflow-y-auto bg-gradient-to-br from-gray-100 to-blue-50 relative custom-scrollbar">
                  {isLoadingMessages && (
                    <div className="absolute inset-0 ...">
                      <LoadingSpinner />
                    </div>
                  )}
                  {socketError && (
                    <ErrorMessage
                      message={socketError}
                      onClose={() => setSocketError("")}
                      isDismissible={true}
                      type="warning"
                    />
                  )}
                  {/* Display fetch error specific to messages */}
                  {error && (
                    <ErrorMessage
                      message={error}
                      onClose={() => setError("")}
                      isDismissible={true}
                      type="error"
                    />
                  )}

                  {messages.length > 0 ? (
                    <ul className="space-y-1">
                      {messages.map((msg, index) => {
                        const prevMessage = messages[index - 1];
                        const showDateSeparator =
                          !prevMessage ||
                          formatDateSeparator(msg.createdAt) !==
                            formatDateSeparator(prevMessage.createdAt);
                        return (
                          <React.Fragment
                            key={
                              msg.id || `msg-${msg.senderId}-${msg.createdAt}`
                            }
                          >
                            {showDateSeparator &&
                              formatDateSeparator(msg.createdAt) && (
                                <motion.div className="...">
                                  {" "}
                                  {/* Date Separator */}{" "}
                                </motion.div>
                              )}
                            <motion.li
                              className={`flex items-start gap-2.5 my-1.5 group relative pr-10`} /* Anim Props */
                            >
                              {/* Avatar */}
                              <div className="..." title={msg.sender?.username}>
                                {" "}
                                {/* Avatar Logic */}{" "}
                              </div>
                              {/* Bubble + Meta */}
                              <div
                                className={`max-w-[75%] ... ${
                                  msg.senderId === currentAdminId
                                    ? "bg-blue-500 ..."
                                    : "bg-white ..."
                                }`}
                              >
                                <p className="text-xs font-semibold ...">
                                  {msg.sender?.username ||
                                    `User ${msg.senderId}`}
                                </p>
                                <p className="text-sm ...">{msg.content}</p>
                                <p
                                  className={`text-[10px] mt-1 ... text-right`}
                                  title={
                                    msg.createdAt
                                      ? new Date(msg.createdAt).toLocaleString()
                                      : ""
                                  }
                                >
                                  {formatMessageTime(msg.createdAt)}
                                </p>
                              </div>
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteClick(msg)}
                                className="absolute right-1 bottom-1 p-1 text-red-300 ... opacity-0 group-hover:opacity-100 ..."
                              >
                                {" "}
                                <FaTrash size="0.8em" />{" "}
                              </button>
                            </motion.li>
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  ) : (
                    !isLoadingMessages &&
                    !error && (
                      <p className="text-center text-sm text-gray-500 pt-10 italic">
                        No messages found for this project.
                      </p>
                    )
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {/* Input Removed for Admin */}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {messageToDelete && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4" /* Anim Props */
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={cancelDeleteMessage}
            ></div>
            <motion.div
              className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center border border-gray-300" /* Anim Props */
            >
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                Delete Message?
              </h3>
              <p className="text-sm text-gray-600 mb-4 break-all">
                "{messageToDelete.content?.substring(0, 100)}
                {messageToDelete.content?.length > 100 ? "..." : ""}"
              </p>
              <p className="text-xs text-gray-500 mb-5">
                Sender:{" "}
                {messageToDelete.sender?.username || messageToDelete.senderId}
              </p>
              <p className="text-xs text-gray-500 mb-5">
                This cannot be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={cancelDeleteMessage}
                  className="px-4 py-2 rounded border ..."
                >
                  {" "}
                  Cancel{" "}
                </button>
                <button
                  onClick={confirmDeleteMessage}
                  className="px-4 py-2 rounded bg-red-600 ..."
                >
                  {" "}
                  <FaTrash size="0.8em" /> Delete{" "}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member List Modal */}
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

export default AdminProjectChatViewer; // Renamed export
