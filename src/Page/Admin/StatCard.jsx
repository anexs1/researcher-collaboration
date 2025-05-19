import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton";

// Helper to calculate percentage change (remains the same)
const calculateChange = (current, previous) => {
  if (previous === null || previous === undefined || previous === 0) return null;
  if (current === null || current === undefined) return null;
  const change = ((current - previous) / previous) * 100;
  if (!isFinite(change)) return null;
  return change;
};

// Refined Color Map for a more "advanced dashboard" feel
const colorMap = {
  // Primary Accent for Dashboards (e.g., Sky Blue or a sophisticated Teal)
  sky: {
    iconBg: "bg-sky-100", // Lighter, solid background for icon container
    iconText: "text-sky-600", // Stronger icon color
    hoverBorder: "hover:border-sky-400", // Subtle border highlight on hover
    linkText: "text-sky-600",
    linkHoverText: "hover:text-sky-700",
    valueText: "text-slate-900", // Main value color (can be consistent)
  },
  // Emerald for positive indicators or specific sections
  emerald: {
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400",
    linkText: "text-emerald-600",
    linkHoverText: "hover:text-emerald-700",
    valueText: "text-slate-900",
  },
  // Amber for warnings or pending items
  amber: {
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    hoverBorder: "hover:border-amber-400",
    linkText: "text-amber-600",
    linkHoverText: "hover:text-amber-700",
    valueText: "text-slate-900",
  },
  // Red for critical alerts or negative trends
  red: {
    iconBg: "bg-red-100",
    iconText: "text-red-600",
    hoverBorder: "hover:border-red-400",
    linkText: "text-red-600",
    linkHoverText: "hover:text-red-700",
    valueText: "text-slate-900",
  },
  // Violet or Purple for specific categories
  violet: {
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
    hoverBorder: "hover:border-violet-400",
    linkText: "text-violet-600",
    linkHoverText: "hover:text-violet-700",
    valueText: "text-slate-900",
  },
  // Teal as another primary or secondary accent
  teal: {
    iconBg: "bg-teal-100",
    iconText: "text-teal-600",
    hoverBorder: "hover:border-teal-400",
    linkText: "text-teal-600",
    linkHoverText: "hover:text-teal-700",
    valueText: "text-slate-900",
  },
  // Blue for general information or another accent
  blue: {
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    hoverBorder: "hover:border-blue-400",
    linkText: "text-blue-600",
    linkHoverText: "hover:text-blue-700",
    valueText: "text-slate-900",
  },
  // Slate for neutral/settings cards
  slate: {
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    hoverBorder: "hover:border-slate-400",
    linkText: "text-slate-600",
    linkHoverText: "hover:text-slate-700",
    valueText: "text-slate-900",
  },
  // Default (if color prop doesn't match)
  default: {
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    hoverBorder: "hover:border-slate-400",
    linkText: "text-slate-600",
    linkHoverText: "hover:text-slate-700",
    valueText: "text-slate-900",
  },
};


const StatCard = ({
  title,
  value,
  icon,
  linkTo,
  linkText = "View Details",
  color = "sky", // Default to a modern primary like sky
  isLoading = false,
  previousValue,
  changePeriod = "vs last period",
}) => {
  const changePercent = calculateChange(value, previousValue);
  const isPositiveChange = changePercent !== null && changePercent >= 0;
  const isNegativeChange = changePercent !== null && changePercent < 0;

  const themeClasses = colorMap[color] || colorMap.default;
  const minCardHeight = "min-h-[170px]"; // Adjusted min height (approx 10.625rem)

  if (isLoading) {
    return (
      <div
        className={`bg-white overflow-hidden shadow-lg rounded-xl border border-slate-200 p-5 ${minCardHeight} flex flex-col animate-pulse`}
      >
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <LoadingSkeleton height="h-6" width="w-3/5" className="bg-slate-200" />
          <LoadingSkeleton height="h-12" width="w-12" rounded="rounded-full" className="bg-slate-200" />
        </div>
        <div className="flex-grow flex flex-col justify-center py-1">
          <LoadingSkeleton height="h-10" width="w-1/2" className="mb-2 bg-slate-300" />
          <LoadingSkeleton height="h-4" width="w-1/3" className="bg-slate-200" />
        </div>
        <div className="mt-auto pt-2 flex-shrink-0">
          <LoadingSkeleton height="h-5" width="w-2/5" className="bg-slate-200" />
        </div>
      </div>
    );
  }

  const cardContent = (
    <>
      <div className="flex items-start justify-between flex-shrink-0">
        <dt className="text-sm font-medium text-slate-500 truncate" title={title}>
          {title}
        </dt>
        {icon && (
          <dd className={`flex-shrink-0 p-3 rounded-full ${themeClasses.iconBg}`}>
            {React.cloneElement(icon, {
              className: `h-6 w-6 ${themeClasses.iconText}`,
              strokeWidth: "1.5", // Thinner stroke for outline icons
            })}
          </dd>
        )}
      </div>

      <div className="mt-1 flex-grow flex flex-col justify-center">
        <div className="flex items-baseline justify-start gap-x-2"> {/* Aligned to start */}
          <dd className={`text-4xl font-bold ${themeClasses.valueText} tracking-tight`}>
            {value ?? <span className="text-slate-400">N/A</span>}
          </dd>
          {changePercent !== null && (
            <div
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                isPositiveChange
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
              title={`${changePercent.toFixed(1)}% ${changePeriod}`}
            >
              {isPositiveChange ? (
                <ArrowUpIcon className="mr-0.5 h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              ) : (
                <ArrowDownIcon className="mr-0.5 h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              )}
              {Math.abs(changePercent).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {linkTo && (
        <div className={`mt-auto pt-3 text-sm font-semibold ${themeClasses.linkText} ${themeClasses.linkHoverText} flex items-center gap-1.5 group-hover:gap-2 transition-all duration-200 flex-shrink-0`}>
          {linkText}
          <ArrowRightIcon className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      )}
      {!linkTo && <div className="h-[2.125rem] flex-shrink-0 mt-auto"></div>} {/* Approx height of link text line + pt-3 */}
    </>
  );

  const cardWrapperClasses = `
    relative group
    bg-white
    overflow-hidden
    shadow-lg hover:shadow-xl focus-within:shadow-xl
    rounded-xl
    border border-slate-200 ${themeClasses.hoverBorder}
    p-5
    ${minCardHeight}
    flex flex-col
    transition-all duration-300 ease-out 
    transform hover:-translate-y-1 focus-within:-translate-y-1 
  `;
  // Added focus-within for keyboard navigation a11y

  return linkTo ? (
    <Link to={linkTo} className={cardWrapperClasses} aria-label={`${title}: ${value}. ${linkText}`}>
      {cardContent}
    </Link>
  ) : (
    <div className={cardWrapperClasses} role="figure" aria-label={`${title}: ${value}`}>
      {cardContent}
    </div>
  );
};

export default StatCard;