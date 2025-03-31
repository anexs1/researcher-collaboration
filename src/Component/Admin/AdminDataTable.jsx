// src/Component/Admin/AdminDataTable.jsx
import React from "react";

// A very basic table component. Consider react-table for real applications.
const AdminDataTable = ({ columns = [], data = [] }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-4">No data available.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.Header}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td
                  key={`${col.Header}-${row.id || rowIndex}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {
                    col.Cell
                      ? col.Cell({ row }) // Use custom cell renderer if provided
                      : col.accessor // Otherwise use accessor
                      ? typeof col.accessor === "function"
                        ? col.accessor(row) // If accessor is a function
                        : row[col.accessor] // If accessor is a string key
                      : "N/A" // Fallback if no accessor or cell
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* TODO: Add Pagination Controls Here */}
    </div>
  );
};

export default AdminDataTable;
