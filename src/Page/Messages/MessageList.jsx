// src/Component/Chat/MessageList.jsx (Assuming path)
import React from "react";
import Message from "./Message"; // Adjust path if needed
import PropTypes from "prop-types"; // Add PropTypes for the list itself

const MessageList = ({ messages = [], currentUser, participants = [] }) => {
  // Add default values for props

  // Add console log to inspect incoming messages array
  console.log("MessageList rendering with messages:", messages);
  console.log("MessageList currentUser:", currentUser);

  // --- Filter out invalid messages BEFORE mapping ---
  const validMessages = messages.filter(
    (message) =>
      message && // Check if message object exists
      typeof message === "object" && // Ensure it's an object
      message.id && // Check for required fields from Message.propTypes
      message.content &&
      message.timestamp
    // You can add more checks here if needed
  );
  // -----------------------------------------------

  if (validMessages.length !== messages.length) {
    console.warn(
      "MessageList filtered out invalid message objects. Original count:",
      messages.length,
      "Valid count:",
      validMessages.length
    );
  }

  if (!currentUser?.id) {
    console.error("MessageList: currentUser or currentUser.id is missing!");
    // Optionally render an error message or return null
    // return <p>Error: User information is missing.</p>;
  }

  return (
    // Consider adding overflow-y-auto and height/max-height for scrolling
    <div className="message-list p-4 space-y-1">
      {validMessages.map((message, index) => {
        // Find sender safely, defaulting if not found
        const sender =
          participants.find((p) => p && p.id === message.senderId) || null;
        const previous = validMessages[index - 1]; // Use validMessages for previous check

        // Calculate isCurrentUser safely, ensuring IDs exist
        const isCurrentUserMessage =
          !!currentUser?.id &&
          !!message.senderId &&
          message.senderId === currentUser.id;

        // Determine if consecutive message from the same sender
        const isConsecutive =
          previous && previous.senderId === message.senderId;

        // Debug log for each message render
        // console.log(`Rendering Message key=${message.id}: isCurrentUser=${isCurrentUserMessage}, sender=${sender?.username}`);

        return (
          <Message
            key={message.id} // Use guaranteed unique ID now
            message={message} // Pass the validated message object
            isCurrentUser={isCurrentUserMessage} // Pass the safely calculated boolean
            user={sender} // Pass the found sender (or null)
            // Conditionally hide avatar/username for consecutive messages
            showAvatar={!isConsecutive}
            showUsername={!isConsecutive}
          />
        );
      })}
    </div>
  );
};

// Add PropTypes for MessageList itself for better maintenance
MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object), // Expects an array of objects (could be more specific)
  currentUser: PropTypes.shape({ id: PropTypes.string.isRequired }), // Requires at least an ID
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ), // Requires array of participants with ID
};

export default MessageList;
