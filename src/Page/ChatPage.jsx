import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { io, Socket } from "socket.io-client";
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

// Adjust import paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import MemberListModal from "../Component/chat/MemberListModal";

// --- Constants ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_TIMEOUT = 15000; // Timeout for socket operations (ms)
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const TYPING_TIMEOUT_DURATION = 3000; // ms

// --- Type Definitions (for clarity, even in JS) ---
/**
 * @typedef {object} User
 * @property {string|number} id
 * @property {string} username
 * @property {string} [profilePictureUrl]
 */

/**
 * @typedef {object} MessageSender
 * @property {string|number} id
 * @property {string} username
 * @property {string} [profilePictureUrl]
 */

/**
 * @typedef {object} Message
 * @property {string|number} id
 * @property {string|number} senderId
 * @property {MessageSender} sender
 * @property {string|number} projectId
 * @property {string} content
 * @property {string} createdAt
 * @property {'text' | 'file'} messageType
 * @property {string} [fileUrl]
 * @property {string} [fileName]
 * @property {string} [mimeType]
 * @property {number} [fileSize]
 */

/**
 * @typedef {object} ProjectDetails
 * @property {string|number} id
 * @property {string} name
 */

/**
 * @typedef {object} Member
 * @property {string|number} id
 * @property {string} username
 * @property {string} email
 * @property {string} [profilePictureUrl]
 * @property {string} role
 */

// --- Helper Functions ---
const getRoomName = (projectId) => (projectId ? `project-${projectId}` : null);

const formatMessageTime = (isoString) => {
  if (!isoString) return "";
  try {
    return format(parseISO(isoString), "p"); // 'p' is short time format like 1:30 PM
  } catch (e) {
    console.error("Date format error (formatMessageTime):", e);
    return "Invalid Date";
  }
};

const formatDateSeparator = (isoString) => {
  if (!isoString) return null;
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy"); // Example: March 15, 2024
  } catch (e) {
    console.error("Date format error (formatDateSeparator):", e);
    return null;
  }
};

const getAuthToken = () => localStorage.getItem("authToken");

const createAxiosInstance = (token) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};

// --- Custom Hooks ---

/**
 * Custom Hook for fetching initial chat data (project details and message history).
 * @param {string|number|null} projectId
 * @param {User|null} currentUser
 * @param {function} scrollToBottom
 * @returns {{
 *  projectDetails: ProjectDetails | null,
 *  initialMessages: Message[],
 *  isLoading: boolean,
 *  fetchError: string | null,
 *  canAttemptConnect: boolean,
 *  fetchInitialData: () => Promise<void>
 * }}
 */
function useChatData(projectId, currentUser, scrollToBottom) {
  const [projectDetails, setProjectDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [canAttemptConnect, setCanAttemptConnect] = useState(false);
  const currentUserId = currentUser?.id;

  const fetchInitialData = useCallback(async () => {
    console.log(
      `HOOK useChatData: fetchInitialData called for project ${projectId}`
    );
    setIsLoading(true);
    setFetchError(null);
    setProjectDetails(null);
    setInitialMessages([]);
    setCanAttemptConnect(false); // Reset connection flag

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
      console.log(
        `HOOK useChatData: Fetching history and details for project ${projectId}`
      );
      // Fetch history and details concurrently
      const [historyResponse, projectInfoResponse] = await Promise.allSettled([
        apiClient.get(`/api/messaging/history/project/${projectId}`),
        apiClient.get(`/api/projects/${projectId}`),
      ]);

      // Process Project Details
      if (projectInfoResponse.status === "fulfilled") {
        const projectData =
          projectInfoResponse.value.data?.data ||
          projectInfoResponse.value.data?.project;
        if (projectData?.id && projectData?.title) {
          fetchedDetails = { id: projectData.id, name: projectData.title };
          allowConnection = true; // Got details, allow connection attempt
        } else {
          console.warn(
            "HOOK useChatData: Project details structure unexpected:",
            projectInfoResponse.value.data
          );
          fetchedDetails = { id: projectId, name: `Project ${projectId}` }; // Fallback name
          // Do not necessarily set allowConnection to true here, depend on history
        }
      } else {
        console.warn(
          "HOOK useChatData: Failed to fetch project details:",
          projectInfoResponse.reason?.message
        );
        // Set a fallback name, but don't assume connection is allowed yet
        fetchedDetails = { id: projectId, name: `Project ${projectId}` };
      }

      // Process Message History
      if (historyResponse.status === "fulfilled") {
        if (
          historyResponse.value.data?.success &&
          Array.isArray(historyResponse.value.data.data)
        ) {
          fetchedMsgs = historyResponse.value.data.data;
          allowConnection = true; // Successfully got history, allow connection attempt
          console.log(
            `HOOK useChatData: Message history success. ${fetchedMsgs.length} messages.`
          );
        } else {
          console.warn(
            "HOOK useChatData: Message history fetch non-success:",
            historyResponse.value.data?.message
          );
          fetchedMsgs = [];
          // If project details failed AND history failed, we have a problem
          if (!allowConnection) {
            errorMsg =
              historyResponse.value.data?.message ||
              "Failed to load message history.";
          }
        }
      } else {
        console.error(
          `HOOK useChatData: Error fetching message history:`,
          historyResponse.reason
        );
        const err = historyResponse.reason;
        allowConnection = false; // History fetch failed, disallow connection
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
          errorMsg =
            err.message || "An unknown error occurred fetching history.";
        }
        fetchedMsgs = [];
      }
    } catch (err) {
      // Catch errors not related to specific promises (e.g., network issues before requests)
      console.error(
        `HOOK useChatData: Unexpected error during initial data fetch:`,
        err
      );
      allowConnection = false;
      errorMsg = err.message || "An unexpected error occurred during setup.";
      fetchedDetails = fetchedDetails || {
        id: projectId,
        name: `Project ${projectId}`,
      };
      fetchedMsgs = [];
    } finally {
      console.log(
        `HOOK useChatData: Applying state - Error: ${errorMsg}, Allow Connection: ${allowConnection}`
      );
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

  // Effect to run initial data fetch on mount or when projectId/currentUser changes
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]); // fetchInitialData is memoized by useCallback

  return {
    projectDetails,
    initialMessages,
    isLoading,
    fetchError,
    canAttemptConnect,
    fetchInitialData,
  };
}

