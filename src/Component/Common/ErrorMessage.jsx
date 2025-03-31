// src/Component/Common/ErrorMessage.jsx
import React from "react";
import { FaExclamationCircle, FaTimes } from "react-icons/fa";

const ErrorMessage = ({ message, onClose }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded relative shadow-md mb-4"
      role="alert"
    >
      <div className="flex items-center">
        <FaExclamationCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
        <div className="flex-grow">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-red-500 hover:text-red-700 font-bold text-xl flex-shrink-0"
            aria-label="Close error message"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
