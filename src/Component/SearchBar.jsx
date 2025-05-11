import React, { useState } from "react";

function SearchBar({ onSearch }) {
  const [term, setTerm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (term.trim()) {
      // Only search if term is not empty
      onSearch(term.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full max-w-2xl mx-auto"
      role="search"
    >
      <input
        type="search" // Use type="search" for better semantics and clear button on some browsers
        placeholder="Search topics (e.g., create account, upload publication...)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="w-full px-5 py-4 pr-16 text-slate-700 bg-white border-2 border-slate-300 rounded-full shadow-md focus:ring-4 focus:ring-blue-500/30 focus:border-blue-600 outline-none transition-all duration-300 ease-in-out placeholder-slate-400"
        aria-label="Search help articles"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ease-in-out"
        aria-label="Submit search"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </button>
    </form>
  );
}

export default SearchBar;