/**
 * Custom Hook for managing WebSocket connection and events.
 * @param {boolean} canAttemptConnect - Flag indicating if connection should be tried.
 * @param {string|number|null} currentUserId
 * @param {string|number|null} projectId
 * @param {string|null} roomName
 * @param {function} onNewMessageCallback - Called when a new message arrives.
 * @returns {{
 *  socket: Socket | null,
 *  isConnected: boolean,
 *  socketError: string | null,
 *  typingUsers: Map<string|number, {username: string, timerId: number}>,
 *  sendMessage: (messageData: Omit<Message, 'id' | 'createdAt' | 'sender'>) => Promise<boolean>,
 *  sendTyping: () => void,
 *  sendStopTyping: () => void
 * }}
 */
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
    console.log(
      `HOOK useChatSocket: Effect Triggered. canAttemptConnect=${canAttemptConnect}, roomName=${roomName}, currentUserId=${currentUserId}, socketConnected=${socketRef.current?.connected}`
    );

    if (!canAttemptConnect || !currentUserId || !projectId || !roomName) {
      console.log(
        "HOOK useChatSocket: Skipping connection (pre-conditions not met)."
      );
      if (socketRef.current) {
        console.log(
          "HOOK useChatSocket: Disconnecting existing socket due to unmet pre-conditions."
        );
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.log("HOOK useChatSocket: Skipping connection (no token).");
      setSocketError("Authentication token missing for socket connection.");
      return;
    }

    // Avoid redundant connection attempts if already connected
    if (socketRef.current?.connected) {
      console.log(
        `HOOK useChatSocket: Already connected (ID: ${socketRef.current.id}).`
      );
      if (!isConnected) setIsConnected(true); // Sync state if needed
      return;
    }

    // Clean up any previous non-connected socket instance before creating a new one
    if (socketRef.current) {
      console.log(
        "HOOK useChatSocket: Cleaning up stale socket instance before reconnecting."
      );
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log(
      `HOOK useChatSocket: *** ATTEMPTING CONNECTION *** to ${API_BASE_URL} for room: ${roomName}`
    );
    setSocketError(null); // Clear previous errors on new attempt

    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"], // Prioritize WebSocket
      query: { userId: currentUserId },
      reconnectionAttempts: 3,
      timeout: SOCKET_TIMEOUT,
    });
    socketRef.current = newSocket;

    // --- Socket Event Handlers ---
    newSocket.on("connect", () => {
      console.log(`>>> Socket CONNECTED: ${newSocket.id}`);
      setIsConnected(true);
      setSocketError(null);
      newSocket.emit("joinChatRoom", { roomName }, (ack) => {
        if (ack?.success) {
          console.log(`Socket successfully joined room: ${roomName}`);
        } else {
          console.error(`Socket failed to join room ${roomName}:`, ack?.error);
          setSocketError(`Join Error: ${ack?.error || "Server rejected join"}`);
          // Consider disconnecting if join fails critically? Maybe not, allow retries?
        }
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log(
        `>>> Socket DISCONNECTED: ${newSocket.id}, Reason: ${reason}`
      );
      setIsConnected(false);
      // Only show persistent error if disconnect wasn't manual client-side
      if (reason !== "io client disconnect") {
        setSocketError("Connection lost. Attempting to reconnect...");
      }
      setTypingUsers(new Map()); // Clear typing users on disconnect
      // Nullify ref ONLY if it's the same socket instance that disconnected
      if (socketRef.current?.id === newSocket.id) {
        socketRef.current = null;
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error(`>>> Socket CONNECT_ERROR: ${err.message}`, err.data);
      setIsConnected(false);
      setSocketError(
        `Connection Failed: ${err.message}. Check network or server status.`
      );
      // Nullify ref ONLY if it's the same socket instance that failed
      if (socketRef.current?.id === newSocket.id) {
        socketRef.current = null;
      }
    });

    newSocket.on("newMessage", (message) => {
      console.log("<<< Received newMessage event:", message);
      if (
        !message ||
        typeof message !== "object" ||
        !message.projectId ||
        !message.id
      ) {
        console.warn("Received invalid message structure:", message);
        return;
      }
      // Ensure message is for the current project
      if (message.projectId?.toString() === projectId?.toString()) {
        // Ensure sender object is present, create fallback if needed
        const msgWithSender = {
          ...message,
          sender: message.sender || {
            id: message.senderId,
            username: "Unknown User",
          },
        };
        onNewMessageCallback(msgWithSender);
      } else {
        console.log(
          `Ignoring message for different project: ${message.projectId}`
        );
      }
    });

    newSocket.on("userTyping", ({ userId, username }) => {
      if (!userId || userId.toString() === currentUserId?.toString()) return; // Ignore self
      setTypingUsers((prevMap) => {
        const newMap = new Map(prevMap);
        // Clear existing timer for this user if they type again
        if (newMap.has(userId)) {
          clearTimeout(newMap.get(userId).timerId);
        }
        // Set a new timer to remove the user after a delay
        const timerId = setTimeout(() => {
          setTypingUsers((currentMap) => {
            const updatedMap = new Map(currentMap);
            if (updatedMap.has(userId)) {
              console.log(`Typing timeout for ${username} (${userId})`);
              updatedMap.delete(userId);
            }
            return updatedMap;
          });
        }, TYPING_TIMEOUT_DURATION);

        newMap.set(userId, { username: username || `User ${userId}`, timerId });
        console.log(
          `User typing: ${username} (${userId}). Current typers: ${Array.from(
            newMap.keys()
          )}`
        );
        return newMap;
      });
    });

    newSocket.on("userStopTyping", ({ userId }) => {
      if (!userId || userId.toString() === currentUserId?.toString()) return; // Ignore self
      setTypingUsers((prevMap) => {
        if (prevMap.has(userId)) {
          console.log(
            `User stopped typing: ${prevMap.get(userId)?.username} (${userId})`
          );
          clearTimeout(prevMap.get(userId).timerId); // Clear the timeout
          const newMap = new Map(prevMap);
          newMap.delete(userId);
          console.log(`Remaining typers: ${Array.from(newMap.keys())}`);
          return newMap;
        }
        return prevMap; // No change if user wasn't in the map
      });
    });

    // --- Cleanup Function ---
    return () => {
      const socketInstanceToClean = newSocket; // Capture the instance
      console.log(
        `HOOK useChatSocket: Cleanup Effect running for socket: ${socketInstanceToClean.id}`
      );
      // Remove all listeners specific to this instance
      socketInstanceToClean.off("connect");
      socketInstanceToClean.off("disconnect");
      socketInstanceToClean.off("connect_error");
      socketInstanceToClean.off("newMessage");
      socketInstanceToClean.off("userTyping");
      socketInstanceToClean.off("userStopTyping");

      // Clear any pending typing timeout on unmount
      clearTimeout(typingTimeoutRef.current);

      // If connected, attempt to leave the room cleanly
      if (socketInstanceToClean.connected) {
        console.log(
          `HOOK useChatSocket: Emitting leaveChatRoom for ${roomName} on cleanup`
        );
        socketInstanceToClean.emit("leaveChatRoom", { roomName });
      }

      // Disconnect the socket
      console.log(
        `HOOK useChatSocket: Disconnecting socket instance ${socketInstanceToClean.id}`
      );
      socketInstanceToClean.disconnect();

      // Crucially, check if the *current* socketRef points to the instance we just cleaned up
      if (socketRef.current?.id === socketInstanceToClean.id) {
        console.log("HOOK useChatSocket: Cleanup nullifying socketRef.");
        socketRef.current = null;
        setIsConnected(false); // Ensure connection state is false after cleanup
      } else {
        console.log(
          "HOOK useChatSocket: Cleanup skipped nullifying socketRef (already different or null)."
        );
      }
    };
  }, [
    canAttemptConnect,
    currentUserId,
    projectId,
    roomName,
    onNewMessageCallback,
  ]); // Dependencies for the effect

  // --- Exposed Emitter Functions ---
  const sendMessage = useCallback((messageData) => {
    return new Promise((resolve, reject) => {
      const currentSocket = socketRef.current;
      if (!currentSocket?.connected) {
        console.error("sendMessage: Socket not connected.");
        setSocketError("Cannot send message: Not connected.");
        return reject(new Error("Socket not connected"));
      }
      console.log("Emitting message:", messageData);
      currentSocket
        .timeout(SOCKET_TIMEOUT)
        .emit("sendMessage", messageData, (err, ack) => {
          if (err) {
            console.error("Socket emit sendMessage error (timeout):", err);
            setSocketError("Error: Message send timed out.");
            reject(err);
          } else if (ack?.success) {
            console.log("Message emitted successfully via socket.");
            setSocketError(null); // Clear error on success
            resolve(true);
          } else {
            console.error("Socket emit sendMessage NACK:", ack?.error);
            setSocketError(`Send failed: ${ack?.error || "Server error"}`);
            reject(new Error(ack?.error || "Server rejected message"));
          }
        });
    });
  }, []); // No dependencies needed as it uses the ref

  const sendTyping = useCallback(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket?.connected || !roomName) return;
    // Debounce or throttle might be overkill here, simple emit is fine
    currentSocket.emit("typing", { roomName });
    // We don't manage the timeout here, rely on the receiving end's logic
  }, [roomName]); // Depends on roomName

  const sendStopTyping = useCallback(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket?.connected || !roomName) return;
    currentSocket.emit("stopTyping", { roomName });
  }, [roomName]); // Depends on roomName

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

