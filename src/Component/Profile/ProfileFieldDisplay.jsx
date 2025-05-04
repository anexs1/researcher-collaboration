import React from "react";
import { FaExternalLinkAlt } from "react-icons/fa"; // For URL links

const ProfileFieldDisplay = React.memo(
  ({ label, value, type = "text", Icon = null }) => {
    const displayValue = value || "";
    const isEmpty = !displayValue;

    if (isEmpty && label !== "Bio") {
      // Always show Bio section container, but maybe not the field itself?
      // Let ProfileContent decide whether to show the whole section
      // This component just renders if value exists
      // return null; // Don't render if empty (handled by ProfileContent now)
    }

    const renderValue = () => {
      if (isEmpty) {
        return (
          <span className="text-gray-400 dark:text-gray-500 italic">
            Not provided
          </span>
        );
      }
      if (type === "url") {
        // Ensure URL has protocol for correct linking
        const url =
          displayValue.startsWith("http://") ||
          displayValue.startsWith("https://")
            ? displayValue
            : `https://${displayValue}`;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline break-all transition-colors inline-flex items-center gap-1.5 group"
            title={`Visit ${label} link`}
          >
            <span className="truncate">{displayValue}</span>{" "}
            {/* Truncate long URLs */}
            <FaExternalLinkAlt
              size={11}
              className="opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          </a>
        );
      }
      if (type === "textarea") {
        return (
          <p className="whitespace-pre-wrap break-words">{displayValue}</p>
        );
      }
      return <span className="break-words">{displayValue}</span>;
    };

    return (
      <div className="mb-4 last:mb-0">
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
          {Icon && (
            <Icon
              className="text-gray-400 dark:text-gray-500 flex-shrink-0"
              size={14}
            />
          )}
          {label}
        </label>
        <div className="mt-1 text-sm sm:text-base text-gray-800 dark:text-gray-100 min-h-[28px] flex items-center">
          {" "}
          {/* Ensure min height */}
          {renderValue()}
        </div>
      </div>
    );
  }
);

export default ProfileFieldDisplay;
