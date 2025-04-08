// MyProjects.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios"; // Using axios directly for simplicity here
import LoadingSpinner from "../Component/Common/LoadingSpinner"; // Verify path
import ErrorMessage from "../Component/Common/ErrorMessage"; // Verify path
// import { Link } from 'react-router-dom'; // Import Link if you add navigation later

// ** IMPORTANT: Ensure this matches your actual backend URL and VITE setup **
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function MyProjects({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch projects for the logged-in user
  const fetchProjects = useCallback(async () => {
    // Only fetch if currentUser exists and has an ID
    if (!currentUser?.id) {
      setIsLoading(false); // Stop loading if no user
      setProjects([]); // Ensure list is empty
      // Avoid setting error here, ProtectedRoute should handle redirection
      return;
    }

    setIsLoading(true);
    setError(""); // Clear previous errors on new fetch
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("Authentication required to view projects.");
      setIsLoading(false);
      return;
    }

    try {
      // Use the endpoint that fetches projects for the authenticated user
      // ** ASSUMPTION: GET /api/projects filters by the user based on the token **
      const url = `${API_BASE_URL}/api/projects`;
      console.log(`Fetching projects from: ${url}`); // Log URL for debugging

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("API Response:", response); // Log response for debugging

      // Check common success structures from backend (adapt as needed)
      let fetchedProjects = [];
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        fetchedProjects = response.data.data; // Handles { success: true, data: [...] }
      } else if (response.data && Array.isArray(response.data)) {
        fetchedProjects = response.data; // Handles direct array response [...]
      } else {
        // Handle unexpected structures or explicit failure message from backend
        console.warn("Unexpected project data structure:", response.data);
        setError(
          response.data?.message || "Received invalid data for projects."
        );
      }

      setProjects(fetchedProjects); // Update state with fetched or empty array
    } catch (err) {
      console.error("Fetch projects error:", err); // Log the full error
      // Provide more specific error message if available
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while loading projects.";
      setError(errMsg);
      setProjects([]); // Clear projects on error
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // Dependency: re-fetch if currentUser changes

  // Effect Hook to run fetchProjects on mount and when fetchProjects changes
  useEffect(() => {
    console.log("MyProjects effect running. currentUser:", currentUser); // Log user status
    fetchProjects();
  }, [fetchProjects]);

  // --- Render Logic ---
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
        My Projects
      </h1>

      {/* Display Error if any */}
      {error && <ErrorMessage message={error} onClose={() => setError("")} />}

      {/* Display Loading Spinner */}
      {isLoading ? (
        <div className="text-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : /* Display Empty Message if no projects */
      projects.length === 0 ? (
        <p className="text-center text-gray-500 bg-white p-6 rounded-lg shadow border">
          You haven't created or joined any projects yet.
        </p>
      ) : (
        /* Display Project List */
        <ul className="list-disc pl-5 bg-white p-6 rounded-lg shadow border">
          {projects.map((proj) => (
            <li key={proj.id} className="mb-2 text-gray-700">
              {proj.title || "Untitled Project"}
              {/* Placeholder for future link */}
              {/* <Link to={`/projects/${proj.id}`} className="ml-2 text-sm text-indigo-600 hover:underline">(View)</Link> */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
