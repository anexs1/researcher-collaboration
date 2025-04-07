import React, { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

const icons = {
  success: (
    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
  ),
  error: <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />,
  info: (
    <InformationCircleIcon
      className="h-5 w-5 text-blue-400"
      aria-hidden="true"
    />
  ),
};
const colors = {
  success: "bg-green-50 border-green-300 text-green-800",
  error: "bg-red-50 border-red-300 text-red-800",
  info: "bg-blue-50 border-blue-300 text-blue-800",
};

const Notification = ({ message, type = "info", show, onClose }) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  if (!isVisible || !message) return null;

  const icon = icons[type];
  const colorClass = colors[type] || colors.info;

  return (
    // Position fixed, top-right for example
    <div
      className={`fixed top-5 right-5 z-50 max-w-sm w-full shadow-lg rounded-md pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border ${
        colorClass.split(" ")[1]
      }`}
    >
      <div className={`p-4 ${colorClass.split(" ")[0]}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">{icon}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${colorClass.split(" ")[2]}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className={`inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                colorClass.split(" ")[0]
              } ${colorClass
                .split(" ")[2]
                .replace("text-", "hover:text-")
                .replace("-800", "-600")}`}
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
