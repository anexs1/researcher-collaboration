// src/Component/Admin/StatCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const StatCard = ({
  title,
  value,
  icon,
  linkTo,
  linkText,
  bgColor = "bg-white",
}) => {
  return (
    <div
      className={`${bgColor} p-5 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col justify-between`}
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
          {icon && React.cloneElement(icon, { className: "mr-2 h-5 w-5" })}{" "}
          {/* Add size */}
          {title}
        </h2>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      {linkTo && linkText && (
        <Link
          to={linkTo}
          className="text-sm text-blue-600 hover:underline mt-3 inline-block self-start"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
};

export default StatCard;
