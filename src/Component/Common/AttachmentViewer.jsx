// src/Component/Common/AttachmentViewer.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaTimes,
  FaRegFileAlt,
  FaRegFilePdf,
  FaRegFileImage,
  FaRegFileWord,
  FaRegFileArchive,
  FaRegFileAudio,
  FaRegFileVideo,
} from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";

// Optional: for PDF viewing with react-pdf (npm install react-pdf)
// import { Document, Page, pdfjs } from 'react-pdf';
// Make sure to set the worker source if you use react-pdf
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // Not directly used for fetching here if fileUrl is absolute
const getAuthToken = () => localStorage.getItem("authToken");

function AttachmentViewer({ fileUrl, fileName, fileType, onClose }) {
  // Log received props for debugging
  useEffect(() => {
    console.log("[AttachmentViewer Props Received]", {
      fileUrl,
      fileName,
      fileType,
    });
  }, [fileUrl, fileName, fileType]);

  const [content, setContent] = useState(null); // For text files, this will be text. For others, it's the URL.
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  // const [numPagesPdf, setNumPagesPdf] = useState(null); // For react-pdf

  useEffect(() => {
    if (!fileUrl || !fileType) {
      setError("File information is incomplete. Cannot display preview.");
      setIsLoading(false);
      setContent(null);
      return;
    }

    setIsLoading(true); // Set loading true at the start of fetching/processing
    setError(null);
    setContent(null); // Reset previous content

    const type = fileType.toLowerCase();

    if (
      [
        "txt",
        "md",
        "json",
        "log",
        "csv",
        "xml",
        "html",
        "css",
        "js",
        "jsx",
        "ts",
        "tsx",
      ].includes(type)
    ) {
      const token = getAuthToken();
      axios
        .get(fileUrl, {
          // fileUrl should be the absolute URL to the backend endpoint
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: "text", // Expecting plain text
        })
        .then((response) => {
          if (typeof response.data === "string") {
            setContent(response.data);
          } else {
            // Fallback if backend sends JSON for some reason despite responseType: 'text'
            setContent(JSON.stringify(response.data, null, 2));
          }
        })
        .catch((err) => {
          console.error(
            "Error fetching text attachment:",
            err.response || err.message || err
          );
          setError(
            err.response?.data?.message ||
              err.message ||
              `Failed to load text content for ${fileName}.`
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // For non-text types (PDF, images, office docs, etc.), the 'content' will be the fileUrl itself.
      // The browser or an iframe will handle fetching from this URL.
      setContent(fileUrl);
      setIsLoading(false); // No separate fetch needed from here, iframe/img tag will do it
    }
  }, [fileUrl, fileType, fileName]); // Added fileName to dependencies for error messages

  // const onDocumentLoadSuccessPdf = ({ numPages }) => {
  //   setNumPagesPdf(numPages);
  // };

  const renderViewerContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-lg font-medium text-gray-600">
            Loading preview for <br />{" "}
            <span className="font-semibold break-all">
              {fileName || "attachment"}
            </span>
            ...
          </p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-6 m-4 text-red-700 bg-red-100 rounded-lg border border-red-300 text-sm shadow-md">
          <p className="font-bold text-lg mb-2">Error Displaying Attachment</p>
          <p className="break-words">{error}</p>
          {fileUrl && fileName && (
            <div className="mt-4 text-center">
              <a
                href={fileUrl}
                download={fileName}
                className="px-5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Download {fileName}
              </a>
            </div>
          )}
        </div>
      );
    }
    // If !content and !isLoading and !error, it means type was not text and content (URL) is set
    // but the iframe or img will handle display. This case should be rare if content gets set to fileUrl.
    // However, if content (the fileUrl) is null/undefined for some reason after processing:
    if (!content && !isLoading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <FaRegFileAlt className="w-16 h-16 text-gray-400 mb-4" />
          <p className="mb-2 text-gray-700 font-semibold">
            Cannot Prepare Preview
          </p>
          <p className="mb-4 text-gray-600 text-sm max-w-sm">
            The necessary information to display this file is missing.
          </p>
        </div>
      );
    }

    const type = fileType?.toLowerCase();

    if (
      [
        "txt",
        "md",
        "json",
        "log",
        "csv",
        "xml",
        "html",
        "css",
        "js",
        "jsx",
        "ts",
        "tsx",
      ].includes(type)
    ) {
      const textContent =
        typeof content === "string"
          ? content
          : "Error: Content is not in expected text format.";
      return (
        <div className="w-full h-full p-1">
          <pre className="w-full h-full p-3 bg-white text-sm overflow-auto border rounded-md whitespace-pre-wrap break-all shadow-inner custom-scrollbar">
            {textContent}
          </pre>
        </div>
      );
    } else if (type === "pdf") {
      return (
        <iframe
          src={content} // content is fileUrl
          title={fileName || "PDF Viewer"}
          className="w-full h-full border-0"
          type="application/pdf"
        />
        // --- react-pdf Example (more control, requires setup) ---
        // <div className="w-full h-full overflow-auto bg-gray-200 flex justify-center p-2">
        //   <Document
        //     file={content} /* content here is the fileUrl */
        //     onLoadSuccess={onDocumentLoadSuccessPdf}
        //     loading={<div className="p-4 text-center"><LoadingSpinner /> Loading PDF...</div>}
        //     error={<div className="p-4 text-red-500 text-center">Failed to load PDF. Ensure the URL is correct and accessible.</div>}
        //     className="shadow-lg"
        //   >
        //     {Array.from(new Array(numPagesPdf || 0), (el, index) => (
        //       <Page
        //         key={`page_${index + 1}`}
        //         pageNumber={index + 1}
        //         width={Math.min(800, (document.querySelector('.flex-grow.overflow-auto.bg-gray-100')?.clientWidth || 800) - 40)}
        //         className="mb-2 shadow-md"
        //       />
        //     ))}
        //   </Document>
        // </div>
      );
    } else if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(type)
    ) {
      return (
        <div className="w-full h-full flex items-center justify-center p-2 bg-gray-200">
          <img
            src={content}
            alt={fileName || "Image attachment"}
            className="max-w-full max-h-full object-contain rounded shadow-lg"
          />
        </div>
      );
    } else if (["docx", "doc", "ppt", "pptx", "xls", "xlsx"].includes(type)) {
      return (
        <div className="w-full h-full flex flex-col items-stretch justify-start p-1 bg-gray-200">
          <div className="p-3 text-center bg-white border-b border-gray-300 text-sm text-gray-700 flex-shrink-0">
            Previewing <strong>{fileName}</strong> (.<em>{type}</em>). Direct
            browser preview may vary. For the best experience, or if preview
            fails, please download.
          </div>
          <iframe
            src={content} // Direct src from your backend
            title={fileName || "Office Document Viewer"}
            className="w-full flex-grow border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
          <div className="p-3 text-center bg-white border-t border-gray-300 flex-shrink-0">
            <a
              href={content}
              download={fileName}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Download {fileName}
            </a>
          </div>
        </div>
      );
    } else if (["mp3", "wav", "ogg", "aac", "m4a"].includes(type)) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-200">
          <FaRegFileAudio className="w-16 h-16 text-indigo-500 mb-4" />
          <p className="text-lg font-medium text-gray-800 mb-2">{fileName}</p>
          <audio
            controls
            src={content}
            className="w-full max-w-md shadow-md rounded-md bg-white p-2"
          >
            Your browser does not support the audio element.
          </audio>
          <a
            href={content}
            download={fileName}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
          >
            Download
          </a>
        </div>
      );
    } else if (["mp4", "webm", "ogv", "mov"].includes(type)) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-black">
          <FaRegFileVideo className="w-16 h-16 text-indigo-400 mb-4" />
          <p className="text-lg font-medium text-white mb-2">{fileName}</p>
          <video
            controls
            src={content}
            className="max-w-full max-h-[calc(100%-120px)] shadow-lg rounded bg-black"
          >
            Your browser does not support the video tag.
          </video>
          <a
            href={content}
            download={fileName}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
          >
            Download
          </a>
        </div>
      );
    }

    // Fallback for truly unsupported or unknown types
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <FaRegFileAlt className="w-16 h-16 text-gray-400 mb-4" />
        <p className="mb-2 text-gray-800 font-semibold">
          Unsupported File Type: <strong>.{type || "unknown"}</strong>
        </p>
        <p className="mb-4 text-gray-600 text-sm max-w-sm">
          Direct preview is not available for this file. You can download it to
          view with a compatible application.
        </p>
        <a
          href={content} // content here is the fileUrl
          download={fileName || "file"}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Download {fileName || "File"}
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-2 sm:p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{
          opacity: 0,
          y: 10,
          scale: 0.95,
          transition: { duration: 0.15 },
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.2,
        }}
        className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl h-[90vh] max-h-[700px] md:max-h-[800px] flex flex-col overflow-hidden border border-gray-300"
      >
        <header className="flex items-center justify-between p-3.5 border-b bg-white shadow-sm sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            {fileType?.toLowerCase() === "pdf" ? (
              <FaRegFilePdf className="text-red-600 h-5 w-5 flex-shrink-0" />
            ) : [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "svg",
                "bmp",
                "ico",
              ].includes(fileType?.toLowerCase()) ? (
              <FaRegFileImage className="text-teal-600 h-5 w-5 flex-shrink-0" />
            ) : ["doc", "docx"].includes(fileType?.toLowerCase()) ? (
              <FaRegFileWord className="text-blue-600 h-5 w-5 flex-shrink-0" />
            ) : ["mp4", "webm", "ogv", "mov"].includes(
                fileType?.toLowerCase()
              ) ? (
              <FaRegFileVideo className="text-orange-500 h-5 w-5 flex-shrink-0" />
            ) : ["mp3", "wav", "ogg", "aac", "m4a"].includes(
                fileType?.toLowerCase()
              ) ? (
              <FaRegFileAudio className="text-purple-500 h-5 w-5 flex-shrink-0" />
            ) : (
              <FaRegFileAlt className="text-indigo-600 h-5 w-5 flex-shrink-0" />
            )}
            <h2
              className="text-md font-semibold text-gray-800 truncate"
              title={fileName}
            >
              {fileName || "Attachment Preview"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close viewer"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-grow overflow-auto bg-gray-100 relative">
          {renderViewerContent()}
        </main>
      </motion.div>
    </div>
  );
}

export default AttachmentViewer;
