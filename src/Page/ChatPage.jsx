// src/Page/ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client"; // Import Socket type is optional in JS, good for clarity
import {
  FaPaperPlane,
  FaSpinner,
  FaUserCircle,
  FaArrowLeft,
} from "react-icons/fa";

// Adjust paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
// import { useNotifications } from '../context/NotificationContext'; // Optional for global notifications

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper to create a consistent room name
const getRoomName = (userId1, userId2) => {
  if (!userId1 || !userId2) return null; // Handle null/undefined IDs
  // Sort IDs alphabetically/numerically to ensure the same room name regardless of order
  return [userId1.toString(), userId2.toString()].sort().join("--");
};

function ChatPage({ currentUser }) {
  // Accept currentUser prop
  const { userId: otherUserIdParam } = useParams(); // Get ID from URL as string
  const navigate = useNavigate();
  // const { addRawNotification } = useNotifications(); // Uncomment if using global notifications

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserDetails, setOtherUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Track socket connection status explicitly
  const socketRef = useRef(null); // Use ref for stable socket instance management
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  const currentUserId = currentUser?.id;
  // Parse otherUserIdParam safely AFTER checking it exists
  const otherUserId = otherUserIdParam ? parseInt(otherUserIdParam, 10) : null;

  // Derive roomName only if both IDs are valid and different
  const roomName =
    currentUserId && otherUserId && currentUserId !== otherUserId
      ? getRoomName(currentUserId, otherUserId)
      : null;

  // --- Scroll to bottom effect ---
  const scrollToBottom = useCallback(() => {
    // Add a small delay to allow the DOM to update after adding a message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100); // Increased delay slightly
  }, []); // No dependencies needed

  // Scroll whenever the messages array updates
  useEffect(() => {
    if (messages.length > 0) {
      // Only scroll if there are messages
      scrollToBottom();
    }
  }, [messages, scrollToBottom]); // Rerun when messages change

  // --- Fetch Initial Data (User Details & Chat History) ---
  const fetchInitialData = useCallback(async () => {
    // Ensure we have valid IDs before fetching
    if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
      setError(
        currentUserId === otherUserId
          ? "Cannot chat with yourself."
          : "User information missing or invalid."
      );
      setIsLoading(false); // Stop loading on initial validation failure
      return;
    }

    console.log(
      `ChatPage: Fetching initial data for chat between ${currentUserId} and ${otherUserId}`
    );
    setIsLoading(true); // Set loading true at the start
    setError(null); // Clear previous errors
    const token = localStorage.getItem("authToken"); // <<< VERIFY KEY NAME!
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setIsLoading(false); // Stop loading if not authenticated
      return;
    }

    let userDetails = null;
    let history = [];
    let fetchError = null;

    try {
      // Fetch both user details and history concurrently
      const [userDetailsResponse, historyResponse] = await Promise.all([
        axios
          .get(`${API_BASE_URL}/api/users/public/${otherUserId}`, {
            // Use public profile route
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => {
            console.warn(
              "User details fetch failed:",
              err.response?.data?.message || err.message
            );
            return null;
          }), // Catch user details error separately
        axios.get(`${API_BASE_URL}/api/messaging/history/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }), // Let errors here propagate to the main catch
      ]);

      // Process User Details response
      if (userDetailsResponse?.data?.success && userDetailsResponse.data.data) {
        userDetails = userDetailsResponse.data.data;
      } else {
        // Use fallback even if request failed (userDetailsResponse might be null)
        userDetails = { id: otherUserId, username: `User ${otherUserId}` };
      }

      // Process Message History response - requires success
      if (
        historyResponse.data?.success &&
        Array.isArray(historyResponse.data.data)
      ) {
        history = historyResponse.data.data;
        console.log(`ChatPage: Fetched ${history.length} messages.`);
      } else {
        console.log(
          "No previous message history found or backend indicated no success."
        );
        history = [];
      }
      fetchError = null; // Clear error on successful fetch
    } catch (err) {
      // Catch errors primarily from history fetch or Promise.all itself
      console.error("Error fetching initial chat data:", err);
      let errorMsg = "Could not load chat data.";
      if (err.response) {
        errorMsg = err.response.data?.message || `Error ${err.response.status}`;
      } else if (err.request) {
        errorMsg = "Network error.";
      } else {
        errorMsg = err.message;
      }
      fetchError = errorMsg;
      userDetails = otherUserDetails || {
        id: otherUserId,
        username: `User ${otherUserId}`,
      }; // Keep potential fallback
      history = []; // Clear messages on critical error
    } finally {
      console.log("fetchInitialData: Setting state and isLoading to false.");
      setOtherUserDetails(userDetails);
      setMessages(history);
      setError(fetchError); // Set final error state
      setIsLoading(false); // <<< CRITICAL: Ensure this is always called
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, otherUserId]); // Dependencies

  // Effect to run fetchInitialData on mount or if relevant IDs change
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchInitialData]);

  // --- Socket Connection and Event Handling ---
  useEffect(() => {
    if (!currentUserId || !otherUserId || !roomName) {
      console.log("Socket Effect: Skipping connection (missing IDs/roomName).");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("Socket Effect: Skipping connection (no token).");
      return;
    }

    if (socketRef.current) {
      console.log(
        `Socket Effect: Ref exists (connected: ${socketRef.current.connected}), skipping new connection.`
      );
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      setIsConnected(socketRef.current.connected);
      return;
    }

    console.log(`Socket Effect: Creating new connection for room: ${roomName}`);
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      query: { userId: currentUserId },
      reconnectionAttempts: 5,
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log(">>> Chat socket CONNECTED:", newSocket.id);
      setIsConnected(true);
      setError(null);
      newSocket.emit("joinChatRoom", { roomName });
    });
    newSocket.on("disconnect", (reason) => {
      console.log(
        ">>> Chat socket DISCONNECTED:",
        newSocket.id,
        "Reason:",
        reason
      );
      setIsConnected(false);
      if (socketRef.current?.id === newSocket.id)
        socketRef.current = null; /*setError("Disconnected...");*/
    });
    newSocket.on("connect_error", (err) => {
      console.error(">>> Chat socket CONNECTION ERROR:", err.message);
      setIsConnected(false);
      setError(`Connection failed: ${err.message}. Retrying...`);
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });

    newSocket.on("newMessage", (message) => {
      console.log("Socket 'newMessage' received:", message);
      if (message?.content && message.senderId && message.receiverId) {
        const msgSenderId = message.senderId.toString();
        const msgReceiverId = message.receiverId.toString();
        const currentIdStr = currentUserId?.toString();
        const otherIdStr = otherUserId?.toString();
        const isCorrectChat =
          (msgSenderId === currentIdStr && msgReceiverId === otherIdStr) ||
          (msgSenderId === otherIdStr && msgReceiverId === currentIdStr);
        if (isCorrectChat) {
          console.log("Adding received message to state:", message.id);
          setMessages((prev) =>
            prev.some((m) => m.id === message.id) ? prev : [...prev, message]
          );
        } else {
          console.log("Ignoring message for different chat.");
        }
      } else {
        console.warn("Invalid message structure received:", message);
      }
    });

    // Optional: Listener for history loaded via socket
    newSocket.on("loadMessages", (history) => {
      console.log("Received message history via socket:", history);
      // --- FIX: Corrected line ---
      if (Array.isArray(history)) {
        // --------------------------
        setMessages(history); // Replace current messages with history
      }
    });

    // --- Cleanup Function ---
    return () => {
      const socketInstanceToClean = socketRef.current;
      if (
        socketInstanceToClean &&
        typeof socketInstanceToClean.disconnect === "function"
      ) {
        console.log(
          "ChatPage Cleanup: Disconnecting socket instance:",
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
          socketInstanceToClean.off("loadMessages");
          socketInstanceToClean.disconnect();
        } catch (cleanupErr) {
          console.error("Error during socket cleanup:", cleanupErr);
        } finally {
          socketRef.current = null;
        }
      } else {
        console.warn(
          "ChatPage Cleanup: socketRef.current was not a valid socket instance.",
          socketInstanceToClean
        );
      }
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, otherUserId, roomName, API_BASE_URL]); // Dependencies

  // --- Send Message Handler ---
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      const contentToSend = newMessage.trim();
      const currentSocket = socketRef.current;

      if (!contentToSend || !currentSocket?.connected || isSending) {
        console.warn("Cannot send:", {
          contentToSend,
          connected: currentSocket?.connected,
          isSending,
        });
        if (!currentSocket?.connected)
          setError("Error: Not connected to chat server.");
        return;
      }

      setIsSending(true);
      setError(null);
      const messageData = {
        senderId: currentUserId,
        receiverId: otherUserId,
        content: contentToSend,
        roomName,
      };

      console.log("Emitting sendMessage:", messageData);
      currentSocket.emit("sendMessage", messageData, (ack) => {
        setIsSending(false);
        if (ack?.success) {
          console.log("Msg ACK:", ack.messageId);
          setNewMessage("");
        } else {
          const errorMsg = `Send failed: ${ack?.error || "Unknown error"}`;
          console.error(errorMsg);
          setError(errorMsg);
        }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [newMessage, currentUserId, otherUserId, roomName, isSending]
  ); // Dependencies

  // --- Render Component ---

  // Initial Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <LoadingSpinner size="xl" message="Loading Chat..." />
      </div>
    );
  }

  // Fatal Error State (e.g., couldn't load user details, major fetch failure)
  if (error && !otherUserDetails && !messages.length) {
    return (
      <div className="p-4 sm:p-8">
        {" "}
        <Link
          to="/messages"
          className="text-sm text-indigo-600 hover:underline mb-4 inline-flex items-center gap-1"
        >
          <FaArrowLeft /> Back
        </Link>{" "}
        <ErrorMessage
          title="Error Loading Chat"
          message={error}
          onRetry={fetchInitialData}
        />{" "}
      </div>
    );
  }

  // Render the main chat interface
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto bg-white shadow-lg rounded-b-lg border border-t-0 border-gray-200">
      {" "}
      {/* Adjust height based on Navbar */}
      {/* Chat Header */}
      <div className="flex items-center p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-shrink-0 sticky top-0 z-10">
        <Link
          to="/messages"
          className="text-gray-500 hover:text-gray-700 mr-3 p-1 rounded-full hover:bg-gray-200"
          aria-label="Back to Messages"
        >
          {" "}
          <FaArrowLeft />{" "}
        </Link>
        {otherUserDetails ? (
          <>
            <div className="flex-shrink-0 mr-2 relative">
              {otherUserDetails.profilePictureUrl ? (
                <img
                  src={otherUserDetails.profilePictureUrl}
                  alt={otherUserDetails.username}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : null}
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-semibold text-sm ${
                  otherUserDetails.profilePictureUrl ? "hidden" : "flex"
                }`}
              >
                {" "}
                {(otherUserDetails.username || "?")
                  .charAt(0)
                  .toUpperCase()}{" "}
              </div>
            </div>
            <span className="font-semibold text-gray-800 truncate">
              {" "}
              {otherUserDetails.username || `User ${otherUserId}`}{" "}
            </span>
            {/* Connection Status Indicator */}
            <span
              className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                isConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700 animate-pulse"
              }`}
            >
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </>
        ) : (
          <span className="font-semibold text-gray-800">Chat</span>
        )}{" "}
        {/* Fallback title */}
      </div>
      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto bg-gradient-to-br from-gray-50 to-slate-100 relative">
        {" "}
        {/* Added relative for sticky error */}
        {/* Display non-fatal errors */}
        {error && (
          <div className="p-4 sticky top-0 z-10 mb-2">
            <ErrorMessage message={error} onClose={() => setError(null)} />
          </div>
        )}
        {/* Empty state message - Show only after loading is done and if array is empty */}
        {!isLoading && messages.length === 0 && !error && (
          <p className="text-center text-gray-500 italic mt-10 text-sm">
            No messages yet. Send the first one!
          </p>
        )}
        <ul className="space-y-3">
          {messages.map((msg) => (
            // Use message ID as key if available and unique
            <li
              key={msg.id || `msg-${msg.senderId}-${msg.createdAt}`}
              className={`flex ${
                msg.senderId?.toString() === currentUserId?.toString()
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {" "}
              {/* Safe comparison */}
              <div
                className={`max-w-[75%] px-3 py-2 rounded-xl shadow-sm break-words ${
                  msg.senderId?.toString() === currentUserId?.toString()
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1.5 ${
                    msg.senderId?.toString() === currentUserId?.toString()
                      ? "text-indigo-200"
                      : "text-gray-400"
                  } text-right`}
                >
                  {/* Display time, handle potential invalid date */}
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "..."}
                </p>
              </div>
            </li>
          ))}
          {/* Scroll anchor */}
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
          className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm disabled:bg-gray-100"
          // Disable input if socket isn't connected OR if currently sending message
          disabled={!isConnected || isSending}
          autoComplete="off"
        />
        <button
          type="submit"
          // Disable button if message empty, socket not connected, OR currently sending message
          disabled={!newMessage.trim() || !isConnected || isSending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors flex items-center justify-center"
          aria-label="Send message"
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
