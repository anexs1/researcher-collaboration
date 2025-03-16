import { useState } from "react";

const Messages = ({ closeChat }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (message.trim() !== "") {
      setMessages([...messages, { text: message, sender: "You" }]);
      setMessage("");
    }
  };

  return (
    <div className="chat-popup">
      <div className="chat-header">
        <h4>Chat</h4>
        <button className="close-btn" onClick={closeChat}>
          ✖
        </button>
      </div>
      <div className="chat-body">
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}: </strong>
            {msg.text}
          </p>
        ))}
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Messages;
