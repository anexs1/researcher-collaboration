// src/Component/Admin/AdminDataTable.jsx
import React, { useState, useMemo } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/20/solid";

// --- Sub-component for Pagination ---
const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
}) => {
  const handlePrev = () => onPageChange(currentPage - 1);
  const handleNext = () => onPageChange(currentPage + 1);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 bg-white rounded-b-lg">
      {/* Items per page dropdown */}
      <div className="flex items-center text-sm text-gray-700">
        <label htmlFor="itemsPerPage" className="mr-2">
          Rows:
        </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm py-1"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Page info */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalItems}</span> results
        </p>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-end items-center space-x-1">
        <button
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 px-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// --- Main Table Component ---
const AdminDataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  error = null,
  renderActions, // Optional: (item) => JSX for action buttons
  defaultSort = { key: null, direction: "ascending" }, // Default sort config
}) => {
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default items per page

  // --- Sorting Logic ---
  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA =
          typeof sortConfig.key === "function"
            ? sortConfig.key(a)
            : a[sortConfig.key];
        const valB =
          typeof sortConfig.key === "function"
            ? sortConfig.key(b)
            : b[sortConfig.key];

        if (valA < valB) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  // --- Pagination Logic ---
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedData.slice(firstPageIndex, lastPageIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  // Reset to page 1 when itemsPerPage changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // --- Handlers ---
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (
      sortConfig.key === key &&
      sortConfig.direction === "descending"
    ) {
      // Optional: Reset sort or cycle back to ascending
      key = null; // Reset sort if clicked again while descending
      direction = "ascending";
    }
    setCurrentPage(1); // Reset to page 1 on sort change
    setSortConfig({ key, direction });
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // --- Rendering ---
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow text-center">
        <p className="text-gray-500 animate-pulse">Loading data...</p>
        {/* You could add skeleton rows here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow">
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500">
        No data available.
      </div>
    );
  }

  return (
    <div className="shadow border-b border-gray-200 sm:rounded-lg overflow-hidden">
      <div className="overflow-x-auto align-middle inline-block min-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.Header}
                  scope="col"
                  onClick={() =>
                    col.sortable !== false && handleSort(col.accessor || col.id)
                  } // Use accessor or explicit id for sorting
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                    col.sortable !== false
                      ? "cursor-pointer hover:bg-gray-100"
                      : ""
                  }`}
                  style={col.width ? { width: col.width } : {}} // Optional width control
                >
                  <div className="flex items-center">
                    {col.Header}
                    {col.sortable !== false &&
                      sortConfig.key === (col.accessor || col.id) && (
                        <span className="ml-1">
                          {sortConfig.direction === "ascending" ? (
                            <ArrowUpIcon className="h-3 w-3" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3" />
                          )}
                        </span>
                      )}
                  </div>
                </th>
              ))}
              {renderActions && (
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="hover:bg-gray-50 transition-colors duration-100"
              >
                {columns.map((col) => (
                  <td
                    key={`${col.Header}-${row.id || rowIndex}`}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                  >
                    {col.Cell
                      ? col.Cell({ row, value: row[col.accessor] }) // Pass value too for convenience
                      : col.accessor // Use accessor
                      ? typeof col.accessor === "function"
                        ? col.accessor(row) // If accessor is a function
                        : row[col.accessor] // If accessor is a string key
                      : "N/A"}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* --- Pagination --- */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={totalItems}
        />
      )}
    </div>
  );
};

export default AdminDataTable;
