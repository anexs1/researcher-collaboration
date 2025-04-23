import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

const JoinRequestModal = ({ project, onClose, onSubmit }) => {
  const [message, setMessage] = useState("");
  // Add loading state for submission if needed
  // const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    // setIsSubmitting(true);
    onSubmit(message); // Pass message to parent handler
    // Parent handler should close modal on success/failure
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Request to Join "{project?.title}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>
        <label
          htmlFor="joinMessage"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Message (Optional)
        </label>
        <textarea
          id="joinMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
          rows="3"
          placeholder="Why do you want to join?"
        />
        <button
          onClick={handleSubmit}
          // disabled={isSubmitting} // Disable while submitting
          className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {/* {isSubmitting ? 'Sending...' : 'Send Request'} */}
          Send Request
        </button>
      </motion.div>
    </div>
  );
};
export default JoinRequestModal;
