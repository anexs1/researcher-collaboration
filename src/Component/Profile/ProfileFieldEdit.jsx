import React from "react";

const ProfileFieldEdit = React.memo(
  ({
    label,
    name,
    value,
    onChange,
    type = "text",
    placeholder = "",
    disabled = false,
    Icon = null,
    rows = 4,
  }) => {
    const InputComponent = type === "textarea" ? "textarea" : "input";
    const inputType = type === "textarea" || type === "url" ? "text" : type; // Use text for url input visually

    return (
      <div className="mb-4 last:mb-0">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1.5"
        >
          {Icon && (
            <Icon
              className="text-gray-400 dark:text-gray-500 flex-shrink-0"
              size={14}
            />
          )}
          {label}
        </label>
        <div className="relative mt-1">
          {Icon && type !== "textarea" && (
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Icon className="text-gray-400 dark:text-gray-500" size={14} />
            </span>
          )}
          <InputComponent
            type={inputType} // Use 'text' for url inputs
            id={name}
            name={name}
            value={value || ""} // Ensure value is not null/undefined
            onChange={onChange}
            rows={type === "textarea" ? rows : undefined}
            className={`block w-full ${
              Icon && type !== "textarea" ? "pl-9" : "px-3"
            } py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-indigo-500 dark:focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed`}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={label}
          />
        </div>
      </div>
    );
  }
);

export default ProfileFieldEdit;
