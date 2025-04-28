// src/Component/Admin/StatCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline"; // Example icon
import { motion } from "framer-motion";

const StatCard = ({
  title,
  value,
  icon,
  linkTo,
  linkText = "View Details",
}) => {
  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-3">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="p-2 bg-gray-100 rounded-full">
          {" "}
          {/* Icon background */}
          {React.cloneElement(icon, { className: "h-6 w-6" })}{" "}
          {/* Ensure icon has className */}
        </dd>
      </div>
      <dd className="text-3xl font-semibold text-gray-900 mb-3">
        {value ?? "N/A"}
      </dd>
      {linkTo && (
        <div className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:gap-2 transition-all">
          {linkText}
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </>
  );

  const cardClasses =
    "bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 p-5 hover:shadow-xl transition-shadow duration-200 ease-in-out"; // Added border, enhanced shadow/hover

  return linkTo ? (
    <Link to={linkTo} className={`${cardClasses} block group`}>
      {" "}
      {/* Wrap with Link if linkTo provided */}
      {cardContent}
    </Link>
  ) : (
    <div className={cardClasses}>
      {" "}
      {/* Use div if no link */}
      {cardContent}
    </div>
  );
};

export default StatCard;
