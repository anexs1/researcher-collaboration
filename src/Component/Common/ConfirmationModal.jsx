// src/components/common/ConfirmationModal.js

import React from "react";

/**
 * A reusable confirmation modal component.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Whether the modal is currently open.
 * @param {string} props.title - The title text for the modal.
 * @param {string|React.ReactNode} props.message - The main content/message of the modal.
 * @param {function} props.onConfirm - Callback function executed when the confirm button is clicked.
 * @param {function} props.onCancel - Callback function executed when the cancel button or overlay is clicked.
 * @param {string} [props.confirmButtonText='Confirm'] - Text for the confirm button.
 * @param {string} [props.cancelButtonText='Cancel'] - Text for the cancel button.
 * @param {string} [props.confirmButtonClass='bg-red-500 hover:bg-red-600'] - Tailwind classes for the confirm button.
 * @param {string} [props.cancelButtonClass='bg-gray-300 hover:bg-gray-400'] - Tailwind classes for the cancel button.
 * @param {boolean} [props.isConfirming=false] - If true, shows a loading state on the confirm button.
 */
const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonClass = "bg-red-500 hover:bg-red-600 text-white", // Default to red for destructive actions
  cancelButtonClass = "bg-gray-200 hover:bg-gray-300 text-gray-800",
  isConfirming = false, // Optional loading state for async actions
}) => {
  if (!isOpen) {
    return null;
  }

  // Base button style
  const baseButtonClass =
    "px-4 py-2 rounded font-semibold transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onCancel} // Close on overlay click
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-enter"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        {/* Close button top right */}
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2
          id="modal-title"
          className="text-xl font-semibold text-gray-800 mb-4"
        >
          {title}
        </h2>
        <div className="text-gray-600 mb-6">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className={`${baseButtonClass} ${cancelButtonClass}`}
            disabled={isConfirming}
          >
            {cancelButtonText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`${baseButtonClass} ${confirmButtonClass}`}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              confirmButtonText
            )}
          </button>
        </div>
      </div>
      {/* Add keyframes for animation in your CSS/Tailwind config if needed */}
      {/* Example for Tailwind (in index.css or tailwind.config.js):
                @layer utilities {
                  @keyframes modal-enter {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                  }
                  .animate-modal-enter {
                    animation: modal-enter 0.2s ease-out forwards;
                  }
                }
            */}
    </div>
  );
};

export default ConfirmationModal;
