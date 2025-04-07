// src/Page/Admin/AdminChatPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios"; // Using Axios
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/solid";
import LoadingSpinner from "../../Component/Common/LoadingSpinner"; // Verify path
import ErrorMessage from "../../Component/Common/ErrorMessage"; // Verify path

// Consistent API Base URL - Make sure this is correctly configured (e.g., via .env file)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper to format timestamps
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    console.warn("Invalid timestamp for formatting:", timestamp);
    return "";
  }
};

const AdminChatPage = () => {
  // --- State ---
  const [allUsers, setAllUsers] = useState([]); // All fetched approved users the admin can chat with
  const [filteredUsers, setFilteredUsers] = useState([]); // Users displayed after search
  const [searchTerm, setSearchTerm] = useState(""); // Search input value

  const [selectedUser, setSelectedUser] = useState(null); // Full object of the selected user for chat
  const [messages, setMessages] = useState([]); // Messages for the selected chat
  const [newMessage, setNewMessage] = useState(""); // Input field state

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState(""); // General error display

  const messagesEndRef = useRef(null); // Ref for scrolling to bottom of messages

  // --- Helper: Scroll to bottom of messages ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Fetch Approved Users the Admin can Chat With ---
  const fetchChatUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setError("");
    setAllUsers([]);
    setFilteredUsers([]);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required.");
      setIsLoadingUsers(false);
      return;
    }

    try {
      // **ASSUMED ENDPOINT**: Fetches users admin can chat with (e.g., approved users)
      // The backend should return users with { id, username, name?, profilePicUrl?, ... }
      const url = `${API_BASE_URL}/api/admin/chat/users`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        setAllUsers(response.data.data);
        setFilteredUsers(response.data.data); // Initially show all
      } else {
        setError(
          response.data?.message || "Failed to load user list for chat."
        );
      }
    } catch (err) {
      console.error("Fetch chat users error:", err);
      const errMsg =
        err.response?.data?.message || "An error occurred fetching chat users.";
      setError(errMsg);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // --- Initial User Fetch ---
  useEffect(() => {
    fetchChatUsers();
  }, [fetchChatUsers]);

  // --- Filter Users based on Search Term ---
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (!searchTerm) {
      setFilteredUsers(allUsers); // Show all if search is empty
    } else {
      const filtered = allUsers.filter(
        (user) =>
          user.username?.toLowerCase().includes(lowerSearchTerm) ||
          user.name?.toLowerCase().includes(lowerSearchTerm) // Add more fields if needed
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers]);

  // --- Fetch Messages for Selected User ---
  const fetchMessagesForUser = useCallback(async (userId) => {
    if (!userId) return;
    setIsLoadingMessages(true);
    // Keep existing error or clear specific message error? Decide based on UX preference
    // setError('');
    setMessages([]); // Clear previous messages

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required to fetch messages.");
      setIsLoadingMessages(false);
      return;
    }

    try {
      // **ASSUMED ENDPOINT**: Fetches message history for a specific user
      // Backend should return messages like { id, senderId, receiverId, text, timestamp, isAdminSender }
      const url = `${API_BASE_URL}/api/admin/chat/messages/${userId}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        // Sort messages by timestamp just in case they aren't ordered
        const sortedMessages = response.data.data.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setMessages(sortedMessages);
      } else {
        setError(
          response.data?.message || "Failed to load messages for this user."
        );
        setMessages([]); // Ensure messages are cleared on error
      }
    } catch (err) {
      console.error(`Fetch messages error for user ${userId}:`, err);
      const errMsg =
        err.response?.data?.message || "An error occurred fetching messages.";
      setError(errMsg);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // --- Effect to Fetch Messages on User Selection ---
  useEffect(() => {
    if (selectedUser?.id) {
      fetchMessagesForUser(selectedUser.id);
    } else {
      setMessages([]); // Clear messages if no user selected
    }
  }, [selectedUser, fetchMessagesForUser]);

  // --- Effect to Scroll to Bottom ---
  useEffect(() => {
    // Scroll after messages are rendered/updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100); // Small delay might help ensure rendering is complete
    return () => clearTimeout(timer);
  }, [messages]);

  // --- Handlers ---
  const handleSelectUser = (user) => {
    if (selectedUser?.id === user.id) return; // Don't re-select same user
    setError(""); // Clear errors when switching users
    setSelectedUser(user);
    // Fetching messages is handled by the useEffect watching selectedUser
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser?.id || isSendingMessage) return;

    setIsSendingMessage(true);
    setError(""); // Clear previous errors

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required to send message.");
      setIsSendingMessage(false);
      return;
    }

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      senderId: "admin", // Use a placeholder or fetch admin ID if needed
      receiverId: selectedUser.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
      isAdminSender: true, // Message sent BY admin
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage("");
    scrollToBottom(); // Scroll after adding optimistic message

    try {
      // **ASSUMED ENDPOINT**: Sends a message from admin to user
      const url = `${API_BASE_URL}/api/admin/chat/messages`;
      const response = await axios.post(
        url,
        { receiverId: selectedUser.id, text: messageToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optionally replace optimistic message with confirmed one from backend
      // This helps if the backend assigns the final ID or timestamp
      if (response.data?.success && response.data?.data?.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...response.data.data, isAdminSender: true }
              : msg
          )
        );
      }
      // If backend doesn't return the new message, the optimistic one just stays
    } catch (err) {
      console.error("Send message error:", err);
      const errMsg = err.response?.data?.message || "Failed to send message.";
      setError(errMsg);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageToSend); // Restore message to input on error
    } finally {
      setIsSendingMessage(false);
    }
  };

  // --- Render ---
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
        Admin Chat
      </h1>

      {/* General Error Display (e.g., for failed user fetch) */}
      {error && !selectedUser && (
        <ErrorMessage message={error} onClose={() => setError("")} />
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 h-[calc(100vh-14rem)] flex overflow-hidden">
        {/* Left Panel: User List & Search */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            {" "}
            {/* Sticky header */}
            <h2 className="font-semibold text-gray-700 mb-3">Conversations</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingUsers ? (
              <div className="flex justify-center items-center h-full p-4">
                <LoadingSpinner />
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <li
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`p-3 flex justify-between items-center cursor-pointer transition-colors duration-150 ${
                        selectedUser?.id === user.id
                          ? "bg-indigo-100"
                          : "hover:bg-gray-50"
                      }`}
                      title={`Chat with ${user.username}`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        {/* Basic Avatar Placeholder */}
                        <span className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 uppercase">
                          {user.username?.substring(0, 2)}
                        </span>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm text-gray-800 truncate">
                            {user.username}
                          </p>
                          {/* Add name if available: <p className="text-xs text-gray-500 truncate">{user.name}</p> */}
                        </div>
                      </div>
                      {/* Placeholder for potential unread/timestamp */}
                    </li>
                  ))
                ) : (
                  <p className="p-4 text-sm text-center text-gray-500">
                    {searchTerm
                      ? "No users match search."
                      : "No users available to chat."}
                  </p>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Right Panel: Message Area & Input */}
        <div className="w-2/3 flex flex-col bg-gray-50">
          {selectedUser ? (
            <>
              {/* Message Area Header */}
              <div className="p-4 border-b border-gray-200 bg-white flex items-center space-x-3 sticky top-0 z-10">
                <span className="flex-shrink-0 h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600 uppercase">
                  {selectedUser.username?.substring(0, 2)}
                </span>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {selectedUser.username}
                  </h2>
                  {/* Add user's name/role if available */}
                </div>
              </div>

              {/* Message Display Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-100 relative">
                {isLoadingMessages && ( // Loading overlay for messages
                  <div className="absolute inset-0 flex justify-center items-center bg-gray-100 bg-opacity-75 z-10">
                    <LoadingSpinner />
                  </div>
                )}
                {!isLoadingMessages && messages.length > 0
                  ? messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.isAdminSender ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`p-2 px-3 rounded-lg max-w-[70%] shadow-sm ${
                            msg.isAdminSender
                              ? "bg-indigo-500 text-white"
                              : "bg-white text-gray-800 border border-gray-200"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.text}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              msg.isAdminSender
                                ? "text-indigo-200"
                                : "text-gray-400"
                            } text-right`}
                          >
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  : !isLoadingMessages && ( // Only show 'no messages' if not loading
                      <p className="text-center text-sm text-gray-500 pt-10">
                        No messages yet. Start the conversation!
                      </p>
                    )}
                {/* Error display specific to message sending/loading */}
                {error && selectedUser && (
                  <ErrorMessage message={error} onClose={() => setError("")} />
                )}
                <div ref={messagesEndRef} /> {/* Element to scroll to */}
              </div>

              {/* Message Input Area */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form
                  onSubmit={handleSendMessage}
                  className="flex space-x-3 items-center"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedUser.username}...`}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
                    disabled={isSendingMessage}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center w-[40px] h-[40px]" // Fixed size for button
                    title="Send Message"
                  >
                    {isSendingMessage ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5 transform rotate-45" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex justify-center items-center text-center text-gray-500 bg-gray-50 p-5">
              {isLoadingUsers ? (
                <p>Loading users...</p> // Show different message while users load initially
              ) : (
                <p>
                  Select a user from the list on the left <br /> to view
                  messages and start chatting.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPage;
