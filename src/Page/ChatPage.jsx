// src/Page/ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  FaPaperPlane,
  FaSpinner,
  FaUserCircle,
  FaArrowLeft,
  FaProjectDiagram,
  FaExclamationCircle,
  FaWifi,
  FaLock,
  FaComments,
  FaCalendarAlt,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { format, isToday, isYesterday, parseISO } from "date-fns";

import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_TIMEOUT = 15000;

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

function ChatPage({ currentUser }) {
  const { projectId: projectIdParam } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentUserId = currentUser?.id;
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : null;
  const roomName = getRoomName(projectId);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 150);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom("smooth");
  }, [messages, scrollToBottom]);

  const fetchInitialData = useCallback(async () => {
    if (!currentUserId) {
      setFetchError("User not identified.");
      setIsLoading(false);
      return;
    }
    if (!projectId) {
      setFetchError("Project ID missing.");
      setIsLoading(false);
      return;
    }

    console.log(
      `ChatPage: Fetching initial data for project chat ${projectId}`
    );
    setIsLoading(true);
    setFetchError(null);
    setSocketError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setFetchError("Authentication token not found.");
      setIsLoading(false);
      return;
    }

    let fetchedDetails = null;
    let fetchedMsgs = [];
    let errorMsg = null;

    try {
      const [historyResponse, projectInfoResponse] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/api/messaging/history/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios
          .get(`${API_BASE_URL}/api/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => {
            console.warn(
              `Project details fetch failed:`,
              err.response?.data?.message || err.message
            );
            return null;
          }),
      ]);

      // Process Project Details
      if (projectInfoResponse?.data?.success) {
        const projectData =
          projectInfoResponse.data.data || projectInfoResponse.data.project;
        if (projectData?.id && projectData?.title) {
          fetchedDetails = { id: projectData.id, name: projectData.title };
          console.log(`Processed project details: ID=${fetchedDetails.id}`);
        } else {
          console.warn(
            "Project details structure unexpected.",
            projectInfoResponse.data
          );
          fetchedDetails = { id: projectId, name: `Project ${projectId}` };
        }
      } else {
        console.warn(`Project details fetch unsuccessful.`);
        fetchedDetails = { id: projectId, name: `Project ${projectId}` };
      }

      // Process Messages
      if (
        historyResponse.data?.success &&
        Array.isArray(historyResponse.data.data)
      ) {
        fetchedMsgs = historyResponse.data.data;
        console.log(`Fetched ${fetchedMsgs.length} messages.`);
      } else {
        console.log(`No message history.`);
        fetchedMsgs = [];
      }

      errorMsg = null; // Clear error on success
    } catch (err) {
      console.error(`Error fetching initial chat data:`, err);
      // --- Determine Error Message ---
      if (err.response) {
        errorMsg = err.response.data?.message || `Error ${err.response.status}`;
        if (err.response.status === 403)
          errorMsg = "Access Denied: Not authorized for this chat.";
        else if (err.response.status === 404)
          errorMsg = "Project or chat not found.";
        else if (err.response.status === 401)
          errorMsg = "Authentication session expired.";
      } else if (err.request) {
        errorMsg = "Network Error: Unable to reach server.";
      } else if (
        err instanceof TypeError &&
        err.message.includes("undefined")
      ) {
        errorMsg = "Internal Error: Processing server response failed.";
        console.error("Check API response structure.", err);
      } else {
        errorMsg = err.message || "Unknown error during data load.";
      }
      // --- End Error Message Determination ---

      fetchedDetails = projectDetails || {
        id: projectId,
        name: `Project ${projectId}`,
      }; // Keep existing/fallback details on error
      fetchedMsgs = []; // Clear messages on critical fetch error
    } finally {
      console.log("Applying fetched data to state.");
      setProjectDetails(fetchedDetails);
      setMessages(fetchedMsgs);
      setFetchError(errorMsg); // Set the determined fetch error state
      setIsLoading(false);
      if (fetchedMsgs.length > 0 && !errorMsg) {
        scrollToBottom("auto");
      }
    }
    // Removed projectDetails from deps to avoid re-fetching just because fallback was used
  }, [currentUserId, projectId, scrollToBottom]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    // Guards
    if (!projectDetails || !currentUserId || !projectId || !roomName) return;
    if (
      fetchError &&
      !isLoading &&
      (fetchError.includes("Access Denied") || fetchError.includes("not found"))
    )
      return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    if (socketRef.current) {
      if (isConnected !== socketRef.current.connected)
        setIsConnected(socketRef.current.connected);
      return;
    }

    console.log(`Socket Effect: Attempting connection to room: ${roomName}`);
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
      console.log(">>> Socket CONNECTED:", newSocket.id);
      setIsConnected(true);
      setSocketError(null);
      newSocket.emit("joinChatRoom", { roomName }, (ack) => {
        if (!ack?.success)
          setSocketError(`Join Error: ${ack?.error || "Server issue"}`);
      });
    });
    newSocket.on("disconnect", (reason) => {
      console.log(">>> Socket DISCONNECTED:", newSocket.id, reason);
      setIsConnected(false);
      if (reason !== "io client disconnect") setSocketError("Disconnected...");
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });
    newSocket.on("connect_error", (err) => {
      console.error(">>> Socket CONNECTION ERROR:", err.message);
      setIsConnected(false);
      setSocketError(`Connection Failed.`);
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });
    newSocket.on("newMessage", (message) => {
      if (message?.projectId?.toString() === projectId?.toString()) {
        const msg = {
          ...message,
          sender: message.sender || { id: message.senderId },
        };
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      }
    });
    newSocket.on("userTyping", ({ userId, username }) => {
      if (userId?.toString() === currentUserId?.toString()) return;
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        if (newMap.has(userId)) clearTimeout(newMap.get(userId).timerId);
        const timerId = setTimeout(() => {
          setTypingUsers((curr) => {
            const mapAfter = new Map(curr);
            mapAfter.delete(userId);
            return mapAfter;
          });
        }, 3000);
        newMap.set(userId, { username, timerId });
        return newMap;
      });
    });
    newSocket.on("userStopTyping", ({ userId }) => {
      if (userId?.toString() === currentUserId?.toString()) return;
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        if (newMap.has(userId)) {
          clearTimeout(newMap.get(userId).timerId);
          newMap.delete(userId);
        }
        return newMap;
      });
    });

    return () => {
      const socketInstanceToClean = newSocket;
      console.log("Socket Cleanup:", socketInstanceToClean.id);
      try {
        socketInstanceToClean.off("connect");
        socketInstanceToClean.off("disconnect");
        socketInstanceToClean.off("connect_error");
        socketInstanceToClean.off("newMessage");
        socketInstanceToClean.off("userTyping");
        socketInstanceToClean.off("userStopTyping");
        if (socketInstanceToClean.connected)
          socketInstanceToClean.emit("leaveChatRoom", { roomName });
        socketInstanceToClean.disconnect();
      } catch (cleanupErr) {
        console.error("Socket cleanup error:", cleanupErr);
      } finally {
        if (socketRef.current?.id === socketInstanceToClean.id)
          socketRef.current = null;
      }
    };
  }, [
    currentUserId,
    projectId,
    roomName,
    API_BASE_URL,
    projectDetails,
    fetchError,
    isLoading,
  ]);

  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      const contentToSend = newMessage.trim();
      const currentSocket = socketRef.current;
      if (
        !contentToSend ||
        !currentSocket?.connected ||
        isSending ||
        !projectId ||
        !currentUserId
      )
        return;
      setIsSending(true);
      setSocketError(null);
      const messageData = {
        senderId: currentUserId,
        projectId,
        content: contentToSend,
        roomName,
      };
      currentSocket
        .timeout(SOCKET_TIMEOUT)
        .emit("sendMessage", messageData, (err, ack) => {
          setIsSending(false);
          if (err) setSocketError("Error: Message timed out.");
          else if (ack?.success) setNewMessage("");
          else setSocketError(`Send failed: ${ack?.error || "Server error"}`);
        });
    },
    [newMessage, currentUserId, projectId, roomName, isSending]
  );

  const handleTyping = useCallback(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket?.connected || !roomName) return;
    clearTimeout(typingTimeoutRef.current);
    currentSocket.emit("typing", { roomName });
    typingTimeoutRef.current = setTimeout(() => {
      /* Optional: Emit stopTyping */
    }, 2000);
  }, [roomName]);

  const handleStopTyping = useCallback(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket?.connected || !roomName) return;
    clearTimeout(typingTimeoutRef.current);
    currentSocket.emit("stopTyping", { roomName });
  }, [roomName]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)] p-4">
        <LoadingSpinner size="xl" message="Loading Chat..." />
      </div>
    );
  }

  const isFatalError = fetchError && !isLoading;
  if (isFatalError) {
    const isForbidden = fetchError.includes("Access Denied");
    const isNotFound = fetchError.includes("not found");
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center">
        <Link
          to="/messages"
          className="text-sm text-indigo-600 hover:underline mb-6 inline-flex items-center gap-1.5"
        >
          <FaArrowLeft /> Back to Chats
        </Link>
        <div className="mt-4 p-6 bg-white rounded-lg shadow border border-red-200">
          {isForbidden ? (
            <FaLock className="text-red-500 h-12 w-12 mx-auto mb-4" />
          ) : isNotFound ? (
            <FaExclamationCircle className="text-yellow-500 h-12 w-12 mx-auto mb-4" />
          ) : (
            <FaExclamationCircle className="text-red-500 h-12 w-12 mx-auto mb-4" />
          )}
          {/* --- CORRECTED ErrorMessage props --- */}
          <ErrorMessage
            title={
              isForbidden
                ? "Access Denied"
                : isNotFound
                ? "Chat Not Found"
                : "Error Loading Chat"
            }
            message={fetchError}
            onRetry={!isForbidden && !isNotFound ? fetchInitialData : undefined}
          />
          {/* --- END CORRECTION --- */}
        </div>
      </div>
    );
  }

  const otherTypingUsers = Array.from(typingUsers.values())
    .filter((user) => user.username)
    .map((user) => user.username);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto bg-white shadow-2xl rounded-b-lg border border-t-0 border-gray-200 overflow-hidden">
      {/* Header */}
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
          </>
        ) : (
          <h2 className="font-semibold text-gray-800 text-xl">Chat</h2>
        )}
        <div
          className={`ml-auto text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm ${
            isConnected
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-yellow-100 text-yellow-800 border border-yellow-200 animate-pulse"
          }`}
          title={isConnected ? "Connected" : "Connecting..."}
        >
          <FaWifi className="w-3 h-3" /> {isConnected ? "Online" : "Connecting"}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative custom-scrollbar">
        {socketError && (
          <div className="p-1 sticky top-1 z-10 mb-2">
            <ErrorMessage
              message={socketError}
              onClose={() => setSocketError(null)}
              isDismissible={true}
              type="warning"
            />
          </div>
        )}
        {messages.length === 0 && !fetchError && (
          <div className="text-center py-20 px-6 text-gray-500">
            <FaComments className="mx-auto h-16 w-16 text-gray-300 mb-5" />
            <p className="text-lg italic">No messages yet.</p>
            <p className="text-base mt-1">Start the conversation!</p>
          </div>
        )}
        <ul className="space-y-1">
          {messages.map((msg, index) => {
            const isCurrentUserSender =
              msg.senderId?.toString() === currentUserId?.toString();
            const prevMessage = messages[index - 1];
            const showDateSeparator =
              !prevMessage ||
              formatDateSeparator(msg.createdAt) !==
                formatDateSeparator(prevMessage.createdAt);
            return (
              <React.Fragment
                key={msg.id || `msg-${msg.senderId}-${msg.createdAt}`}
              >
                {showDateSeparator && formatDateSeparator(msg.createdAt) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center items-center my-6"
                  >
                    {" "}
                    <span className="px-3 py-1 bg-white text-gray-500 text-xs font-semibold rounded-full shadow border border-gray-200 flex items-center gap-1.5">
                      {" "}
                      <FaCalendarAlt className="w-3 h-3" />{" "}
                      {formatDateSeparator(msg.createdAt)}{" "}
                    </span>{" "}
                  </motion.div>
                )}
                <motion.li
                  initial={{ opacity: 0, y: isCurrentUserSender ? 10 : -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-end gap-2.5 my-2 ${
                    isCurrentUserSender ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isCurrentUserSender && (
                    <div
                      className="flex-shrink-0 self-start relative mt-1"
                      title={msg.sender?.username || "User"}
                    >
                      {" "}
                      {msg.sender?.profilePictureUrl ? (
                        <img
                          src={msg.sender.profilePictureUrl}
                          alt={msg.sender.username || ""}
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-base font-semibold text-white shadow border-2 border-white">
                          {(msg.sender?.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}{" "}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] md:max-w-[65%] px-4 py-2.5 rounded-t-xl ${
                      isCurrentUserSender
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-l-xl shadow-lg"
                        : "bg-white text-gray-800 border border-gray-200 rounded-r-xl shadow-md"
                    }`}
                  >
                    {!isCurrentUserSender && (
                      <p className="text-xs font-bold mb-1 text-indigo-700">
                        {" "}
                        {msg.sender?.username || `User ${msg.senderId}`}{" "}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
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
                  {isCurrentUserSender && (
                    <div
                      className="flex-shrink-0 self-start relative mt-1"
                      title={currentUser?.username || "You"}
                    >
                      {" "}
                      {currentUser?.profilePictureUrl ? (
                        <img
                          src={currentUser.profilePictureUrl}
                          alt={currentUser.username || ""}
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-base font-semibold text-white shadow border-2 border-white">
                          {(currentUser?.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}{" "}
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
      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 bg-white flex-shrink-0 flex items-center gap-3"
      >
        {" "}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onBlur={handleStopTyping}
          placeholder={isConnected ? "Send a message..." : "Connecting..."}
          className="flex-grow px-5 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-sm"
          disabled={!isConnected || isSending}
          autoComplete="off"
          aria-label="Message input"
        />{" "}
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected || isSending}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full p-3.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center shadow-md hover:shadow-lg transform active:scale-95"
          aria-label="Send message"
          title="Send message"
        >
          {" "}
          {isSending ? (
            <FaSpinner className="animate-spin h-5 w-5" />
          ) : (
            <FaPaperPlane className="h-5 w-5" />
          )}{" "}
        </button>{" "}
      </form>
    </div>
  );
}

export default ChatPage;
