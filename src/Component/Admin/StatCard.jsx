// src/Component/Admin/StatCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/20/solid"; // For trend

const StatCard = ({
  title,
  value,
  icon,
  linkTo,
  linkText,
  trendValue, // e.g., "+5.2%"
  trendDirection, // 'up' or 'down'
  isLoading = false,
  className = "", // Allow additional classes
}) => {
  const trendColor =
    trendDirection === "up"
      ? "text-green-600"
      : trendDirection === "down"
      ? "text-red-600"
      : "text-gray-500";
  const TrendIcon =
    trendDirection === "up"
      ? ArrowUpIcon
      : trendDirection === "down"
      ? ArrowDownIcon
      : null;

  return (
    <div
      className={`bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col ${className}`}
    >
      {isLoading ? (
        // Skeleton Loading State
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
          {linkTo && linkText && (
            <div className="h-4 w-20 bg-gray-200 rounded mt-2"></div>
          )}
        </div>
      ) : (
        // Actual Content
        <>
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-gray-100 rounded-full">
              {icon && React.cloneElement(icon, { className: "h-6 w-6" })}
            </div>
            {trendValue && (
              <div
                className={`flex items-center text-xs font-medium ${trendColor}`}
              >
                {TrendIcon && <TrendIcon className="h-4 w-4 mr-0.5" />}
                {trendValue}
              </div>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {value ?? "N/A"}
            </p>
            <h3 className="text-base font-medium text-gray-600">{title}</h3>
          </div>
          {linkTo && linkText && (
            <Link
              to={linkTo}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-4 inline-block self-start group transition-colors duration-150"
            >
              {linkText}{" "}
              <span
                aria-hidden="true"
                className="group-hover:translate-x-1 inline-block transition-transform duration-150"
              >
                →
              </span>
            </Link>
          )}
        </>
      )}
    </div>
  );
};

export default StatCard;
