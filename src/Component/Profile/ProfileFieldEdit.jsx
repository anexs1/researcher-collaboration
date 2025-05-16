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
    Icon = null, // Expecting an actual component
    rows = 4,
  }) => {
    const InputComponent = type === "textarea" ? "textarea" : "input";
    // Textarea doesn't use input 'type' attribute. For input, map 'url' to 'text' for styling consistency
    const inputType = type === "textarea" || type === "url" ? undefined : type;

    const baseInputClasses =
      "block w-full rounded-lg border shadow-sm sm:text-sm p-3 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-slate-800";
    const enabledClasses =
      "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500";
    const disabledClasses =
      "bg-slate-100 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed";

    const hasIconForInput = Icon && type !== "textarea";

    return (
      // The parent (ProfileContent's grid) will handle col-span if needed.
      // Each field takes full width of its grid cell.
      <div className="w-full">
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center"
        >
          {Icon &&
            type === "textarea" && ( // Show icon next to label for textarea
              <Icon className="text-slate-400 dark:text-slate-500 mr-2 h-4 w-4 flex-shrink-0" />
            )}
          {label}
        </label>
        <div className="relative">
          {hasIconForInput && ( // Icon inside input field for non-textarea types
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Icon className="text-slate-400 dark:text-slate-500 h-4 w-4" />
            </div>
          )}
          <InputComponent
            type={inputType}
            id={name}
            name={name}
            value={value || ""}
            onChange={onChange}
            rows={type === "textarea" ? rows : undefined}
            className={`${baseInputClasses} ${
              disabled ? disabledClasses : enabledClasses
            } ${hasIconForInput ? "pl-10" : "px-3"}`}
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
