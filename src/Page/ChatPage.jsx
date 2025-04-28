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
} from "react-icons/fa";

import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_TIMEOUT = 10000;

const getRoomName = (projectId) => {
  if (!projectId) return null;
  return `project-${projectId}`;
};

function ChatPage({ currentUser }) {
  const { projectId: projectIdParam } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null); // Error during fetch or socket connection
  const [socketError, setSocketError] = useState(null); // Separate state for transient socket errors
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const currentUserId = currentUser?.id;
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : null;
  const roomName = projectId ? getRoomName(projectId) : null;

  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  // --- Fetch Initial Chat Data (Project Details & History) ---
  const fetchInitialData = useCallback(async () => {
    if (!currentUserId) {
      setError("User not identified.");
      setIsLoading(false);
      return;
    }
    if (!projectId) {
      setError("Project ID missing.");
      setIsLoading(false);
      return;
    }

    console.log(
      `ChatPage: Fetching initial data for project chat ${projectId} by user ${currentUserId}`
    );
    setIsLoading(true);
    setError(null); // Clear previous *fetch* errors
    setSocketError(null); // Clear previous *socket* errors
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Authentication token not found.");
      setIsLoading(false);
      return;
    }

    let fetchedProjectDetails = null;
    let fetchedMessages = [];
    let fetchError = null;

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
              `Failed fetch project details:`,
              err.response?.data?.message || err.message
            );
            return null;
          }),
      ]);

      // --- Corrected Project Details Handling ---
      if (
        projectInfoResponse?.data?.success &&
        projectInfoResponse.data.project
      ) {
        fetchedProjectDetails = {
          id: projectInfoResponse.data.project.id,
          name: projectInfoResponse.data.project.title,
        };
        console.log(
          "ChatPage: Processed project details from response.data.project"
        );
      } else if (
        projectInfoResponse?.data?.success &&
        projectInfoResponse.data.data
      ) {
        fetchedProjectDetails = {
          id: projectInfoResponse.data.data.id,
          name: projectInfoResponse.data.data.title,
        };
        console.log(
          "ChatPage: Processed project details from response.data.data"
        );
      } else {
        console.warn(`ChatPage: Using fallback name for project ${projectId}.`);
        fetchedProjectDetails = { id: projectId, name: `Project ${projectId}` };
      }
      // --- END CORRECTION ---

      if (
        historyResponse.data?.success &&
        Array.isArray(historyResponse.data.data)
      ) {
        fetchedMessages = historyResponse.data.data;
        console.log(`Fetched ${fetchedMessages.length} messages.`);
      } else {
        console.log(`No message history found or non-success.`);
        fetchedMessages = [];
      }
      fetchError = null;
    } catch (err) {
      console.error(`Error fetching initial chat data:`, err);
      let errorMsg = "Could not load chat data.";
      if (err.response) {
        errorMsg = err.response.data?.message || `Error ${err.response.status}`;
        if (err.response.status === 403) {
          errorMsg = "Access Denied: Not authorized for this chat.";
        } else if (err.response.status === 404) {
          errorMsg = "Project chat not found.";
        } else if (err.response.status === 401) {
          errorMsg = "Authentication expired.";
        }
      } else if (err.request) {
        errorMsg = "Network Error.";
      } else if (
        err instanceof TypeError &&
        err.message.includes("undefined")
      ) {
        errorMsg = "Internal Error: Failed processing server response.";
        console.error("Potential API response structure issue.", err);
      } else {
        errorMsg = err.message || "Unknown data fetching error.";
      }
      fetchError = errorMsg;
      // Use previous details only if fetch failed, otherwise use new fallback
      fetchedProjectDetails = fetchedProjectDetails ||
        projectDetails || { id: projectId, name: `Project ${projectId}` };
      fetchedMessages = [];
    } finally {
      console.log("Applying fetched data to state.");
      setProjectDetails(fetchedProjectDetails); // Update project details
      setMessages(fetchedMessages); // Update messages
      setError(fetchError); // Set fetch error state
      setIsLoading(false); // Mark loading as complete
      if (fetchedMessages.length > 0 && !fetchError) {
        scrollToBottom("auto"); // Scroll after initial data load
      }
    }
    // *** REMOVED projectDetails from dependency array ***
  }, [currentUserId, projectId, scrollToBottom]);

  // Effect to run fetchInitialData on mount or if critical IDs change
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- WebSocket Connection and Event Handling ---
  useEffect(() => {
    // --- Conditions to PREVENT connection ---
    // 1. Don't connect if essential IDs/details are missing
    if (!currentUserId || !projectId || !roomName || !projectDetails) {
      console.log(
        "Socket Effect: Skipping connection (missing IDs, roomName, or projectDetails)."
      );
      return;
    }
    // 2. Don't connect if initial data fetch resulted in a critical error (e.g., 403, 404)
    if (error && !isLoading) {
      // Check isLoading to ensure fetch attempt finished
      const isFatalError =
        error.includes("Access Denied") || error.includes("not found");
      if (isFatalError) {
        console.log(
          "Socket Effect: Skipping connection due to fatal fetch error:",
          error
        );
        return;
      }
    }
    // 3. Don't proceed if no authentication token is available
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("Socket Effect: Skipping connection (no auth token).");
      return;
    }
    // 4. Don't reconnect if already connected
    if (socketRef.current && socketRef.current.connected) {
      console.log(
        `Socket Effect: Already connected (ID: ${socketRef.current.id}).`
      );
      // Ensure state is accurate, though it should be already
      if (!isConnected) setIsConnected(true);
      return;
    }
    // --- End Conditions ---

    console.log(`Socket Effect: Attempting to connect to room: ${roomName}`);
    setSocketError(null); // Clear previous socket errors on new connection attempt

    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      query: { userId: currentUserId },
      reconnectionAttempts: 3,
      timeout: SOCKET_TIMEOUT,
    });
    socketRef.current = newSocket;

    // --- Socket Event Listeners ---
    newSocket.on("connect", () => {
      console.log(">>> Socket CONNECTED:", newSocket.id);
      setIsConnected(true);
      setSocketError(null); // Clear errors on successful connection
      newSocket.emit("joinChatRoom", { roomName }, (ack) => {
        // Join room
        if (ack?.success) {
          console.log(`Joined room: ${roomName}`);
        } else {
          console.error(`Failed join room ${roomName}:`, ack?.error);
          setSocketError(`Join Error: ${ack?.error || "Server issue"}`);
        }
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log(">>> Socket DISCONNECTED:", newSocket.id, "Reason:", reason);
      setIsConnected(false);
      if (reason !== "io client disconnect") {
        // Only show error if unexpected
        setSocketError("Disconnected. Attempting to reconnect...");
      }
      if (socketRef.current?.id === newSocket.id) {
        socketRef.current = null;
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error(">>> Socket CONNECTION ERROR:", err.message);
      setIsConnected(false);
      setSocketError(`Connection Failed: ${err.message}. Retrying...`);
      if (socketRef.current?.id === newSocket.id) {
        socketRef.current = null;
      }
    });

    newSocket.on("newMessage", (message) => {
      // Handle incoming messages
      console.log("Socket 'newMessage' received:", message);
      if (message?.content && message.senderId && message.projectId) {
        if (message.projectId?.toString() === projectId?.toString()) {
          const messageWithSender = {
            ...message,
            sender: message.sender || { id: message.senderId },
          };
          setMessages((prev) =>
            prev.some((m) => m.id === messageWithSender.id)
              ? prev
              : [...prev, messageWithSender]
          );
        } else {
          console.log(`Ignoring msg for different project.`);
        }
      } else {
        console.warn("Invalid message structure:", message);
      }
    });

    // --- Cleanup Function ---
    return () => {
      const socketInstanceToClean = socketRef.current;
      if (socketInstanceToClean) {
        console.log(
          "Socket Cleanup: Disconnecting socket instance:",
          socketInstanceToClean.id
        );
        try {
          if (socketInstanceToClean.connected) {
            socketInstanceToClean.emit("leaveChatRoom", { roomName });
          }
          socketInstanceToClean.off("connect");
          socketInstanceToClean.off("disconnect");
          socketInstanceToClean.off("connect_error");
          socketInstanceToClean.off("newMessage");
          socketInstanceToClean.disconnect();
        } catch (cleanupErr) {
          console.error("Error during socket cleanup:", cleanupErr);
        } finally {
          // Crucial: Clear the ref only if cleaning up the specific instance stored in it
          if (
            socketRef.current &&
            socketRef.current.id === socketInstanceToClean.id
          ) {
            socketRef.current = null;
            console.log("Socket Cleanup: socketRef nullified.");
          }
        }
      } else {
        console.log("Socket Cleanup: No active socket instance.");
      }
      setIsConnected(false); // Set disconnected on cleanup
    };
    // *** CORRECTED Dependency Array: Depends only on stable identifiers ***
  }, [currentUserId, projectId, roomName, API_BASE_URL]); // Removed projectDetails, error, isLoading

  // --- Send Message Handler ---
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      const contentToSend = newMessage.trim();
      const currentSocket = socketRef.current;

      if (!contentToSend) return;
      if (!currentSocket?.connected) {
        setSocketError("Not connected. Cannot send.");
        return;
      }
      if (isSending) return;
      if (!projectId || !currentUserId) {
        setError("Internal Error: Missing IDs.");
        return;
      } // Use main error for this

      setIsSending(true);
      setSocketError(null); // Clear transient socket errors on send attempt

      const messageData = {
        senderId: currentUserId,
        projectId,
        content: contentToSend,
        roomName,
      };
      console.log("Emitting 'sendMessage':", messageData);

      currentSocket
        .timeout(SOCKET_TIMEOUT)
        .emit("sendMessage", messageData, (err, ack) => {
          setIsSending(false);
          if (err) {
            console.error("Send timeout/error:", err);
            setSocketError("Error: Message timed out.");
          } else if (ack?.success) {
            console.log("Send ACK success:", ack);
            setNewMessage("");
          } // Clear input on success
          else {
            const errorMsg = `Send failed: ${ack?.error || "Server error"}`;
            console.error(errorMsg);
            setSocketError(errorMsg);
          }
        });
    },
    [newMessage, currentUserId, projectId, roomName, isSending]
  ); // Removed currentUser from deps if not used for optimistic UI

  // --- Render Logic ---

  // Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)] text-center p-4">
        <LoadingSpinner size="xl" message="Loading Chat..." />
      </div>
    );
  }

  // Fatal Error State (Access Denied, Not Found, or Critical Fetch Failure)
  const isFatalError =
    error && !isLoading && (!projectDetails || !messages.length);
  if (isFatalError) {
    const isForbidden = error.includes("Access Denied");
    const isNotFound = error.includes("not found");
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
          <ErrorMessage
            title={
              isForbidden
                ? "Access Denied"
                : isNotFound
                ? "Chat Not Found"
                : "Error Loading Chat"
            }
            message={error} // Display the fetch error
            onRetry={!isForbidden && !isNotFound ? fetchInitialData : undefined}
          />
        </div>
      </div>
    );
  }

  // Main Chat Interface
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto bg-white shadow-xl rounded-b-lg border border-t-0 border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0 sticky top-0 z-20">
        <Link
          to="/messages"
          className="text-gray-500 hover:text-gray-700 mr-3 p-2 rounded-full hover:bg-gray-200"
          aria-label="Back to Chats"
        >
          <FaArrowLeft />
        </Link>
        {projectDetails ? (
          <>
            <div className="flex-shrink-0 mr-3 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
              {" "}
              <FaProjectDiagram className="w-4 h-4 text-indigo-600" />{" "}
            </div>
            <span
              className="font-semibold text-gray-800 truncate text-lg"
              title={projectDetails.name}
            >
              {" "}
              {projectDetails.name || `Project ${projectId}`}{" "}
            </span>
          </>
        ) : (
          <span className="font-semibold text-gray-800 text-lg">Chat</span>
        )}
        <span
          className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
            isConnected
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700 animate-pulse"
          }`}
          title={isConnected ? "Connected" : "Connecting..."}
        >
          <FaWifi className="w-3 h-3" /> {isConnected ? "Online" : "Connecting"}
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto bg-gradient-to-br from-gray-100 to-slate-200 relative custom-scrollbar">
        {/* Display non-fatal SOCKET errors here */}
        {socketError && (
          <div className="p-1 sticky top-0 z-10 mb-2">
            <ErrorMessage
              message={socketError}
              onClose={() => setSocketError(null)}
              isDismissible={true}
              type="warning"
            />
          </div>
        )}
        {/* Empty Chat Message */}
        {!isLoading && messages.length === 0 && !error && (
          <p className="text-center text-gray-500 italic mt-16 text-base">
            {" "}
            No messages yet.{" "}
          </p>
        )}
        {/* List of Messages */}
        <ul className="space-y-4 pb-2">
          {messages.map((msg) => {
            const isCurrentUserSender =
              msg.senderId?.toString() === currentUserId?.toString();
            return (
              <li
                key={msg.id || `msg-${msg.senderId}-${msg.createdAt}`}
                className={`flex ${
                  isCurrentUserSender ? "justify-end" : "justify-start"
                } items-end gap-2 group`}
              >
                {!isCurrentUserSender && (
                  <div
                    className="flex-shrink-0 self-start relative"
                    title={msg.sender?.username || "User"}
                  >
                    {msg.sender?.profilePictureUrl ? (
                      <img
                        src={msg.sender.profilePictureUrl}
                        alt={msg.sender.username || ""}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                        {" "}
                        {(msg.sender?.username || "?")
                          .charAt(0)
                          .toUpperCase()}{" "}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-xl shadow-md break-words ${
                    isCurrentUserSender
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  {!isCurrentUserSender && (
                    <p className="text-xs font-bold mb-1 text-indigo-700">
                      {" "}
                      {msg.sender?.username || `User ${msg.senderId}`}{" "}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1.5 opacity-70 ${
                      isCurrentUserSender ? "text-indigo-200" : "text-gray-500"
                    } text-right`}
                    title={
                      msg.createdAt
                        ? new Date(msg.createdAt).toLocaleString()
                        : ""
                    }
                  >
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "Sending..."}
                  </p>
                </div>
              </li>
            );
          })}
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </ul>
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gray-200 bg-white flex-shrink-0 flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!isConnected || isSending}
          autoComplete="off"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected || isSending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all flex items-center justify-center shadow-sm"
          aria-label="Send message"
          title="Send message"
        >
          {isSending ? (
            <FaSpinner className="animate-spin h-5 w-5" />
          ) : (
            <FaPaperPlane className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}

export default ChatPage;
