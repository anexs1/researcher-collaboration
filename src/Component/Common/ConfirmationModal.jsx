// src/Component/Common/ConfirmationModal.jsx
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
  confirmButtonClass = "bg-red-600 hover:bg-red-700", // Default dangerous action style
  cancelButtonClass = "bg-gray-300 hover:bg-gray-400 text-gray-800",
  icon = <FaExclamationTriangle className="text-yellow-500 mr-2 h-5 w-5" />, // Default icon
}) => {
  const modalRef = useRef(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Optional: Focus management - focus the cancel button or the modal itself
      setTimeout(() => modalRef.current?.focus(), 50); // Small delay might help
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onCancel]);

  // Close modal on backdrop click
  const handleBackdropClick = (event) => {
    // Check if the click is directly on the backdrop (the outer div)
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      {/* Modal Content Box */}
      <div
        ref={modalRef}
        className="modal-content bg-white rounded-lg p-6 w-full max-w-sm shadow-xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        tabIndex="-1" // Make modal focusable
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3
            id="confirmation-modal-title"
            className="text-lg font-semibold text-gray-800 flex items-center"
          >
            {icon}
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700 text-2xl transition-colors"
            aria-label="Close confirmation modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* Message Body */}
        <p className="mb-6 text-gray-700">{message}</p>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className={`btn font-bold py-2 px-4 rounded transition-colors duration-200 ease-in-out ${cancelButtonClass}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn text-white font-bold py-2 px-4 rounded transition-colors duration-200 ease-in-out ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
      {/* Add animation keyframes in your global CSS (e.g., index.css) if needed: */}
      {/*
             @keyframes fadeInScale {
               from { opacity: 0; transform: scale(0.95); }
               to { opacity: 1; transform: scale(1); }
             }
             .animate-fade-in-scale { animation: fadeInScale 0.3s ease-out forwards; }
            */}
    </div>
  );
};

export default ConfirmationModal;
