import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaTimes, FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import LoadingSpinner from "../Common/LoadingSpinner"; // Adjust path if needed
import ErrorMessage from "../Common/ErrorMessage"; // Adjust path if needed

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const MembersModal = ({ project, onClose, currentUser }) => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMembers = useCallback(async (projectId) => {
    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("authToken"); // Use your token key

    if (!token) {
      setError("Authentication required to view members.");
      setIsLoading(false);
      return;
    }

    try {
      // *** ADJUST API ENDPOINT IF NEEDED ***
      const response = await axios.get(
        `${API_BASE_URL}/api/projects/${projectId}/members`, // Example endpoint
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success && Array.isArray(response.data?.data)) {
        setMembers(response.data.data); // Assuming data is the array of members
      } else {
        // Handle case where data is not an array or success is false
        console.warn("Unexpected API response format:", response.data);
        setMembers([]); // Set to empty array if format is wrong
        // Optionally set an error message:
        // setError("Could not load members due to unexpected data format.");
      }
    } catch (err) {
      console.error("Error fetching project members:", err);
      const message =
        err.response?.status === 403
          ? "You do not have permission to view members for this project."
          : err.response?.data?.message ||
            err.message ||
            "Could not load members.";
      setError(message);
      setMembers([]); // Clear members on error
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed if it only uses args

  useEffect(() => {
    if (project?.id) {
      fetchMembers(project.id);
    } else {
      // Handle case where modal opens without a project ID somehow
      setError("Project ID is missing.");
      setIsLoading(false);
    }
  }, [project?.id, fetchMembers]); // Re-fetch if project ID changes

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">
            Members: {project?.title || "Project"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : members.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No members found for this project yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Basic Avatar Placeholder - Replace with actual image if available */}
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.username}
                        className="w-8 h-8 rounded-full object-cover bg-gray-200"
                      />
                    ) : (
                      <FaUserCircle className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-800">
                      {member.username || `User ${member.id.substring(0, 6)}`}
                      {member.id === currentUser?.id && (
                        <span className="text-xs text-indigo-600 ml-1">
                          (You)
                        </span>
                      )}
                      {member.id === project?.ownerId && (
                        <span className="text-xs text-amber-600 ml-1">
                          (Owner)
                        </span>
                      )}
                    </span>
                  </div>
                  {/* Optional: Add member role or action button (e.g., remove if owner) */}
                  {/* <span className="text-xs text-gray-500">{member.role || 'Member'}</span> */}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MembersModal;
