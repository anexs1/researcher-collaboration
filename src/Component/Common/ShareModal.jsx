import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaLink,
  FaCopy,
  FaCheck,
  FaEnvelope,
  FaTwitter,
  FaLinkedin,
  FaFacebook,
} from "react-icons/fa";
import { Tooltip } from "react-tooltip";

const ShareModal = ({ item, itemType, onClose }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // Set the current URL for sharing
    setCurrentUrl(`${window.location.origin}/${itemType}s/${item.id}`);
  }, [item, itemType]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = `Check out this ${itemType}: ${item.title}`;
    const body = `${message}\n\n${currentUrl}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const shareOnTwitter = () => {
    const text = `Check out this ${itemType}: ${item.title}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      currentUrl
    )}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      currentUrl
    )}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Share {itemType === "publication" ? "Publication" : "Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            data-tooltip-id="close-tooltip"
            data-tooltip-content="Close"
          >
            <FaTimes className="h-5 w-5" />
          </button>
          <Tooltip id="close-tooltip" />
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Link Sharing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share link
            </label>
            <div className="flex rounded-md shadow-sm">
              <div className="relative flex-grow">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="block w-full rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                />
              </div>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                data-tooltip-id="copy-tooltip"
                data-tooltip-content={copySuccess ? "Copied!" : "Copy link"}
              >
                {copySuccess ? (
                  <FaCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <FaCopy className="h-4 w-4" />
                )}
              </button>
              <Tooltip id="copy-tooltip" />
            </div>
          </div>

          {/* Email Sharing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share via email
            </label>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Recipient's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
              />
              <textarea
                placeholder="Optional message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="3"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
              />
              <button
                onClick={shareViaEmail}
                disabled={!email}
                className={`flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  email
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-400 cursor-not-allowed"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <FaEnvelope className="mr-2 h-4 w-4" />
                Send Email
              </button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share on social media
            </label>
            <div className="flex justify-center space-x-4">
              <button
                onClick={shareOnTwitter}
                className="p-3 rounded-full bg-blue-400 hover:bg-blue-500 text-white transition-colors"
                data-tooltip-id="twitter-tooltip"
                data-tooltip-content="Share on Twitter"
              >
                <FaTwitter className="h-5 w-5" />
              </button>
              <button
                onClick={shareOnLinkedIn}
                className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                data-tooltip-id="linkedin-tooltip"
                data-tooltip-content="Share on LinkedIn"
              >
                <FaLinkedin className="h-5 w-5" />
              </button>
              <button
                onClick={shareOnFacebook}
                className="p-3 rounded-full bg-blue-800 hover:bg-blue-900 text-white transition-colors"
                data-tooltip-id="facebook-tooltip"
                data-tooltip-content="Share on Facebook"
              >
                <FaFacebook className="h-5 w-5" />
              </button>
              <Tooltip id="twitter-tooltip" />
              <Tooltip id="linkedin-tooltip" />
              <Tooltip id="facebook-tooltip" />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
