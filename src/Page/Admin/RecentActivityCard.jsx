// src/Component/Admin/RecentActivityCard.jsx
// Note: Ensure this file is actually saved in src/Component/Admin/ and not src/Page/Admin/

import React from "react";
import { Link } from "react-router-dom";
// --- *** CORRECTED IMPORT PATH *** ---
// Go up two levels from Component/Admin/ to src/, then down to Component/Common/
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton";
// If RecentActivityCard is actually in Page/Admin, the path would be:
// import LoadingSkeleton from '../../Component/Common/LoadingSkeleton';
// --- ************************** ---

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const RecentActivityCard = ({
  title,
  items = [],
  linkPrefix,
  keyPrefix,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 animate-pulse">
        <LoadingSkeleton height="h-6" width="w-1/2" className="mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <LoadingSkeleton key={`skel-${keyPrefix}-${i}`} height="h-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
      {" "}
      {/* Added h-full */}
      <h3 className="font-semibold text-lg text-gray-800 mb-3 border-b border-gray-200 pb-2 flex-shrink-0">
        {" "}
        {/* Prevent header shrinking */}
        {title}
      </h3>
      <div className="flex-grow max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {" "}
        {/* Scrollable content */}
        {items.length > 0 ? (
          <ul className="space-y-2.5 text-sm">
            {items.map((item) => (
              <li
                key={`${keyPrefix}-${item.id}`}
                className="flex items-center justify-between space-x-2 hover:bg-gray-50 p-1.5 rounded-md transition-colors"
              >
                <Link
                  to={`${linkPrefix}/${item.id}`}
                  className="font-medium text-gray-700 hover:text-indigo-600 hover:underline truncate flex-grow"
                  title={item.title || item.username}
                >
                  {item.title || item.username || `Item ${item.id}`}
                </Link>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatDate(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm italic text-center py-10">
            No recent activity.
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentActivityCard;
