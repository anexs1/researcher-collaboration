// src/Component/Admin/UserDetailsModal.jsx
import React from "react";
import { FaTimes, FaUserCircle, FaTrash, FaEdit } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
const modalVariants = {
  hidden: { y: "-20%", opacity: 0 },
  visible: { y: "0%", opacity: 1 },
  exit: { y: "20%", opacity: 0 },
};

// Helper to format dates
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

// Helper for status badge styling
const getStatusClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "suspended":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function UserDetailsModal({
  isOpen,
  onClose,
  user,
  onDeleteRequest,
  onEditRequest,
}) {
  if (!user) return null; // Don't render if no user data

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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          ></div>

          {/* Modal Content */}
          <motion.div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                {user.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-lg font-semibold text-white shadow border-2 border-white">
                    {(user.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2
                    id="user-details-title"
                    className="text-lg font-semibold text-gray-800"
                  >
                    {user.username}
                  </h2>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role || "User"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
                aria-label="Close user details"
              >
                <FaTimes size="1.2em" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {/* Add more fields as needed */}
                <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-gray-900">{user.email || "N/A"}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusClass(
                        user.status
                      )}`}
                    >
                      {user.status || "N/A"}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Joined</dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDate(user.updatedAt)}
                  </dd>
                </div>

                {/* Optional Fields */}
                {user.university && (
                  <div className="sm:col-span-1">
                    <dt className="font-medium text-gray-500">University</dt>
                    <dd className="mt-1 text-gray-900">{user.university}</dd>
                  </div>
                )}
                {user.department && (
                  <div className="sm:col-span-1">
                    <dt className="font-medium text-gray-500">Department</dt>
                    <dd className="mt-1 text-gray-900">{user.department}</dd>
                  </div>
                )}
                {user.jobTitle && (
                  <div className="sm:col-span-1">
                    <dt className="font-medium text-gray-500">Job Title</dt>
                    <dd className="mt-1 text-gray-900">{user.jobTitle}</dd>
                  </div>
                )}
                {/* Add other fields like companyName, medicalSpecialty, etc. */}

                {user.bio && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-gray-500">Bio</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {user.bio}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Footer with Actions */}
            <div className="flex justify-end items-center p-4 bg-gray-50 border-t border-gray-200 gap-3">
              <button
                onClick={() => {
                  onClose();
                  onDeleteRequest(user);
                }} // Close modal then trigger delete confirmation
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                title="Delete User"
              >
                <FaTrash className="mr-1.5 h-3 w-3" /> Delete
              </button>
              {/* Add Edit button if you implement edit page/modal */}
              {/*
               <button
                 onClick={() => { onClose(); onEditRequest(user); }}
                 className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                 title="Edit User"
               >
                  <FaEdit className="mr-1.5 h-3 w-3" /> Edit
               </button>
               */}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
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
