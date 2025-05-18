import React from "react";
import { FaTimes, FaCrown } from "react-icons/fa"; // FaUserCircle and FaUser were not used, removed for cleanliness
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessage from "../Common/ErrorMessage";

// --- START: Image URL Helper (Ideally import this from a shared utils file) ---
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getFullImageUrl = (relativePath) => {
  if (!relativePath) {
    return null;
  }
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
};
// --- END: Image URL Helper ---


const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { y: "-50%", opacity: 0, scale: 0.9 },
  visible: {
    y: "0%",
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { y: "50%", opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

function MemberListModal({
  isOpen,
  onClose,
  members = [],
  isLoading,
  error,
  projectName = "Project Members",
  onRetry,
  currentUserId,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          ></div>

          <motion.div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-list-title"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2
                id="member-list-title"
                className="text-lg font-semibold text-gray-800 truncate"
                title={projectName}
              >
                {projectName} - Members
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Close members list"
              >
                <FaTimes size="1.2em" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <LoadingSpinner />
                  <p className="mt-2">Loading members...</p>
                </div>
              ) : error ? (
                <ErrorMessage
                  title="Could not load members"
                  message={error}
                  onRetry={onRetry}
                />
              ) : members.length === 0 ? (
                <p className="text-center text-gray-500 py-10 italic">
                  No members found for this project.
                </p>
              ) : (
                <ul className="space-y-3">
                  {members.map((member) => {
                    const isCurrentUser =
                      member.id?.toString() === currentUserId?.toString();
                    const isOwner = member.role === "Owner";
                    
                    // Get the full display URL for the member's avatar
                    const memberAvatarDisplayUrl = member.profilePictureUrl
                      ? getFullImageUrl(member.profilePictureUrl)
                      : null;

                    return (
                      <li
                        key={member.id}
                        className={`flex items-center p-2.5 rounded-lg transition-colors ${
                          isCurrentUser
                            ? "bg-indigo-50 border border-indigo-100"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex-shrink-0 mr-3 relative">
                          {/* === MEMBER AVATAR === */}
                          {memberAvatarDisplayUrl ? (
                            <img
                              src={memberAvatarDisplayUrl}
                              alt={`${member.username || "User"}'s avatar`}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                              onError={(e) => {
                                console.error(
                                  `Error loading MEMBER avatar in modal. Original: ${member.profilePictureUrl}, Attempted: ${e.target.src}. Check /default-avatar.png.`, e
                                );
                                e.target.onerror = null; // Prevent infinite loop if fallback also fails
                                e.target.src = "/default-avatar.png"; // Fallback to default avatar
                              }}
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold text-white shadow border-2 border-white ${
                                isOwner
                                  ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                  : "bg-gradient-to-br from-gray-400 to-gray-500"
                              }`}
                            >
                              {(member.username || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isOwner && (
                            <span className="absolute -bottom-1 -right-1 bg-yellow-500 text-white rounded-full p-0.5 border-2 border-white shadow">
                              <FaCrown size="0.6em" title="Project Owner" />
                            </span>
                          )}
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCurrentUser
                                ? "text-indigo-700"
                                : "text-gray-800"
                            }`}
                            title={member.username}
                          >
                            {member.username || `User ${member.id}`}
                            {isCurrentUser && (
                              <span className="text-xs text-indigo-500 font-normal ml-1">
                                (You)
                              </span>
                            )}
                          </p>
                          <p
                            className={`text-xs capitalize ${
                              isOwner ? "text-yellow-700" : "text-gray-500"
                            }`}
                          >
                            {member.role || "Member"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MemberListModal;