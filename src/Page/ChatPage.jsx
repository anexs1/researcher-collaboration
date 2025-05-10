// src/Page/ChatPage.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { io } from "socket.io-client";
import {
  FaPaperPlane,
  FaSpinner,
  FaArrowLeft,
  FaProjectDiagram,
  FaExclamationCircle,
  FaWifi,
  FaLock,
  FaComments,
  FaCalendarAlt,
  FaUsers,
  FaPaperclip,
  FaTimesCircle,
  FaFileAlt,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { format, isToday, isYesterday, parseISO } from "date-fns";

// Components
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import MemberListModal from "../Component/chat/MemberListModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_TIMEOUT = 15000; // ms for socket emit with ack
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const TYPING_TIMEOUT_DURATION = 3000; // ms

const getRoomName = (projectId) => (projectId ? `project-${projectId}` : null);
const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  try {
    return format(parseISO(isoString), "p");
  } catch (e) {
    return "Invalid Date";
  }
};
const formatDateSeparator = (isoString) => {
  if (!isoString) return null;
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  } catch (e) {
    return null;
  }
};
const getAuthToken = () => localStorage.getItem("authToken");
const createAxiosInstance = (token) =>
  axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

// --- useChatData Hook ---
function useChatData(projectId, currentUser, scrollToBottom) {
  const [projectDetails, setProjectDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [canAttemptConnect, setCanAttemptConnect] = useState(false);
  const currentUserId = currentUser?.id;

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setProjectDetails(null);
    setInitialMessages([]);
    setCanAttemptConnect(false);
    if (!currentUserId || !projectId) {
      setFetchError(
        !currentUserId ? "Authentication Error" : "Invalid Project ID"
      );
      setIsLoading(false);
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setIsLoading(false);
      return;
    }
    const apiClient = createAxiosInstance(token);
    let fetchedDetails = null;
    let fetchedMsgs = [];
    let errorMsg = null;
    let allowConnection = false;

    try {
      const [historyResponse, projectInfoResponse] = await Promise.allSettled([
        apiClient.get(`/api/messaging/history/project/${projectId}`),
        apiClient.get(`/api/projects/${projectId}`),
      ]);

      if (
        projectInfoResponse.status === "fulfilled" &&
        projectInfoResponse.value.data?.success
      ) {
        const projectData = projectInfoResponse.value.data.data;
        if (projectData?.id && projectData?.title) {
          fetchedDetails = { id: projectData.id, name: projectData.title };
          allowConnection = true;
        } else {
          fetchedDetails = { id: projectId, name: `Project ${projectId}` };
        }
      } else {
        fetchedDetails = { id: projectId, name: `Project ${projectId}` };
      }

      if (
        historyResponse.status === "fulfilled" &&
        historyResponse.value.data?.success
      ) {
        if (Array.isArray(historyResponse.value.data.data)) {
          fetchedMsgs = historyResponse.value.data.data;
          allowConnection = true;
        } else {
          fetchedMsgs = [];
          if (!allowConnection)
            errorMsg =
              historyResponse.value.data?.message || "Invalid history data.";
        }
      } else if (historyResponse.status === "rejected") {
        const err = historyResponse.reason;
        allowConnection = false;
        if (err.response) {
          errorMsg =
            err.response.data?.message || `Error ${err.response.status}`;
          if (err.response.status === 403)
            errorMsg = "Access Denied to this project chat.";
          else if (err.response.status === 404)
            errorMsg = "Project chat not found.";
          else if (err.response.status === 401)
            errorMsg = "Authentication expired. Please log in.";
        } else if (err.request) {
          errorMsg = "Network Error: Could not reach server for history.";
        } else {
          errorMsg = err.message || "Unknown error fetching history.";
        }
        fetchedMsgs = [];
      }
    } catch (err) {
      allowConnection = false;
      errorMsg = err.message || "Unexpected error during setup.";
      fetchedDetails = fetchedDetails || {
        id: projectId,
        name: `Project ${projectId}`,
      };
      fetchedMsgs = [];
    } finally {
      setProjectDetails(fetchedDetails);
      setInitialMessages(fetchedMsgs);
      setFetchError(errorMsg);
      setCanAttemptConnect(allowConnection);
      setIsLoading(false);
      if (fetchedMsgs.length > 0 && allowConnection && !errorMsg) {
        scrollToBottom("auto");
      }
    }
  }, [currentUserId, projectId, scrollToBottom]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  return {
    projectDetails,
    initialMessages,
    isLoading,
    fetchError,
    canAttemptConnect,
    fetchInitialData,
  };
}

