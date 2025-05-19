// src/Component/Admin/RecentActivityCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton";
import {
  FaUsers,        // Example icon for Users
  FaNewspaper,    // Example icon for Publications
  FaProjectDiagram, // Example icon for Projects
  FaInfoCircle,   // For "No activity"
} from "react-icons/fa";

// Helper to format date (remains the same)
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric" // Added year for more context
    });
  } catch { return "Invalid Date"; }
};

// Color themes for different activity types
const activityThemes = {
  users: {
    icon: FaUsers,
    iconColor: "text-sky-500",
    bgColor: "bg-sky-50",
    hoverBgColor: "hover:bg-sky-100",
    borderColor: "border-sky-200", // For the card itself or title underline
    titleColor: "text-sky-700",
  },
  publications: {
    icon: FaNewspaper,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-50",
    hoverBgColor: "hover:bg-emerald-100",
    borderColor: "border-emerald-200",
    titleColor: "text-emerald-700",
  },
  projects: {
    icon: FaProjectDiagram,
    iconColor: "text-violet-500",
    bgColor: "bg-violet-50",
    hoverBgColor: "hover:bg-violet-100",
    borderColor: "border-violet-200",
    titleColor: "text-violet-700",
  },
  default: { // Fallback
    icon: FaInfoCircle,
    iconColor: "text-slate-500",
    bgColor: "bg-slate-50",
    hoverBgColor: "hover:bg-slate-100",
    borderColor: "border-slate-200",
    titleColor: "text-slate-700",
  }
};


const RecentActivityCard = ({
  title,
  items = [],
  linkPrefix,
  keyPrefix, // Used to determine the theme (e.g., "users", "publications")
  isLoading,
  cardClassName = "", // Allow passing additional classes
}) => {
  const theme = activityThemes[keyPrefix?.toLowerCase()] || activityThemes.default;
  const IconComponent = theme.icon;

  if (isLoading) {
    return (
      <div className={`bg-white p-5 rounded-xl shadow-lg border border-slate-200 animate-pulse ${cardClassName}`}>
        <div className="flex items-center mb-4">
          <LoadingSkeleton height="h-7" width="h-7" rounded="rounded-full" className="mr-3 bg-slate-200" />
          <LoadingSkeleton height="h-6" width="w-3/5" className="bg-slate-200" />
        </div>
        <div className="space-y-3.5"> {/* Slightly more space */}
          {[...Array(4)].map((_, i) => (
            <div key={`skel-item-${i}`} className="flex justify-between items-center">
              <LoadingSkeleton height="h-4" width="w-2/3" className="bg-slate-100" />
              <LoadingSkeleton height="h-3" width="w-1/4" className="bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-5 rounded-xl shadow-xl border ${theme.borderColor} flex flex-col h-full transition-all duration-300 hover:shadow-2xl ${cardClassName}`}>
      <div className={`flex items-center mb-4 pb-3 border-b ${theme.borderColor} flex-shrink-0`}>
        {IconComponent && (
          <IconComponent className={`h-6 w-6 mr-3 ${theme.iconColor}`} />
        )}
        <h3 className={`font-semibold text-lg ${theme.titleColor}`}>
          {title}
        </h3>
      </div>

      <div className="flex-grow max-h-72 overflow-y-auto custom-scrollbar pr-2 space-y-1"> {/* Added space-y-1 */}
        {items.length > 0 ? (
          <ul className="text-sm divide-y divide-slate-100"> {/* Subtle dividers */}
            {items.map((item) => (
              <li key={`${keyPrefix}-${item.id}`}>
                <Link
                  to={`${linkPrefix}/${item.id}`}
                  className={`flex items-center justify-between space-x-3 py-2.5 px-2 -mx-2 rounded-lg ${theme.hoverBgColor} group transition-colors duration-150`}
                  title={item.title || item.username}
                >
                  <span className="font-medium text-slate-700 group-hover:text-slate-900 truncate flex-grow">
                    {item.title || item.username || `Item ${item.id}`}
                  </span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-600 flex-shrink-0 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 text-slate-500">
            <theme.icon className={`h-12 w-12 ${theme.iconColor} opacity-50 mb-4`} />
            <p className="text-sm italic">No recent activity to display.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivityCard;