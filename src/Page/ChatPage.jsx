// src/Page/ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client"; // Import socket client directly for chat focus
import {
  FaPaperPlane,
  FaSpinner,
  FaUserCircle,
  FaArrowLeft,
} from "react-icons/fa";

// Adjust paths as needed
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";
import { useNotifications } from "../context/NotificationContext"; // To potentially use global socket

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper to create a consistent room name
const getRoomName = (userId1, userId2) => {
  // Sort IDs to ensure consistent room name regardless of who initiates
  return [userId1, userId2].sort().join("--");
};

function ChatPage({ currentUser }) {
  const { userId: otherUserId } = useParams(); // ID of the user being chatted with
  const navigate = useNavigate();
  const { addRawNotification } = useNotifications(); // Use if global socket is preferred

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserDetails, setOtherUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null); // Dedicated socket for chat page? Or use global?
  const messagesEndRef = useRef(null); // Ref to scroll to bottom
  const currentUserId = currentUser?.id;
  const roomName =
    currentUserId && otherUserId
      ? getRoomName(currentUserId, parseInt(otherUserId))
      : null;

  // --- Scroll to bottom ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]); // Scroll when messages change

  // --- Fetch Initial Data (Chat History & Other User Details) ---
  const fetchInitialData = useCallback(async () => {
    if (!currentUserId || !otherUserId) {
      setError("User information is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required.");
      setIsLoading(false);
      return;
    }

    try {
      // Fetch other user's details (optional but helpful)
      const userDetailsPromise = axios.get(
        `${API_BASE_URL}/api/users/${otherUserId}`,
        {
          // Assumes a route like this exists
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch chat history
      const historyPromise = axios.get(
        `${API_BASE_URL}/api/messaging/history/${otherUserId}`,
        {
          // <<< Needs backend route/controller
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const [userDetailsResponse, historyResponse] = await Promise.all([
        userDetailsPromise,
        historyPromise,
      ]);

      // Process User Details
      if (userDetailsResponse.data?.success && userDetailsResponse.data.data) {
        setOtherUserDetails(userDetailsResponse.data.data);
      } else {
        console.warn(
          "Could not fetch other user details:",
          userDetailsResponse.data?.message
        );
        // Set a default/fallback object if needed
        setOtherUserDetails({
          id: otherUserId,
          username: `User ${otherUserId}`,
        });
      }

      // Process Message History
      if (
        historyResponse.data?.success &&
        Array.isArray(historyResponse.data.data)
      ) {
        setMessages(historyResponse.data.data); // Assuming backend returns sorted messages
      } else {
        // Don't throw error for no history, just log it
        console.log("No previous message history found or failed to load.");
        setMessages([]);
      }
    } catch (err) {
      console.error("Error fetching initial chat data:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not load chat data.";
      setError(errorMsg);
      setMessages([]);
      setOtherUserDetails(null); // Clear details on error
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- Socket Connection and Event Handling ---
  useEffect(() => {
    if (!currentUserId || !otherUserId || !roomName) return; // Ensure IDs and room are available

    const token = localStorage.getItem("authToken");
    if (!token) return; // Need token to connect

    console.log(`Attempting to connect socket for chat room: ${roomName}`);

    // Establish connection (or reuse global one if implemented)
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      query: { userId: currentUserId }, // Send user ID for backend mapping
    });

    setSocket(newSocket); // Store the socket instance

    newSocket.on("connect", () => {
      console.log("Chat socket connected:", newSocket.id);
      // Join the specific chat room upon connection
      console.log(`Joining room: ${roomName}`);
      newSocket.emit("joinChatRoom", { roomName });
      // Optional: Request message history on successful connect/reconnect
      // newSocket.emit("requestHistory", { roomName }); // Backend needs to handle this
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Chat socket disconnected:", reason);
      setSocket(null); // Clear socket state
    });

    newSocket.on("connect_error", (err) => {
      console.error("Chat socket connection error:", err.message);
      setError(`Connection error: ${err.message}. Please refresh.`);
      setSocket(null);
    });

    // Listen for new messages specifically for THIS chat room
    newSocket.on("newMessage", (message) => {
      console.log("New message received:", message);
      // Basic validation: ensure it has content and sender/receiver IDs match current chat
      if (
        message &&
        message.content &&
        message.senderId &&
        message.receiverId
      ) {
        // Check if the message belongs to the current chat conversation
        const involvesCurrentUser =
          message.senderId === currentUserId ||
          message.receiverId === currentUserId;
        const involvesOtherUser =
          message.senderId === parseInt(otherUserId) ||
          message.receiverId === parseInt(otherUserId);

        if (involvesCurrentUser && involvesOtherUser) {
          console.log("Adding message to state:", message);
          setMessages((prevMessages) => [...prevMessages, message]);
          // Optional: Mark message as read if window is active
        } else {
          console.log("Received message for a different chat:", message);
          // Optionally use global notification handler for messages from other chats
          // if (addRawNotification) {
          //    addRawNotification({ type: 'new_message', message: `New message from ${message.sender?.username || 'user'}`, senderId: message.senderId });
          // }
        }
      } else {
        console.warn("Received invalid message object:", message);
      }
    });

    // Listen for past messages loaded after joining room (if backend emits this)
    newSocket.on("loadMessages", (history) => {
      console.log("Received message history:", history);
      if (Array.isArray(history)) {
        setMessages(history);
      }
    });

    // Cleanup on component unmount
    return () => {
      console.log(
        "ChatPage unmounting, leaving room and disconnecting socket."
      );
      if (newSocket) {
        newSocket.emit("leaveChatRoom", { roomName });
        newSocket.disconnect();
      }
      setSocket(null); // Clear state on unmount
    };
  }, [currentUserId, otherUserId, roomName, API_BASE_URL]); // Reconnect if user/room changes

  // --- Send Message Handler ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !socket ||
      !currentUserId ||
      !otherUserId ||
      isSending
    ) {
      return; // Don't send empty messages or if disconnected/sending
    }

    setIsSending(true);
    const messageData = {
      senderId: currentUserId,
      receiverId: parseInt(otherUserId), // Ensure receiver ID is a number
      content: newMessage.trim(),
      roomName: roomName, // Send room name for backend targeting
      timestamp: new Date().toISOString(), // Client-side timestamp (backend should use its own)
    };

    console.log("Emitting sendMessage:", messageData);

    // Optimistic UI update (optional but good UX)
    // setMessages(prev => [...prev, { ...messageData, id: `temp-${Date.now()}`, sender: currentUser }]); // Add temporary message

    socket.emit("sendMessage", messageData, (ack) => {
      // Add acknowledgement callback
      setIsSending(false);
      if (ack?.success) {
        console.log("Message sent and acknowledged by server.");
        setNewMessage(""); // Clear input field only on success
        // If NOT using optimistic update, you'd wait for the 'newMessage' event from server
        // scrollToBottom(); // Scroll after clearing
      } else {
        console.error("Server failed to acknowledge message:", ack?.error);
        showModalNotification(
          `Failed to send message: ${ack?.error || "Server error"}`,
          "error"
        );
        // If using optimistic update, remove the temporary message here
        // setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`)); // Example ID matching
      }
    });
    // If not using optimistic UI, clear input immediately
    // setNewMessage('');
    // scrollToBottom();
  };

  // --- Render Component ---
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto bg-white shadow-lg rounded-b-lg border border-t-0 border-gray-200">
      {" "}
      {/* Adjust height based on Navbar */}
      {/* Chat Header */}
      <div className="flex items-center p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-shrink-0">
        <Link
          to="/messages"
          className="text-gray-500 hover:text-gray-700 mr-3 p-1 rounded-full hover:bg-gray-200"
        >
          <FaArrowLeft />
        </Link>
        {otherUserDetails ? (
          <>
            {otherUserDetails.profilePictureUrl ? (
              <img
                src={otherUserDetails.profilePictureUrl}
                alt={otherUserDetails.username}
                className="w-8 h-8 rounded-full object-cover mr-2"
              />
            ) : (
              <FaUserCircle className="w-8 h-8 text-gray-400 mr-2" />
            )}
            <span className="font-semibold text-gray-800 truncate">
              {otherUserDetails.username || `User ${otherUserId}`}
            </span>
          </>
        ) : isLoading ? (
          <span className="text-sm text-gray-500 italic">
            Loading user info...
          </span>
        ) : (
          <span className="font-semibold text-gray-800">Chat</span> // Fallback title
        )}
        {/* Optional: Online status or last seen */}
      </div>
      {/* Messages Area */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-100">
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center pt-10">
            <LoadingSpinner />
          </div>
        )}
        {error && (
          <div className="p-4">
            <ErrorMessage message={error} onClose={() => setError(null)} />
          </div>
        )}
        {!isLoading && messages.length === 0 && !error && (
          <p className="text-center text-gray-500 italic mt-10">
            No messages yet. Start the conversation!
          </p>
        )}
        <ul className="space-y-3">
          {messages.map((msg, index) => (
            <li
              key={msg.id || `msg-${index}`}
              className={`flex ${
                msg.senderId === currentUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] px-3 py-2 rounded-lg shadow-sm ${
                  msg.senderId === currentUserId
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
              >
                {/* Optional: Show sender name if group chat, not needed for 1-on-1 */}
                {/* {msg.senderId !== currentUserId && otherUserDetails && (
                                    <p className="text-xs font-medium mb-1 text-indigo-700">{otherUserDetails.username}</p>
                                )} */}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    msg.senderId === currentUserId
                      ? "text-indigo-200"
                      : "text-gray-400"
                  } text-right`}
                >
                  {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString(
                    [],
                    { hour: "numeric", minute: "2-digit" }
                  )}
                  {/* Optional: Read status checkmark */}
                </p>
              </div>
            </li>
          ))}
          <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
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
          className="flex-grow px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          disabled={!socket || isLoading || !!error} // Disable if not connected or loading/error
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={
            !newMessage.trim() || !socket || isSending || isLoading || !!error
          }
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
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
