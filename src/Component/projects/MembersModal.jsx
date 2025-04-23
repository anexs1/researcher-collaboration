import React from "react";
import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

const MembersModal = ({ project, onClose }) => {
  // TODO: Fetch actual members for project.id here using useEffect
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
      >
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold">
            Members for "{project?.title}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>
        <p className="text-gray-600 text-sm">
          Member list will be loaded here.
        </p>
        {/* Add loading state and member list rendering */}
      </motion.div>
    </div>
  );
};
export default MembersModal;
