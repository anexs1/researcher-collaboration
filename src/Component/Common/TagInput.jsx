import React, { useState } from "react";
import { FaTimes } from "react-icons/fa"; // Import an icon for removal

const TagInput = ({
  tags = [],
  setTags,
  placeholder = "Add tags...",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");

  // Function to add a new tag
  const addTag = (tagValue) => {
    const newTag = tagValue.trim();
    // Prevent adding empty tags or duplicates
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]); // Update the parent component's state
    }
    setInputValue(""); // Clear the input field
  };

  // Handle key presses in the input field
  const handleKeyDown = (e) => {
    if (disabled) return; // Do nothing if disabled

    // Add tag on Enter or Comma
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); // Prevent form submission or typing a comma
      addTag(inputValue);
    }
    // Remove last tag on Backspace if input is empty
    else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.preventDefault(); // Prevent default backspace behavior (like navigating back)
      removeTag(tags.length - 1);
    }
  };

  // Handle input value change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle pasting tags (split by common delimiters)
  const handlePaste = (e) => {
    if (disabled) return;
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const tagsToPaste = paste
      .split(/,|\n|\t/)
      .map((tag) => tag.trim())
      .filter(Boolean); // Split by comma, newline, tab

    // Add unique tags from the pasted content
    const uniqueNewTags = tagsToPaste.filter((tag) => !tags.includes(tag));
    if (uniqueNewTags.length > 0) {
      setTags([...tags, ...uniqueNewTags]);
    }
    setInputValue(""); // Clear input after paste
  };

  // Function to remove a tag by its index
  const removeTag = (indexToRemove) => {
    if (disabled) return;
    setTags(tags.filter((_, index) => index !== indexToRemove)); // Update parent state
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-2 border rounded-md transition-colors ${
        disabled
          ? "bg-gray-100 cursor-not-allowed border-gray-200"
          : "bg-white border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
      }`}
    >
      {/* Render existing tags */}
      {tags.map((tag, index) => (
        <span
          key={index}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs sm:text-sm font-medium ${
            disabled
              ? "bg-gray-300 text-gray-600"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className={`ml-1 p-0.5 rounded-full ${
              disabled
                ? "text-gray-500 cursor-not-allowed"
                : "text-indigo-500 hover:text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            }`}
            disabled={disabled}
            aria-label={`Remove ${tag}`}
          >
            <FaTimes size="0.75em" /> {/* Use icon */}
          </button>
        </span>
      ))}
      {/* Input field for adding new tags */}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={tags.length === 0 ? placeholder : ""} // Show placeholder only when empty
        className="flex-grow p-0.5 outline-none text-sm bg-transparent disabled:cursor-not-allowed disabled:bg-gray-100" // Make input blend in
        disabled={disabled}
        aria-label="Add new tag"
      />
    </div>
  );
};

export default TagInput;
