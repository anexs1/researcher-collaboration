// src/Component/Common/SearchBar.jsx
import React, { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const SearchBar = ({
  placeholder = "Search...",
  onSearch, // Function called with the search term
  initialValue = "",
  className = "", // Class for the wrapping div
  inputClassName = "", // Class for the input element
  buttonClassName = "", // Class for the search button
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
    // Optional: Call onSearch on every change (consider debouncing)
    // onSearch(event.target.value);
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && onSearch) {
      event.preventDefault(); // Prevent form submission if inside a form
      onSearch(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    if (onSearch) {
      onSearch(""); // Trigger search with empty term to reset results
    }
  };

  return (
    <div className={`relative flex items-center w-full max-w-lg ${className}`}>
      {/* Search Icon Inside */}
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaSearch className="h-4 w-4 text-gray-400" />
      </span>

      <input
        type="search" // Use type="search" for potential native clear button (browser dependent)
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputClassName}`}
        aria-label="Search"
      />

      {/* Clear Button Inside */}
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      )}

      {/* Optional: Explicit Search Button Outside */}
      {/*
             <button
                type="button"
                onClick={handleSearchClick}
                className={`ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${buttonClassName}`}
            >
                 Search
             </button>
             */}
    </div>
  );
};

export default SearchBar;
