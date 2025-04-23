// src/Component/Project/ProjectDetailModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaTimes, FaSpinner, FaUniversity } from "react-icons/fa";
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorMessage from "../Common/ErrorMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProjectDetailModal = ({ project, onClose }) => {
  const [detailedProject, setDetailedProject] = useState(project);
  const [isLoading, setIsLoading] = useState(true); // Start loading true to fetch details
  const [error, setError] = useState("");

  useEffect(() => {
    if (!project?.id) {
      setError("No project ID provided for details.");
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/projects/${project.id}`
        );
        if (response.data?.success && response.data?.data) {
          // Map fields again just in case detail view has different needs or names
          const fullData = {
            ...response.data.data,
            image: response.data.data.imageUrl || null,
            collaboratorsNeeded:
              response.data.data.requiredCollaborators ??
              response.data.data.collaboratorsNeeded ??
              1,
            skillsNeeded: response.data.data.skillsNeeded ?? [],
            // Ensure defaults for display
            status: response.data.data.status || "Planning",
            category: response.data.data.category || "Other",
            progress: response.data.data.progress ?? 0,
            views: response.data.data.views ?? 0,
            likes: response.data.data.likes ?? 0,
            comments: response.data.data.comments ?? 0,
          };
          setDetailedProject(fullData);
        } else {
          throw new Error(response.data?.message || "Invalid data received.");
        }
      } catch (err) {
        console.error(
          "Error fetching project details:",
          err.response?.data || err.message
        );
        setError(
          err.response?.data?.message || "Could not load full project details."
        );
        setDetailedProject(project); // Fallback to initially passed data
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [project?.id]); // Depend on project.id

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
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
            {detailedProject?.title || "Loading Project..."}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <LoadingSpinner />
            </div>
          )}
          {error && !isLoading && <ErrorMessage message={error} />}
          {!isLoading && !error && detailedProject && (
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              {detailedProject.image ? (
                <img
                  src={detailedProject.image}
                  alt={detailedProject.title}
                  className="w-full h-auto max-h-60 object-contain rounded-lg mb-4 border bg-gray-100"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-indigo-100 flex items-center justify-center rounded-lg mb-4">
                  <FaUniversity className="text-5xl text-gray-300" />
                </div>
              )}
              <p>
                <strong className="font-medium text-gray-800">Category:</strong>{" "}
                {detailedProject.category || "N/A"}
              </p>
              <p>
                <strong className="font-medium text-gray-800">Status:</strong>{" "}
                {detailedProject.status || "N/A"}
              </p>
              <p>
                <strong className="font-medium text-gray-800">
                  Description:
                </strong>
              </p>
              <p className="whitespace-pre-wrap bg-gray-50 p-3 border rounded-md">
                {detailedProject.description || "N/A"}
              </p>
              {/* Skills Needed */}
              {detailedProject.skillsNeeded?.length > 0 && (
                <div>
                  <strong className="font-medium text-gray-800 block mb-1">
                    Skills Needed:
                  </strong>
                  <div className="flex flex-wrap gap-2">
                    {detailedProject.skillsNeeded.map((skill) => (
                      <span
                        key={skill}
                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Other Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t mt-3">
                <p>
                  <strong className="font-medium text-gray-800">
                    Duration:
                  </strong>{" "}
                  {detailedProject.duration || "N/A"}
                </p>
                <p>
                  <strong className="font-medium text-gray-800">
                    Funding:
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
                  {detailedProject.progress ?? "N/A"}%
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
                <div className="pt-3 border-t mt-3">
                  <strong className="font-medium text-gray-800">Owner:</strong>{" "}
                  {detailedProject.owner.username || "N/A"}
                  {/* Link to owner profile later? */}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4">
                Project ID: {detailedProject.id}
              </p>
            </div>
          )}
          {!isLoading && !error && !detailedProject && (
            <p className="text-center text-gray-500">
              Project details not found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-5 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}; // No semicolon
export default ProjectDetailModal;
