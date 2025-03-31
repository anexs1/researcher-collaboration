// src/Page/Notification.jsx (or src/components/Notification.jsx)
import React from "react";

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  // Determine styles based on type
  let bgColor, borderColor, textColor;
  switch (type) {
    case "success":
      bgColor = "bg-green-100";
      borderColor = "border-green-400";
      textColor = "text-green-700";
      break;
    case "error":
    default: // Default to error style
      bgColor = "bg-red-100";
      borderColor = "border-red-400";
      textColor = "text-red-700";
      break;
    // Add other types like 'warning' or 'info' if needed
    // case 'warning':
    //   bgColor = 'bg-yellow-100';
    //   borderColor = 'border-yellow-400';
    //   textColor = 'text-yellow-700';
    //   break;
  }

  return (
    <div
      className={`border ${borderColor} ${bgColor} ${textColor} px-4 py-3 rounded relative mb-4 shadow-md`}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
      {/* Optional: Add a close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 bottom-0 right-0 px-4 py-3 font-bold text-xl"
          aria-label="Close notification"
        >
          × {/* Recommend using an icon library for consistency */}
        </button>
      )}
    </div>
  );
};

export default Notification;
