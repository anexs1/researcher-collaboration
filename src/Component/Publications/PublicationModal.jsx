import React, { useState } from "react";
import {
  FaTimes,
  FaExternalLinkAlt,
  FaBookOpen,
  FaRegChartBar,
  FaUser,
  FaCalendarAlt,
  FaTag,
  FaFlask,
  FaRegBookmark,
  FaBookmark,
  FaShare,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import ShareModal from "./ShareModal";

const PublicationModal = ({ publication, onClose, currentUser }) => {
  const [isBookmarked, setIsBookmarked] = useState(
    publication.isBookmarked || false
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleBookmark = async () => {
    try {
      // Here you would typically make an API call to update the bookmark status
      setIsBookmarked(!isBookmarked);
      // You would call your API here, something like:
      // await axios.patch(`/api/publications/${publication.id}/bookmark`,
      //   { bookmark: !isBookmarked },
      //   { headers: getAuthHeaders() }
      // );
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/publications/${publication.id}`
    );
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-gray-900">
            Publication Details
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
        <div className="p-6">
          {/* Publication Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {publication.thumbnail && (
              <div className="w-full md:w-1/3 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={publication.thumbnail}
                  alt={publication.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {publication.title}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleBookmark}
                    className="p-2 text-gray-400 hover:text-yellow-500"
                    data-tooltip-id="bookmark-tooltip"
                    data-tooltip-content={
                      isBookmarked ? "Remove bookmark" : "Bookmark"
                    }
                  >
                    {isBookmarked ? (
                      <FaBookmark className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <FaRegBookmark className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 text-gray-400 hover:text-blue-500"
                    data-tooltip-id="share-tooltip"
                    data-tooltip-content="Share"
                  >
                    <FaShare className="h-5 w-5" />
                  </button>
                  <Tooltip id="bookmark-tooltip" />
                  <Tooltip id="share-tooltip" />
                </div>
              </div>

              <p className="text-gray-600 mb-4 flex items-center gap-2">
                <FaUser className="text-gray-400" />
                {publication.author}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                    publication.collaborationStatus
                  )}`}
                >
                  {publication.collaborationStatus.replace(/_/g, " ")}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium flex items-center gap-1">
                  <FaBookOpen className="h-3 w-3" /> {publication.views || 0}{" "}
                  views
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium flex items-center gap-1">
                  <FaRegChartBar className="h-3 w-3" />{" "}
                  {publication.citations || 0} citations
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FaCalendarAlt className="text-gray-400" />
                  Published: {formatDate(publication.publicationDate)}
                </span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FaFlask className="text-gray-400" />
                  {publication.area || "N/A"}
                </span>
              </div>

              {publication.doi && (
                <a
                  href={`https://doi.org/${publication.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  <FaExternalLinkAlt className="mr-1 h-3 w-3" /> DOI:{" "}
                  {publication.doi}
                </a>
              )}
            </div>
          </div>

          {/* Publication Content */}
          <div className="space-y-6">
            {/* Abstract/Summary */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Abstract
              </h4>
              <p className="text-gray-700 whitespace-pre-line">
                {publication.summary || "No abstract available."}
              </p>
            </div>

            {/* Tags */}
            {publication.tags?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FaTag className="text-gray-400" /> Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {publication.tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Technical Details
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex justify-between">
                    <span className="text-gray-500">Publication Type</span>
                    <span>{publication.type || "Research Paper"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Pages</span>
                    <span>{publication.pages || "N/A"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Publisher</span>
                    <span>{publication.publisher || "N/A"}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Sharing</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/publications/${publication.id}`}
                    className="flex-1 text-sm p-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
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
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() =>
              window.open(`/publications/edit/${publication.id}`, "_blank")
            }
            className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Edit Publication
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          item={publication}
          itemType="publication"
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PublicationModal;
