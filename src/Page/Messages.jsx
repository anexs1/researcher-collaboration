import React from "react";
import "./messages.css";
const messagesData = [
  { id: 1, sender: "John Doe", message: "Hey, how are you?" },
  { id: 2, sender: "Jane Doe", message: "Can you help me with this?" },
];

const Messages = () => {
  const handleReply = (sender) => {
    alert(`Replying to ${sender}`);
  };

  return (
    <div className="messages-page">
      <h1 className="messages-title">Messages</h1>

      <div className="messages-container">
        {messagesData.map((msg) => (
          <div key={msg.id} className="message-card">
            <h2 className="message-sender">{msg.sender}</h2>
            <p className="message-text">{msg.message}</p>
            <button
              className="reply-btn"
              onClick={() => handleReply(msg.sender)}
            >
              Reply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Messages;
