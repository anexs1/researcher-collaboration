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
  const selectedProjectId = selectedProject?.projectId;

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
    // console.log("ADMIN: Fetching projects list (fetchAdminProjects called)...");
    setIsLoadingProjects(true);
    setProjectLoadError(null);
    const token = localStorage.getItem("authToken");

    if (!token) {
      setProjectLoadError("Authentication required to load projects.");
      setIsLoadingProjects(false);
      setProjects([]); setFilteredProjects([]); return;
    }

    try {
      const url = `${API_BASE_URL}/api/admin/projects`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log("ADMIN: response.data (parsed JSON) for projects:", JSON.stringify(response.data, null, 2));

      if (response.data?.success === true && response.data?.data && Array.isArray(response.data.data.projects)) {
        const projectListFromData = response.data.data.projects.map((p) => ({
          projectId: p.id,
          projectName: p.title,
          description: p.description, status: p.status, owner: p.owner, ownerId: p.ownerId,
        }));
        projectListFromData.sort((a, b) => (a.projectName || "").localeCompare(b.projectName || ""));
        setProjects(projectListFromData);
        setFilteredProjects(projectListFromData);
        setProjectLoadError(null);
        if (response.data.data.pagination) { /* console.log("ADMIN: Project list pagination received:", response.data.data.pagination); */ }
      } else {
        const errorMessage = response.data?.message || "Server indicated failure loading projects. (Response structure unexpected)";
        setProjectLoadError(errorMessage);
        setProjects([]); setFilteredProjects([]);
      }
    } catch (err) {
      if (err.response) {
        setProjectLoadError(`Error ${err.response.status}: ${err.response.data?.message || 'Failed to load projects.'}`);
      } else if (err.request) {
        setProjectLoadError("No response from server. Check network.");
      } else {
        setProjectLoadError(err.message || "Error loading projects.");
      }
      setProjects([]); setFilteredProjects([]);
    } finally {
      setIsLoadingProjects(false);
      // console.log("ADMIN: fetchAdminProjects finished.");
    }
  }, [API_BASE_URL]);

  useEffect(() => { fetchAdminProjects(); }, [fetchAdminProjects]);

  useEffect(() => {
    if (!searchTerm) setFilteredProjects(projects);
    else setFilteredProjects(projects.filter((p) => p.projectName?.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, projects]);

  // Logging for project state
  useEffect(() => {
    if (projects.length > 0) { /* console.log("ADMIN: 'projects' state updated (first 2 items):", JSON.stringify(projects.slice(0,2), null, 2)); */ }
  }, [projects]);
  useEffect(() => {
    if (selectedProject) { /* console.log("ADMIN: 'selectedProject' state updated:", JSON.stringify(selectedProject, null, 2)); */ }
  }, [selectedProject]);


  const fetchProjectMessages = useCallback(
    async (projectIdToFetch, page = 1) => {
      if (!projectIdToFetch) return;
      console.log(`ADMIN MSGS: Fetching messages page ${page} for project ${projectIdToFetch}`);
      setIsLoadingMessages(true);
      setMessageLoadError(null);
      if (page === 1) setMessages([]);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessageLoadError("Authentication required to load messages.");
        setIsLoadingMessages(false); return;
      }
      try {
        const url = `${API_BASE_URL}/api/admin/messages/project/${projectIdToFetch}?page=${page}&limit=50`;
        const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        
        console.log("ADMIN MSGS: Raw response for messages:", JSON.stringify(response.data, null, 2));

        if (response.data?.success === true && Array.isArray(response.data.messages || response.data.items)) {
          const fetchedMessages = response.data.messages || response.data.items;
          
          // --- ADDED LOG FOR FIRST FETCHED MESSAGE ---
          if (fetchedMessages.length > 0) {
            console.log("ADMIN MSGS: First fetched message object structure:", JSON.stringify(fetchedMessages[0], null, 2));
          } else {
            console.log("ADMIN MSGS: No messages fetched in this batch.");
          }
          // --- END LOG ---

          const sortedMessages = fetchedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          setMessages(page === 1 ? sortedMessages : (prev) => [...prev, ...sortedMessages]);
          setMessagesPagination({
            currentPage: response.data.currentPage || 1,
            totalPages: response.data.totalPages || 1,
            count: response.data.count || response.data.totalItems || response.data.totalMessages || 0,
          });
        } else {
          throw new Error(response.data?.message || "Failed to load messages for project (unexpected structure).");
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
    const currentSelectedProjId = selectedProject?.projectId;
    if (!currentSelectedProjId) { setMembersError("No project selected."); return; }
    // ... (rest of fetchMembers)
    setLoadingMembers(true); setMembersError(null);
    const token = localStorage.getItem("authToken");
    if (!token) { setMembersError("Auth required."); setLoadingMembers(false); return; }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/projects/${currentSelectedProjId}/members`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success === true && Array.isArray(res.data.data)) setMemberList(res.data.data);
      else throw new Error(res.data?.message || "Failed to load members.");
    } catch (err) {
      setMembersError(err.response?.data?.message || "Could not load members."); setMemberList([]);
    } finally { setLoadingMembers(false); }
  }, [selectedProject, API_BASE_URL]);

  const handleOpenMembersModal = () => {
    if (!selectedProject?.projectId) return;
    setShowMembersModal(true);
    if ( (memberList.length === 0 || memberList[0]?.projectId !== selectedProject?.projectId) && !loadingMembers && !membersError) {
      fetchMembers();
    }
  };

  useEffect(() => {
    const currentSelectedId = selectedProject?.projectId;
    const currentRoomName = getRoomName(currentSelectedId);
    if (currentSelectedId) {
      fetchProjectMessages(currentSelectedId, 1);
      setMessageLoadError(null); setMembersError(null); setMemberList([]);
      if (socketRef.current?.connected && currentRoomName) {
        socketRef.current.emit("joinChatRoom", { roomName: currentRoomName });
        if(socketRef.current) socketRef.current.currentRoom = currentRoomName;
      }
    } else {
      setMessages([]); setMessagesPagination({ currentPage: 1, totalPages: 1, count: 0 }); setMessageLoadError(null);
    }
    return () => {
      const roomToLeave = currentRoomName; 
      if (socketRef.current?.connected && roomToLeave) {
        socketRef.current.emit("leaveChatRoom", { roomName: roomToLeave });
        if(socketRef.current) socketRef.current.currentRoom = null;
      }
    };
  }, [selectedProject, fetchProjectMessages]);

  useEffect(() => {
    if (!currentAdminId || !API_BASE_URL) return;
    const token = localStorage.getItem("authToken");
    if (!token) { setSocketError("Auth token not found for chat."); return; }
    if (socketRef.current?.connected) return;
    if (socketRef.current && socketRef.current.io?.engine?.readyState === 'opening') return;

    const newSocket = io(API_BASE_URL, {
      auth: { token }, transports: ["websocket"], query: { userId: currentAdminId, isAdmin: true },
      reconnectionAttempts: 3, timeout: SOCKET_TIMEOUT, autoConnect: true,
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setIsConnected(true); setSocketError(null);
      const currentRoom = getRoomName(selectedProject?.projectId);
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
      // --- ENHANCED LOGGING FOR SOCKET MESSAGE ---
      console.log("ADMIN CHAT: newMessage event received (raw object):", message);
      console.log("ADMIN CHAT: newMessage expected content property:", message?.content); // Check if 'content' exists
      // --- END LOG ---

      if (message?.projectId?.toString() === selectedProject?.projectId?.toString()) {
        const msg = {
          ...message,
          sender: message.sender || { id: message.senderId, username: message.senderUsername || `User ${message.senderId}` },
        };
        setMessages((prev) => [...prev, msg]);
      }
    });
    newSocket.on("messageDeleted", (payload) => {
      if (payload?.projectId?.toString() === selectedProject?.projectId?.toString()) {
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
  }, [currentAdminId, API_BASE_URL, selectedProject]);


  // --- ADDED USEEFFECT TO LOG MESSAGES STATE ---
  useEffect(() => {
    if (messages.length > 0) {
        console.log("ADMIN MSGS STATE: 'messages' state updated (first message object):", JSON.stringify(messages[0], null, 2));
        console.log("ADMIN MSGS STATE: Content of first message in state:", messages[0]?.content); // Check 'content' specifically
    } else if (!isLoadingMessages && selectedProject) {
        console.log("ADMIN MSGS STATE: 'messages' state is empty (and not loading for a selected project).");
    }
  }, [messages, isLoadingMessages, selectedProject]);
  // --- END LOG ---


  const handleDeleteClick = (message) => setMessageToDelete(message);
  const cancelDeleteMessage = () => setMessageToDelete(null);
  const confirmDeleteMessage = useCallback(async () => {
    if (!messageToDelete || !currentAdminId) return;
    const msgIdToDelete = messageToDelete.id;
    setMessageToDelete(null);
    const token = localStorage.getItem("authToken");
    if (!token) { setProjectLoadError("Auth required to delete message."); return; }
    try {
      const url = `${API_BASE_URL}/api/admin/messages/${msgIdToDelete}`;
      const response = await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.data?.success) throw new Error(response.data?.message || "API deletion failed.");
    } catch (err) {
      setProjectLoadError(err.response?.data?.message || "Error deleting message.");
    }
  }, [messageToDelete, currentAdminId, API_BASE_URL]);

  // --- Render Logic ---

  if (isLoadingProjects) {
    return (
      <div className="p-6"><AdminPageHeader title="Project Chat Viewer" /><LoadingSpinner message="Loading Projects..." /></div>
    );
  }

  if (projectLoadError && projects.length === 0 && !isLoadingProjects) {
    return (
      <div className="p-6"><AdminPageHeader title="Project Chat Viewer" /><ErrorMessage message={projectLoadError} onRetry={fetchAdminProjects} /></div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader title="Project Chat Viewer" />
        {projectLoadError && projects.length > 0 && (
          <ErrorMessage message={projectLoadError} onClose={() => setProjectLoadError(null)} isDismissible={true} type="warning" />
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 h-[calc(100vh-16rem)] flex overflow-hidden">
          {/* Left Panel: Project List */}
          <div className="w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700">
              <div className="relative">
                <input type="search" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border rounded-md pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" />
                <FaSearch className="h-4 w-4 text-gray-400 dark:text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((proj) => (
                    <li key={proj.projectId} onClick={() => { if(selectedProject?.projectId !== proj.projectId) setSelectedProject(proj); }}
                      className={`p-3 flex items-center gap-3 cursor-pointer text-sm transition-colors duration-150 ${ selectedProject?.projectId === proj.projectId ? "bg-indigo-100 dark:bg-indigo-700 font-semibold text-indigo-800 dark:text-indigo-100" : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" }`} >
                      <FaProjectDiagram className={`w-4 h-4 flex-shrink-0 ${ selectedProject?.projectId === proj.projectId ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500" }`} />
                      <span className="truncate">{proj.projectName || "Unnamed Project"}</span>
                    </li>
                  ))
                ) : ( <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">{isLoadingProjects ? "Loading..." : (searchTerm ? "No projects match." : (projectLoadError ? "Error." : "No projects."))}</p> )}
              </ul>
            </div>
          </div>

          {/* Right Panel: Message Area */}
          <div className="w-2/3 lg:w-3/4 flex flex-col bg-gray-50 dark:bg-gray-850">
            {!selectedProject ? (
              <div className="flex-1 flex justify-center items-center text-center text-gray-500 dark:text-gray-400 p-5">
                <div className="flex flex-col items-center"><FaComments size="3em" className="mb-3 text-gray-400 dark:text-gray-500" /><p>Select a project to view chat.</p></div>
              </div>
            ) : (
              <>
                <div className="flex items-center p-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 gap-3 sticky top-0 z-10 shadow-sm">
                  <div className="flex-shrink-0 h-9 w-9 bg-indigo-100 dark:bg-indigo-700 rounded-md flex items-center justify-center text-indigo-600 dark:text-indigo-300"><FaProjectDiagram size="1.2em" /></div>
                  <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 truncate" title={selectedProject.projectName}>{selectedProject.projectName}</h2>
                  <button onClick={handleOpenMembersModal} className="ml-auto mr-1 p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="View Members"><FaUsers size="1.1em"/></button>
                  <div className={`flex items-center gap-1 text-xs ${isConnected ? "text-green-600 dark:text-green-400" : (socketError ? "text-yellow-500 dark:text-yellow-400" : "text-red-500 dark:text-red-400")}`}><FaWifi size="0.8em" /> {isConnected ? "Live" : (socketError ? "Connecting..." : "Offline")}</div>
                </div>

                <div className="flex-grow p-4 overflow-y-auto bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-800 dark:to-gray-850 relative custom-scrollbar">
                  {isLoadingMessages && (<div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 z-10"><LoadingSpinner message="Loading messages..." /></div>)}
                  {socketError && !isConnected && (<div className="my-2"><ErrorMessage message={socketError} onClose={() => setSocketError(null)} isDismissible={true} type="warning"/></div>)}
                  {messageLoadError && (<div className="my-2"><ErrorMessage message={messageLoadError} onClose={() => setMessageLoadError(null)} isDismissible={true} onRetry={() => fetchProjectMessages(selectedProject?.projectId, 1)} type="error"/></div>)}

                  {messages.length > 0 ? (
                    <ul className="space-y-1">
                      {messages.map((msg, index) => {
                        const prevMessage = messages[index - 1];
                        const showDateSeparator = !prevMessage || formatDateSeparator(msg.createdAt) !== formatDateSeparator(prevMessage.createdAt);
                        const senderIsAdmin = msg.senderId === currentAdminId || msg.sender?.isAdmin;
                        return (
                          <React.Fragment key={msg.id || `msg-${msg.senderId}-${msg.createdAt}-${index}`}>
                            {showDateSeparator && formatDateSeparator(msg.createdAt) && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center my-3">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{formatDateSeparator(msg.createdAt)}</span>
                                </motion.div>
                            )}
                            <motion.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                              className={`flex items-start gap-2.5 my-1.5 group relative pr-10 ${senderIsAdmin ? "justify-end" : ""}`}>
                              {!senderIsAdmin && (
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm text-gray-600 dark:text-gray-300 overflow-hidden" title={msg.sender?.username}>
                                  {msg.sender?.profilePictureUrl ? (<img src={msg.sender.profilePictureUrl} alt={msg.sender.username?.charAt(0)} className="h-full w-full object-cover" />) : (msg.sender?.username?.charAt(0).toUpperCase() || <FaUserCircle />)}
                                </div>
                              )}
                              <div className={`max-w-[70%] p-2.5 rounded-lg shadow-sm ${ senderIsAdmin ? "bg-indigo-500 text-white rounded-br-none" : "bg-white dark:bg-gray-700 dark:text-gray-200 text-gray-800 rounded-bl-none border dark:border-gray-600"}`}>
                                {!senderIsAdmin && (<p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">{msg.sender?.username || `User ${msg.senderId}`}</p>)}
                                {/* THIS IS WHERE MESSAGE CONTENT IS RENDERED */}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p> 
                                <p className={`text-[10px] mt-1 ${senderIsAdmin ? "text-indigo-200" : "text-gray-400 dark:text-gray-500"} text-right`} title={msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}>{formatMessageTime(msg.createdAt)}</p>
                              </div>
                              {senderIsAdmin && (
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-200 dark:bg-indigo-600 flex items-center justify-center text-sm text-indigo-700 dark:text-indigo-100 overflow-hidden" title={currentUser?.username || "Admin"}>
                                  {currentUser?.profilePictureUrl ? (<img src={currentUser.profilePictureUrl} alt={currentUser.username?.charAt(0)} className="h-full w-full object-cover" />) : (currentUser?.username?.charAt(0).toUpperCase() || <FaUserCircle />)}
                                </div>
                              )}
                              <button onClick={() => handleDeleteClick(msg)} className={`absolute p-1 rounded-full text-red-300 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${ senderIsAdmin ? "left-1 bottom-1" : "right-1 bottom-1"}`} title="Delete Message"><FaTrash size="0.8em" /></button>
                            </motion.li>
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  ) : ( !isLoadingMessages && !messageLoadError && (<p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-10 italic">No messages found for this project.</p>) )}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {messageToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full text-center border border-gray-300 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Delete Message?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 break-all">"{messageToDelete.content?.substring(0, 100)}{messageToDelete.content?.length > 100 ? "..." : ""}"</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sender: {messageToDelete.sender?.username || `User ${messageToDelete.senderId}`}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">This action cannot be undone.</p>
              <div className="flex justify-center gap-4">
                <button onClick={cancelDeleteMessage} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={confirmDeleteMessage} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2"><FaTrash size="0.9em" /> Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MemberListModal
        isOpen={showMembersModal} onClose={() => setShowMembersModal(false)}
        members={memberList} isLoading={loadingMembers} error={membersError}
        projectName={selectedProject?.projectName} onRetry={fetchMembers} currentUserId={currentAdminId} />
    </>
  );
}

export default AdminProjectChatViewer;