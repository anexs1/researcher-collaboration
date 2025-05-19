// src/Component/Admin/UserDetailsModal.jsx
import React from "react";
import { FaTimes, FaUserCircle, FaTrash, FaEdit, FaCheckCircle, FaHourglassHalf, FaBan, FaExclamationTriangle } from "react-icons/fa"; // Added more status icons
import { motion, AnimatePresence } from "framer-motion";

// Animation variants (can remain the same)
const backdropVariants = { /* ... */ };
const modalVariants = { /* ... */ };

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "Invalid Date"; }
};

// Refined status styles with icons
const statusStyles = {
  approved: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: <FaCheckCircle className="mr-1.5 h-3.5 w-3.5" />,
    label: "Approved"
  },
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: <FaHourglassHalf className="mr-1.5 h-3.5 w-3.5" />,
    label: "Pending"
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <FaBan className="mr-1.5 h-3.5 w-3.5" />,
    label: "Rejected"
  },
  suspended: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: <FaExclamationTriangle className="mr-1.5 h-3.5 w-3.5" />,
    label: "Suspended"
  },
  default: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: <FaInfoCircle className="mr-1.5 h-3.5 w-3.5" />, // Using FaInfoCircle from react-icons/fa
    label: "Unknown"
  }
};


function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onDeleteRequest, // Assumed to be a function that might trigger further confirmation
  onEditRequest,   // Assumed to be a function to navigate to an edit page or open an edit modal
}) {
  if (!user) return null;

  const currentStatus = statusStyles[user.status?.toLowerCase()] || statusStyles.default;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // For profile pic

  const profilePictureDisplayUrl = user.profilePictureUrl
    ? user.profilePictureUrl.startsWith('http')
      ? user.profilePictureUrl
      : `${API_BASE_URL}${user.profilePictureUrl.startsWith('/') ? user.profilePictureUrl : `/${user.profilePictureUrl}`}`
    : null;


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4" // Increased z-index if needed
          variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>

          <motion.div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-300"
            variants={modalVariants} role="dialog" aria-modal="true" aria-labelledby="user-details-title"
          >
            {/* Header with a subtle thematic accent */}
            <div className="flex items-center justify-between p-5 px-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center gap-4">
                {profilePictureDisplayUrl ? (
                  <img
                    src={profilePictureDisplayUrl}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-xl font-semibold text-white shadow-md border-2 border-white">
                    {(user.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 id="user-details-title" className="text-xl font-semibold text-slate-800">
                    {user.username}
                  </h2>
                  <p className="text-sm text-slate-500 capitalize">
                    {user.role || "User Account"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                aria-label="Close user details"
              >
                <FaTimes size="1.3em" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">User ID</dt>
                  <dd className="mt-1 text-slate-700 bg-slate-50 px-2 py-1 rounded text-xs">{user.id || "N/A"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full capitalize ${currentStatus.bg} ${currentStatus.text}`}>
                      {currentStatus.icon}
                      {user.status || currentStatus.label}
                    </span>
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="font-medium text-slate-500">Email Address</dt>
                  <dd className="mt-1 text-slate-800 font-medium">{user.email || "N/A"}</dd>
                </div>
                
                <div>
                  <dt className="font-medium text-slate-500">Account Created</dt>
                  <dd className="mt-1 text-slate-700">{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Last Profile Update</dt>
                  <dd className="mt-1 text-slate-700">{formatDate(user.updatedAt)}</dd>
                </div>

                {/* Optional Fields - Render dynamically if present */}
                {user.university && (
                  <div><dt className="font-medium text-slate-500">University</dt><dd className="mt-1 text-slate-700">{user.university}</dd></div>
                )}
                {user.department && (
                  <div><dt className="font-medium text-slate-500">Department</dt><dd className="mt-1 text-slate-700">{user.department}</dd></div>
                )}
                {user.jobTitle && (
                  <div><dt className="font-medium text-slate-500">Job Title</dt><dd className="mt-1 text-slate-700">{user.jobTitle}</dd></div>
                )}
                {user.companyName && (
                  <div><dt className="font-medium text-slate-500">Company</dt><dd className="mt-1 text-slate-700">{user.companyName}</dd></div>
                )}
                 {user.medicalSpecialty && (
                  <div><dt className="font-medium text-slate-500">Medical Specialty</dt><dd className="mt-1 text-slate-700">{user.medicalSpecialty}</dd></div>
                )}
              </div>

              {user.bio && (
                <div className="pt-4 border-t border-slate-200">
                  <dt className="font-medium text-slate-500 mb-1">Biography</dt>
                  <dd className="text-slate-700 text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded-md">
                    {user.bio}
                  </dd>
                </div>
              )}
            </div>

            {/* Footer with Enhanced Actions */}
            <div className="flex flex-wrap justify-end items-center p-5 bg-slate-50 border-t border-slate-200 gap-3">
              <button
                onClick={() => {
                  // Consider opening a confirmation modal before calling onDeleteRequest
                  // For now, directly calling it as per original structure
                  if (window.confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) {
                     onDeleteRequest(user); // Call this after confirmation
                     onClose(); // Close this modal
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                title="Delete User Account"
              >
                <FaTrash className="mr-2 h-4 w-4" /> Delete User
              </button>
              
              {onEditRequest && ( // Conditionally render Edit button
               <button
                 onClick={() => { onEditRequest(user); onClose(); }} // Close modal then trigger edit action
                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                 title="Edit User Details"
               >
                  <FaEdit className="mr-2 h-4 w-4" /> Edit User
               </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UserDetailsModal;