import React from "react";
import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

const ChatModal = ({ project, onClose }) => {
  // TODO: Implement real-time chat logic (Socket.IO connection, message state, sending)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full h-[70vh] flex flex-col p-0 overflow-hidden" // Adjusted padding/height
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">
            Chat: {project?.title || "Project"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>
        {/* Message Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-50">
          <p className="text-center text-gray-400 text-sm italic py-10">
            Chat feature under construction...
          </p>
          {/* Map over messages here */}
        </div>
        {/* Input Area */}
        <div className="p-4 border-t flex gap-2 flex-shrink-0">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-grow p-2 border rounded text-sm"
            disabled
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            disabled
          >
            Send
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default ChatModal;
