// src/Pages/ProjectDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../Component/Common/LoadingSpinner';
import ErrorMessage from '../Component/Common/ErrorMessage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_PROJECT_IMAGE = "/default-project-image.png";

function ProjectDetailPage({ currentUser }) {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setError("Project ID is missing. Cannot load details.");
      setProject(null);
      setLoading(false);
      return;
    }

    const fetchProjectDetails = async () => {
      setLoading(true);
      setError(null);
      setProject(null);

      const apiUrl = `${API_BASE_URL}/api/projects/${projectId}`;

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: `Server responded with ${response.status}: ${response.statusText}` };
          }
          const errorMessage = errorData?.message || `Failed to fetch project details. Status: ${response.status}`;
          setError(errorMessage);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data && data.success === true && data.data) {
          setProject(data.data);
        } else if (data && data.success === false) {
          setError(data.message || "Project not found or could not be loaded.");
        } else {
          setError("Received an unexpected response structure from the server.");
        }
      } catch (err) {
        setError(err.message || "An unexpected error occurred while fetching project details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-lg text-gray-600">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        </div>
        <ErrorMessage
          title="Error Loading Project"
          message={error}
          className="max-w-xl mx-auto"
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="mb-4 text-left">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        </div>
        <p className="text-xl text-gray-700">Project not found.</p>
        <p className="text-sm text-gray-500 mt-2">The project you are looking for does not exist or could not be loaded.</p>
      </div>
    );
  }

  const projectImageUrl = project.imageUrl
    ? project.imageUrl.startsWith('http')
      ? project.imageUrl
      : `${API_BASE_URL}${project.imageUrl.startsWith('/') ? project.imageUrl : `/${project.imageUrl}`}`
    : DEFAULT_PROJECT_IMAGE;

  const authorLink = project.authorId
    ? `/users/${project.authorId}/projects`
    : project.author?.id
      ? `/users/${project.author.id}/projects`
      : null;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        {authorLink ? (
          <Link to={authorLink} className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to {project.author?.username || 'User'}'s Projects
          </Link>
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        )}
      </div>

      <article className="bg-white shadow-xl rounded-lg overflow-hidden">
        <img src={projectImageUrl} alt={project.title || "Project"} className="w-full h-64 object-cover" />
        <div className="p-6">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">{project.title}</h1>
          <p className="text-gray-600 mb-4">{project.description}</p>
          <p className="text-sm text-gray-500">
            Created by {project.author?.username || 'Unknown'} on {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </article>
    </div>
  );
}

export default ProjectDetailPage;
