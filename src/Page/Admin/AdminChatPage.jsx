// src/Page/Admin/AdminChatPage.jsx (or AdminProjectChatViewer.jsx)
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
    console.warn("Failed to format message time:", isoString, e);
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
    console.warn("Failed to format date separator:", isoString, e);
    return null;
  }
};

function AdminProjectChatViewer({ currentUser }) {
  const navigate = useNavigate();

  // --- State ---
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesPagination, setMessagesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: 0,
  });
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [projectLoadError, setProjectLoadError] = useState(null);
  const [messageLoadError, setMessageLoadError] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);


  // --- Refs ---
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- Derived Values ---
  const currentAdminId = currentUser?.id;
  const selectedProjectId = selectedProject?.projectId; // This relies on selectedProject having projectId

  // --- Callbacks & Effects ---
  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) {
        const lastMessage = messages[messages.length - 1];
        const behavior = lastMessage?.senderId === currentAdminId ? "smooth" : "auto";
        scrollToBottom(behavior);
    }
  }, [messages, scrollToBottom, currentAdminId, isLoadingMessages]);

  const fetchAdminProjects = useCallback(async () => {
    console.log("ADMIN: Fetching projects list (fetchAdminProjects called)...");
    setIsLoadingProjects(true);
    setProjectLoadError(null);
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.error("ADMIN: No auth token found for fetching projects.");
      setProjectLoadError("Authentication required to load projects.");
      setIsLoadingProjects(false);
      setProjects([]);
      setFilteredProjects([]);
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/admin/projects`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("ADMIN: response.data (parsed JSON) for projects:", JSON.stringify(response.data, null, 2));

      if (response.data?.success === true && response.data?.data && Array.isArray(response.data.data.projects)) {
        console.log("ADMIN: Condition met (success is true, data.projects is an array). Processing projects...");
        
        const projectListFromData = response.data.data.projects.map((p) => ({
          projectId: p.id,     // Use p.id from the received data
          projectName: p.title,    // Use p.title from the received data
          // Include other properties from 'p' if needed by the selectedProject state or UI directly
          // For example, if selectedProject needs the full owner object or description for other UI parts:
          description: p.description,
          status: p.status,
          owner: p.owner, // The full owner object as received
          ownerId: p.ownerId,
          // ... any other fields from 'p' that you might need later when 'selectedProject' is set
        }));

        console.log("ADMIN: projectListFromData (after frontend map, first 2 items):", JSON.stringify(projectListFromData.slice(0,2), null, 2));

        projectListFromData.sort((a, b) =>
          (a.projectName || "").localeCompare(b.projectName || "")
        );
        setProjects(projectListFromData); // This state now holds objects with projectId and projectName
        setFilteredProjects(projectListFromData);
        setProjectLoadError(null);

        if (response.data.data.pagination) {
            console.log("ADMIN: Project list pagination received:", response.data.data.pagination);
        }

      } else {
        const errorMessage = response.data?.message || "Server indicated failure loading projects. (Response structure unexpected)";
        console.error("ADMIN: Backend response did not meet expected structure or success was false.", {
            responseData: response.data,
            expectedSuccess: true,
            actualSuccess: response.data?.success,
            expectedDataProjectsArray: true,
            actualDataProjectsIsArray: Array.isArray(response.data?.data?.projects)
        });
        setProjectLoadError(errorMessage);
        setProjects([]);
        setFilteredProjects([]);
      }
    } catch (err) {
      console.error("ADMIN: Fetch projects error (axios catch block):", err);
      if (err.response) {
        setProjectLoadError(
          `Error ${err.response.status}: ${err.response.data?.message || 'Failed to load projects from server.'}`
        );
      } else if (err.request) {
        setProjectLoadError("No response from server. Check network connection and backend server status.");
      } else {
        setProjectLoadError(err.message || "An unexpected error occurred while loading projects.");
      }
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setIsLoadingProjects(false);
      console.log("ADMIN: fetchAdminProjects finished.");
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchAdminProjects();
  }, [fetchAdminProjects]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(
        projects.filter((p) =>
          p.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) // Uses projectName
        )
      );
    }
  }, [searchTerm, projects]);

  // For debugging the state that feeds the UI
  useEffect(() => {
    if (projects.length > 0) {
        console.log("ADMIN: 'projects' state updated (first 2 items):", JSON.stringify(projects.slice(0,2), null, 2));
    } else if (!isLoadingProjects) {
        console.log("ADMIN: 'projects' state is empty or cleared.");
    }
  }, [projects, isLoadingProjects]);

  useEffect(() => {
    if (selectedProject) { // selectedProject will have projectId and projectName from the 'projects' state
        console.log("ADMIN: 'selectedProject' state updated:", JSON.stringify(selectedProject, null, 2));
    }
  }, [selectedProject]);


  const fetchProjectMessages = useCallback(
    async (projectIdToFetch, page = 1) => {
      if (!projectIdToFetch) return;
      // ... (rest of fetchProjectMessages - assumed to be okay)
      console.log(`ADMIN MSGS: Fetching messages page ${page} for project ${projectIdToFetch}`);
      setIsLoadingMessages(true);
      setMessageLoadError(null);
      if (page === 1) setMessages([]);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessageLoadError("Authentication required to load messages.");
        setIsLoadingMessages(false);
        return;
      }
      try {
        const url = `${API_BASE_URL}/api/admin/messages/project/${projectIdToFetch}?page=${page}&limit=50`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data?.success === true && Array.isArray(response.data.messages || response.data.items)) {
          const fetchedMessages = response.data.messages || response.data.items;
          const sortedMessages = fetchedMessages.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          setMessages(page === 1 ? sortedMessages : (prev) => [...prev, ...sortedMessages]);
          setMessagesPagination({
            currentPage: response.data.currentPage || 1,
            totalPages: response.data.totalPages || 1,
            count: response.data.count || response.data.totalItems || response.data.totalMessages || 0,
          });
        } else {
          throw new Error(response.data?.message || "Failed to load messages for project.");
        }
      } catch (err) {
        console.error(`ADMIN MSGS: Fetch messages error project ${projectIdToFetch}:`, err);
        setMessageLoadError(err.response?.data?.message || "Error fetching messages for this project.");
        if(page === 1) setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [API_BASE_URL]
  );

  const fetchMembers = useCallback(async () => {
    const currentSelectedProjectId = selectedProject?.projectId; // Use local const for safety in async
    if (!currentSelectedProjectId) {
      setMembersError("No project selected to fetch members.");
      return;
    }
    console.log(`ADMIN MEMBERS: Fetching members for project ${currentSelectedProjectId}`);
    // ... (rest of fetchMembers - assumed to be okay)
    setLoadingMembers(true);
    setMembersError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setMembersError("Authentication required.");
      setLoadingMembers(false);
      return;
    }
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/projects/${currentSelectedProjectId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success === true && Array.isArray(res.data.data)) {
        setMemberList(res.data.data);
      } else {
        throw new Error(res.data?.message || "Failed to load members.");
      }
    } catch (err) {
      console.error("ADMIN MEMBERS: Fetch members error:", err);
      setMembersError(err.response?.data?.message || "Could not load project members.");
      setMemberList([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedProject, API_BASE_URL]); // Depend on selectedProject so currentSelectedProjectId is up-to-date

  const handleOpenMembersModal = () => {
    if (!selectedProject?.projectId) return; // Use selectedProject.projectId
    setShowMembersModal(true);
    if ( (memberList.length === 0 || memberList[0]?.projectId !== selectedProject?.projectId) && !loadingMembers && !membersError) {
      fetchMembers();
    }
  };

  useEffect(() => {
    const currentSelectedId = selectedProject?.projectId; // Uses projectId from selectedProject
    const currentRoomName = getRoomName(currentSelectedId);

    if (currentSelectedId) {
      console.log(`ADMIN: Project selected: ${selectedProject.projectName} (ID: ${currentSelectedId}). Fetching messages.`); // Uses projectName
      fetchProjectMessages(currentSelectedId, 1);
      setMessageLoadError(null);
      setMembersError(null);
      setMemberList([]);

      if (socketRef.current?.connected && currentRoomName) {
        console.log(`ADMIN Socket: Joining room ${currentRoomName}`);
        socketRef.current.emit("joinChatRoom", { roomName: currentRoomName });
        if(socketRef.current) socketRef.current.currentRoom = currentRoomName;
      }
    } else {
      setMessages([]);
      setMessagesPagination({ currentPage: 1, totalPages: 1, count: 0 });
      setMessageLoadError(null);
    }
    
    // This cleanup logic needs to capture the roomName from the *previous* render's selectedProject
    // A more robust way is to store the room name in a ref or use the closure property carefully.
    // For now, this might lead to leaving the wrong room if selection changes very rapidly.
    return () => {
      const roomToLeave = currentRoomName; 
      if (socketRef.current?.connected && roomToLeave) {
        console.log(`ADMIN Socket: Leaving room ${roomToLeave} due to project change or unmount.`);
        socketRef.current.emit("leaveChatRoom", { roomName: roomToLeave });
        if(socketRef.current) socketRef.current.currentRoom = null;
      }
    };
  }, [selectedProject, fetchProjectMessages]);

  useEffect(() => {
    // ... (Socket.IO useEffect - assumed to be okay for now, ensure it uses selectedProject?.projectId for room joining)
    if (!currentAdminId || !API_BASE_URL) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      setSocketError("Authentication token not found for chat.");
      return;
    }
    if (socketRef.current?.connected) return;
    if (socketRef.current && socketRef.current.io?.engine?.readyState === 'opening') return;

    const newSocket = io(API_BASE_URL, {
      auth: { token }, transports: ["websocket"], query: { userId: currentAdminId, isAdmin: true },
      reconnectionAttempts: 3, timeout: SOCKET_TIMEOUT, autoConnect: true,
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setIsConnected(true); setSocketError(null);
      const currentRoom = getRoomName(selectedProject?.projectId); // Use selectedProject here
      if (currentRoom) {
        newSocket.emit("joinChatRoom", { roomName: currentRoom });
        newSocket.currentRoom = currentRoom;
      }
    });
    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") setSocketError("Disconnected by server.");
      else if (reason !== "io client disconnect") setSocketError("Chat disconnected. Reconnecting...");
    });
    newSocket.on("connect_error", (err) => {
      setIsConnected(false); setSocketError(`Chat Connection Failed: ${err.message}.`);
    });
    newSocket.on("newMessage", (message) => {
      if (message?.projectId?.toString() === selectedProject?.projectId?.toString()) { // Use selectedProject here
        setMessages((prev) => [...prev, {...message, sender: message.sender || { id: message.senderId, username: message.senderUsername || `User ${message.senderId}` }}]);
      }
    });
    newSocket.on("messageDeleted", (payload) => {
      if (payload?.projectId?.toString() === selectedProject?.projectId?.toString()) { // Use selectedProject here
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.messageId));
      }
    });
    return () => {
      if (newSocket) {
        newSocket.off("connect"); newSocket.off("disconnect"); newSocket.off("connect_error");
        newSocket.off("newMessage"); newSocket.off("messageDeleted");
        newSocket.disconnect();
      }
      if (socketRef.current && socketRef.current.id === newSocket.id) socketRef.current = null;
    };
  }, [currentAdminId, API_BASE_URL, selectedProject]); // Add selectedProject


  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
  };
  const cancelDeleteMessage = () => {
    setMessageToDelete(null);
  };
  const confirmDeleteMessage = useCallback(async () => {
    // ... (confirmDeleteMessage - assumed to be okay)
    if (!messageToDelete || !currentAdminId) return;
    const msgIdToDelete = messageToDelete.id;
    setMessageToDelete(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setProjectLoadError("Authentication required to delete message.");
      return;
    }
    try {
      const url = `${API_BASE_URL}/api/admin/messages/${msgIdToDelete}`;
      const response = await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "API deletion failed.");
      }
    } catch (err) {
      console.error(`ADMIN: Delete message error for ${msgIdToDelete}:`, err);
      setProjectLoadError(err.response?.data?.message || "Error deleting message.");
    }
  }, [messageToDelete, currentAdminId, API_BASE_URL]);

  // --- Render Logic ---

  if (isLoadingProjects) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Project Chat Viewer" />
        <LoadingSpinner message="Loading Projects..." />
      </div>
    );
  }

  // This error display is for when the initial project list fails to load entirely
  if (projectLoadError && projects.length === 0 && !isLoadingProjects) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Project Chat Viewer" />
        <ErrorMessage message={projectLoadError} onRetry={fetchAdminProjects} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader title="Project Chat Viewer" />

        {/* This error is for non-fatal project load errors, e.g. if a retry fails but some projects were loaded */}
        {projectLoadError && projects.length > 0 && (
          <ErrorMessage
            message={projectLoadError}
            onClose={() => setProjectLoadError(null)}
            isDismissible={true}
            type="warning"
          />
        )}
      
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 h-[calc(100vh-16rem)] flex overflow-hidden">
          {/* Left Panel: Project List */}
          <div className="w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border rounded-md pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <FaSearch className="h-4 w-4 text-gray-400 dark:text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((proj) => ( // `proj` here comes from `projects` state, which has `projectId` and `projectName`
                    <li
                      key={proj.projectId}
                      onClick={() => {
                        if(selectedProject?.projectId !== proj.projectId) {
                            setSelectedProject(proj); // `proj` is the full object mapped in fetchAdminProjects
                        }
                      }}
                      className={`p-3 flex items-center gap-3 cursor-pointer text-sm transition-colors duration-150 ${
                        selectedProject?.projectId === proj.projectId
                          ? "bg-indigo-100 dark:bg-indigo-700 font-semibold text-indigo-800 dark:text-indigo-100"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <FaProjectDiagram
                        className={`w-4 h-4 flex-shrink-0 ${
                          selectedProject?.projectId === proj.projectId
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      />
                      <span className="truncate">{proj.projectName || "Unnamed Project"}</span>
                    </li>
                  ))
                ) : (
                  <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    {isLoadingProjects /* This should be false here */ ? "Loading..." : (searchTerm ? "No projects match search." : (projectLoadError ? "Error loading." : "No projects."))}
                  </p>
                )}
              </ul>
            </div>
          </div>

          {/* Right Panel: Message Area */}
          <div className="w-2/3 lg:w-3/4 flex flex-col bg-gray-50 dark:bg-gray-850">
            {!selectedProject ? (
              <div className="flex-1 flex justify-center items-center text-center text-gray-500 dark:text-gray-400 p-5">
                <div className="flex flex-col items-center">
                  <FaComments size="3em" className="mb-3 text-gray-400 dark:text-gray-500" />
                  <p>Select a project from the list to view its chat messages.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center p-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 gap-3 sticky top-0 z-10 shadow-sm">
                  <div className="flex-shrink-0 h-9 w-9 bg-indigo-100 dark:bg-indigo-700 rounded-md flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                    <FaProjectDiagram size="1.2em" />
                  </div>
                  <h2
                    className="font-semibold text-lg text-gray-800 dark:text-gray-100 truncate"
                    title={selectedProject.projectName} // selectedProject should have projectName
                  >
                    {selectedProject.projectName}
                  </h2>
                  <button
                    onClick={handleOpenMembersModal}
                    className="ml-auto mr-1 p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="View Members"
                  >
                    <FaUsers size="1.1em"/>
                  </button>
                  <div className={`flex items-center gap-1 text-xs ${isConnected ? "text-green-600 dark:text-green-400" : (socketError ? "text-yellow-500 dark:text-yellow-400" : "text-red-500 dark:text-red-400")}`}>
                    <FaWifi size="0.8em" /> {isConnected ? "Live" : (socketError ? "Connecting..." : "Offline")}
                  </div>
                </div>

                <div className="flex-grow p-4 overflow-y-auto bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-800 dark:to-gray-850 relative custom-scrollbar">
                  {/* ... (Message display logic - assumed to be okay) ... */}
                  {isLoadingMessages && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10">
                      <LoadingSpinner message="Loading messages..." />
                    </div>
                  )}
                  {socketError && !isConnected && (
                    <div className="my-2">
                      <ErrorMessage
                        message={socketError}
                        onClose={() => setSocketError(null)}
                        isDismissible={true}
                        type="warning"
                      />
                    </div>
                  )}
                  {messageLoadError && (
                     <div className="my-2">
                        <ErrorMessage
                            message={messageLoadError}
                            onClose={() => setMessageLoadError(null)}
                            isDismissible={true}
                            onRetry={() => fetchProjectMessages(selectedProject?.projectId, 1)} // Use selectedProject.projectId
                            type="error"
                        />
                     </div>
                  )}

                  {messages.length > 0 ? (
                    <ul className="space-y-1">
                      {messages.map((msg, index) => {
                        const prevMessage = messages[index - 1];
                        const showDateSeparator =
                          !prevMessage ||
                          formatDateSeparator(msg.createdAt) !==
                            formatDateSeparator(prevMessage.createdAt);
                        const senderIsAdmin = msg.senderId === currentAdminId || msg.sender?.isAdmin;

                        return (
                          <React.Fragment key={msg.id || `msg-${msg.senderId}-${msg.createdAt}-${index}`}>
                            {showDateSeparator && formatDateSeparator(msg.createdAt) && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-center my-3"
                                >
                                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    {formatDateSeparator(msg.createdAt)}
                                  </span>
                                </motion.div>
                              )}
                            <motion.li /* ... */ >
                              {/* ... message item structure ... */}
                            </motion.li>
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  ) : (
                    !isLoadingMessages && !messageLoadError && (
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-10 italic">
                        No messages found for this project.
                      </p>
                    )
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals (Delete Confirmation, Member List) - assumed to be okay */}
      <AnimatePresence>
        {messageToDelete && (
          <motion.div /* ... */ >
            {/* ... delete modal content ... */}
          </motion.div>
        )}
      </AnimatePresence>

      <MemberListModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={memberList}
        isLoading={loadingMembers}
        error={membersError}
        projectName={selectedProject?.projectName} // Uses selectedProject.projectName
        onRetry={fetchMembers}
        currentUserId={currentAdminId}
      />
    </>
  );
}

export default AdminProjectChatViewer;