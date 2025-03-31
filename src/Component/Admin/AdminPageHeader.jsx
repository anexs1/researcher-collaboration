// src/Component/Admin/AdminPageHeader.jsx
import React from "react";

const AdminPageHeader = ({ title, children }) => {
  // Children prop for optional buttons/actions
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
        {title}
      </h1>
      {children && <div className="mt-3 md:mt-0">{children}</div>}
    </div>
  );
};

export default AdminPageHeader;
