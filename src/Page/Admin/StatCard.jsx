import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowUpIcon, // For positive change
  ArrowDownIcon, // For negative change
} from "@heroicons/react/24/outline";
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton"; // Assuming path is correct

// Helper to calculate percentage change
const calculateChange = (current, previous) => {
  if (previous === null || previous === undefined || previous === 0)
    return null;
  if (current === null || current === undefined) return null;
  const change = ((current - previous) / previous) * 100;
  if (!isFinite(change)) return null;
  return change;
};

// Enhanced Color Map with Gradients for Icon Backgrounds
const colorMap = {
  indigo: {
    bg: "bg-gradient-to-br from-indigo-100 to-indigo-200",
    text: "text-indigo-600",
    hoverBorder: "hover:border-indigo-300",
    linkText: "text-indigo-600",
    linkHoverText: "hover:text-indigo-800",
  },
  green: {
    bg: "bg-gradient-to-br from-green-100 to-green-200",
    text: "text-green-600",
    hoverBorder: "hover:border-green-300",
    linkText: "text-green-600",
    linkHoverText: "hover:text-green-800",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-100 to-amber-200",
    text: "text-amber-600",
    hoverBorder: "hover:border-amber-300",
    linkText: "text-amber-600",
    linkHoverText: "hover:text-amber-800",
  },
  red: {
    bg: "bg-gradient-to-br from-red-100 to-red-200",
    text: "text-red-600",
    hoverBorder: "hover:border-red-300",
    linkText: "text-red-600",
    linkHoverText: "hover:text-red-800",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-100 to-purple-200",
    text: "text-purple-600",
    hoverBorder: "hover:border-purple-300",
    linkText: "text-purple-600",
    linkHoverText: "hover:text-purple-800",
  },
  teal: {
    bg: "bg-gradient-to-br from-teal-100 to-teal-200",
    text: "text-teal-600",
    hoverBorder: "hover:border-teal-300",
    linkText: "text-teal-600",
    linkHoverText: "hover:text-teal-800",
  },
  sky: {
    bg: "bg-gradient-to-br from-sky-100 to-sky-200",
    text: "text-sky-600",
    hoverBorder: "hover:border-sky-300",
    linkText: "text-sky-600",
    linkHoverText: "hover:text-sky-800",
  },
  gray: {
    bg: "bg-gradient-to-br from-gray-100 to-gray-200",
    text: "text-gray-600",
    hoverBorder: "hover:border-gray-300", // Keep gray border subtle
    linkText: "text-gray-600",
    linkHoverText: "hover:text-gray-800",
  },
};

