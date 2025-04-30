// src/Page/ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client"; // Removed unused 'Socket' type
import {
  FaPaperPlane,
  FaSpinner,
  // FaUserCircle, // Removed if not used
  FaArrowLeft,
  FaProjectDiagram,
  FaExclamationCircle,
  FaWifi,
  FaLock,
  FaComments,
  FaCalendarAlt,
  FaUsers,
  FaPaperclip, // <-- Added File Upload icon
  FaTimesCircle, // <-- Added Clear File icon
  FaFileAlt, // <-- Added Generic File icon for messages
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { format, isToday, isYesterday, parseISO } from "date-fns";

// Adjust import paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import MemberListModal from "../Component/chat/MemberListModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_TIMEOUT = 15000; // Timeout for socket operations

// Helper: Generate socket room name
const getRoomName = (projectId) => (projectId ? `project-${projectId}` : null);

// Helper: Format message timestamp (e.g., '1:30 PM')
const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  try {
    return format(parseISO(isoString), "p"); // 'p' is short time format like 1:30 PM
  } catch (e) {
    console.error("Date format error:", e);
    return "";
  }
};

// Helper: Format date separator (e.g., 'Today', 'Yesterday', 'March 15, 2024')
const formatDateSeparator = (isoString) => {
  if (!isoString) return null;
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy"); // Example: March 15, 2024
  } catch (e) {
    console.error("Date format error:", e);
    return null;
  }
};

