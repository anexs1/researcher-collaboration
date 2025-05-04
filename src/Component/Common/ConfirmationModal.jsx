// src/components/common/ConfirmationModal.js
import React from "react";

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel, // Using onCancel for clarity, matches usage
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonClass = "bg-red-500 hover:bg-red-600 text-white",
  cancelButtonClass = "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200",
  isConfirming = false,
}) => {
  // Log when the component renders and the state of key props
  console.log(
    `[DEBUG] ConfirmationModal rendering. isOpen: ${isOpen}, isConfirming: ${isConfirming}, onConfirm exists: ${!!onConfirm}`
  );

  if (!isOpen) {
    return null;
  }

  const baseButtonClass =
    "px-4 py-2 rounded font-semibold transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // Specific Handlers with stopPropagation
  const handleCancelClick = (e) => {
    e.stopPropagation();
    if (onCancel) {
      console.log(
        "[DEBUG] ConfirmationModal: handleCancelClick running onCancel"
      );
      onCancel();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onCancel) {
      console.log(
        "[DEBUG] ConfirmationModal: handleOverlayClick running onCancel"
      );
      onCancel();
    }
  };

  // *** Direct inline onClick logging for extreme debugging ***
  const handleDirectConfirmClick = (e) => {
    e.stopPropagation(); // Still important!
    // Log that this specific handler fired
    console.error(
      "<<<<<< BUTTON onClick HANDLER FIRING DIRECTLY! (Inside ConfirmationModal) >>>>>>"
    );

    // Now, attempt to call the prop function passed from the parent
    if (onConfirm && !isConfirming) {
      console.log(
        "[DEBUG] ConfirmationModal: Direct handler trying to call onConfirm prop function..."
      );
      onConfirm(); // Call the actual prop function
    } else {
      // Log why the prop function wasn't called
      console.warn(
        `[DEBUG] ConfirmationModal: Direct handler DID NOT call onConfirm. isConfirming: ${isConfirming}, onConfirm prop exists: ${!!onConfirm}`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={handleOverlayClick} // Close on overlay click
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-enter"
        // Stop propagation is handled by buttons/overlay now
      >
        {/* Close button top right */}
        <button
          onClick={handleCancelClick} // Use specific handler
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-full transition-colors"
          aria-label="Close modal"
        >
          {/* SVG Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {" "}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />{" "}
          </svg>
        </button>

        {/* Title */}
        <h2
          id="modal-title"
          className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4"
        >
          {title}
        </h2>
        {/* Message */}
        <div className="text-gray-600 dark:text-gray-300 mb-6">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        {/* Button Container */}
        <div className="flex justify-end space-x-3">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancelClick} // Use specific handler
            className={`${baseButtonClass} ${cancelButtonClass}`}
            disabled={isConfirming}
          >
            {cancelButtonText}
          </button>

          {/* Confirm Button - Using the direct handler */}
          <button
            type="button"
            onClick={handleDirectConfirmClick} // <<< USE THE DIRECT HANDLER HERE
            className={`${baseButtonClass} ${confirmButtonClass}`}
            disabled={isConfirming} // Disable button if action is in progress
          >
            {/* Conditional content: Spinner or Text */}
            {isConfirming ? (
              <span className="flex items-center justify-center">
                {/* SVG Spinner */}
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
      {/* Add keyframes if needed, e.g., in index.css */}
      <style jsx global>{`
        @keyframes modal-enter {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ConfirmationModal;
