// src/Component/projects/ProjectDetailModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaTimes, FaUniversity, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom"; // <<< ADD THIS IMPORT

// Adjust paths for common components if needed
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessage from "../Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProjectDetailModal = ({ project, onClose, currentUser }) => {
  const [detailedProject, setDetailedProject] = useState(null); // Start null to differentiate from initial prop
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch full project details when modal opens
  const fetchDetails = useCallback(
    async (projectId) => {
      console.log(`ProjectDetailModal: Fetching details for ID: ${projectId}`);
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("authToken");

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/projects/${projectId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        if (response.data?.success && response.data?.data) {
          console.log("ProjectDetailModal: Details fetched successfully.");
          const apiData = response.data.data;
          // Map API data carefully, providing fallbacks
          const fullData = {
            id: apiData.id ?? projectId,
            title: apiData.title ?? project?.title ?? "Untitled Project",
            description:
              apiData.description ?? project?.description ?? "No description.",
            image: apiData.imageUrl || apiData.image || project?.image || null, // Use consistent image field name
            requiredCollaborators:
              apiData.requiredCollaborators ??
              project?.requiredCollaborators ??
              0,
            skillsNeeded: apiData.skillsNeeded ?? [], // Ensure it's an array
            status: apiData.status || project?.status || "Unknown",
            category: apiData.category || "General",
            progress: apiData.progress ?? 0,
            views: apiData.views ?? 0,
            likes: apiData.likes ?? 0,
            comments: apiData.comments ?? 0,
            duration: apiData.duration || null,
            funding: apiData.funding || null,
            owner: apiData.owner || project?.owner || null, // Expect owner object
            createdAt: apiData.createdAt || project?.createdAt,
            updatedAt: apiData.updatedAt || project?.updatedAt,
            projectUrl: apiData.projectUrl || null, // Example field
          };
          setDetailedProject(fullData);
        } else {
          throw new Error(response.data?.message || "Invalid data received.");
        }
      } catch (err) {
        console.error("ProjectDetailModal: Error fetching details:", err);
        const message =
          err.response?.status === 401
            ? "Unauthorized."
            : err.response?.status === 404
            ? "Project not found."
            : err.response?.data?.message ||
              err.message ||
              "Could not load details.";
        setError(message);
        setDetailedProject(null); // Clear details on error
      } finally {
        setIsLoading(false);
      }
    },
    [
      project?.title,
      project?.description,
      project?.image,
      project?.status,
      project?.owner,
      project?.createdAt,
      project?.updatedAt,
    ]
  ); // Include initial project props used in fallback/mapping

  // Trigger fetch when project ID changes
  useEffect(() => {
    const projectId = project?.id;
    if (projectId) {
      fetchDetails(projectId);
    } else {
      setError("No project ID provided to modal.");
      setIsLoading(false);
      setDetailedProject(null);
    }
    // Optional cleanup if fetchDetails used AbortController
    // return () => { /* abort fetch */ };
  }, [project?.id, fetchDetails]); // Depend on ID and the memoized fetch function

  // --- Render Logic ---
  return (
    // Backdrop & Centering
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      {/* Modal Container with Animation */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden" // Prevent modal exceeding viewport height
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
            {isLoading
              ? "Loading..."
              : detailedProject?.title || project?.title || "Project Details"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-60">
              <LoadingSpinner />
            </div>
          )}
          {/* Error State */}
          {error && !isLoading && (
            <ErrorMessage message={error} onClose={() => setError("")} />
          )}

          {/* --- Content Display (only when not loading and no error) --- */}
          {!isLoading && !error && detailedProject && (
            <div className="space-y-5 text-sm sm:text-base text-gray-700">
              {/* Image */}
              {detailedProject.image ? (
                <img
                  src={
                    detailedProject.image.startsWith("/")
                      ? `${API_BASE_URL}${detailedProject.image}`
                      : detailedProject.image
                  }
                  alt={detailedProject.title || "Project Image"}
                  className="w-full h-auto max-h-72 object-contain rounded-lg mb-4 border bg-gray-50"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-indigo-100 flex items-center justify-center rounded-lg mb-4">
                  <FaUniversity className="text-6xl text-gray-300" />
                </div>
              )}

              {/* Info Row: Category & Status */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm border-b pb-3">
                <p>
                  <strong className="font-medium text-gray-800">
                    Category:
                  </strong>{" "}
                  {detailedProject.category || "N/A"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800">Status:</strong>
                  <span
                    className={`ml-1.5 font-medium px-2 py-0.5 rounded-full text-xs ${
                      detailedProject.status?.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-800"
                        : detailedProject.status?.toLowerCase() === "active"
                        ? "bg-blue-100 text-blue-800"
                        : detailedProject.status?.toLowerCase() === "planning"
                        ? "bg-yellow-100 text-yellow-800"
                        : detailedProject.status?.toLowerCase() === "on hold"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {detailedProject.status || "N/A"}
                  </span>
                </p>
              </div>

              {/* Description */}
              <div>
                <strong className="font-medium text-gray-800 block mb-1.5">
                  Description:
                </strong>
                <p className="whitespace-pre-wrap bg-gray-50 p-3 border rounded-md text-gray-800 text-sm leading-relaxed shadow-sm">
                  {detailedProject.description || (
                    <span className="italic text-gray-500">
                      No description provided.
                    </span>
                  )}
                </p>
              </div>

              {/* Skills Needed */}
              {detailedProject.skillsNeeded &&
                detailedProject.skillsNeeded.length > 0 && (
                  <div>
                    <strong className="font-medium text-gray-800 block mb-1.5">
                      Skills Needed:
                    </strong>
                    <div className="flex flex-wrap gap-2">
                      {detailedProject.skillsNeeded.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Other Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t mt-5 text-sm">
                <p>
                  <strong className="font-medium text-gray-800">
                    Duration:
                  </strong>{" "}
                  {detailedProject.duration || "Not specified"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800">
                    Funding:
                  </strong>{" "}
                  {detailedProject.funding || "Not specified"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800">
                    Collaborators Needed:
                  </strong>{" "}
                  {detailedProject.requiredCollaborators ?? "N/A"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800">
                    Progress:
                  </strong>{" "}
                  {detailedProject.progress ?? 0}%
                </p>
                <p>
                  <strong className="font-medium text-gray-800">Views:</strong>{" "}
                  {detailedProject.views ?? 0}
                </p>
                <p>
                  <strong className="font-medium text-gray-800">Likes:</strong>{" "}
                  {detailedProject.likes ?? 0}
                </p>
                {/* External Project Link */}
                {detailedProject.projectUrl && (
                  <p className="md:col-span-2">
                    <strong className="font-medium text-gray-800">
                      Project Link:
                    </strong>
                    <a
                      href={detailedProject.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                    >
                      Visit Site <FaExternalLinkAlt size={10} />
                    </a>
                  </p>
                )}
              </div>

              {/* Owner Info */}
              {detailedProject.owner && (
                <div className="pt-4 border-t mt-4 text-sm">
                  <strong className="font-medium text-gray-800">Owner:</strong>
                  {/* Use Link component here */}
                  <Link
                    to={
                      detailedProject.owner.id
                        ? `/profile/${detailedProject.owner.id}`
                        : "#"
                    }
                    className="ml-1.5 text-indigo-600 hover:underline font-medium"
                  >
                    {detailedProject.owner.username || "Unknown User"}
                  </Link>
                  {detailedProject.owner.email && (
                    <span className="text-gray-500 text-xs ml-2">
                      ({detailedProject.owner.email})
                    </span>
                  )}
                  {/* Highlight if owner is the current user */}
                  {detailedProject.owner.id === currentUser?.id && (
                    <span className="text-xs text-indigo-600 font-semibold ml-1">
                      (You)
                    </span>
                  )}
                </div>
              )}

              {/* Timestamps & ID */}
              <div className="text-xs text-gray-400 mt-5 pt-3 border-t flex flex-wrap justify-between gap-2">
                <span>ID: {detailedProject.id || "N/A"}</span>
                <span>
                  Created:{" "}
                  {detailedProject.createdAt
                    ? new Date(detailedProject.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
                <span>
                  Updated:{" "}
                  {detailedProject.updatedAt
                    ? new Date(detailedProject.updatedAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          )}

          {/* Fallback message if loading finished but no details (e.g., fetch failed but didn't set error) */}
          {!isLoading && !error && !detailedProject && (
            <p className="text-center text-gray-500 py-10">
              Could not display project details.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-5 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Close
          </button>
          {/* Add other actions like Join/Edit buttons here if desired */}
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectDetailModal;
