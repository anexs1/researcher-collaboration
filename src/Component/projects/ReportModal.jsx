import React from "react";
import { FaTimes, FaDownload } from "react-icons/fa";
import { motion } from "framer-motion";

const ReportModal = ({ reportData, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-4 border-b pb-2 flex-shrink-0">
          <h3 className="text-lg font-semibold">Generated Report</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow mb-4 pr-1">
          <pre className="text-xs sm:text-sm bg-gray-50 p-4 rounded border whitespace-pre-wrap break-words">
            {reportData || "No report data generated."}
          </pre>
        </div>
        <button
          onClick={onDownload}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 flex-shrink-0 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaDownload /> Download Report
        </button>
      </motion.div>
    </div>
  );
};
export default ReportModal;
