// src/Page/ConfirmationModal.jsx (or src/components/ConfirmationModal.jsx)
import React, { useEffect, useRef } from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa"; // Example using icons

const ConfirmationModal = ({
  isOpen,
  title = "Confirm Action", // Default title
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-500 hover:bg-red-700", // Default dangerous action style
  cancelButtonClass = "bg-gray-300 hover:bg-gray-400 text-gray-800",
}) => {
  const modalRef = useRef(null);

  // Optional: Close modal on Escape key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Optional: Focus management - focus the cancel button or the modal itself
      setTimeout(() => modalRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onCancel]);

  // Optional: Close modal on backdrop click
  const handleBackdropClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick} // Add backdrop click handler
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        ref={modalRef} // Add ref for focus management and backdrop click check
        className="modal-content bg-white rounded-lg p-6 w-full max-w-sm shadow-xl"
        tabIndex="-1" // Make modal focusable
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            id="confirmation-modal-title"
            className="text-lg font-semibold flex items-center"
          >
            {/* Optional: Icon */}
            {/* <FaExclamationTriangle className="text-yellow-500 mr-2" /> */}
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-800 text-2xl"
            aria-label="Close confirmation modal"
          >
            <FaTimes />
          </button>
        </div>

        <p className="mb-6 text-gray-700">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className={`btn font-bold py-2 px-4 rounded transition-colors ${cancelButtonClass}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn text-white font-bold py-2 px-4 rounded transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
