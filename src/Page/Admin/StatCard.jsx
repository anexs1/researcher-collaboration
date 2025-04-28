// src/Component/Admin/StatCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ArrowUpIcon, // For positive change
  ArrowDownIcon, // For negative change
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton";
// Helper to calculate percentage change
const calculateChange = (current, previous) => {
  if (previous === null || previous === undefined || previous === 0) {
    // Cannot calculate percentage change from zero or null/undefined
    return null;
  }
  if (current === null || current === undefined) return null; // Cannot calculate if current is missing

  const change = ((current - previous) / previous) * 100;
  // Handle NaN or Infinity cases just in case
  if (!isFinite(change)) return null;
  return change;
};

// Map color names to Tailwind classes
const colorMap = {
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  red: { bg: "bg-red-100", text: "text-red-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-600" },
  sky: { bg: "bg-sky-100", text: "text-sky-600" },
  gray: { bg: "bg-gray-100", text: "text-gray-600" },
  // Add more colors as needed
};

const StatCard = ({
  title,
  value, // Current value (number or string)
  icon, // React icon component instance
  linkTo, // Optional URL for navigation
  linkText = "View Details", // Text for the link
  color = "indigo", // Color theme for the icon (e.g., 'green', 'red')
  isLoading = false, // Show skeleton loader if true
  previousValue, // Optional: Value from previous period for comparison
  changePeriod = "vs last period", // Optional: Text describing the change period
}) => {
  const changePercent = calculateChange(value, previousValue);
  const isPositiveChange = changePercent !== null && changePercent >= 0;
  const isNegativeChange = changePercent !== null && changePercent < 0;

  const themeClasses = colorMap[color] || colorMap.indigo; // Fallback to indigo

  // --- Loading Skeleton ---
  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <LoadingSkeleton height="h-4" width="w-2/5" />
          <LoadingSkeleton height="h-10" width="w-10" rounded="rounded-full" />
        </div>
        <LoadingSkeleton height="h-8" width="w-1/3" className="mb-4" />
        <LoadingSkeleton height="h-4" width="w-3/5" />
      </div>
    );
  }

  // --- Card Content ---
  const cardContent = (
    <>
      {/* Header Row: Title and Icon */}
      <div className="flex items-start justify-between">
        <dt
          className="text-base font-medium text-gray-500 truncate"
          title={title}
        >
          {title}
        </dt>
        {icon && (
          <dd
            className={`flex-shrink-0 p-3 rounded-full ${themeClasses.bg} shadow-inner`}
          >
            {/* Clone icon to apply consistent styling */}
            {React.cloneElement(icon, {
              className: `h-6 w-6 ${themeClasses.text}`,
            })}
          </dd>
        )}
      </div>

      {/* Main Value and Change Row */}
      <div className="mt-1 flex items-baseline justify-between md:block lg:flex lg:items-baseline">
        {" "}
        {/* Adjusted layout for responsiveness */}
        <dd className="flex items-baseline text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {value ?? "N/A"}
          {/* Optional: Unit or suffix */}
          {/* <span className="ml-2 text-sm font-medium text-gray-500"> / unit </span> */}
        </dd>
        {/* Percentage Change Indicator */}
        {changePercent !== null && (
          <div
            className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-xs font-medium md:mt-2 lg:mt-0 ${
              isPositiveChange
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
            title={`${changePercent.toFixed(1)}% ${changePeriod}`}
          >
            {isPositiveChange ? (
              <ArrowUpIcon
                className="-ml-1 mr-0.5 h-3.5 w-3.5 flex-shrink-0 self-center text-green-500"
                aria-hidden="true"
              />
            ) : (
              <ArrowDownIcon
                className="-ml-1 mr-0.5 h-3.5 w-3.5 flex-shrink-0 self-center text-red-500"
                aria-hidden="true"
              />
            )}
            <span className="sr-only">
              {isPositiveChange ? "Increased" : "Decreased"} by
            </span>
            {Math.abs(changePercent).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Link Row */}
      {linkTo && (
        <div className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:gap-1.5 transition-all duration-150 ease-in-out">
          {linkText}
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </>
  );

  // --- Base Card Styling ---
  const cardClasses = `relative bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 p-5 hover:shadow-xl hover:border-gray-300 transition-all duration-200 ease-in-out transform hover:-translate-y-1`;

  // --- Render Link or Div based on props ---
  return linkTo ? (
    <Link to={linkTo} className={`${cardClasses} block group`}>
      {cardContent}
    </Link>
  ) : (
    <div className={cardClasses}>{cardContent}</div>
  );
};

export default StatCard;
