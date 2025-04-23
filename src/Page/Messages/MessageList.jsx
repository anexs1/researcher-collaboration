import React from "react";
import Message from "./Message";

const MessageList = ({ messages, currentUser, participants }) => {
  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const sender = participants.find((p) => p.id === message.senderId);
        const previous = messages[index - 1];
        const isConsecutive =
          previous && previous.senderId === message.senderId;

        return (
          <Message
            key={message.id || index}
            message={message}
            isCurrentUser={message.senderId === currentUser.id}
            user={sender}
            showAvatar={!isConsecutive}
          />
        );
      })}
    </div>
  );
};

export default MessageList;