/**
 * Custom Hook for handling file selection and upload.
 * @param {string|number|null} projectId
 * @returns {{
 *  selectedFile: File | null,
 *  isUploading: boolean,
 *  uploadError: string | null,
 *  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void,
 *  triggerFileInput: () => void,
 *  clearSelectedFile: () => void,
 *  uploadFile: () => Promise<object | null> // Returns file data on success, null on failure
 * }}
 */
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
      setUploadError(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
      return;
    }

    console.log(
      "File selected:",
      file.name,
      `(${(file.size / 1024 / 1024).toFixed(2)} MB)`
    );
    setSelectedFile(file);
    setUploadError(null); // Clear previous errors
  }, []);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the hidden input
    }
    console.log("Cleared selected file.");
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const uploadFile = useCallback(async () => {
    if (!selectedFile || !projectId) {
      console.error("uploadFile: No file selected or projectId missing.");
      setUploadError("Cannot upload: File or Project ID missing.");
      return null;
    }

    const token = getAuthToken();
    if (!token) {
      setUploadError("Authentication required for upload.");
      return null;
    }

    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      console.log(
        `HOOK useFileUpload: Uploading ${selectedFile.name} for project ${projectId}`
      );
      const apiClient = createAxiosInstance(token); // Use instance with token
      const response = await apiClient.post(
        `/api/messaging/upload/project/${projectId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data?.success && response.data.data) {
        console.log("HOOK useFileUpload: Upload Success:", response.data.data);
        // Don't clear file here, let the caller do it after successful message emission
        return response.data.data; // Return { fileUrl, fileName, mimeType, fileSize }
      } else {
        throw new Error(
          response.data?.message || "File upload failed on server."
        );
      }
    } catch (err) {
      console.error("HOOK useFileUpload: Upload Axios Error:", err);
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
      return null; // Indicate failure
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
    fileInputRef, // Expose ref for direct binding
  };
}

/**
 * Custom Hook for fetching project members.
 * @param {string|number|null} projectId
 * @returns {{
 *   memberList: Member[],
 *   loadingMembers: boolean,
 *   membersError: string | null,
 *   fetchMembers: () => Promise<void>
 * }}
 */
function useProjectMembers(projectId) {
  const [memberList, setMemberList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState(null);

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;
    console.log(
      `HOOK useProjectMembers: Fetching members for project ${projectId}`
    );
    setLoadingMembers(true);
    setMembersError(null);
    const token = getAuthToken();
    if (!token) {
      setMembersError("Authentication token not found.");
      setLoadingMembers(false);
      return;
    }

    try {
      const apiClient = createAxiosInstance(token);
      const res = await apiClient.get(`/api/projects/${projectId}/members`);

      if (res.data?.success && Array.isArray(res.data.data)) {
        setMemberList(res.data.data);
        console.log(
          `HOOK useProjectMembers: Successfully fetched ${res.data.data.length} members.`
        );
      } else {
        throw new Error(
          res.data?.message || "Failed to process member list from server."
        );
      }
    } catch (err) {
      console.error("HOOK useProjectMembers: Fetch members error:", err);
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
      setMemberList([]); // Clear list on error
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId]);

  // Note: This hook doesn't fetch automatically on mount.
  // It's designed to be triggered manually (e.g., when opening the modal).

  return { memberList, loadingMembers, membersError, fetchMembers };
}

// --- ChatPage Component ---
function ChatPage({ currentUser }) {
  const { projectId: projectIdParam } = useParams();
  const navigate = useNavigate();

  // --- Derived Values ---
  const projectId = useMemo(
    () => (projectIdParam ? parseInt(projectIdParam, 10) : null),
    [projectIdParam]
  );
  const currentUserId = currentUser?.id;
  const roomName = useMemo(() => getRoomName(projectId), [projectId]);

  // --- State ---
  const [messages, setMessages] = useState([]);
  const [newMessageInput, setNewMessageInput] = useState(""); // Input field state
  const [isSendingText, setIsSendingText] = useState(false); // Specifically for text messages
  const [showMembersModal, setShowMembersModal] = useState(false);

  // --- Refs ---
  const messagesEndRef = useRef(null);

  // --- Callbacks ---
  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 150); // Delay allows layout adjustments
  }, []);

  // --- Custom Hook Integrations ---

  // 1. Fetch Initial Chat Data
  const {
    projectDetails,
    initialMessages,
    isLoading: isLoadingData,
    fetchError,
    canAttemptConnect,
    fetchInitialData, // Expose refetch if needed later
  } = useChatData(projectId, currentUser, scrollToBottom);

  // 2. Manage File Upload
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

  // 3. Manage WebSocket Connection & Events
  const handleNewMessage = useCallback(
    (newMessage) => {
      setMessages((prevMessages) => {
        // Prevent duplicates based on message ID
        if (prevMessages.some((m) => m.id === newMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, newMessage];
      });
      scrollToBottom("smooth");
    },
    [scrollToBottom]
  );

  const {
    isConnected,
    socketError: socketConnectionError, // Rename to avoid conflict with fetchError
    typingUsers,
    sendMessage: emitSendMessageViaSocket,
    sendTyping: emitTypingViaSocket,
    sendStopTyping: emitStopTypingViaSocket,
  } = useChatSocket(
    canAttemptConnect,
    currentUserId,
    projectId,
    roomName,
    handleNewMessage
  );

  // 4. Fetch Project Members (triggered manually)
  const { memberList, loadingMembers, membersError, fetchMembers } =
    useProjectMembers(projectId);

  // --- Effects ---

  // Effect to populate messages state once initial data is loaded
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Effect to scroll down when messages array changes (after initial load)
  useEffect(() => {
    if (
      messages.length > initialMessages.length ||
      (messages.length > 0 && initialMessages.length === 0)
    ) {
      scrollToBottom("smooth");
    }
  }, [messages, initialMessages.length, scrollToBottom]);

  // Combine sending states for disabling UI elements
  const isSendingOrUploading = isSendingText || isUploading;

  // --- Event Handlers ---

  const handleOpenMembersModal = useCallback(() => {
    setShowMembersModal(true);
    // Fetch members only if the list is empty and not already loading/error
    if (memberList.length === 0 && !loadingMembers && !membersError) {
      fetchMembers();
    }
  }, [memberList.length, loadingMembers, membersError, fetchMembers]);

  const handleSendMessage = useCallback(
    async (event) => {
      event?.preventDefault(); // Allow calling without event (e.g., retry button)

      if (!isConnected || !projectId || !currentUserId) {
        console.error(
          "handleSendMessage: Preconditions not met (connection/IDs)."
        );
        // Error state is handled by useChatSocket hook, maybe add a transient UI error?
        return;
      }
      if (isSendingOrUploading) {
        console.warn("handleSendMessage: Already sending/uploading.");
        return;
      }

      // --- File Upload Path ---
      if (selectedFile) {
        // isUploading state is managed by useFileUpload hook
        const uploadedFileData = await uploadFile(); // Returns file data or null

        if (uploadedFileData) {
          // Construct the message payload for the socket
          const fileMessageData = {
            senderId: currentUserId,
            projectId,
            roomName,
            messageType: "file",
            fileUrl: uploadedFileData.fileUrl,
            fileName: uploadedFileData.fileName,
            mimeType: uploadedFileData.mimeType,
            fileSize: uploadedFileData.fileSize,
            content: `File: ${uploadedFileData.fileName}`, // Fallback content
          };
          try {
            await emitSendMessageViaSocket(fileMessageData);
            console.log("File message emitted successfully.");
            clearSelectedFile(); // Clear file input *after* successful emission
          } catch (error) {
            console.error("Failed to emit file message via socket:", error);
            // Socket error state is already set by the hook
            // Optionally set a more specific error here if needed
          }
        } else {
          console.error(
            "handleSendMessage: File upload failed, message not sent."
          );
          // uploadError state is already set by useFileUpload hook
        }
      }
      // --- Text Message Path ---
      else {
        const contentToSend = newMessageInput.trim();
        if (!contentToSend) return; // Don't send empty messages

        setIsSendingText(true);
        const textMessageData = {
          senderId: currentUserId,
          projectId,
          content: contentToSend,
          roomName,
          messageType: "text",
        };

        try {
          await emitSendMessageViaSocket(textMessageData);
          console.log("Text message emitted successfully.");
          setNewMessageInput(""); // Clear input on success
          emitStopTypingViaSocket(); // Ensure typing indicator stops
        } catch (error) {
          console.error("Failed to emit text message via socket:", error);
          // Socket error state is already set by the hook
        } finally {
          setIsSendingText(false);
        }
      }
    },
    [
      isConnected,
      projectId,
      currentUserId,
      isSendingOrUploading,
      selectedFile,
      newMessageInput,
      uploadFile,
      emitSendMessageViaSocket,
      clearSelectedFile,
      roomName,
      emitStopTypingViaSocket, // Added dependency
    ]
  );

  // Optimised typing handlers - avoid sending if file is selected
  const handleTyping = useCallback(() => {
    if (!selectedFile) {
      emitTypingViaSocket();
    }
  }, [selectedFile, emitTypingViaSocket]);

  const handleStopTyping = useCallback(() => {
    if (!selectedFile) {
      emitStopTypingViaSocket();
    }
  }, [selectedFile, emitStopTypingViaSocket]);

  // --- Render Logic ---

  // Loading State
  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-5rem)] p-4">
        <LoadingSpinner size="xl" message="Loading Chat..." />
      </div>
    );
  }

  // Fatal Error State (Access Denied, Not Found, Auth Errors)
  const isFatalError =
    fetchError &&
    (fetchError.includes("Access Denied") ||
      fetchError.includes("Not Found") ||
      fetchError.includes("Invalid Project ID") ||
      fetchError.includes("Authentication Error") ||
      fetchError.includes("Authentication token")); // Covers token issues from hooks too

  if (isFatalError) {
    const isAuthError = fetchError.includes("Authentication");
    const isForbidden = fetchError.includes("Access Denied");
    const isNotFound =
      fetchError.includes("Not Found") ||
      fetchError.includes("Invalid Project ID");

    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center">
        <Link
          to={isAuthError ? "/login" : "/messages"}
          className="text-sm text-indigo-600 hover:underline mb-6 inline-flex items-center gap-1.5"
        >
          <FaArrowLeft /> {isAuthError ? "Back to Login" : "Back to Messages"}
        </Link>
        <div className="mt-4 p-6 bg-white rounded-lg shadow border border-red-200">
          {isForbidden || isAuthError ? (
            <FaLock className="text-red-500 h-12 w-12 mx-auto mb-4" />
          ) : (
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
            // No retry for fatal errors like these
          />
        </div>
      </div>
    );
  }

  // Calculate derived UI data within the render function or using useMemo if complex
  const otherTypingUsernames = Array.from(typingUsers.values())
    .map((user) => user.username)
    .filter((username) => !!username);

  // --- Main Chat UI ---
  return (
    <>
      {/* Main container with consistent height and styling */}
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto bg-white shadow-xl rounded-b-lg border border-t-0 border-gray-200 overflow-hidden">
        {/* Chat Header */}
        <header className="flex items-center p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 sticky top-0 z-20 shadow-sm">
          <Link
            to="/messages"
            className="text-gray-500 hover:text-indigo-600 mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors duration-150 ease-in-out"
            aria-label="Back to Messages"
          >
            <FaArrowLeft size="1.1em" />
          </Link>
          {projectDetails ? (
            <>
              <div className="flex-shrink-0 mr-3 h-10 w-10 bg-indigo-100 border border-indigo-200 rounded-full flex items-center justify-center shadow-inner">
                <FaProjectDiagram className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-grow min-w-0">
                {" "}
                {/* Added min-w-0 for proper truncation */}
                <h2
                  className="font-semibold text-gray-800 truncate text-lg sm:text-xl"
                  title={projectDetails.name}
                >
                  {projectDetails.name || `Project ${projectId}`}
                </h2>
                <p className="text-xs text-gray-500">Group Chat</p>
              </div>
              <button
                onClick={handleOpenMembersModal}
                className="ml-auto mr-3 flex-shrink-0 p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 transition-colors duration-150 ease-in-out"
                title="View Project Members"
                aria-label="View Project Members"
              >
                <FaUsers size="1.2em" />
              </button>
            </>
          ) : (
            // Should generally not be seen if loading handles properly, but good fallback
            <h2 className="font-semibold text-gray-800 text-lg sm:text-xl">
              Loading Chat...
            </h2>
          )}
          {/* Connection Status Indicator */}
          <div
            className={`flex-shrink-0 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm transition-colors duration-300 ${
              isConnected
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse"
            }`}
            title={
              isConnected
                ? "Connected to real-time server"
                : "Connecting to real-time server..."
            }
          >
            <FaWifi
              className={`w-3 h-3 ${isConnected ? "" : "animate-pulse"}`}
            />
            {isConnected ? "Online" : "Connecting"}
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative custom-scrollbar">
          {/* Display Non-Fatal Fetch/Socket Errors */}
          {fetchError &&
            !isFatalError && ( // Show non-fatal fetch errors here
              <ErrorMessage
                message={fetchError}
                onClose={() => {
                  /* Maybe allow manual dismiss? If so, need state */
                }}
                isDismissible={false} // Make non-dismissible unless fetchInitialData is exposed for retry
                type="warning"
                className="mb-3"
              />
            )}
          {socketConnectionError && (
            <ErrorMessage
              message={socketConnectionError}
              onClose={() => {
                /* Maybe allow manual dismiss? */
              }}
              isDismissible={false} // Generally let the socket handle retries
              type="warning"
              className="mb-3"
            />
          )}

          {/* Empty Chat Display */}
          {!isLoadingData && messages.length === 0 && !fetchError && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6 text-gray-500">
              <FaComments className="h-16 w-16 text-gray-300 mb-5" />
              <p className="text-lg font-medium">It's quiet in here...</p>
              <p className="text-sm mt-1">
                Be the first to send a message or share a file!
              </p>
            </div>
          )}

          {/* Messages List */}
          <ul className="space-y-1 pb-2">
            {" "}
            {/* Added padding-bottom */}
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
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-center items-center my-5" // Increased margin
                    >
                      <span className="px-3 py-1 bg-white text-gray-500 text-xs font-semibold rounded-full shadow-sm border border-gray-200 flex items-center gap-1.5">
                        <FaCalendarAlt className="w-3 h-3" />
                        {currentDateSeparator}
                      </span>
                    </motion.div>
                  )}

                  {/* Message Bubble */}
                  <motion.li
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex items-end gap-2.5 my-1.5 ${
                      isCurrentUserSender ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Sender Avatar (only for others) */}
                    {!isCurrentUserSender && (
                      <div
                        className="flex-shrink-0 self-start relative mt-1 group"
                        title={msg.sender?.username || `User ${msg.senderId}`}
                      >
                        {msg.sender?.profilePictureUrl ? (
                          <img
                            src={msg.sender.profilePictureUrl}
                            alt={`${msg.sender.username || "User"}'s avatar`}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-sm sm:text-base font-semibold text-white shadow border-2 border-white uppercase">
                            {(msg.sender?.username || "?").charAt(0)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Content Box */}
                    <div
                      className={`max-w-[75%] sm:max-w-[70%] md:max-w-[65%] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-t-xl text-sm sm:text-base ${
                        isCurrentUserSender
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-l-xl shadow-md"
                          : "bg-white text-gray-800 border border-gray-200 rounded-r-xl shadow-sm"
                      }`}
                    >
                      {/* Sender Name (only for others) */}
                      {!isCurrentUserSender && (
                        <p className="text-xs font-bold mb-1 text-indigo-700">
                          {msg.sender?.username || `User ${msg.senderId}`}
                        </p>
                      )}

                      {/* Message Body (Text or File Link) */}
                      {isFileMessage ? (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 font-medium break-all ${
                            // Added break-all for long names
                            isCurrentUserSender
                              ? "text-indigo-100 hover:text-white hover:underline"
                              : "text-indigo-600 hover:text-indigo-800 hover:underline"
                          }`}
                          title={`Download ${msg.fileName || "file"}`}
                        >
                          <FaFileAlt className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-[180px] xs:max-w-[250px] sm:max-w-[300px]">
                            {msg.fileName || "Attached File"}
                          </span>
                          {/* Optional: File size display */}
                          {/* {msg.fileSize && <span className="text-xs opacity-70 ml-1">({(msg.fileSize / 1024 / 1024).toFixed(1)} MB)</span>} */}
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
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
                            : "Sending..."
                        }
                      >
                        {formatMessageTime(msg.createdAt) || "..."}
                      </p>
                    </div>

                    {/* Current User Avatar (only for self) */}
                    {isCurrentUserSender && (
                      <div
                        className="flex-shrink-0 self-start relative mt-1 group"
                        title={currentUser?.username || "You"}
                      >
                        {currentUser?.profilePictureUrl ? (
                          <img
                            src={currentUser.profilePictureUrl}
                            alt={`${currentUser.username || "Your"}'s avatar`}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white shadow"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm sm:text-base font-semibold text-white shadow border-2 border-white uppercase">
                            {(currentUser?.username || "?").charAt(0)}
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
              {otherTypingUsernames.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-left pl-12 pr-4 pt-1 pb-2" // Adjusted padding
                >
                  <span className="text-xs italic text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full shadow-sm border border-gray-200">
                    {otherTypingUsernames.join(", ")}
                    {otherTypingUsernames.length === 1 ? " is" : " are"}{" "}
                    typing...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Scroll Anchor */}
            <div ref={messagesEndRef} style={{ height: "1px" }} />
          </ul>
        </main>

        {/* Input Area */}
        <footer className="p-3 sm:p-4 border-t border-gray-200 bg-white flex-shrink-0">
          {/* Selected File Preview & Upload Error */}
          {(selectedFile || uploadError) && (
            <div className="mb-2 px-2 py-1.5">
              {selectedFile && (
                <div className="flex items-center justify-between text-sm p-2 bg-indigo-50 border border-indigo-200 rounded-md">
                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    {" "}
                    {/* Added min-w-0 */}
                    <FaPaperclip className="text-indigo-600 flex-shrink-0 h-4 w-4" />
                    <span
                      className="text-indigo-800 truncate font-medium"
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={clearSelectedFile}
                    disabled={isUploading} // Disable clear while uploading
                    className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Clear selected file"
                    aria-label="Clear selected file"
                  >
                    <FaTimesCircle />
                  </button>
                </div>
              )}
              {uploadError && (
                <div className="mt-1">
                  {" "}
                  {/* Add margin if both are shown (unlikely but possible) */}
                  <ErrorMessage
                    message={uploadError}
                    onClose={() => {
                      /* Upload errors are typically cleared on next action */
                    }}
                    type="error"
                    isDismissible={false}
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 sm:gap-3"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              disabled={!isConnected || isSendingOrUploading}
              accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip,.rar,.mp3,.wav" // Expanded accepted types slightly
              aria-hidden="true"
            />
            {/* File Upload Button */}
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={!isConnected || isSendingOrUploading}
              className="flex-shrink-0 p-2.5 sm:p-3 text-gray-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-gray-100 transition-colors duration-150"
              title="Attach file"
              aria-label="Attach file"
            >
              <FaPaperclip className="h-5 w-5" />
            </button>

            {/* Text Input Field */}
            <input
              type="text"
              value={newMessageInput}
              onChange={(e) => {
                setNewMessageInput(e.target.value);
                handleTyping(); // Notify typing on change
              }}
              onBlur={handleStopTyping} // Notify stop typing on blur
              placeholder={
                !isConnected
                  ? "Connecting..."
                  : isUploading
                  ? "Uploading file..."
                  : selectedFile
                  ? "File ready to send"
                  : "Type a message..."
              }
              className="flex-grow px-4 py-2.5 sm:px-5 sm:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-150"
              disabled={!isConnected || isSendingOrUploading || !!selectedFile} // Disable if disconnected, sending, uploading, or file selected
              autoComplete="off"
              aria-label="Message input"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={
                !isConnected ||
                isSendingOrUploading ||
                (!selectedFile && !newMessageInput.trim()) // Disabled if nothing to send
              }
              className="flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full p-3 sm:p-3.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-150 flex items-center justify-center shadow-md hover:shadow-lg active:shadow-inner"
              aria-label={
                isSendingOrUploading ? "Sending" : "Send message or file"
              }
            >
              {isSendingOrUploading ? (
                <FaSpinner className="animate-spin h-5 w-5" />
              ) : (
                <FaPaperPlane className="h-5 w-5" />
              )}
            </button>
          </form>
        </footer>
      </div>

      {/* Member List Modal */}
      <MemberListModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        members={memberList}
        isLoading={loadingMembers}
        error={membersError}
        projectName={projectDetails?.name}
        onRetry={fetchMembers} // Allow retrying member fetch from modal
        currentUserId={currentUserId}
      />
    </>
  );
}

export default ChatPage;
