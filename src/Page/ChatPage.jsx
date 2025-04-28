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
  FaComments, // Added for empty state
} from "react-icons/fa";

// Adjust import paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
// import { useAuth } from '../context/AuthContext'; // Example if using context

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_TIMEOUT = 15000; // Increased timeout slightly

// Helper to generate a consistent room name
const getRoomName = (projectId) => {
  if (!projectId) return null;
  return `project-${projectId}`;
};

// --- ChatPage Component ---
function ChatPage({ currentUser }) {
  const { projectId: projectIdParam } = useParams();
  const navigate = useNavigate();

  // --- State Definitions ---
  const [messages, setMessages] = useState([]); // Holds the array of message objects
  const [newMessage, setNewMessage] = useState(""); // Input field content
  const [projectDetails, setProjectDetails] = useState(null); // { id, name } fetched from API
  const [isLoading, setIsLoading] = useState(true); // True while fetching initial data
  const [isSending, setIsSending] = useState(false); // True while emitting a message via socket
  const [fetchError, setFetchError] = useState(null); // Stores errors from initial data fetching (can be fatal)
  const [socketError, setSocketError] = useState(null); // Stores transient socket errors (connection, send failure)
  const [isConnected, setIsConnected] = useState(false); // Tracks live socket connection status

  // --- Refs ---
  const socketRef = useRef(null); // Holds the current socket instance
  const messagesEndRef = useRef(null); // Target element for auto-scrolling

  // --- Derived Values ---
  const currentUserId = currentUser?.id;
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : null;
  const roomName = projectId ? getRoomName(projectId) : null;

  // --- Auto-scroll Logic ---
  const scrollToBottom = useCallback((behavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 150); // Small delay for render
  }, []);

  // Scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  // --- Fetch Initial Data (Project Details & Chat History) ---
  const fetchInitialData = useCallback(async () => {
    // Validate prerequisites
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
    setFetchError(null); // Clear previous fetch errors
    setSocketError(null); // Clear previous socket errors
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
      // Fetch history and details concurrently
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
          }), // Gracefully handle project detail fetch failure
      ]);

      // Process Project Details Response
      if (projectInfoResponse?.data?.success) {
        // Prioritize the structure that worked (`.data.data`) based on previous logs, but keep fallback
        const projectData =
          projectInfoResponse.data.data || projectInfoResponse.data.project;
        if (projectData && projectData.id && projectData.title) {
          fetchedDetails = { id: projectData.id, name: projectData.title };
          console.log(
            `Processed project details: ID=${fetchedDetails.id}, Name=${fetchedDetails.name}`
          );
        } else {
          console.warn(
            "Project details structure unexpected, using fallback.",
            projectInfoResponse.data
          );
          fetchedDetails = { id: projectId, name: `Project ${projectId}` };
        }
      } else {
        console.warn(
          `Project details fetch unsuccessful or structure unknown, using fallback.`
        );
        fetchedDetails = { id: projectId, name: `Project ${projectId}` };
      }

      // Process Message History Response
      if (
        historyResponse.data?.success &&
        Array.isArray(historyResponse.data.data)
      ) {
        fetchedMsgs = historyResponse.data.data;
        console.log(`Fetched ${fetchedMsgs.length} messages.`);
      } else {
        console.log(`No message history found or non-success response.`);
        fetchedMsgs = [];
      }
    } catch (err) {
      console.error(`Error fetching initial chat data:`, err);
      // Determine error message and check for fatal errors (403, 404)
      if (err.response) {
        errorMsg = err.response.data?.message || `Error ${err.response.status}`;
        if (err.response.status === 403)
          errorMsg = "Access Denied: Not authorized for this chat.";
        else if (err.response.status === 404)
          errorMsg = "Project or chat not found.";
        else if (err.response.status === 401)
          errorMsg = "Authentication session expired.";
      } else if (err.request)
        errorMsg = "Network Error: Unable to reach server.";
      else if (err instanceof TypeError && err.message.includes("undefined")) {
        errorMsg = "Internal Error: Processing server response failed.";
        console.error("Check API response structure.", err);
      } else errorMsg = err.message || "Unknown error during data load.";

      // Use existing details only if fetch failed, otherwise use fallback
      fetchedDetails = projectDetails || {
        id: projectId,
        name: `Project ${projectId}`,
      };
      fetchedMsgs = []; // Clear messages on critical fetch error
    } finally {
      console.log("Applying fetched data to state.");
      setProjectDetails(fetchedDetails); // Update project details state
      setMessages(fetchedMsgs); // Update messages state
      setFetchError(errorMsg); // Set potential fetch error
      setIsLoading(false); // Mark loading as complete
      // Scroll only if data was loaded successfully
      if (fetchedMsgs.length > 0 && !errorMsg) {
        scrollToBottom("auto");
      }
    }
  }, [currentUserId, projectId, scrollToBottom]); // Dependencies for the data fetching logic

  // Effect to fetch data on mount or when critical IDs change
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]); // Relies on the memoized fetchInitialData

  // --- WebSocket Connection and Event Handling ---
  useEffect(() => {
    // --- Guard Clauses: Conditions to PREVENT connection ---
    // 1. Don't connect until project details are loaded (essential for checks/room name)
    if (!projectDetails) {
      console.log("Socket Effect: Skipping - Project details not loaded yet.");
      return;
    }
    // 2. Don't connect if essential IDs are missing
    if (!currentUserId || !projectId || !roomName) {
      console.log(
        "Socket Effect: Skipping - Missing user/project ID or room name."
      );
      return;
    }
    // 3. Don't connect if initial fetch had a fatal error (Access Denied/Not Found)
    if (fetchError && !isLoading) {
      // Check isLoading to ensure fetch attempt finished
      const isFatalError =
        fetchError.includes("Access Denied") ||
        fetchError.includes("not found");
      if (isFatalError) {
        console.log("Socket Effect: Skipping - Fatal fetch error:", fetchError);
        return;
      }
    }
    // 4. Don't connect if no auth token
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("Socket Effect: Skipping - No auth token.");
      return;
    }

    // --- *** CRITICAL CHECK: Prevent Duplicate Connections *** ---
    // If socketRef already holds an instance, DO NOT create a new one.
    if (socketRef.current) {
      console.log(
        `Socket Effect: Skipping - Socket ref exists (ID: ${socketRef.current.id}, Connected: ${socketRef.current.connected}).`
      );
      // Sync UI state if needed (e.g., if connection dropped without state update)
      if (isConnected !== socketRef.current.connected)
        setIsConnected(socketRef.current.connected);
      return;
    }
    // --- End Duplicate Connection Check ---

    // --- Proceed with Establishing Connection ---
    console.log(
      `Socket Effect: Conditions met, Attempting connection to room: ${roomName}`
    );
    setSocketError(null); // Clear previous socket errors

    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      query: { userId: currentUserId },
      reconnectionAttempts: 3,
      timeout: SOCKET_TIMEOUT,
    });
    // --- Store the new socket instance in the ref IMMEDIATELY ---
    socketRef.current = newSocket;

    // --- Event Listeners ---
    newSocket.on("connect", () => {
      console.log(">>> Socket CONNECTED:", newSocket.id);
      setIsConnected(true); // Update connection state
      setSocketError(null); // Clear any previous connection errors
      // Join the specific project chat room
      newSocket.emit("joinChatRoom", { roomName }, (ack) => {
        if (ack?.success) console.log(`Successfully joined room: ${roomName}`);
        else {
          console.error(`Failed to join room ${roomName}:`, ack?.error);
          setSocketError(`Join Error: ${ack?.error || "Server error"}`);
        }
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log(">>> Socket DISCONNECTED:", newSocket.id, "Reason:", reason);
      setIsConnected(false); // Update connection state
      if (reason !== "io client disconnect") {
        setSocketError("Disconnected. Trying to reconnect...");
      }
      // Ensure ref is cleared only if the disconnected instance is the one stored
      if (socketRef.current?.id === newSocket.id) {
        socketRef.current = null;
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error(">>> Socket CONNECTION ERROR:", err.message);
      setIsConnected(false); // Update connection state
      setSocketError(`Connection Failed: ${err.message}.`);
      // Ensure ref is cleared only if the failing instance is the one stored
      if (socketRef.current?.id === newSocket.id) {
        socketRef.current = null;
      }
    });

    // Listen for incoming messages for this project
    newSocket.on("newMessage", (message) => {
      console.log("Socket 'newMessage' received:", message);
      if (message?.content && message.senderId && message.projectId) {
        // Make sure the message is for the project currently being viewed
        if (message.projectId?.toString() === projectId?.toString()) {
          // Add sender details if missing (backend should ideally send this)
          const messageWithSender = {
            ...message,
            sender: message.sender || { id: message.senderId },
          };
          // Add to message list, preventing duplicates
          setMessages((prev) =>
            prev.some((m) => m.id === messageWithSender.id)
              ? prev
              : [...prev, messageWithSender]
          );
        } else {
          console.log(
            `Ignoring msg for different project (${message.projectId}).`
          );
        }
      } else {
        console.warn("Invalid message structure received:", message);
      }
    });

    // --- Cleanup Function for this specific effect instance ---
    return () => {
      // Use the instance created in *this* effect run for cleanup
      const socketInstanceToClean = newSocket;
      console.log(
        "Socket Cleanup: Cleaning up listeners and disconnecting socket instance:",
        socketInstanceToClean.id
      );
      try {
        // Remove listeners to prevent memory leaks
        socketInstanceToClean.off("connect");
        socketInstanceToClean.off("disconnect");
        socketInstanceToClean.off("connect_error");
        socketInstanceToClean.off("newMessage");

        // Leave room and disconnect
        if (socketInstanceToClean.connected) {
          socketInstanceToClean.emit("leaveChatRoom", { roomName });
        }
        socketInstanceToClean.disconnect();
      } catch (cleanupErr) {
        console.error("Error during socket cleanup:", cleanupErr);
      } finally {
        // --- IMPORTANT: Nullify ref ONLY if it holds this instance ---
        if (
          socketRef.current &&
          socketRef.current.id === socketInstanceToClean.id
        ) {
          socketRef.current = null; // Clear the ref
          console.log(
            "Socket Cleanup: socketRef nullified for cleaned instance."
          );
        } else {
          console.log(
            "Socket Cleanup: socketRef did not hold the instance being cleaned, ref not changed."
          );
        }
        // We don't set isConnected to false here, the 'disconnect' listener handles that state update.
      }
    };
    // --- Dependencies for the socket effect ---
    // It runs when IDs/room change, OR when projectDetails load, OR if fetchError/isLoading changes (to re-evaluate guards)
  }, [
    currentUserId,
    projectId,
    roomName,
    API_BASE_URL,
    projectDetails,
    fetchError,
    isLoading,
  ]);

  // --- Send Message Handler ---
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      const contentToSend = newMessage.trim();
      const currentSocket = socketRef.current;

      if (!contentToSend) return;
      if (!currentSocket?.connected) {
        setSocketError("Cannot send: Not connected.");
        return;
      }
      if (isSending) return;
      if (!projectId || !currentUserId) {
        setFetchError("Internal Error: Missing IDs.");
        return;
      } // Use fetchError for this critical state issue

      setIsSending(true);
      setSocketError(null); // Clear transient socket errors

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
          setIsSending(false); // Mark sending as complete
          if (err) {
            console.error("Send message timeout/error:", err);
            setSocketError("Error: Message failed to send (timeout).");
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
  );

  // --- Render Logic ---

  // Initial Loading Screen
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)] p-4">
        {" "}
        <LoadingSpinner size="xl" message="Loading Chat..." />{" "}
      </div>
    );
  }

  // Fatal Error Screen (Access Denied, Not Found, etc.)
  // Check fetchError state AFTER isLoading is false
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
          {" "}
          <FaArrowLeft /> Back to Chats{" "}
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
            message={fetchError} // Show the specific fetch error
            onRetry={!isForbidden && !isNotFound ? fetchInitialData : undefined} // Allow retry only for non-fatal errors
          />
        </div>
      </div>
    );
  }

  // Main Chat Interface (Rendered if no fatal error and not loading)
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
              <FaProjectDiagram className="w-4 h-4 text-indigo-600" />
            </div>
            <span
              className="font-semibold text-gray-800 truncate text-lg"
              title={projectDetails.name}
            >
              {projectDetails.name || `Project ${projectId}`}
            </span>
          </>
        ) : (
          <span className="font-semibold text-gray-800 text-lg">Chat</span>
        )}
        {/* Connection Status */}
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
        {/* Display Transient Socket Errors */}
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
        {messages.length === 0 &&
          !isLoading &&
          !fetchError && ( // Check isLoading/fetchError again
            <div className="text-center py-16 px-6 text-gray-500">
              <FaComments className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-base italic">
                No messages in this project yet.
              </p>
              <p className="text-sm mt-1">Start the conversation!</p>
            </div>
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                        {(msg.sender?.username || "?").charAt(0).toUpperCase()}
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
          disabled={!isConnected || isSending} // Input disabled if not connected OR sending
          autoComplete="off"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected || isSending} // Button disabled if no text OR not connected OR sending
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
