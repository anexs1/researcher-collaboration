import React from "react";

function CategoryNav({ categories, selectedCategory, onSelectCategory }) {
  return (
    <nav className="mb-6 md:mb-8" aria-label="Help Categories">
      <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
        <li>
          <button
            onClick={() => onSelectCategory(null)}
            type="button"
            className={`px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
              ${
                !selectedCategory
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white ring-indigo-500 transform hover:scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 ring-slate-400 transform hover:shadow-md"
              }`}
          >
            All Topics
          </button>
        </li>
        {categories.map((cat) => (
          <li key={cat.id || cat.slug}>
            <button
              onClick={() => onSelectCategory(cat.slug)}
              type="button"
              className={`px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out
                ${
                  selectedCategory === cat.slug
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white ring-indigo-500 transform hover:scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 ring-slate-400 transform hover:shadow-md"
                }`}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default CategoryNav;
