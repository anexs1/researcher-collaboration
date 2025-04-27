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
  if (!userId1 || !userId2) return null; // Handle null/undefined IDs
  return [userId1.toString(), userId2.toString()].sort().join("--");
};

function ChatPage({ currentUser }) {
  const { userId: otherUserIdParam } = useParams();
  const navigate = useNavigate();
  // const { addRawNotification } = useNotifications(); // Uncomment if using global notifications

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserDetails, setOtherUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null); // Use ref for stable socket instance management

  const currentUserId = currentUser?.id;
  const otherUserId = otherUserIdParam ? parseInt(otherUserIdParam, 10) : null;
  const roomName =
    currentUserId && otherUserId && currentUserId !== otherUserId
      ? getRoomName(currentUserId, otherUserId)
      : null;

  // --- Scroll to bottom ---
  const scrollToBottom = useCallback(() => {
    // Add a small delay to allow the DOM to update after adding a message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);
  }, []);

  useEffect(scrollToBottom, [messages]); // Scroll when messages array changes

  // --- Fetch Initial Data (User Details & Chat History) ---
  const fetchInitialData = useCallback(async () => {
    // Ensure IDs are valid before proceeding
    if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
      setError(
        currentUserId === otherUserId
          ? "Cannot chat with yourself."
          : "User information is missing or invalid."
      );
      setIsLoading(false); // Stop loading on initial validation failure
      return;
    }

    console.log(
      `ChatPage: Fetching initial data for chat between ${currentUserId} and ${otherUserId}`
    );
    setIsLoading(true); // <<< Set loading true at the START
    setError(null);
    const token = localStorage.getItem("authToken"); // <<< VERIFY KEY NAME
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setIsLoading(false); // Stop loading if not authenticated
      return;
    }

    try {
      const [userDetailsResponse, historyResponse] = await Promise.all([
        axios
          .get(`${API_BASE_URL}/api/users/public/${otherUserId}`, {
            // Use public profile route
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((err) => {
            // Catch error specifically for user details
            console.warn(
              "Could not fetch other user details:",
              err.response?.data?.message || err.message
            );
            return null; // Return null on error to allow history fetch to continue
          }),
        axios.get(`${API_BASE_URL}/api/messaging/history/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Process User Details response
      if (userDetailsResponse?.data?.success && userDetailsResponse.data.data) {
        setOtherUserDetails(userDetailsResponse.data.data);
      } else {
        // Use fallback even if request failed (userDetailsResponse might be null)
        setOtherUserDetails({
          id: otherUserId,
          username: `User ${otherUserId}`,
        });
      }

      // Process Message History response
      if (
        historyResponse.data?.success &&
        Array.isArray(historyResponse.data.data)
      ) {
        setMessages(historyResponse.data.data);
        console.log(
          `ChatPage: Fetched ${historyResponse.data.data.length} messages.`
        );
      } else {
        console.log("No previous message history found or failed to load.");
        setMessages([]); // Set empty array
      }
      // Clear any previous fetch error on success
      setError(null);
    } catch (err) {
      // Catch errors from historyPromise or Promise.all itself
      console.error("Error fetching initial chat data:", err);
      let errorMsg = "Could not load chat data.";
      if (err.response) {
        errorMsg = err.response.data?.message || `Error ${err.response.status}`;
      } else if (err.request) {
        errorMsg = "Network error.";
      } else {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setMessages([]); // Clear data on error
      // Keep potentially fetched (or fallback) user details unless user detail fetch failed specifically
      if (!otherUserDetails) setOtherUserDetails(null);
    } finally {
      // --- CRITICAL FIX ---
      console.log("fetchInitialData: Setting isLoading to false.");
      setIsLoading(false); // <<< ENSURE this is ALWAYS called
      // --------------------
    }
  }, [currentUserId, otherUserId]); // Dependencies

  // Effect to run fetchInitialData on mount or if IDs change
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- Socket Connection and Event Handling ---
  useEffect(() => {
    if (!currentUserId || !otherUserId || !roomName) {
      console.log("Socket Effect: Skipping connection (missing IDs/roomName).");
      return; // Exit if required IDs/room are not available
    }
    const token = localStorage.getItem("authToken"); // <<< VERIFY KEY
    if (!token) {
      console.log("Socket Effect: Skipping connection (no token).");
      return;
    }

    // Prevent multiple connections if effect re-runs quickly
    if (socketRef.current) {
      console.log(
        "Socket Effect: Socket ref already exists, skipping new connection."
      );
      return;
    }

    console.log(`Socket Effect: Attempting connection for room: ${roomName}`);
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      query: { userId: currentUserId },
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket; // Store in ref
    setSocket(newSocket); // Update state

    // --- Event Listeners ---
    newSocket.on("connect", () => {
      console.log("Chat socket connected:", newSocket.id);
      newSocket.emit("joinChatRoom", { roomName });
    });
    newSocket.on("disconnect", (reason) => {
      console.log("Chat socket disconnected:", newSocket.id, "Reason:", reason);
      if (socketRef.current && socketRef.current.id === newSocket.id) {
        // Clear ref only if this instance disconnects
        socketRef.current = null;
        setSocket(null);
      }
    });
    newSocket.on("connect_error", (err) => {
      console.error("Chat socket connection error:", err.message);
      setError(`Connection error: ${err.message}. Attempting to reconnect...`); // Inform user
      if (socketRef.current && socketRef.current.id === newSocket.id) {
        socketRef.current = null; // Clear potentially broken ref
        setSocket(null);
      }
    });

    newSocket.on("newMessage", (message) => {
      console.log("Socket 'newMessage' received:", message);
      if (message?.content && message.senderId && message.receiverId) {
        const messageSenderId = message.senderId.toString();
        const messageReceiverId = message.receiverId.toString();
        const currentUserIdStr = currentUserId.toString();
        const otherUserIdStr = otherUserId.toString();

        const isCorrectChat =
          (messageSenderId === currentUserIdStr &&
            messageReceiverId === otherUserIdStr) ||
          (messageSenderId === otherUserIdStr &&
            messageReceiverId === currentUserIdStr);

        if (isCorrectChat) {
          console.log("Adding message to state:", message.id);
          setMessages((prevMessages) => {
            // Prevent duplicates if message already exists (e.g., from history fetch)
            if (prevMessages.some((m) => m.id === message.id))
              return prevMessages;
            return [...prevMessages, message];
          });
        } else {
          console.log("Ignoring message for a different chat.");
        }
      } else {
        console.warn("Received invalid message structure:", message);
      }
    });

    newSocket.on("loadMessages", (history) => {
      /* ... optional handler ... */
    });

    // --- Cleanup Function ---
    return () => {
      console.log(
        "ChatPage Cleanup: Disconnecting socket instance:",
        newSocket.id
      );
      if (newSocket) {
        newSocket.emit("leaveChatRoom", { roomName });
        newSocket.off("connect"); // Remove specific listeners
        newSocket.off("disconnect");
        newSocket.off("connect_error");
        newSocket.off("newMessage");
        newSocket.off("loadMessages");
        newSocket.disconnect();
      }
      // Clear ref/state if this specific instance is being cleaned up
      if (socketRef.current && socketRef.current.id === newSocket.id) {
        socketRef.current = null;
        setSocket(null);
      }
    };
    // Only reconnect if essential IDs, room name, or API URL change
  }, [currentUserId, otherUserId, roomName, API_BASE_URL]);

  // --- Send Message Handler ---
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      const contentToSend = newMessage.trim();
      const currentSocket = socketRef.current; // Use the ref for sending

      if (
        !contentToSend ||
        !currentSocket?.connected ||
        !currentUserId ||
        !otherUserId ||
        isSending
      ) {
        console.warn("Cannot send message:", {
          contentToSend,
          socketConnected: currentSocket?.connected,
          isSending,
        });
        if (!currentSocket?.connected)
          setError("Not connected. Cannot send message."); // Show error if not connected
        return;
      }

      setIsSending(true);
      setError(null); // Clear previous send errors
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
          console.log("Message sent ACK received. Message ID:", ack.messageId);
          setNewMessage(""); // Clear input only on success
          // Message will be added via the 'newMessage' listener echo
          // scrollToBottom(); // Scrolling handled by useEffect on messages change
        } else {
          const errorMsg = `Failed to send message: ${
            ack?.error || "Server error"
          }`;
          console.error("Server failed to ACK message:", ack?.error);
          setError(errorMsg); // Set error state
          // Don't clear input on failure
        }
      });
    },
    [newMessage, currentUserId, otherUserId, roomName, isSending]
  ); // Removed socket state dependency

  // --- Render Component ---

  // Combined Loading and Initial Error State Handling
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <LoadingSpinner size="xl" message="Loading Chat..." />
      </div>
    );
  }
  // If there was a critical error fetching initial data (e.g., user not found)
  if (error && !otherUserDetails && !messages.length) {
    return (
      <div className="p-8">
        <Link
          to="/messages"
          className="text-sm text-indigo-600 hover:underline mb-4 inline-flex items-center gap-1"
        >
          <FaArrowLeft /> Back
        </Link>
        <ErrorMessage
          title="Error Loading Chat"
          message={error}
          onRetry={fetchInitialData}
        />
      </div>
    );
  }
  // If user details loaded (even fallback) but history fetch failed
  if (error && otherUserDetails) {
    // Display the error non-blockingly above the (empty) message list later
    console.log(
      "Non-fatal error occurred but user details loaded, will render chat shell."
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto bg-white shadow-lg rounded-b-lg border border-t-0 border-gray-200">
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
          </>
        ) : (
          <span className="font-semibold text-gray-800">Chat</span>
        )}
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
        {/* Empty state */}
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
          placeholder="Type your message..."
          className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm disabled:bg-gray-100"
          // Disable input if socket isn't connected OR if currently sending
          disabled={!socket?.connected || isSending}
          autoComplete="off"
        />
        <button
          type="submit"
          // Disable button if message empty, socket not connected, OR currently sending
          disabled={!newMessage.trim() || !socket?.connected || isSending}
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
