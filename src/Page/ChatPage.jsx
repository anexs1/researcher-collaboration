// src/Page/ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  FaPaperPlane,
  FaSpinner,
  FaUserCircle,
  FaArrowLeft,
} from "react-icons/fa";

// Adjust paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import { useNotifications } from "../context/NotificationContext"; // Optional

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper to create a consistent room name
const getRoomName = (userId1, userId2) => {
  if (!userId1 || !userId2) return null;
  return [userId1.toString(), userId2.toString()].sort().join("--");
};

function ChatPage({ currentUser }) {
  const { userId: otherUserIdParam } = useParams();
  const navigate = useNavigate();
  // const { addRawNotification } = useNotifications(); // Optional

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserDetails, setOtherUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // <<< Start loading
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Separate state for socket connection status
  const socketRef = useRef(null); // Ref for the socket instance
  const messagesEndRef = useRef(null);

  const currentUserId = currentUser?.id;
  const otherUserId = otherUserIdParam ? parseInt(otherUserIdParam, 10) : null;

  // Derive roomName, ensure it's null if IDs are invalid or same
  const roomName =
    currentUserId && otherUserId && currentUserId !== otherUserId
      ? getRoomName(currentUserId, otherUserId)
      : null;

  // --- Scroll to bottom ---
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100); // Small delay
  }, []);

  useEffect(() => {
    // Scroll only if there are messages to avoid scrolling on initial empty load
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]); // Rerun when messages change

  // --- Fetch Initial Data (User Details & Chat History) ---
  const fetchInitialData = useCallback(async () => {
    // Basic validation
    if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
      setError(
        currentUserId === otherUserId
          ? "Cannot chat with yourself."
          : "User information missing."
      );
      setIsLoading(false);
      return;
    }

    console.log(
      `ChatPage: Fetching initial data for chat between ${currentUserId} and ${otherUserId}`
    );
    setIsLoading(true); // Ensure loading is true at the start
    setError(null);
    const token = localStorage.getItem("authToken"); // <<< VERIFY KEY NAME!
    if (!token) {
      setError("Authentication required.");
      setIsLoading(false);
      return;
    }

    let userDetails = null;
    let history = [];
    let fetchError = null;

    try {
      // Fetch concurrently
      const [userDetailsResponse, historyResponse] = await Promise.all([
        axios
          .get(`${API_BASE_URL}/api/users/public/${otherUserId}`, {
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
        }),
      ]);

      // Process User Details
      if (userDetailsResponse?.data?.success && userDetailsResponse.data.data) {
        userDetails = userDetailsResponse.data.data;
      } else {
        userDetails = { id: otherUserId, username: `User ${otherUserId}` }; // Use fallback
      }

      // Process History - This needs success to continue without critical error
      if (
        historyResponse.data?.success &&
        Array.isArray(historyResponse.data.data)
      ) {
        history = historyResponse.data.data;
        console.log(`ChatPage: Fetched ${history.length} messages.`);
      } else {
        // Allow proceeding even if history fetch fails but user details succeeded
        console.warn(
          "No message history found or failed to load:",
          historyResponse.data?.message
        );
        history = [];
        // Optionally set a non-critical error if needed: setError("Could not load message history.");
      }
    } catch (err) {
      // Catch errors primarily from history fetch or Promise.all itself
      console.error("Error during initial chat data fetch:", err);
      let errorMsg = "Could not load chat data.";
      if (err.response) {
        errorMsg = err.response.data?.message || `Error ${err.response.status}`;
      } else if (err.request) {
        errorMsg = "Network error.";
      } else {
        errorMsg = err.message;
      }
      fetchError = errorMsg; // Set error state
      userDetails = otherUserDetails || {
        id: otherUserId,
        username: `User ${otherUserId}`,
      }; // Keep fallback/existing details if history failed
      history = []; // Clear messages on critical error
    } finally {
      console.log("fetchInitialData: Setting state and isLoading to false.");
      setOtherUserDetails(userDetails);
      setMessages(history);
      setError(fetchError); // Set error state AFTER setting messages/details
      setIsLoading(false); // <<< CRITICAL: Ensure this is always called
    }
  }, [currentUserId, otherUserId]); // Dependencies

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]); // Fetch on mount/dependency change

  // --- Socket Connection ---
  useEffect(() => {
    if (!currentUserId || !otherUserId || !roomName) return; // Exit if prerequisites not met
    const token = localStorage.getItem("authToken");
    if (!token) return;

    // Avoid reconnecting if already connected
    if (socketRef.current?.connected) {
      console.log("Socket Effect: Already connected via ref.");
      return;
    }

    console.log(`Socket Effect: Attempting connection for room: ${roomName}`);
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      query: { userId: currentUserId },
      reconnectionAttempts: 5,
    });
    socketRef.current = newSocket; // Store ref

    // --- Event Listeners ---
    newSocket.on("connect", () => {
      console.log("Chat socket connected:", newSocket.id);
      setIsConnected(true);
      newSocket.emit("joinChatRoom", { roomName });
      setError(null); /* Clear connection errors */
    }); // Set connected true
    newSocket.on("disconnect", (reason) => {
      console.log("Chat socket disconnected:", newSocket.id, "Reason:", reason);
      setIsConnected(false);
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });
    newSocket.on("connect_error", (err) => {
      console.error("Chat socket connection error:", err.message);
      setIsConnected(false);
      setError(`Connection error. Retrying...`);
      if (socketRef.current?.id === newSocket.id) socketRef.current = null;
    });

    newSocket.on("newMessage", (message) => {
      console.log("Socket 'newMessage' received:", message);
      if (message?.content && message.senderId && message.receiverId) {
        const msgSenderId = message.senderId.toString();
        const msgReceiverId = message.receiverId.toString();
        const currentIdStr = currentUserId.toString();
        const otherIdStr = otherUserId.toString();
        const isCorrectChat =
          (msgSenderId === currentIdStr && msgReceiverId === otherIdStr) ||
          (msgSenderId === otherIdStr && msgReceiverId === currentIdStr);
        if (isCorrectChat) {
          console.log("Adding message to state:", message.id);
          setMessages((prev) =>
            prev.some((m) => m.id === message.id) ? prev : [...prev, message]
          ); // Add if unique
        }
      } else {
        console.warn("Invalid message structure received:", message);
      }
    });

    // --- Cleanup ---
    return () => {
      console.log("ChatPage Cleanup: Disconnecting socket:", newSocket.id);
      if (newSocket) {
        newSocket.emit("leaveChatRoom", { roomName });
        newSocket.disconnect();
      }
      if (socketRef.current && socketRef.current.id === newSocket.id) {
        socketRef.current = null;
      }
      setIsConnected(false); // Set disconnected on cleanup
    };
  }, [currentUserId, otherUserId, roomName, API_BASE_URL]); // Dependencies

  // --- Send Message ---
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      const contentToSend = newMessage.trim();
      const currentSocket = socketRef.current; // Use ref

      if (!contentToSend || !currentSocket?.connected || isSending) {
        if (!currentSocket?.connected) setError("Not connected.");
        return;
      }

      setIsSending(true);
      setError(null); // Clear previous errors on new attempt
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
    },
    [newMessage, currentUserId, otherUserId, roomName, isSending]
  ); // Removed socket state dep

  // --- Render Logic ---

  // Initial Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <LoadingSpinner size="xl" message="Loading Chat..." />
      </div>
    );
  }

  // Fatal Error State (e.g., couldn't load user details, auth failed)
  if (error && !otherUserDetails && messages.length === 0) {
    // Check if messages are also empty
    return (
      <div className="p-8">
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

  // Main Chat Interface Render
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto bg-white shadow-lg rounded-b-lg border border-t-0 border-gray-200">
      {/* Header */}
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
            {/* Avatar */}
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
            {/* Username */}
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
              {isConnected ? "Live" : "Connecting..."}
            </span>
          </>
        ) : (
          <span className="font-semibold text-gray-800">Chat</span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto bg-gradient-to-br from-gray-50 to-slate-100 relative">
        {/* Non-fatal error display (e.g., temporary disconnect) */}
        {error && (
          <div className="p-4 sticky top-0 z-10 mb-2">
            <ErrorMessage message={error} onClose={() => setError(null)} />
          </div>
        )}
        {/* Empty state message - Show only after loading is done and if no messages exist */}
        {!isLoading && messages.length === 0 && !error && (
          <p className="text-center text-gray-500 italic mt-10 text-sm">
            No messages yet. Send the first one!
          </p>
        )}

        <ul className="space-y-3">
          {messages.map((msg) => (
            <li
              key={msg.id || `msg-${msg.senderId}-${msg.createdAt}`}
              className={`flex ${
                msg.senderId === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded-xl shadow-sm break-words ${
                  msg.senderId === currentUserId
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1.5 ${
                    msg.senderId === currentUserId
                      ? "text-indigo-200"
                      : "text-gray-400"
                  } text-right`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
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
