// src/Component/Project/ProjectDetailModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaTimes, FaUniversity, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

// Adjust paths for common components if needed
import LoadingSpinner from "../Common/LoadingSpinner"; // Assuming correct path
import ErrorMessage from "../Common/ErrorMessage"; // Assuming correct path

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProjectDetailModal = ({ project, onClose, currentUser }) => {
  const [detailedProject, setDetailedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(
    async (projectId) => {
      console.log(`ProjectDetailModal: Fetching details for ID: ${projectId}`);
      setIsLoading(true);
      setError("");
      setDetailedProject(null);
      const token = localStorage.getItem("authToken");

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/projects/${projectId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        // Log the raw response for easier debugging
        console.log("ProjectDetailModal: API Response Data:", response.data);

        if (response.data?.success) {
          // --- !!! KEY CHANGE: Check for 'data' key instead of 'project' key !!! ---
          if (response.data.data && typeof response.data.data === "object") {
            console.log(
              "ProjectDetailModal: Details fetched successfully from 'data' field."
            );
            // --- Assign data from the correct 'data' field ---
            const apiData = response.data.data;

            // --- Mapping Logic (ensure fields match the structure inside response.data.data) ---
            const fullData = {
              id: apiData.id ?? projectId,
              title: apiData.title ?? project?.title ?? "Untitled Project",
              description:
                apiData.description ??
                project?.description ??
                "No description.",
              // Use consistent naming: prefer imageUrl if available, fallback to image
              image:
                apiData.imageUrl || apiData.image || project?.image || null,
              requiredCollaborators:
                apiData.requiredCollaborators ??
                project?.requiredCollaborators ??
                0,
              // Ensure skillsNeeded is always an array
              skillsNeeded: Array.isArray(apiData.skillsNeeded)
                ? apiData.skillsNeeded
                : [],
              status: apiData.status || project?.status || "Unknown",
              category: apiData.category || "General",
              progress: apiData.progress ?? 0,
              views: apiData.views ?? 0,
              likes: apiData.likes ?? 0,
              comments: apiData.comments ?? 0,
              duration: apiData.duration || null,
              funding: apiData.funding || null,
              // Ensure owner is an object or null
              owner:
                apiData.owner && typeof apiData.owner === "object"
                  ? apiData.owner
                  : project?.owner || null,
              createdAt: apiData.createdAt || project?.createdAt,
              updatedAt: apiData.updatedAt || project?.updatedAt,
              projectUrl: apiData.projectUrl || null,
              // Include any user-specific status if available from the API response
              // (This assumes getProjectById was updated to return it like getAllProjects)
              currentUserMembershipStatus:
                apiData.currentUserMembershipStatus || null,
            };
            // --- End Mapping ---

            setDetailedProject(fullData);
          } else {
            // API reported success: true, but the 'data' field was missing, null, or not an object.
            console.error(
              "ProjectDetailModal: API success true, but 'data' payload is missing or invalid.",
              response.data
            );
            // Throw a specific error indicating the expected data structure wasn't found
            throw new Error(
              "Project details structure not found in the API response (expected 'data' field)."
            );
          }
        } else {
          // API explicitly reported failure (e.g., success: false)
          console.error(
            "ProjectDetailModal: API indicated failure.",
            response.data
          );
          throw new Error(
            response.data?.message ||
              "The server indicated an error processing the request."
          );
        }
      } catch (err) {
        // (Keep existing enhanced error handling logic)
        console.error(
          "ProjectDetailModal: Error fetching/processing details:",
          err
        );
        let message = "Could not load project details.";
        if (axios.isAxiosError(err)) {
          if (err.response) {
            console.error("API Error Response Status:", err.response.status);
            console.error("API Error Response Data:", err.response.data);
            if (err.response.status === 401)
              message = "Unauthorized. Please log in.";
            else if (err.response.status === 404)
              message = "Project not found.";
            else
              message =
                err.response.data?.message ||
                `Server error (${err.response.status}).`;
          } else if (err.request)
            message = "Network error. Unable to reach server.";
          else message = "Error configuring the request.";
        } else message = err.message || message;
        setError(message);
        setDetailedProject(null);
      } finally {
        setIsLoading(false);
      }
    },
    // Dependencies for useCallback
    [
      project?.title,
      project?.description,
      project?.image,
      project?.requiredCollaborators,
      project?.status,
      project?.owner,
      project?.createdAt,
      project?.updatedAt,
    ]
  );

  // Trigger fetch when project ID changes (no changes needed here)
  useEffect(() => {
    const projectId = project?.id;
    if (projectId) {
      fetchDetails(projectId);
    } else {
      console.error("ProjectDetailModal: Initial project prop missing ID.");
      setError("No project ID provided to modal.");
      setIsLoading(false);
      setDetailedProject(null);
    }
  }, [project?.id, fetchDetails]);

  // --- Render Logic (keep as is, it uses `detailedProject` state) ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden dark:bg-gray-800"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 flex-shrink-0 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4 dark:text-white">
            {isLoading
              ? "Loading..."
              : detailedProject?.title || project?.title || "Project Details"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow dark:text-gray-300">
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

          {/* Content Display */}
          {!isLoading && !error && detailedProject && (
            <div className="space-y-5 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              {/* Image */}
              {detailedProject.image ? (
                <img
                  src={
                    detailedProject.image.startsWith("http") ||
                    detailedProject.image.startsWith("data:")
                      ? detailedProject.image
                      : `${API_BASE_URL}${
                          detailedProject.image.startsWith("/") ? "" : "/"
                        }${detailedProject.image}`
                  }
                  alt={detailedProject.title || "Project Image"}
                  className="w-full h-auto max-h-72 object-contain rounded-lg mb-4 border bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }} // Hide broken image
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-indigo-100 dark:from-gray-700 dark:to-indigo-900 flex items-center justify-center rounded-lg mb-4">
                  <FaUniversity className="text-6xl text-gray-300 dark:text-gray-500" />
                </div>
              )}

              {/* Info Row: Category & Status */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm border-b pb-3 dark:border-gray-700">
                <p>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Category:
                  </strong>{" "}
                  {detailedProject.category || "N/A"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Status:
                  </strong>
                  <span
                    className={`ml-1.5 font-medium px-2 py-0.5 rounded-full text-xs ${
                      detailedProject.status?.toLowerCase() === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : detailedProject.status?.toLowerCase() === "active"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : detailedProject.status?.toLowerCase() === "planning"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : detailedProject.status?.toLowerCase() === "on hold"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                    }`}
                  >
                    {detailedProject.status || "N/A"}
                  </span>
                </p>
              </div>

              {/* Description */}
              <div>
                <strong className="font-medium text-gray-800 dark:text-gray-100 block mb-1.5">
                  Description:
                </strong>
                <p className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 border border-gray-200 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 text-sm leading-relaxed shadow-sm">
                  {detailedProject.description || (
                    <span className="italic text-gray-500 dark:text-gray-400">
                      No description provided.
                    </span>
                  )}
                </p>
              </div>

              {/* Skills Needed */}
              {detailedProject.skillsNeeded &&
                detailedProject.skillsNeeded.length > 0 && (
                  <div>
                    <strong className="font-medium text-gray-800 dark:text-gray-100 block mb-1.5">
                      Skills Needed:
                    </strong>
                    <div className="flex flex-wrap gap-2">
                      {detailedProject.skillsNeeded.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Other Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t mt-5 text-sm dark:border-gray-700">
                <p>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Duration:
                  </strong>{" "}
                  {detailedProject.duration || "Not specified"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Funding:
                  </strong>{" "}
                  {detailedProject.funding || "Not specified"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Collaborators Needed:
                  </strong>{" "}
                  {detailedProject.requiredCollaborators ?? "N/A"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Progress:
                  </strong>{" "}
                  {detailedProject.progress ?? 0}%
                </p>
                <p>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Views:
                  </strong>{" "}
                  {detailedProject.views ?? 0}
                </p>
                <p>
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Likes:
                  </strong>{" "}
                  {detailedProject.likes ?? 0}
                </p>
                {detailedProject.projectUrl && (
                  <p className="md:col-span-2">
                    <strong className="font-medium text-gray-800 dark:text-gray-100">
                      Project Link:
                    </strong>
                    <a
                      href={detailedProject.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline inline-flex items-center gap-1"
                    >
                      Visit Site <FaExternalLinkAlt size={10} />
                    </a>
                  </p>
                )}
              </div>

              {/* Owner Info */}
              {detailedProject.owner && (
                <div className="pt-4 border-t mt-4 text-sm dark:border-gray-700">
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Owner:
                  </strong>
                  <Link
                    to={
                      detailedProject.owner.id
                        ? `/profile/${detailedProject.owner.id}`
                        : "#"
                    }
                    onClick={onClose}
                    className="ml-1.5 text-indigo-600 hover:underline font-medium dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {detailedProject.owner.username || "Unknown User"}
                  </Link>
                  {currentUser &&
                    detailedProject.owner.id === currentUser?.id && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold ml-1">
                        (You)
                      </span>
                    )}
                </div>
              )}

              {/* Display Membership Status (if available and user is logged in) */}
              {currentUser && detailedProject.currentUserMembershipStatus && (
                <div className="pt-2 mt-2 text-sm">
                  <strong className="font-medium text-gray-800 dark:text-gray-100">
                    Your Status:
                  </strong>
                  <span
                    className={`ml-1.5 font-medium px-2 py-0.5 rounded-full text-xs ${
                      detailedProject.currentUserMembershipStatus === "approved"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : detailedProject.currentUserMembershipStatus ===
                          "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                    }`}
                  >
                    {
                      detailedProject.currentUserMembershipStatus === "approved"
                        ? "Member"
                        : detailedProject.currentUserMembershipStatus ===
                          "pending"
                        ? "Request Pending"
                        : detailedProject.currentUserMembershipStatus /* Or 'N/A' */
                    }
                  </span>
                </div>
              )}

              {/* Timestamps & ID */}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-5 pt-3 border-t dark:border-gray-700 flex flex-wrap justify-between gap-2">
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

          {/* Fallback message if loading finished but no details */}
          {!isLoading && !error && !detailedProject && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">
              Could not display project details. The data might be missing or
              invalid after fetching.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-b-xl space-x-3">
          {/* Edit button example (conditional) */}
          {currentUser && detailedProject?.owner?.id === currentUser.id && (
            <Link
              to={`/projects/edit/${detailedProject?.id}`}
              onClick={onClose}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            >
              Edit Project
            </Link>
          )}
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 px-5 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-800"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectDetailModal;
