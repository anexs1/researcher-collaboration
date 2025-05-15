import React from "react";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const DEFAULT_PROJECT_IMAGE = "/default-project-image.png"; // Place in /public

const ProjectCard = ({ project }) => {
  if (!project) return null;

  const projectImageUrl = project.imageUrl
    ? project.imageUrl.startsWith("http")
      ? project.imageUrl
      : `${API_BASE_URL}${project.imageUrl}`
    : DEFAULT_PROJECT_IMAGE;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full hover:shadow-2xl transition-shadow duration-300 ease-in-out">
      <Link to={`/projects/${project.id}`} className="block aspect-video_">
        {" "}
        {/* aspect-video might be too restrictive if images vary */}
        <img
          src={projectImageUrl}
          alt={project.title || "Project Image"}
          className="w-full h-48 object-cover" // Fixed height for consistency
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_PROJECT_IMAGE;
          }}
        />
      </Link>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-blue-700 mb-1">
          <Link
            to={`/projects/${project.id}`}
            className="hover:underline line-clamp-2"
            title={project.title}
          >
            {project.title}
          </Link>
        </h3>
        {project.owner && (
          <p className="text-xs text-gray-500 mb-2">
            By:{" "}
            <Link
              to={`/profile/${project.owner.id}`}
              className="hover:underline font-medium"
            >
              {project.owner.username || "Unknown Owner"}
            </Link>
          </p>
        )}
        <p className="text-sm text-gray-700 mb-3 line-clamp-3 flex-grow min-h-[60px]">
          {" "}
          {/* Min height for description area */}
          {project.description}
        </p>
        <div className="text-xs text-gray-500 mb-3">
          Status:{" "}
          <span className="font-medium capitalize">{project.status}</span>
          {project.category && (
            <span className="ml-2">
              | Category:{" "}
              <span className="font-medium">{project.category}</span>
            </span>
          )}
        </div>
        {project.currentUserMembershipStatus && (
          <div
            className={`mb-3 text-xs font-semibold p-1.5 rounded text-center ${
              project.currentUserMembershipStatus === "approved"
                ? "bg-green-100 text-green-700"
                : project.currentUserMembershipStatus === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : ""
            }`}
          >
            {project.currentUserMembershipStatus === "approved"
              ? "You are a member"
              : project.currentUserMembershipStatus === "pending"
              ? "Your request is pending"
              : ""}
          </div>
        )}
      </div>
      <div className="px-5 pb-5 pt-3 border-t border-gray-200 mt-auto">
        <Link
          to={`/projects/${project.id}`} // This should link to a Project Detail Page
          className="w-full block text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors text-sm font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
