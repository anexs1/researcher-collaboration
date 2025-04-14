import { useState } from "react";

const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [resolveCallback, setResolveCallback] = useState(null);

  const confirm = (title, message) => {
    setTitle(title);
    setMessage(message);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveCallback(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveCallback?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveCallback?.(false);
  };

  const ConfirmDialog = () =>
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-lg">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleConfirm}
            >
              Confirm
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

  return { confirm, ConfirmDialog };
};

export default useConfirm;