// --- useChatSocket Hook ---
function useChatSocket(
  canAttemptConnect,
  currentUserId,
  projectId,
  roomName,
  onNewMessageCallback
) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!canAttemptConnect || !currentUserId || !projectId || !roomName) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setSocketError("Auth token missing for socket.");
      return;
    }
    if (socketRef.current?.connected && isConnected) return;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

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
      setIsConnected(true);
      setSocketError(null);
      newSocket.emit("joinChatRoom", { roomName }, (ack) => {
        if (!ack?.success)
          setSocketError(`Join Error: ${ack?.error || "Server rejected join"}`);
      });
    });
    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason !== "io client disconnect") setSocketError("Connection lost.");
      setTypingUsers(new Map());
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });
    newSocket.on("connect_error", (err) => {
      setIsConnected(false);
      setSocketError(`Connection Failed: ${err.message}.`);
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });
    newSocket.on("newMessage", (message) => {
      if (!message || !message.projectId || !message.id) return;
      if (message.projectId?.toString() === projectId?.toString()) {
        const msgWithSender = {
          ...message,
          sender: message.sender || {
            id: message.senderId,
            username: "Unknown User",
          },
        };
        onNewMessageCallback(msgWithSender);
      }
    });
    newSocket.on("userTyping", ({ userId, username }) => {
      if (!userId || userId.toString() === currentUserId?.toString()) return;
      setTypingUsers((prevMap) => {
        const newMap = new Map(prevMap);
        if (newMap.has(userId)) clearTimeout(newMap.get(userId).timerId);
        const timerId = setTimeout(() => {
          setTypingUsers((currentMap) => {
            const updatedMap = new Map(currentMap);
            if (updatedMap.has(userId)) updatedMap.delete(userId);
            return updatedMap;
          });
        }, TYPING_TIMEOUT_DURATION);
        newMap.set(userId, { username: username || `User ${userId}`, timerId });
        return newMap;
      });
    });
    newSocket.on("userStopTyping", ({ userId }) => {
      if (!userId || userId.toString() === currentUserId?.toString()) return;
      setTypingUsers((prevMap) => {
        if (prevMap.has(userId)) {
          clearTimeout(prevMap.get(userId).timerId);
          const newMap = new Map(prevMap);
          newMap.delete(userId);
          return newMap;
        }
        return prevMap;
      });
    });

    return () => {
      const s = newSocket;
      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      s.off("newMessage");
      s.off("userTyping");
      s.off("userStopTyping");
      clearTimeout(typingTimeoutRef.current);
      if (s.connected) s.emit("leaveChatRoom", { roomName });
      s.disconnect();
      if (socketRef.current?.id === s.id) {
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [
    canAttemptConnect,
    currentUserId,
    projectId,
    roomName,
    onNewMessageCallback,
  ]);

  const sendMessage = useCallback((messageData) => {
    return new Promise((resolve, reject) => {
      const currentSocket = socketRef.current; // Use the ref's current value
      if (!currentSocket?.connected) {
        const errMsg = "Cannot send message: Not connected.";
        setSocketError(errMsg);
        return reject(new Error(errMsg));
      }
      currentSocket
        .timeout(SOCKET_TIMEOUT)
        .emit("sendMessage", messageData, (err, ack) => {
          if (err) {
            const errMsg = "Error: Message send timed out.";
            setSocketError(errMsg);
            reject(new Error(errMsg));
          } else if (ack?.success) {
            setSocketError(null);
            resolve(ack);
          } // Resolve with ack for potential use
          else {
            const errMsg = `Send failed: ${ack?.error || "Server error"}`;
            setSocketError(errMsg);
            reject(new Error(errMsg));
          }
        });
    });
  }, []); // No dependencies that change frequently, setSocketError is stable

  const sendTyping = useCallback(() => {
    const s = socketRef.current;
    if (!s?.connected || !roomName) return;
    s.emit("typing", { roomName });
  }, [roomName]);
  const sendStopTyping = useCallback(() => {
    const s = socketRef.current;
    if (!s?.connected || !roomName) return;
    s.emit("stopTyping", { roomName });
  }, [roomName]);

  // Expose the socket instance itself (socketRef.current)
  return {
    socket: socketRef.current,
    isConnected,
    socketError,
    typingUsers,
    sendMessage,
    sendTyping,
    sendStopTyping,
  };
}

