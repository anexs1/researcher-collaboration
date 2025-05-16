import React from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

const ProfileFieldDisplay = React.memo(
  ({ label, value, type = "text", Icon = null }) => {
    const isEmptyAndNotBio = !value && label !== "Bio";

    const renderValue = () => {
      if (!value) {
        return (
          <span className="text-slate-400 dark:text-slate-500 italic">
            Not specified
          </span>
        );
      }

      // **** START: Special handling for Skills display ****
      if ((label === "Skills" || type === "skills") && value) {
        // Check by label or a custom type
        try {
          const skillsArray = JSON.parse(value); // Value is expected to be a JSON string array
          if (Array.isArray(skillsArray) && skillsArray.length > 0) {
            return (
              <div className="flex flex-wrap gap-2 items-center">
                {skillsArray.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200 rounded-full text-xs sm:text-sm font-medium shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            );
          } else if (Array.isArray(skillsArray) && skillsArray.length === 0) {
            return (
              <span className="text-slate-400 dark:text-slate-500 italic">
                No skills listed.
              </span>
            );
          }
        } catch (e) {
          // If parsing fails, fall back to displaying the raw string (though ideally it's always valid JSON string)
          console.error("Failed to parse skills JSON for display:", value, e);
          return (
            <span className="break-words text-slate-700 dark:text-slate-200">
              {value} (Invalid format)
            </span>
          );
        }
      }
      // **** END: Special handling for Skills display ****

      if (type === "url") {
        const url =
          value.startsWith("http://") || value.startsWith("https://")
            ? value
            : `https://${value}`;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline break-all transition-colors inline-flex items-center group"
            title={`Visit ${label} link`}
          >
            <span className="truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
              {value}
            </span>
            <FaExternalLinkAlt
              size={12}
              className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          </a>
        );
      }
      if (type === "textarea") {
        return (
          <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200">
            {value}
          </p>
        );
      }
      return (
        <span className="break-words text-slate-700 dark:text-slate-200">
          {value}
        </span>
      );
    };

    return (
      <div className="w-full">
        <label className="block text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 flex items-center">
          {Icon && (
            <Icon className="text-slate-400 dark:text-slate-500 mr-2 h-4 w-4 flex-shrink-0" />
          )}
          {label}
        </label>
        <div className="mt-1 text-sm sm:text-base min-h-[24px] flex items-center">
          {renderValue()}
        </div>
      </div>
    );
  }
);

export default ProfileFieldDisplay;
