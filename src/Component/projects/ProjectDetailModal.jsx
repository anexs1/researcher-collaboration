// src/Component/projects/ProjectDetailModal.jsx
import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import axios from "axios";
import { motion } from "framer-motion";
import { FaTimes, FaUniversity } from "react-icons/fa"; // Removed FaSpinner as LoadingSpinner is used
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessage from "../Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProjectDetailModal = ({ project, onClose }) => {
  // Initialize with the potentially basic project data passed in
  const [detailedProject, setDetailedProject] = useState(project);
  const [isLoading, setIsLoading] = useState(true); // Start loading to fetch full details
  const [error, setError] = useState("");

  // Define fetchDetails using useCallback to memoize it
  const fetchDetails = useCallback(
    async (projectId) => {
      setIsLoading(true);
      setError("");

      // --- Get the token from localStorage ---
      const token = localStorage.getItem("authToken"); // Use the correct key 'authToken'

      if (!token) {
        setError("Authentication required to view project details.");
        setIsLoading(false);
        // Optionally call onClose() after a delay or show a login prompt
        console.error("Auth token not found in localStorage.");
        return; // Stop execution if no token
      }

      try {
        // --- Add the headers configuration to axios.get ---
        const response = await axios.get(
          `${API_BASE_URL}/api/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Add the Authorization header
            },
          }
        );

        if (response.data?.success && response.data?.data) {
          // Map fields robustly, providing defaults
          const fullData = {
            ...response.data.data, // Spread fetched data first
            id: response.data.data.id ?? projectId, // Ensure ID is present
            title: response.data.data.title ?? "Untitled Project",
            description: response.data.data.description ?? "No description.",
            image: response.data.data.imageUrl || project?.image || null, // Use fetched, fallback to prop, then null
            collaboratorsNeeded:
              response.data.data.requiredCollaborators ??
              response.data.data.collaboratorsNeeded ?? // Check alternative field names
              1,
            skillsNeeded: response.data.data.skillsNeeded ?? [],
            status: response.data.data.status || "Planning",
            category: response.data.data.category || "Other",
            progress: response.data.data.progress ?? 0,
            views: response.data.data.views ?? 0,
            likes: response.data.data.likes ?? 0,
            comments: response.data.data.comments ?? 0,
            duration: response.data.data.duration, // Add fields if they exist in API response
            funding: response.data.data.funding,
            owner: response.data.data.owner, // Assume owner object is included
          };
          setDetailedProject(fullData);
        } else {
          // Handle cases where API returns success: false or no data
          throw new Error(response.data?.message || "Invalid data received.");
        }
      } catch (err) {
        console.error(
          "Error fetching project details:",
          err.response?.data || err.message
        );
        const message =
          err.response?.status === 401
            ? "Unauthorized: Cannot view details." // Specific message for 401
            : err.response?.data?.message ||
              err.message || // Use backend message or generic error
              "Could not load full project details.";
        setError(message);
        // Keep the initially passed project data as fallback if fetch fails
        setDetailedProject(project);
      } finally {
        setIsLoading(false);
      }
    },
    [project]
  ); // Add `project` as dependency because it's used in the catch block fallback

  // useEffect to trigger fetch when component mounts or project.id changes
  useEffect(() => {
    const projectId = project?.id; // Get ID from prop

    if (!projectId) {
      setError("No project ID provided for details.");
      setIsLoading(false);
      setDetailedProject(null); // Clear details if no ID
      return;
    }

    fetchDetails(projectId);

    // Optional: Cleanup function (e.g., for AbortController) if needed
    // return () => { ... };
  }, [project?.id, fetchDetails]); // Depend on project.id and the memoized fetchDetails

  // --- Render Logic ---
  return (
    // Modal backdrop and positioning
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      {/* Modal content container with animation */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
            {/* Show title from detailedProject if available, else initial project, else loading */}
            {detailedProject?.title || project?.title || "Loading Project..."}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <LoadingSpinner />
            </div>
          )}
          {/* Error State */}
          {error && !isLoading && (
            <ErrorMessage message={error} onClose={() => setError("")} />
          )}
          {/* Success State - Display Details */}
          {!isLoading && !error && detailedProject && (
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              {/* Image */}
              {detailedProject.image ? (
                <img
                  src={detailedProject.image}
                  alt={detailedProject.title}
                  className="w-full h-auto max-h-60 object-contain rounded-lg mb-4 border bg-gray-50" // Use contain for potentially different aspect ratios
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-indigo-100 flex items-center justify-center rounded-lg mb-4">
                  <FaUniversity className="text-5xl text-gray-300" />
                </div>
              )}
              {/* Basic Info */}
              <p>
                <strong className="font-medium text-gray-800">Category:</strong>{" "}
                {detailedProject.category || "N/A"}
              </p>
              <p>
                <strong className="font-medium text-gray-800">Status:</strong>{" "}
                <span
                  className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                    detailedProject.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : detailedProject.status === "Active"
                      ? "bg-blue-100 text-blue-800"
                      : detailedProject.status === "Planning"
                      ? "bg-yellow-100 text-yellow-800"
                      : detailedProject.status === "On Hold"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {detailedProject.status || "N/A"}
                </span>
              </p>
              {/* Description */}
              <div>
                <strong className="font-medium text-gray-800 block mb-1">
                  Description:
                </strong>
                <p className="whitespace-pre-wrap bg-gray-50 p-3 border rounded-md text-gray-800 text-sm leading-relaxed">
                  {detailedProject.description || "No description provided."}
                </p>
              </div>

              {/* Skills Needed */}
              {detailedProject.skillsNeeded?.length > 0 && (
                <div>
                  <strong className="font-medium text-gray-800 block mb-1">
                    Skills Needed:
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {detailedProject.skillsNeeded.map(
                      (
                        skill,
                        index // Added index for key safety if skills aren't unique
                      ) => (
                        <span
                          key={`${skill}-${index}`}
                          className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
              {/* Other Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t mt-4">
                <p>
                  <strong className="font-medium text-gray-800">
                    Duration:
                  </strong>{" "}
                  {detailedProject.duration || "N/A"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800">
                    Funding Status:
                  </strong>{" "}
                  {detailedProject.funding || "N/A"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800">
                    Collaborators Needed:
                  </strong>{" "}
                  {detailedProject.collaboratorsNeeded ?? "N/A"}
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
              </div>
              {/* Owner Info */}
              {detailedProject.owner && (
                <div className="pt-4 border-t mt-4">
                  <strong className="font-medium text-gray-800">Owner:</strong>{" "}
                  <span className="text-indigo-600">
                    {detailedProject.owner.username || "N/A"}
                  </span>
                  {/* Optionally add owner email or link */}
                  {detailedProject.owner.email && (
                    <span className="text-gray-500 text-xs ml-2">
                      ({detailedProject.owner.email})
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4 pt-3 border-t">
                Project ID: {detailedProject.id || "N/A"}
              </p>
            </div>
          )}
          {/* Fallback if no details and not loading/error */}
          {!isLoading && !error && !detailedProject && (
            <p className="text-center text-gray-500 py-10">
              Could not load project details.
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
          {/* Add other actions here if needed, e.g., Join, Edit (if owner) */}
        </div>
      </motion.div>
    </div>
  );
}; // Removed semicolon

export default ProjectDetailModal;
