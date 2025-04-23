// src/Component/Project/JoinRequestModal.jsx

import React, { useState, useEffect } from "react"; // Added useEffect back if needed
import { FaTimes, FaPaperPlane, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios"; // Keep axios if needed for direct calls (though currently handled by parent)

// --- CORRECTED Import Paths for Common Components ---
// Go up one level from 'Project' to 'Component', then into 'Common'
import Notification from "../Common/Notification";
// You don't seem to be *using* LoadingSpinner directly here, but if you needed it:
// import LoadingSpinner from "../Common/LoadingSpinner";

// --- API Base URL (if needed directly in modal, but usually not) ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const JoinRequestModal = ({
  project,
  onClose,
  onSubmit, // Function passed from parent (Projects.jsx) to handle the actual API call
  isSubmitting = false, // Loading state controlled by parent
}) => {
  const [message, setMessage] = useState("");
  // Local state for notifications *within* this modal (e.g., validation errors)
  const [localNotification, setLocalNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Helper to show local notifications
  const showModalNotification = (msg, type = "info") => {
    setLocalNotification({ show: true, message: msg, type });
    setTimeout(
      () => setLocalNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  };

  // Function called when the 'Send Request' button is clicked
  const handleSendRequest = () => {
    if (isSubmitting) return; // Prevent multiple clicks

    if (!project?.id) {
      console.error("JoinRequestModal: project prop or project.id is missing.");
      showModalNotification(
        "Cannot submit request: Project information is missing.",
        "error"
      );
      return;
    }
    // Call the onSubmit function passed from Projects.jsx, sending the message content
    onSubmit(message);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative overflow-hidden"
      >
        {/* --- Optional: Local Notification Area --- */}
        <AnimatePresence>
          {localNotification.show && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 z-10" // Position at top
            >
              <Notification
                message={localNotification.message}
                type={localNotification.type}
                onClose={() =>
                  setLocalNotification({ ...localNotification, show: false })
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div
          className={`flex justify-between items-center mb-4 border-b pb-3 ${
            localNotification.show ? "pt-12" : "pt-0"
          }`}
        >
          {" "}
          {/* Adjust padding */}
          <h3 className="text-lg font-semibold text-gray-800">
            Request to Join "{project?.title || "Project"}"
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting} // Use parent's submitting state
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Message Input */}
        <div className="mb-4">
          <label
            htmlFor="joinMessage"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Message (Optional)
          </label>
          <textarea
            id="joinMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`w-full mt-1 p-2 border rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              isSubmitting
                ? "bg-gray-100 cursor-not-allowed"
                : "border-gray-300 bg-white"
            }`}
            rows="4"
            placeholder="Briefly explain your interest or relevant skills..."
            disabled={isSubmitting} // Use parent's submitting state
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {message.length}/500
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSendRequest}
          disabled={isSubmitting || !project?.id} // Use parent's submitting state
          className="mt-4 w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm font-medium"
        >
          {isSubmitting ? (
            <>
              {" "}
              <FaSpinner className="animate-spin h-4 w-4" /> Sending...{" "}
            </>
          ) : (
            <>
              {" "}
              <FaPaperPlane className="h-4 w-4" /> Send Request{" "}
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default JoinRequestModal;
