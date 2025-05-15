import React from "react";

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const pageNumbers = [];
  const maxPagesToShow = 5;
  const halfMax = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage - halfMax);
  let endPage = Math.min(totalPages, currentPage + halfMax);

  if (currentPage - halfMax < 1) {
    endPage = Math.min(totalPages, maxPagesToShow);
  }
  if (currentPage + halfMax > totalPages) {
    startPage = Math.max(1, totalPages - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const renderPageButton = (page) => (
    <button
      key={page}
      onClick={() => onPageChange(page)}
      disabled={isLoading}
      className={`px-3 py-1.5 md:px-4 md:py-2 border rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
        currentPage === page
          ? "bg-blue-600 text-white border-blue-600 z-10"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
    >
      {page}
    </button>
  );

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex justify-center items-center space-x-1 md:space-x-2"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous Page"
      >
        « Prev
      </button>

      {startPage > 1 && (
        <>
          {renderPageButton(1)}
          {startPage > 2 && (
            <span className="px-2 py-2 text-gray-500 self-end">...</span>
          )}
        </>
      )}

      {pageNumbers.map((pageNumber) => renderPageButton(pageNumber))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 py-2 text-gray-500 self-end">...</span>
          )}
          {renderPageButton(totalPages)}
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next Page"
      >
        Next »
      </button>
    </nav>
  );
};

export default PaginationControls;
