// src/Component/Common/LoadingSpinner.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const LoadingSpinner = ({
  size = "md", // sm, md, lg, xl or custom tailwind class like 'h-10 w-10'
  text = "", // Optional text like "Loading..."
  className = "", // Allow passing additional classes
  textColor = "text-gray-600", // Default text color
  spinnerColor = "text-blue-500", // Default spinner color
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  };

  const spinnerSizeClass = sizeClasses[size] || size; // Use predefined or custom class

  return (
    <div
      className={`flex items-center justify-center space-x-2 ${textColor} ${className}`}
    >
      <FaSpinner
        className={`animate-spin ${spinnerSizeClass} ${spinnerColor}`}
      />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
