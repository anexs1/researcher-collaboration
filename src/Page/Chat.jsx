import React, { useState, useEffect } from "react";
import axios from "axios";

function Chat({ chatId, userId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      const result = await axios.get(`/api/chat/${chatId}`);
      setMessages(result.data);
    };
    fetchMessages();
  }, [chatId]);

  const handleSendMessage = async () => {
    await axios.post("/api/chat", {
      senderId: userId,
      receiverId: receiverId,
      message: message,
    });
    setMessages([...messages, { senderId: userId, message, version: 1 }]);
    setMessage("");
  };

  const handleEditMessage = async (messageId, newMessage) => {
    await axios.put(`/api/chat/${messageId}`, { message: newMessage });
    setMessages(
      messages.map((msg) =>
        msg._id === messageId
          ? { ...msg, message: newMessage, version: msg.version + 1 }
          : msg
      )
    );
  };

  return (
    <div>
      <h3>Chat</h3>
      <ul>
        {messages.map((msg) => (
          <li key={msg._id}>
            <strong>{msg.senderId}</strong>: {msg.message} (Version{" "}
            {msg.version})
            <button
              onClick={() =>
                handleEditMessage(msg._id, prompt("Edit message:", msg.message))
              }
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}

export default Chat;