const StatCard = ({
  title,
  value,
  icon,
  linkTo,
  linkText = "View Details",
  color = "indigo", // Default color theme
  isLoading = false,
  previousValue,
  changePeriod = "vs last period",
}) => {
  const changePercent = calculateChange(value, previousValue);
  const isPositiveChange = changePercent !== null && changePercent >= 0;
  const isNegativeChange = changePercent !== null && changePercent < 0;

  // Use selected theme or fallback to indigo
  const themeClasses = colorMap[color] || colorMap.indigo;
  // Define a minimum height - adjust as needed (11rem = 176px)
  const minCardHeight = "min-h-44"; // <--- Adjust this value if needed

  // --- Loading Skeleton ---
  if (isLoading) {
    return (
      <div
        className={`bg-white overflow-hidden shadow-md rounded-xl border border-gray-100 p-5 animate-pulse ${minCardHeight} flex flex-col`}
      >
        {/* Header Skeleton */}
        <div className="flex items-start justify-between mb-3 flex-shrink-0">
          <LoadingSkeleton height="h-5" width="w-3/5" />{" "}
          {/* Slightly taller title */}
          <LoadingSkeleton
            height="h-12"
            width="w-12"
            rounded="rounded-full"
          />{" "}
          {/* Larger icon area */}
        </div>
        {/* Body Skeleton (grows) */}
        <div className="flex-grow flex flex-col justify-center py-2">
          <LoadingSkeleton height="h-8" width="w-1/2" className="mb-2" />{" "}
          {/* Value */}
          <LoadingSkeleton height="h-4" width="w-1/3" />{" "}
          {/* Placeholder for potential change indicator space */}
        </div>
        {/* Footer Skeleton */}
        <div className="mt-auto flex-shrink-0">
          <LoadingSkeleton height="h-4" width="w-2/5" />{" "}
          {/* Link placeholder */}
        </div>
      </div>
    );
  }

  // --- Card Content ---
  const cardContent = (
    <>
      {/* Header Row: Title and Icon (Stays at top) */}
      <div className="flex items-start justify-between flex-shrink-0">
        <dt
          className="text-base font-semibold text-gray-600 truncate" // Slightly bolder title
          title={title}
        >
          {title}
        </dt>
        {icon && (
          <dd
            // Apply gradient background, consistent padding/rounding
            className={`flex-shrink-0 p-3 rounded-full ${themeClasses.bg} shadow-inner`}
          >
            {React.cloneElement(icon, {
              className: `h-6 w-6 ${themeClasses.text}`, // Icon color from theme
              strokeWidth: 2, // Slightly bolder icon lines
            })}
          </dd>
        )}
      </div>
      {/* Middle Section (Value, Change) - Grows to fill space */}
      <div className="mt-1 flex-grow flex flex-col justify-center py-1">
        {" "}
        {/* Added padding for vertical centering */}
        <div className="flex items-baseline justify-between gap-x-2 md:block lg:flex lg:items-baseline">
          {" "}
          {/* Added gap */}
          <dd className="flex items-baseline text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {value ?? "N/A"}
          </dd>
          {/* Percentage Change Indicator */}
          {changePercent !== null && (
            <div
              className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-xs font-medium md:mt-2 lg:mt-0 flex-shrink-0 ${
                // flex-shrink-0 to prevent wrapping issue
                isPositiveChange
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
              title={`${changePercent.toFixed(1)}% ${changePeriod}`}
            >
              {isPositiveChange ? (
                <ArrowUpIcon
                  className="-ml-0.5 mr-0.5 h-3.5 w-3.5 flex-shrink-0 self-center text-green-500" // Adjusted margin
                  aria-hidden="true"
                />
              ) : (
                <ArrowDownIcon
                  className="-ml-0.5 mr-0.5 h-3.5 w-3.5 flex-shrink-0 self-center text-red-500" // Adjusted margin
                  aria-hidden="true"
                />
              )}
              <span className="sr-only">
                {isPositiveChange ? "Increased" : "Decreased"} by
              </span>
              {Math.abs(changePercent).toFixed(1)}%
            </div>
          )}
          {/* Placeholder if no change, ensures consistent alignment if needed */}
          {/* {changePercent === null && <div className="h-5"></div>}  Usually not needed with flex-grow */}
        </div>
      </div>
      {/* Link Row (Stays at bottom) */}
      {linkTo && (
        // Use mt-auto to push to bottom IF flex-grow doesn't fill space entirely
        <div
          className={`mt-auto pt-2 text-sm font-medium ${themeClasses.linkText} ${themeClasses.linkHoverText} flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200 ease-in-out flex-shrink-0`}
        >
          {linkText}
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
        </div>
      )}
      {/* Add minimal height placeholder if NO link, to prevent bottom content jumping up too much */}
      {!linkTo && <div className="h-5 flex-shrink-0 mt-auto"></div>}{" "}
      {/* Reserves space similar to link */}
    </>
  );

  // --- Base Card Styling (Wrapper) ---
  const cardWrapperClasses = `
    relative group
    bg-white
    overflow-hidden
    shadow-md hover:shadow-xl focus-within:shadow-xl  // Subtle initial shadow, bigger on hover/focus
    rounded-xl
    border border-gray-200 ${themeClasses.hoverBorder} // Base border, theme color on hover
    p-5
    ${minCardHeight}      // Ensures minimum height consistency
    flex flex-col        // Enables flex item control (grow, shrink)
    transition-all duration-300 ease-in-out // Smooth transitions for shadow, border, transform
    transform hover:-translate-y-1 focus-within:-translate-y-1 // Lift effect
  `;

  // --- Render Link or Div based on props ---
  return linkTo ? (
    <Link to={linkTo} className={cardWrapperClasses}>
      {cardContent}
    </Link>
  ) : (
    <div className={cardWrapperClasses}>{cardContent}</div>
  );
};

export default StatCard;
