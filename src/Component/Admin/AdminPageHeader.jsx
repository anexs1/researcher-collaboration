// src/Component/Admin/AdminPageHeader.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";

const AdminPageHeader = ({ title, children, breadcrumbs = [] }) => {
  return (
    <header className="mb-6 md:mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex mb-2" aria-label="Breadcrumb">
          <ol
            role="list"
            className="flex items-center space-x-1 text-sm text-gray-500"
          >
            <li>
              <Link
                to="/admin"
                className="hover:text-gray-700 flex items-center"
              >
                <HomeIcon
                  className="flex-shrink-0 h-4 w-4 mr-1.5"
                  aria-hidden="true"
                />
                <span className="sr-only">Admin Home</span>
              </Link>
            </li>
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.label}>
                <div className="flex items-center">
                  <ChevronRightIcon
                    className="flex-shrink-0 h-4 w-4"
                    aria-hidden="true"
                  />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="ml-1 font-medium text-gray-700">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link to={crumb.link} className="ml-1 hover:text-gray-700">
                      {crumb.label}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Title and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {children && (
          <div className="mt-3 md:mt-0 flex-shrink-0">{children}</div>
        )}
      </div>
    </header>
  );
};

export default AdminPageHeader;
