import React from "react";
import { FaTimes, FaDownload } from "react-icons/fa";
import { motion } from "framer-motion";

// Added projectName prop for clarity in the header
const ReportModal = ({ reportData, projectName, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-0 max-h-[80vh] flex flex-col" // Adjusted padding
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 truncate pr-2">
            Report: {projectName || "Project"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close modal">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-grow p-4"> {/* Added padding here */}
          <pre className="text-xs sm:text-sm bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap break-words font-mono">
            {reportData || <span className="italic text-gray-500">No report data available.</span>}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-xl">
            <button
            onClick={onDownload} // This triggers the downloadReport function passed from Projects.jsx
            disabled={!reportData} // Disable if no data
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-sm font-medium"
            >
            <FaDownload /> Download Report
            </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportModal;