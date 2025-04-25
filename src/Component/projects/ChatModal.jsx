import React from "react";
import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

const ChatModal = ({ project, onClose, currentUser }) => {
  // TODO: Implement real-time chat (WebSocket connection, message state, sending logic)
  // Needs backend support for WebSocket/Chat service.

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full h-[70vh] flex flex-col p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 truncate pr-2">
            Chat: {project?.title || "Project"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-50 flex flex-col justify-center items-center">
          {/* Replace with actual message rendering */}
          <p className="text-center text-gray-400 text-sm italic">
            Real-time chat feature is currently under development.
          </p>
          <p className="text-center text-gray-400 text-xs mt-2">
            (Requires WebSocket implementation)
          </p>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t flex gap-2 flex-shrink-0 bg-gray-50">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            disabled // Disabled until implemented
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled // Disabled until implemented
          >
            Send
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatModal;
