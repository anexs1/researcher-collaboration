// src/Page/NotFoundPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
      {" "}
      {/* Adjust min-height based on your layout */}
      <FaExclamationTriangle className="text-6xl text-yellow-400 mb-6" />
      <h1 className="text-4xl font-bold text-gray-800 mb-3">
        404 - Page Not Found
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Oops! The page you are looking for does not seem to exist.
      </p>
      <Link
        to="/"
        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
