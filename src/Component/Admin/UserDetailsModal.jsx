import React from "react";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/solid"; // Import TrashIcon

const UserDetailsModal = ({
  isOpen,
  user,
  onClose,
  onDeleteRequest, // <-- Add new prop to request deletion
}) => {
  if (!isOpen || !user) return null;

  // Helper to format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString(); // Or .toLocaleDateString()
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Determine affiliation based on available fields (add more as needed)
  const getAffiliation = (usr) => {
    return (
      usr.affiliation ||
      usr.companyName ||
      usr.university ||
      usr.hospitalName ||
      "N/A"
    );
  };

  // --- Handler for Delete Button Click ---
  // Calls the function passed from the parent, providing user info
  const handleDeleteClick = () => {
    if (onDeleteRequest && typeof onDeleteRequest === "function") {
      onDeleteRequest(user.id, user.username); // Pass ID and username for confirmation/API call
    } else {
      console.warn(
        "onDeleteRequest prop is missing or not a function in UserDetailsModal"
      );
    }
    // Optionally close the modal immediately after requesting delete,
    // or let the parent close it after confirmation/API call.
    // onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      aria-labelledby="user-details-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        onClick={onClose} // Close on overlay click
      ></div>

      {/* Modal Content */}
      <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        {/* Header */}
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3
              className="text-lg leading-6 font-medium text-gray-900"
              id="user-details-title"
            >
              User Details: {user.username}
            </h3>
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body with User Details */}
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {/* User ID */}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 break-words">
                {user.id || "N/A"}
              </dd>
            </div>
            {/* Username */}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Username</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.username || "N/A"}
              </dd>
            </div>
            {/* Email */}
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 break-words">
                {user.email || "N/A"}
              </dd>
            </div>
            {/* Role */}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {user.role || "N/A"}
              </dd>
            </div>
            {/* Status */}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd
                className={`mt-1 text-sm font-semibold capitalize ${
                  user.status === "approved"
                    ? "text-green-600"
                    : user.status === "pending"
                    ? "text-yellow-600"
                    : user.status === "rejected"
                    ? "text-red-600"
                    : user.status === "banned"
                    ? "text-red-700"
                    : "text-gray-900" // Default
                }`}
              >
                {user.status || "N/A"}
              </dd>
            </div>
            {/* Affiliation */}
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Affiliation</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {getAffiliation(user)}
              </dd>
            </div>
            {/* Joined On */}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Joined On</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            {/* Last Updated */}
            {user.updatedAt && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(user.updatedAt)}
                </dd>
              </div>
            )}
            {/* Add more fields as needed */}
          </dl>
        </div>

        {/* Footer with Actions */}
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          {/* Close Button */}
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Close
          </button>

          {/* Delete Button (Added) */}
          {/* Render only if the onDeleteRequest prop is provided */}
          {onDeleteRequest && (
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={handleDeleteClick}
              // You might want a loading state from the parent to disable while deleting
              // disabled={isDeleting}
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Delete User
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