// --- ChatPage Component ---
function ChatPage({ currentUser }) {
  const { projectId: projectIdParam } = useParams();
  const navigate = useNavigate();

  // --- State Definitions ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false); // For text messages
  const [fetchError, setFetchError] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // React state for connection
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const [canAttemptConnect, setCanAttemptConnect] = useState(false);

  // --- File Upload State ---
  const [selectedFile, setSelectedFile] = useState(null); // Stores the selected File object
  const [isUploading, setIsUploading] = useState(false); // Tracks file upload progress
  const [uploadError, setUploadError] = useState(null); // Stores file upload errors

  // --- Refs ---
  const socketRef = useRef(null); // Holds the actual socket instance
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for the hidden file input

  // --- Derived Values ---
  const currentUserId = currentUser?.id;
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : null;
  const roomName = getRoomName(projectId);

  // --- Callbacks ---
  const scrollToBottom = useCallback((behavior = "smooth") => {
    // Scrolls the message container to the bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 150); // Slight delay allows layout to settle
  }, []);

  // Effect to scroll down when new messages arrive (if needed)
  useEffect(() => {
    if (messages.length > 0) {
      // Consider only auto-scrolling if user is already near the bottom
      // This prevents jumping if user scrolled up to read history
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  // --- Fetch Initial Data (Project Info & Message History) ---
  const fetchInitialData = useCallback(async () => {
    setCanAttemptConnect(false); // Don't try socket connection until data fetched
    // Disconnect existing socket if fetching again
    if (socketRef.current) {
      console.log(
        "fetchInitialData: Disconnecting existing socket before fetch."
      );
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
    // Reset state
    setProjectDetails(null);
    setMessages([]);

    if (!currentUserId || !projectId) {
      setFetchError(
        !currentUserId ? "Authentication Error" : "Invalid Project ID"
      );
      setIsLoading(false);
      return;
    }
    console.log(`FETCH: Starting initial data fetch for project ${projectId}`);
    setIsLoading(true);
    setFetchError(null);
    setSocketError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setIsLoading(false);
      return;
    }

    let fetchedDetails = null;
    let fetchedMsgs = [];
    let errorMsg = null;
    let allowConnection = false;

    try {
      // Fetch history and project info concurrently
      const [historyResponse, projectInfoResponse] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/api/messaging/history/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        // Fetch project details separately to confirm existence/name
        axios
          .get(`${API_BASE_URL}/api/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => {
            console.warn(
              "Failed to fetch project details separately:",
              err.message
            );
            // Return null but don't fail the whole fetch yet
            return null;
          }),
      ]);

      // Process Project Details Response
      const projectData =
        projectInfoResponse?.data?.data || projectInfoResponse?.data?.project;
      if (projectData?.id && projectData?.title) {
        fetchedDetails = { id: projectData.id, name: projectData.title };
        allowConnection = true; // Project confirmed to exist and user likely has access
      } else {
        // Fallback if project details fetch failed but history might exist
        fetchedDetails = { id: projectId, name: `Project ${projectId}` };
        // We might still allow connection if history fetch worked, indicates membership
      }

      // Process Message History Response
      if (
        historyResponse.data?.success &&
        Array.isArray(historyResponse.data.data)
      ) {
        fetchedMsgs = historyResponse.data.data;
        allowConnection = true; // If history fetched, user has access
        console.log(
          `FETCH: Message history success. ${fetchedMsgs.length} messages.`
        );
      } else {
        // History fetch failed, might be okay if project exists but no messages
        if (!allowConnection) {
          // If project details also failed, then it's likely an error
          throw new Error(
            historyResponse.data?.message || "Failed to load message history."
          );
        }
        console.warn(
          "FETCH: Message history fetch returned non-success or no data."
        );
        fetchedMsgs = [];
      }
    } catch (err) {
      console.error(`FETCH: Error during initial data fetch:`, err);
      allowConnection = false; // Assume no connection if fetch fails severely
      if (err.response) {
        errorMsg = err.response.data?.message || `Error ${err.response.status}`;
        if (err.response.status === 403)
          errorMsg = "Access Denied to this project chat.";
        else if (err.response.status === 404)
          errorMsg = "Project chat not found.";
        else if (err.response.status === 401)
          errorMsg = "Authentication expired. Please log in.";
      } else if (err.request) {
        errorMsg = "Network Error. Could not reach server.";
      } else {
        errorMsg = err.message || "An unknown error occurred during fetch.";
      }
      // Keep fallback project details if possible
      fetchedDetails = fetchedDetails ||
        projectDetails || { id: projectId, name: `Project ${projectId}` };
      fetchedMsgs = [];
    } finally {
      console.log("FETCH: Applying state updates.");
      setProjectDetails(fetchedDetails);
      setMessages(fetchedMsgs);
      setFetchError(errorMsg);
      setIsLoading(false);
      setCanAttemptConnect(allowConnection); // Only allow socket connection if fetch was successful enough
      console.log(
        `FETCH: Final state - errorMsg=${errorMsg}, allowConnection=${allowConnection}`
      );
      // Scroll to bottom only if messages were successfully fetched
      if (fetchedMsgs.length > 0 && allowConnection && !errorMsg) {
        scrollToBottom("auto"); // Instant scroll on initial load
      }
    }
  }, [currentUserId, projectId, scrollToBottom]); // Dependencies

  // Effect to run initial data fetch
  useEffect(() => {
    fetchInitialData();
    // Cleanup function for socket when component unmounts
    return () => {
      if (socketRef.current) {
        console.log(
          "ChatPage Unmount: Disconnecting socket",
          socketRef.current.id
        );
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false); // Update state on unmount
      }
    };
  }, [fetchInitialData]); // Rerun if projectId changes

  // --- Fetch Members ---
  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    setLoadingMembers(true);
    setMembersError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoadingMembers(false);
      return;
    }
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/projects/${projectId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success && Array.isArray(res.data.members)) {
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
      let msg = "Could not load members.";
      if (err.response)
        msg = err.response.data?.message || `Err ${err.response.status}`;
      else if (err.request) msg = "Network Error";
      else msg = err.message;
      setMembersError(msg);
      setMemberList([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId]);

  const handleOpenMembersModal = () => {
    setShowMembersModal(true);
    if (memberList.length === 0 && !loadingMembers && !membersError) {
      fetchMembers();
    }
  };

  // --- WebSocket Connection useEffect ---
  useEffect(() => {
    console.log(
      `Socket Effect Triggered: canAttemptConnect=${canAttemptConnect}, currentUserId=${currentUserId}, projectId=${projectId}, roomName=${roomName}, tokenExists=${!!localStorage.getItem(
        "authToken"
      )}, socketConnected=${socketRef.current?.connected}`
    );

    if (!canAttemptConnect || !currentUserId || !projectId || !roomName) {
      console.log(
        "Socket Effect: Skipping connection (pre-conditions not met)."
      );
      if (socketRef.current) {
        console.log(
          "Socket Effect: Disconnecting existing socket due to unmet pre-conditions."
        );
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("Socket Effect: Skipping connection (no token).");
      return;
    }
    if (socketRef.current?.connected) {
      console.log(
        `Socket Effect: Skipping connection (already connected, ID: ${socketRef.current.id}).`
      );
      if (!isConnected) setIsConnected(true);
      return;
    }
    if (socketRef.current) {
      console.log(
        "Socket Effect: Cleaning up existing non-connected socket before retry."
      );
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log(
      `Socket Effect: *** ATTEMPTING CONNECTION *** to ${API_BASE_URL} for room: ${roomName}`
    );
    setSocketError(null);
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      query: { userId: currentUserId },
      reconnectionAttempts: 3,
      timeout: SOCKET_TIMEOUT,
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log(
        `>>> Socket CONNECTED: ${newSocket.id}. Setting isConnected=true.`
      );
      setIsConnected(true);
      setSocketError(null);
      newSocket.emit("joinChatRoom", { roomName }, (ack) => {
        if (ack?.success) {
          console.log(`Socket successfully joined room: ${roomName}`);
        } else {
          console.error(`Socket failed to join room ${roomName}:`, ack?.error);
          setSocketError(`Join Error: ${ack?.error || "Server rejected join"}`);
        }
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log(
        `>>> Socket DISCONNECTED: ${newSocket.id}, Reason: ${reason}. Setting isConnected=false.`
      );
      setIsConnected(false);
      if (reason !== "io client disconnect") {
        setSocketError("Connection lost. Attempting to reconnect...");
      }
      if (socketRef.current?.id === newSocket.id) {
        socketRef.current = null;
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error(
        `>>> Socket CONNECT_ERROR: ${err.message}. Setting isConnected=false. Data:`,
        err.data
      );
      setIsConnected(false);
      setSocketError(
        `Connection Failed: ${err.message}. Please check network or try again later.`
      );
      if (socketRef.current?.id === newSocket.id) {
        socketRef.current = null;
      }
    });

    newSocket.on("newMessage", (message) => {
      console.log("<<< Received newMessage event:", message);
      if (!message || !message.projectId || !message.id) {
        console.warn("Received invalid message structure:", message);
        return;
      }
      if (message.projectId.toString() === projectId?.toString()) {
        const msg = {
          ...message,
          sender: message.sender || {
            id: message.senderId,
            username: "Unknown",
          },
        };
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
        scrollToBottom("smooth");
      } else {
        console.log(
          `Ignoring message for different project: ${message.projectId}`
        );
      }
    });

    newSocket.on("userTyping", ({ userId, username }) => {
      if (userId?.toString() === currentUserId?.toString()) return;
      setTypingUsers((prev) => {
        const map = new Map(prev);
        if (map.has(userId)) clearTimeout(map.get(userId).timerId);
        const timerId = setTimeout(
          () =>
            setTypingUsers((curr) => {
              const mA = new Map(curr);
              mA.delete(userId);
              return mA;
            }),
          3000
        );
        map.set(userId, { username, timerId });
        return map;
      });
    });

    newSocket.on("userStopTyping", ({ userId }) => {
      if (userId?.toString() === currentUserId?.toString()) return;
      setTypingUsers((prev) => {
        const map = new Map(prev);
        if (map.has(userId)) {
          clearTimeout(map.get(userId).timerId);
          map.delete(userId);
        }
        return map;
      });
    });

    return () => {
      const socketInstanceToClean = newSocket;
      console.log(
        `Socket Cleanup Effect running for socket: ${socketInstanceToClean.id}`
      );
      try {
        socketInstanceToClean.off("connect");
        socketInstanceToClean.off("disconnect");
        socketInstanceToClean.off("connect_error");
        socketInstanceToClean.off("newMessage");
        socketInstanceToClean.off("userTyping");
        socketInstanceToClean.off("userStopTyping");
        if (socketInstanceToClean.connected) {
          console.log(`Emitting leaveChatRoom for ${roomName} on cleanup`);
          socketInstanceToClean.emit("leaveChatRoom", { roomName });
        }
        console.log(
          `Disconnecting socket instance ${socketInstanceToClean.id}`
        );
        socketInstanceToClean.disconnect();
      } catch (e) {
        console.error("Socket cleanup error during disconnect:", e);
      } finally {
        if (socketRef.current?.id === socketInstanceToClean.id) {
          socketRef.current = null;
          console.log("Socket Cleanup: socketRef nullified.");
        } else {
          console.log(
            "Socket Cleanup: socketRef already holds a different instance or is null."
          );
        }
      }
    };
  }, [
    canAttemptConnect,
    currentUserId,
    projectId,
    roomName,
    API_BASE_URL,
    scrollToBottom,
  ]);

  // --- File Handlers ---
  const handleFileSelect = (event) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size exceeds the 10MB limit.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      console.log("File selected:", file.name, file.size, file.type);
      setSelectedFile(file);
      setUploadError(null);
      setNewMessage("");
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- Send Message / Upload File Handler ---
  const handleSendMessage = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      const currentSocket = socketRef.current;

      console.log(
        `handleSendMessage: Triggered. isConnected(React State)=${isConnected}, currentSocket?.connected=${currentSocket?.connected}, isSending=${isSending}, isUploading=${isUploading}, selectedFile=${selectedFile?.name}, newMessage=${newMessage}`
      );

      if (!currentSocket?.connected) {
        console.error(
          "handleSendMessage: Send aborted, socket is not connected."
        );
        setSocketError(
          "Not connected to send message. Please wait or check connection."
        );
        return;
      }
      if (!projectId || !currentUserId) {
        console.error(
          "handleSendMessage: Send aborted, missing projectId or currentUserId."
        );
        setSocketError("Cannot send message - missing critical IDs.");
        return;
      }
      if (isSending || isUploading) {
        console.log(
          "handleSendMessage: Send aborted, already sending/uploading."
        );
        return;
      }

      // File Upload Logic
      if (selectedFile) {
        setIsUploading(true);
        setUploadError(null);
        setSocketError(null);
        const formData = new FormData();
        formData.append("file", selectedFile);
        try {
          console.log(
            `Uploading file: ${selectedFile.name} for project ${projectId}`
          );
          const token = localStorage.getItem("authToken");
          const uploadResponse = await axios.post(
            `${API_BASE_URL}/api/messaging/upload/project/${projectId}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (uploadResponse.data?.success && uploadResponse.data.data) {
            const fileData = uploadResponse.data.data;
            console.log("File Upload Success, emitting message:", fileData);
            const fileMessageData = {
              senderId: currentUserId,
              projectId,
              roomName,
              messageType: "file",
              fileUrl: fileData.fileUrl,
              fileName: fileData.fileName,
              mimeType: fileData.mimeType,
              fileSize: fileData.fileSize,
              content: `File: ${fileData.fileName}`,
            };
            currentSocket
              .timeout(SOCKET_TIMEOUT)
              .emit("sendMessage", fileMessageData, (err, ack) => {
                if (err) {
                  console.error("Socket emit (file) error:", err);
                  setSocketError("Error: File message send timed out.");
                } else if (!ack?.success) {
                  console.error("Socket emit (file) NACK:", ack?.error);
                  setSocketError(
                    `Send failed: ${ack?.error || "Server error"}`
                  );
                } else {
                  console.log("File message emitted successfully via socket.");
                }
              });
            clearSelectedFile();
          } else {
            throw new Error(
              uploadResponse.data?.message || "File upload failed on server."
            );
          }
        } catch (err) {
          console.error("File Upload Axios Error:", err);
          let errorMsg = "Failed to upload file.";
          if (err.response)
            errorMsg =
              err.response.data?.message ||
              `Upload failed (${err.response.status})`;
          else if (err.request) errorMsg = "Network error during upload.";
          else errorMsg = err.message;
          setUploadError(errorMsg);
        } finally {
          setIsUploading(false);
        }
      }
      // Text Message Logic
      else {
        const contentToSend = newMessage.trim();
        if (!contentToSend) return;
        setIsSending(true);
        setSocketError(null);
        setUploadError(null);
        const messageData = {
          senderId: currentUserId,
          projectId,
          content: contentToSend,
          roomName,
          messageType: "text",
        };
        console.log("Emitting text message:", messageData);
        currentSocket
          .timeout(SOCKET_TIMEOUT)
          .emit("sendMessage", messageData, (err, ack) => {
            setIsSending(false);
            if (err) {
              console.error("Socket emit (text) error:", err);
              setSocketError("Error: Message send timed out.");
            } else if (ack?.success) {
              console.log("Text message emitted successfully.");
              setNewMessage("");
            } else {
              console.error("Socket emit (text) NACK:", ack?.error);
              setSocketError(`Send failed: ${ack?.error || "Server error"}`);
            }
          });
      }
    },
    [
      // Dependencies
      newMessage,
      selectedFile,
      currentUserId,
      projectId,
      roomName,
      isSending,
      isUploading,
      API_BASE_URL,
      isConnected, // isConnected for logging, guard uses socketRef.current.connected
    ]
  );

  // Typing Handlers
  const handleTyping = useCallback(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket?.connected || !roomName || selectedFile) return;
    clearTimeout(typingTimeoutRef.current);
    currentSocket.emit("typing", { roomName });
    typingTimeoutRef.current = setTimeout(() => {}, 2500);
  }, [roomName, selectedFile]);

  const handleStopTyping = useCallback(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket?.connected || !roomName || selectedFile) return;
    clearTimeout(typingTimeoutRef.current);
    currentSocket.emit("stopTyping", { roomName });
  }, [roomName, selectedFile]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)] p-4">
        <LoadingSpinner size="xl" message="Loading Chat..." />
      </div>
    );
  }

  // Fatal Error State
  const isFatalError =
    fetchError &&
    !isLoading &&
    (fetchError.includes("Access Denied") ||
      fetchError.includes("Not Found") ||
      fetchError.includes("Invalid Project ID") ||
      fetchError.includes("Authentication Error"));
  if (isFatalError) {
    const isForbidden = fetchError.includes("Access Denied");
    const isNotFound =
      fetchError.includes("Not Found") ||
      fetchError.includes("Invalid Project ID");
    const isAuthError = fetchError.includes("Authentication"); // Added check for auth errors

    // *** RESTORED JSX FOR FATAL ERROR DISPLAY ***
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center">
        <Link
          to={isAuthError ? "/login" : "/messages"}
          className="text-sm text-indigo-600 hover:underline mb-6 inline-flex items-center gap-1.5"
        >
          <FaArrowLeft /> {isAuthError ? "Back to Login" : "Back to Chats"}
        </Link>
        <div className="mt-4 p-6 bg-white rounded-lg shadow border border-red-200">
          {isForbidden || isAuthError ? (
            <FaLock className="text-red-500 h-12 w-12 mx-auto mb-4" />
          ) : (
            // Covers Not Found and Invalid ID
            <FaExclamationCircle className="text-red-500 h-12 w-12 mx-auto mb-4" />
          )}
          <ErrorMessage
            title={
              isAuthError
                ? "Authentication Required"
                : isForbidden
                ? "Access Denied"
                : isNotFound
                ? "Chat Not Found"
                : "Error Loading Chat"
            }
            message={fetchError}
            // Only show retry if it's not a permission/existence issue
            onRetry={
              !isForbidden && !isNotFound && !isAuthError
                ? fetchInitialData
                : undefined
            }
          />
        </div>
      </div>
    );
    // *** END RESTORED JSX ***
  }

  // Get typing users list
  const otherTypingUsers = Array.from(typingUsers.values())
    .filter((user) => user.username)
    .map((user) => user.username);

  // Main Chat UI
  return (
    <>
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto bg-white shadow-2xl rounded-b-lg border border-t-0 border-gray-200 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 sticky top-0 z-20 shadow-sm">
          <Link
            to="/messages"
            className="text-gray-500 hover:text-indigo-600 mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Back to Chats"
          >
            <FaArrowLeft size="1.1em" />
          </Link>
          {projectDetails ? (
            <>
              <div className="flex-shrink-0 mr-3 h-10 w-10 bg-indigo-100 border border-indigo-200 rounded-full flex items-center justify-center shadow-inner">
                <FaProjectDiagram className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-grow overflow-hidden">
                <h2
                  className="font-semibold text-gray-800 truncate text-xl"
                  title={projectDetails.name}
                >
                  {projectDetails.name || `Project ${projectId}`}
                </h2>
                <p className="text-xs text-gray-500">Group Chat</p>
              </div>
              <button
                onClick={handleOpenMembersModal}
                className="ml-4 flex-shrink-0 p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 transition-colors"
                title="View Project Members"
                aria-label="View Project Members"
              >
                <FaUsers size="1.2em" />
              </button>
            </>
          ) : (
            <h2 className="font-semibold text-gray-800 text-xl">
              Loading Chat...
            </h2>
          )}
          <div
            className={`ml-auto text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm ${
              isConnected
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse"
            }`}
            title={isConnected ? "Connected" : "Connecting..."}
          >
            <FaWifi className="w-3 h-3" />{" "}
            {isConnected ? "Online" : "Connecting"}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative custom-scrollbar">
          {/* Display Non-Fatal Fetch/Socket Errors */}
          {fetchError && !isFatalError && (
            <ErrorMessage
              message={fetchError}
              onClose={() => setFetchError(null)}
              isDismissible={true}
              type="warning"
            />
          )}
          {socketError && (
            <ErrorMessage
              message={socketError}
              onClose={() => setSocketError(null)}
              isDismissible={true}
              type="warning"
            />
          )}

          {/* Empty Chat Message */}
          {messages.length === 0 && !fetchError && !isLoading && (
            <div className="text-center py-20 px-6 text-gray-500">
              {" "}
              <FaComments className="mx-auto h-16 w-16 text-gray-300 mb-5" />{" "}
              <p className="text-lg italic">No messages yet.</p>{" "}
              <p className="text-base mt-1">
                Start the conversation or send a file!
              </p>{" "}
            </div>
          )}

          {/* List of Messages */}
          <ul className="space-y-1">
            {messages.map((msg, index) => {
              const isCurrentUserSender =
                msg.senderId?.toString() === currentUserId?.toString();
              const prevMessage = messages[index - 1];
              const showDateSeparator =
                !prevMessage ||
                formatDateSeparator(msg.createdAt) !==
                  formatDateSeparator(prevMessage.createdAt);
              const isFileMessage = msg.messageType === "file";

              return (
                <React.Fragment
                  key={
                    msg.id ||
                    `msg-${msg.senderId}-${msg.createdAt || Date.now()}`
                  }
                >
                  {" "}
                  {/* Added fallback key */}
                  {/* Date Separator Rendering */}
                  {showDateSeparator && formatDateSeparator(msg.createdAt) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center items-center my-6"
                    >
                      <span className="px-3 py-1 bg-white text-gray-500 text-xs font-semibold rounded-full shadow border border-gray-200 flex items-center gap-1.5">
                        <FaCalendarAlt className="w-3 h-3" />{" "}
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </motion.div>
                  )}
                  {/* Message Bubble Rendering */}
                  <motion.li
                    initial={{ opacity: 0, y: isCurrentUserSender ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-end gap-2.5 my-2 ${
                      isCurrentUserSender ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Sender Avatar */}
                    {!isCurrentUserSender && (
                      <div
                        className="flex-shrink-0 self-start relative mt-1"
                        title={msg.sender?.username || "User"}
                      >
                        {msg.sender?.profilePictureUrl ? (
                          <img
                            src={msg.sender.profilePictureUrl}
                            alt={msg.sender.username || ""}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) =>
                              (e.target.src = "/default-avatar.png")
                            }
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-base font-semibold text-white shadow border-2 border-white">
                            {" "}
                            {(msg.sender?.username || "?")
                              .charAt(0)
                              .toUpperCase()}{" "}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Message Content Box */}
                    <div
                      className={`max-w-[70%] md:max-w-[65%] px-4 py-2.5 rounded-t-xl ${
                        isCurrentUserSender
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-l-xl shadow-lg"
                          : "bg-white text-gray-800 border border-gray-200 rounded-r-xl shadow-md"
                      }`}
                    >
                      {/* Sender Name */}
                      {!isCurrentUserSender && (
                        <p className="text-xs font-bold mb-1 text-indigo-700">
                          {" "}
                          {msg.sender?.username || `User ${msg.senderId}`}{" "}
                        </p>
                      )}
                      {/* Text or File Link */}
                      {isFileMessage ? (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 text-sm font-medium hover:underline ${
                            isCurrentUserSender
                              ? "text-indigo-100 hover:text-white"
                              : "text-indigo-600 hover:text-indigo-800"
                          }`}
                          title={`Download ${msg.fileName || "file"}`}
                        >
                          <FaFileAlt className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-[300px]">
                            {msg.fileName || "Attached File"}
                          </span>
                          {/* {msg.fileSize && <span className="text-xs opacity-70 ml-1">({(msg.fileSize / 1024 / 1024).toFixed(1)} MB)</span>} */}
                        </a>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {" "}
                          {msg.content}{" "}
                        </p>
                      )}
                      {/* Timestamp */}
                      <p
                        className={`text-xs mt-1.5 opacity-80 ${
                          isCurrentUserSender
                            ? "text-indigo-100"
                            : "text-gray-400"
                        } text-right`}
                        title={
                          msg.createdAt
                            ? new Date(msg.createdAt).toLocaleString()
                            : ""
                        }
                      >
                        {" "}
                        {formatMessageTime(msg.createdAt) || "Sending..."}{" "}
                      </p>
                    </div>
                    {/* Current User Avatar */}
                    {isCurrentUserSender && (
                      <div
                        className="flex-shrink-0 self-start relative mt-1"
                        title={currentUser?.username || "You"}
                      >
                        {currentUser?.profilePictureUrl ? (
                          <img
                            src={currentUser.profilePictureUrl}
                            alt={currentUser.username || ""}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) =>
                              (e.target.src = "/default-avatar.png")
                            }
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-base font-semibold text-white shadow border-2 border-white">
                            {" "}
                            {(currentUser?.username || "?")
                              .charAt(0)
                              .toUpperCase()}{" "}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.li>
                </React.Fragment>
              );
            })}
            {/* Typing Indicator */}
            <AnimatePresence>
              {" "}
              {otherTypingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-left pl-12 pr-4 pt-1 pb-2"
                >
                  {" "}
                  <span className="text-xs italic text-gray-600 bg-gray-200 px-2 py-1 rounded-full shadow-sm">
                    {" "}
                    {otherTypingUsers.join(", ")}{" "}
                    {otherTypingUsers.length === 1 ? "is" : "are"} typing...{" "}
                  </span>{" "}
                </motion.div>
              )}{" "}
            </AnimatePresence>
            <div ref={messagesEndRef} style={{ height: "1px" }} />
          </ul>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          {/* Selected File Display */}
          {selectedFile && (
            <div className="mb-2 flex items-center justify-between text-sm p-2 bg-indigo-50 border border-indigo-200 rounded-md">
              {" "}
              <div className="flex items-center gap-2 overflow-hidden">
                {" "}
                <FaPaperclip className="text-indigo-600 flex-shrink-0" />{" "}
                <span
                  className="text-indigo-800 truncate"
                  title={selectedFile.name}
                >
                  {selectedFile.name}
                </span>{" "}
              </div>{" "}
              <button
                onClick={clearSelectedFile}
                className="p-1 text-red-500 hover:text-red-700"
                title="Clear selected file"
              >
                <FaTimesCircle />
              </button>{" "}
            </div>
          )}
          {/* Upload Error Display */}
          {uploadError && (
            <div className="mb-2">
              {" "}
              <ErrorMessage
                message={uploadError}
                onClose={() => setUploadError(null)}
                type="error"
                isDismissible={true}
              />{" "}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3"
          >
            {/* File Upload Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              disabled={!isConnected || isUploading || isSending}
              accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isUploading || isSending}
              className="p-3 text-gray-500 hover:text-indigo-600 disabled:opacity-50 rounded-full hover:bg-gray-100 transition-colors"
            >
              {" "}
              <FaPaperclip className="h-5 w-5" />{" "}
            </button>
            {/* Text Input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onBlur={handleStopTyping}
              placeholder={isConnected ? "Send a message..." : "Connecting..."}
              className="flex-grow px-5 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={
                !isConnected || isUploading || isSending || !!selectedFile
              }
              autoComplete="off"
            />
            {/* Send Button */}
            <button
              type="submit"
              disabled={
                !isConnected ||
                isUploading ||
                isSending ||
                (!selectedFile && !newMessage.trim())
              }
              className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full p-3.5 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {isUploading || isSending ? (
                <FaSpinner className="animate-spin h-5 w-5" />
              ) : (
                <FaPaperPlane className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Member List Modal */}
      <MemberListModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={memberList}
        isLoading={loadingMembers}
        error={membersError}
        projectName={projectDetails?.name}
        onRetry={fetchMembers}
        currentUserId={currentUserId}
      />
    </>
  );
}

export default ChatPage;
