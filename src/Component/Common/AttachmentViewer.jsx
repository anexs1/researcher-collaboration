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
  FaRegFileVideo, // Added for completeness if you handle video
} from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner"; // Assuming this path is correct

// Optional: for PDF viewing (if you uncomment and use react-pdf)
// import { Document, Page, pdfjs } from 'react-pdf';
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Base URL for your API
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper to get auth token
const getAuthToken = () => localStorage.getItem("authToken");

function AttachmentViewer({ fileUrl, fileName, fileType, onClose }) {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [numPagesPdf, setNumPagesPdf] = useState(null); // For react-pdf

  useEffect(() => {
    if (!fileUrl || !fileType) {
      setIsLoading(false);
      setError("File URL or type missing for viewer.");
      return;
    }

    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      setContent(null);
      const token = getAuthToken();

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
        ].includes(fileType.toLowerCase())
      ) {
        try {
          const response = await axios.get(fileUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            responseType: "text",
          });
          if (typeof response.data === "string") {
            setContent(response.data);
          } else {
            console.warn(
              "Received non-string data for text file:",
              response.data
            );
            setContent(JSON.stringify(response.data, null, 2));
          }
        } catch (err) {
          console.error("Error fetching text attachment:", err);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load text content."
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        setContent(fileUrl);
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [fileUrl, fileType]);

  // const onDocumentLoadSuccessPdf = ({ numPages }) => {
  //   setNumPagesPdf(numPages);
  // };

  const renderViewerContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-gray-600">
            Loading {fileName || "attachment"}...
          </p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-6 text-red-700 bg-red-100 rounded-md border border-red-300 text-sm m-4">
          <p className="font-semibold mb-1 text-lg">Error Loading Attachment</p>
          <p>{error}</p>
        </div>
      );
    }
    if (!content && !isLoading) {
      // Handles cases where content couldn't be set but no explicit error
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <FaRegFileAlt className="w-16 h-16 text-gray-400 mb-4" />
          <p className="mb-2 text-gray-700 font-semibold">
            Cannot Preview File
          </p>
          <p className="mb-4 text-gray-600 text-sm max-w-sm">
            There was an issue preparing the preview for this file. You can try
            downloading it.
          </p>
          {fileUrl &&
            fileName && ( // Ensure fileUrl and fileName are available for download
              <a
                href={fileUrl}
                download={fileName}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Download {fileName}
              </a>
            )}
        </div>
      );
    }

    const type = fileType?.toLowerCase();

    if (
      ["txt", "md", "json", "log", "csv", "xml", "html", "css", "js"].includes(
        type
      )
    ) {
      const textContent =
        typeof content === "string"
          ? content
          : "Error: Content is not in expected text format.";
      return (
        <div className="w-full h-full p-1">
          <pre className="w-full h-full p-3 bg-white text-sm overflow-auto border rounded-md whitespace-pre-wrap break-all shadow-inner">
            {textContent}
          </pre>
        </div>
      );
    } else if (type === "pdf") {
      return (
        <iframe
          src={content}
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
        //         width={Math.min(800, (document.querySelector('.flex-grow.overflow-auto.bg-gray-100')?.clientWidth || 800) - 40)} // Dynamic width
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
          {" "}
          {/* Changed bg for contrast */}
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
          {" "}
          {/* Changed padding */}
          <div className="p-3 text-center bg-white border-b border-gray-300 text-sm text-gray-700 flex-shrink-0">
            Previewing <strong>{fileName}</strong> (.<em>{type}</em>). For the
            best experience, or if preview fails, please download the file.
          </div>
          <iframe
            // Using Google Docs Viewer as an example. Ensure 'content' (fileUrl) is publicly accessible.
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              content
            )}&embedded=true`}
            // src={content} // Alternative: Direct src, browser handles it (might download)
            title={fileName || "Office Document Viewer"}
            className="w-full flex-grow border-0 bg-white" // Removed h-[] for flex-grow
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Keep sandbox for security
          />
          <div className="p-3 text-center bg-white border-t border-gray-300 flex-shrink-0">
            <a
              href={content} // Direct download link
              download={fileName}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Download {fileName}
            </a>
          </div>
        </div>
      );
    } else if (["mp3", "wav", "ogg", "aac", "m4a"].includes(type)) {
      // Added m4a
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
            className="mt-6 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
          >
            Download
          </a>
        </div>
      );
    } else if (["mp4", "webm", "ogv", "mov"].includes(type)) {
      // Added mov
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

    // Fallback for genuinely unsupported or unknown types
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
          href={content}
          download={fileName || "file"} // Ensure fileName is not undefined
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
            {/* Dynamically choose icon in header based on type */}
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
          {" "}
          {/* Added relative for potential absolute positioned elements inside content */}
          {renderViewerContent()}
        </main>
      </motion.div>
    </div>
  );
}

export default AttachmentViewer;
