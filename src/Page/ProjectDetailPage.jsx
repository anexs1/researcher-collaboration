// Example: src/Page/ProjectDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // Or your API client
import LoadingSpinner from "../Component/Common/LoadingSpinner";
import ErrorMessage from "../Component/Common/ErrorMessage";

const ProjectDetailPage = ({ currentUser }) => {
  const { projectId } = useParams(); // Get the project ID from the URL parameter
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setIsLoading(true);
      setError(null);
      console.log(`ProjectDetailPage: Fetching project with ID: ${projectId}`);
      try {
        // Adjust API endpoint if needed
        const response = await axiosInstance.get(`/api/projects/${projectId}`);
        if (response.data?.success) {
          setProject(response.data.project); // Assuming response structure
          console.log(
            "ProjectDetailPage: Project data fetched:",
            response.data.project
          );
        } else {
          throw new Error(
            response.data?.message || "Failed to load project data."
          );
        }
      } catch (err) {
        console.error("ProjectDetailPage: Fetch error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load project."
        );
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]); // Re-fetch if projectId changes

  if (isLoading)
    return (
      <div className="p-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  if (error)
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
      </div>
    );
  if (!project)
    return (
      <div className="p-6 text-center text-gray-500">Project not found.</div>
    );

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* --- Render Project Details --- */}
      <h1 className="text-2xl md:text-3xl font-bold mb-4">{project.title}</h1>
      <p className="text-gray-600 mb-2">
        Category: {project.category || "N/A"}
      </p>
      <p className="text-gray-600 mb-4">
        Owner: {project.owner?.username || "Unknown"}
      </p>
      <div className="prose max-w-none mb-6">
        <p>{project.description}</p>
      </div>

      {/* Add sections for collaborators, requests (if owner), chat, etc. */}
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
        {/* Example: Display requests if current user is owner */}
        {currentUser?.id === project.ownerId && (
          <div>
            <h3 className="text-lg font-medium mb-2">Join Requests</h3>
            {/* TODO: Add component or logic to show/manage requests for THIS project */}
            <p className="text-sm text-gray-500">
              (Request management section)
            </p>
          </div>
        )}
        {/* Other sections */}
      </div>

      {/* --- End Project Details --- */}
    </div>
  );
};

export default ProjectDetailPage;