// --- useFileUpload Hook ---
function useFileUpload(projectId) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File size exceeds ${MAX_FILE_SIZE_MB}MB.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
  }, []);
  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const uploadFile = useCallback(async () => {
    if (!selectedFile || !projectId) {
      setUploadError("No file selected or project ID missing.");
      return null;
    }
    const token = getAuthToken();
    if (!token) {
      setUploadError("Authentication required.");
      return null;
    }
    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const apiClient = createAxiosInstance(token);
      const response = await apiClient.post(
        `/api/messaging/upload/project/${projectId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data?.message || "File upload failed on server."
        );
      }
    } catch (err) {
      let errorMsg = "Failed to upload file.";
      if (err instanceof AxiosError && err.response) {
        errorMsg =
          err.response.data?.message ||
          `Upload failed (${err.response.status})`;
      } else if (err instanceof AxiosError && err.request) {
        errorMsg = "Network error during upload.";
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setUploadError(errorMsg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, projectId]);
  return {
    selectedFile,
    isUploading,
    uploadError,
    handleFileSelect,
    triggerFileInput,
    clearSelectedFile,
    uploadFile,
    fileInputRef,
  };
}

// --- useProjectMembers Hook ---
function useProjectMembers(projectId) {
  const [memberList, setMemberList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    setLoadingMembers(true);
    setMembersError(null);
    const token = getAuthToken();
    if (!token) {
      setMembersError("Auth token missing.");
      setLoadingMembers(false);
      return;
    }
    try {
      const apiClient = createAxiosInstance(token);
      const res = await apiClient.get(`/api/projects/${projectId}/members`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setMemberList(res.data.data);
      } else {
        throw new Error(res.data?.message || "Failed to process member list.");
      }
    } catch (err) {
      let msg = "Could not load members.";
      if (err instanceof AxiosError && err.response) {
        msg =
          err.response.data?.message ||
          `Error loading members (${err.response.status})`;
      } else if (err instanceof AxiosError && err.request) {
        msg = "Network Error fetching members.";
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setMembersError(msg);
      setMemberList([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId]);
  return { memberList, loadingMembers, membersError, fetchMembers };
}

// --- Main ChatPage Component ---
function ChatPage({ currentUser }) {
  const { projectId: projectIdParam } = useParams();
  const navigate = useNavigate();

  const projectId = useMemo(
    () => (projectIdParam ? parseInt(projectIdParam, 10) : null),
    [projectIdParam]
  );
  const currentUserId = currentUser?.id;
  const roomName = useMemo(() => getRoomName(projectId), [projectId]);

  const [messages, setMessages] = useState([]);
  const [newMessageInput, setNewMessageInput] = useState("");
  const [isSendingText, setIsSendingText] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 150);
  }, []);

  const {
    projectDetails,
    initialMessages,
    isLoading: isLoadingData,
    fetchError,
    canAttemptConnect,
  } = useChatData(projectId, currentUser, scrollToBottom);
  const {
    selectedFile,
    isUploading,
    uploadError,
    handleFileSelect,
    triggerFileInput,
    clearSelectedFile,
    uploadFile,
    fileInputRef,
  } = useFileUpload(projectId);

  const handleNewMessageFromSocket = useCallback((newMessage) => {
    setMessages((prevMessages) => {
      if (
        prevMessages.some(
          (m) => m.id === newMessage.id && m.createdAt === newMessage.createdAt
        )
      ) {
        return prevMessages;
      }
      // Add and sort to maintain chronological order, useful if messages arrive slightly out of order
      const updatedMessages = [...prevMessages, newMessage];
      updatedMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      return updatedMessages;
    });
    // scrollToBottom("smooth"); // Let the messages.length effect handle this
  }, []);

  const {
    socket, // This IS socketRef.current from the hook
    isConnected,
    socketError: socketConnectionError,
    typingUsers,
    sendMessage: emitSendMessageViaSocket,
    sendTyping: emitTypingViaSocket,
    sendStopTyping: emitStopTypingViaSocket,
  } = useChatSocket(
    canAttemptConnect,
    currentUserId,
    projectId,
    roomName,
    handleNewMessageFromSocket
  );

  const { memberList, loadingMembers, membersError, fetchMembers } =
    useProjectMembers(projectId);

  useEffect(() => {
    setMessages(
      initialMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
    );
  }, [initialMessages]);
  useEffect(() => {
    if (messages.length > 0) scrollToBottom("auto");
  }, [messages.length, scrollToBottom]);

  const isProcessingSomething = isSendingText || isUploading;

  const handleOpenMembersModal = useCallback(() => {
    setShowMembersModal(true);
    if (memberList.length === 0 && !loadingMembers && !membersError)
      fetchMembers();
  }, [memberList.length, loadingMembers, membersError, fetchMembers]);

  const handleSendMessage = useCallback(
    async (event) => {
      event?.preventDefault();
      // Use isConnected state primarily, but also check direct socket connection for immediate emit attempts
      if (
        !isConnected ||
        !socket?.connected ||
        !projectId ||
        !currentUserId ||
        isProcessingSomething
      ) {
        if (!isConnected || !socket?.connected)
          console.warn("SendMessage: Socket not connected. Aborting.");
        return;
      }

      if (selectedFile) {
        const uploadedFileData = await uploadFile();
        if (uploadedFileData) {
          const fileMessageData = {
            senderId: currentUserId,
            projectId,
            roomName,
            messageType: "file",
            fileUrl: uploadedFileData.fileUrl,
            fileName: uploadedFileData.fileName,
            mimeType: uploadedFileData.mimeType,
            fileSize: uploadedFileData.fileSize,
            content: `File: ${uploadedFileData.fileName}`,
          };
          try {
            // Double check connection again before critical emit
            if (!socket?.connected && !isConnected) {
              console.error(
                "Socket disconnected just before emitting file message."
              );
              // Potentially set a specific error state for the user here
              return;
            }
            const ack = await emitSendMessageViaSocket(fileMessageData); // emitSendMessageViaSocket now returns the ack
            console.log("File message socket emit successful, ack:", ack);
            clearSelectedFile();
          } catch (socketEmitError) {
            console.error(
              "Failed to emit file message via socket (error from promise):",
              socketEmitError
            );
            // Error state is set within useChatSocket's sendMessage
          }
        } else {
          console.error(
            "HTTP File upload failed, not emitting socket message. Upload error:",
            uploadError
          );
          // uploadError state from useFileUpload will be displayed
        }
      } else {
        const contentToSend = newMessageInput.trim();
        if (!contentToSend) return;
        setIsSendingText(true);
        const textMessageData = {
          senderId: currentUserId,
          projectId,
          content: contentToSend,
          roomName,
          messageType: "text",
        };
        try {
          if (!socket?.connected && !isConnected) {
            console.error(
              "Socket disconnected just before emitting text message."
            );
            setIsSendingText(false);
            return;
          }
          await emitSendMessageViaSocket(textMessageData);
          setNewMessageInput("");
          emitStopTypingViaSocket();
        } catch (socketEmitError) {
          console.error(
            "Failed to emit text message via socket (error from promise):",
            socketEmitError
          );
        } finally {
          setIsSendingText(false);
        }
      }
    },
    [
      isConnected,
      socket,
      projectId,
      currentUserId,
      isProcessingSomething,
      selectedFile,
      newMessageInput,
      uploadFile,
      emitSendMessageViaSocket,
      clearSelectedFile,
      roomName,
      emitStopTypingViaSocket,
      uploadError,
    ]
  );

  const handleTyping = useCallback(() => {
    if (!selectedFile) emitTypingViaSocket();
  }, [selectedFile, emitTypingViaSocket]);
  const handleStopTyping = useCallback(() => {
    if (!selectedFile) emitStopTypingViaSocket();
  }, [selectedFile, emitStopTypingViaSocket]);

  // Render logic
  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-5rem)] p-4">
        {" "}
        <LoadingSpinner size="xl" message="Loading Chat..." />{" "}
      </div>
    );
  }
  const isFatalError =
    fetchError &&
    (fetchError.includes("Access Denied") ||
      fetchError.includes("Not Found") ||
      fetchError.includes("Invalid Project ID") ||
      fetchError.includes("Authentication Error") ||
      fetchError.includes("Authentication token"));
  if (isFatalError) {
    const isAuthError = fetchError.includes("Authentication");
    const isForbidden = fetchError.includes("Access Denied");
    const isNotFound =
      fetchError.includes("Not Found") ||
      fetchError.includes("Invalid Project ID");
    return (
      <div className="p-4 max-w-2xl mx-auto text-center">
        {" "}
        <Link
          to={isAuthError ? "/login" : "/messages"}
          className="text-sm text-indigo-600 hover:underline mb-6 inline-flex items-center gap-1.5"
        >
          {" "}
          <FaArrowLeft /> {isAuthError
            ? "Back to Login"
            : "Back to Messages"}{" "}
        </Link>{" "}
        <div className="mt-4 p-6 bg-white rounded-lg shadow border border-red-200">
          {" "}
          {isForbidden || isAuthError ? (
            <FaLock className="text-red-500 h-12 w-12 mx-auto mb-4" />
          ) : (
            <FaExclamationCircle className="text-red-500 h-12 w-12 mx-auto mb-4" />
          )}{" "}
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
          />{" "}
        </div>{" "}
      </div>
    );
  }

  const otherTypingUsernames = Array.from(typingUsers.values())
    .map((user) => user.username)
    .filter((username) => !!username);

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto bg-white shadow-lg rounded-b-lg border border-t-0 border-gray-200 overflow-hidden">
        <header className="flex items-center p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 sticky top-0 z-20 shadow-sm">
          <Link
            to="/messages"
            className="text-gray-500 hover:text-indigo-600 mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Back to Messages"
          >
            {" "}
            <FaArrowLeft size="1.1em" />{" "}
          </Link>
          {projectDetails ? (
            <>
              {" "}
              <div className="flex-shrink-0 mr-3 h-10 w-10 bg-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-center shadow-inner">
                {" "}
                <FaProjectDiagram className="w-5 h-5 text-indigo-600" />{" "}
              </div>{" "}
              <div className="flex-grow min-w-0">
                {" "}
                <h2
                  className="font-semibold text-gray-800 truncate text-lg"
                  title={projectDetails.name}
                >
                  {" "}
                  {projectDetails.name || `Project ${projectId}`}{" "}
                </h2>{" "}
                <p className="text-xs text-gray-500">Group Chat</p>{" "}
              </div>{" "}
              <button
                onClick={handleOpenMembersModal}
                className="ml-auto mr-3 flex-shrink-0 p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 transition-colors"
                title="View Project Members"
                aria-label="View Project Members"
              >
                {" "}
                <FaUsers size="1.2em" />{" "}
              </button>{" "}
            </>
          ) : (
            <h2 className="font-semibold text-gray-800 text-lg">
              {" "}
              Loading Chat...{" "}
            </h2>
          )}
          <div
            className={`flex-shrink-0 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm transition-colors ${
              isConnected
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse"
            }`}
            title={isConnected ? "Connected" : "Connecting..."}
          >
            {" "}
            <FaWifi
              className={`w-3 h-3 ${isConnected ? "" : "animate-pulse"}`}
            />{" "}
            {isConnected ? "Online" : "Connecting"}{" "}
          </div>
        </header>

        <main className="flex-grow p-4 overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative custom-scrollbar">
          {fetchError && !isFatalError && (
            <ErrorMessage
              message={fetchError}
              isDismissible={false}
              type="warning"
              className="mb-3"
            />
          )}
          {socketConnectionError && (
            <ErrorMessage
              message={socketConnectionError}
              isDismissible={true}
              type="error"
              className="mb-3 sticky top-2 z-10 shadow-lg"
              onClose={() => setSocketError(null)}
            />
          )}{" "}
          {/* Made dismissible and more prominent */}
          {!isLoadingData && messages.length === 0 && !fetchError && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6 text-gray-500">
              {" "}
              <FaComments className="h-16 w-16 text-gray-300 mb-5" />{" "}
              <p className="text-lg font-medium">It's quiet in here...</p>{" "}
              <p className="text-sm mt-1">
                Be the first to send a message or share a file!
              </p>{" "}
            </div>
          )}
          <ul className="space-y-1 pb-2">
            {" "}
            {messages.map((msg, index) => {
              const isCurrentUserSender =
                msg.senderId?.toString() === currentUserId?.toString();
              const prevMessage = messages[index - 1];
              const currentDateSeparator = formatDateSeparator(msg.createdAt);
              const prevDateSeparator = prevMessage
                ? formatDateSeparator(prevMessage.createdAt)
                : null;
              const showDateSeparator =
                currentDateSeparator &&
                currentDateSeparator !== prevDateSeparator;
              const isFileMessage = msg.messageType === "file";
              return (
                <React.Fragment key={msg.id || `msg-fallback-${index}`}>
                  {" "}
                  {showDateSeparator && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-center items-center my-5"
                    >
                      {" "}
                      <span className="px-3 py-1 bg-white text-gray-500 text-xs font-semibold rounded-full shadow-sm border border-gray-200 flex items-center gap-1.5">
                        {" "}
                        <FaCalendarAlt className="w-3 h-3" />{" "}
                        {currentDateSeparator}{" "}
                      </span>{" "}
                    </motion.div>
                  )}{" "}
                  <motion.li
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex items-end gap-2.5 my-1.5 ${
                      isCurrentUserSender ? "justify-end" : "justify-start"
                    }`}
                  >
                    {" "}
                    {!isCurrentUserSender && (
                      <div
                        className="flex-shrink-0 self-start relative mt-1 group"
                        title={msg.sender?.username || `User ${msg.senderId}`}
                      >
                        {" "}
                        {msg.sender?.profilePictureUrl ? (
                          <img
                            src={msg.sender.profilePictureUrl}
                            alt={`${msg.sender.username || "User"}'s avatar`}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-sm font-semibold text-white shadow border-2 border-white uppercase">
                            {(msg.sender?.username || "?").charAt(0)}
                          </div>
                        )}{" "}
                      </div>
                    )}{" "}
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-xl text-sm ${
                        isCurrentUserSender
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-l-xl shadow-md"
                          : "bg-white text-gray-800 border border-gray-200 rounded-r-xl shadow-sm"
                      }`}
                    >
                      {" "}
                      {!isCurrentUserSender && (
                        <p className="text-xs font-bold mb-1 text-indigo-700">
                          {msg.sender?.username || `User ${msg.senderId}`}
                        </p>
                      )}{" "}
                      {isFileMessage ? (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 font-medium break-all ${
                            isCurrentUserSender
                              ? "text-indigo-100 hover:text-white hover:underline"
                              : "text-indigo-600 hover:text-indigo-800 hover:underline"
                          }`}
                          title={`Download ${msg.fileName || "file"}`}
                        >
                          {" "}
                          <FaFileAlt className="w-4 h-4 flex-shrink-0" />{" "}
                          <span className="truncate max-w-[180px]">
                            {msg.fileName || "Attached File"}
                          </span>{" "}
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}{" "}
                      <p
                        className={`text-xs mt-1.5 opacity-80 ${
                          isCurrentUserSender
                            ? "text-indigo-100"
                            : "text-gray-400"
                        } text-right`}
                        title={
                          msg.createdAt
                            ? new Date(msg.createdAt).toLocaleString()
                            : "Sending..."
                        }
                      >
                        {" "}
                        {formatMessageTime(msg.createdAt) || "..."}{" "}
                      </p>{" "}
                    </div>{" "}
                    {isCurrentUserSender && (
                      <div
                        className="flex-shrink-0 self-start relative mt-1 group"
                        title={currentUser?.username || "You"}
                      >
                        {" "}
                        {currentUser?.profilePictureUrl ? (
                          <img
                            src={currentUser.profilePictureUrl}
                            alt={`${currentUser.username || "Your"}'s avatar`}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-semibold text-white shadow border-2 border-white uppercase">
                            {(currentUser?.username || "?").charAt(0)}
                          </div>
                        )}{" "}
                      </div>
                    )}{" "}
                  </motion.li>{" "}
                </React.Fragment>
              );
            })}{" "}
            <AnimatePresence>
              {" "}
              {otherTypingUsernames.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-left pl-12 pr-4 pt-1 pb-2"
                >
                  {" "}
                  <span className="text-xs italic text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full shadow-sm border border-gray-200">
                    {" "}
                    {otherTypingUsernames.join(", ")}{" "}
                    {otherTypingUsernames.length === 1 ? " is" : " are"}{" "}
                    typing...{" "}
                  </span>{" "}
                </motion.div>
              )}{" "}
            </AnimatePresence>{" "}
            <div ref={messagesEndRef} style={{ height: "1px" }} />{" "}
          </ul>
        </main>

        <footer className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
          {(selectedFile || uploadError) && (
            <div className="mb-2 px-2 py-1.5">
              {" "}
              {selectedFile && (
                <div className="flex items-center justify-between text-sm p-2 bg-indigo-50 border border-indigo-200 rounded-md">
                  {" "}
                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    {" "}
                    <FaPaperclip className="text-indigo-600 flex-shrink-0 h-4 w-4" />{" "}
                    <span
                      className="text-indigo-800 truncate font-medium"
                      title={selectedFile.name}
                    >
                      {" "}
                      {selectedFile.name}{" "}
                    </span>{" "}
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {" "}
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB){" "}
                    </span>{" "}
                  </div>{" "}
                  <button
                    onClick={clearSelectedFile}
                    disabled={isUploading}
                    className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Clear selected file"
                    aria-label="Clear selected file"
                  >
                    {" "}
                    <FaTimesCircle />{" "}
                  </button>{" "}
                </div>
              )}{" "}
              {uploadError && (
                <div className="mt-1">
                  {" "}
                  <ErrorMessage
                    message={uploadError}
                    type="error"
                    isDismissible={true}
                    onClose={() => setUploadError(null)}
                    className="text-xs"
                  />{" "}
                </div>
              )}{" "}
            </div>
          )}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              disabled={!isConnected || isProcessingSomething}
              accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip,.rar,.mp3,.wav"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={!isConnected || isProcessingSomething}
              className="flex-shrink-0 p-2.5 text-gray-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors"
              title="Attach file"
              aria-label="Attach file"
            >
              {" "}
              <FaPaperclip className="h-5 w-5" />{" "}
            </button>
            <input
              type="text"
              value={newMessageInput}
              onChange={(e) => {
                setNewMessageInput(e.target.value);
                handleTyping();
              }}
              onBlur={handleStopTyping}
              placeholder={
                !isConnected
                  ? "Connecting..."
                  : isUploading
                  ? "Uploading file..."
                  : selectedFile
                  ? "File ready to send"
                  : "Type a message..."
              }
              className="flex-grow px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              disabled={!isConnected || isProcessingSomething || !!selectedFile}
              autoComplete="off"
              aria-label="Message input"
            />
            <button
              type="submit"
              disabled={
                !isConnected ||
                isProcessingSomething ||
                (!selectedFile && !newMessageInput.trim())
              }
              className="flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center shadow hover:shadow-lg active:shadow-inner"
              aria-label={
                isProcessingSomething ? "Sending" : "Send message or file"
              }
            >
              {" "}
              {isProcessingSomething ? (
                <FaSpinner className="animate-spin h-5 w-5" />
              ) : (
                <FaPaperPlane className="h-5 w-5" />
              )}{" "}
            </button>
          </form>
        </footer>
      </div>
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
