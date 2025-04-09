// src/hooks/usePublications.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { useApiClient } from "./useApiUtils"; // Corrected import path

/**
 * Hook to manage fetching, filtering, sorting, and interaction with publications.
 * @param {object|null} currentUser The current logged-in user object (needs at least `id`).
 * @param {function} showNotification Function to display notifications (likely from useNotification).
 * @returns {object} State and functions related to publications.
 */
function usePublications(currentUser, showNotification) {
  const [publications, setPublications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title"); // Default sort
  const [actionLoading, setActionLoading] = useState(null); // Tracks ID of publication during request send

  const { makeRequest } = useApiClient(); // Get the API request function

  // --- Fetch Publications ---
  const fetchPublications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await makeRequest("get", "/publications");
      setPublications(Array.isArray(data) ? data : []); // Ensure it's an array
    } catch (error) {
      showNotification(
        `Failed to load publications: ${error.message}`,
        "error"
      );
      setPublications([]); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest, showNotification]); // Dependencies: makeRequest and showNotification

  // Initial fetch on mount (and if fetchPublications changes, though it shouldn't often)
  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  // --- Filtering and Sorting ---
  const filteredAndSortedPublications = useMemo(() => {
    // Start with the raw publications list
    let processedPublications = [...publications];

    // Apply filtering based on searchTerm
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (lowerSearchTerm) {
      processedPublications = processedPublications.filter(
        (pub) =>
          pub.title?.toLowerCase().includes(lowerSearchTerm) ||
          pub.author?.toLowerCase().includes(lowerSearchTerm) ||
          pub.keywords?.toLowerCase().includes(lowerSearchTerm) ||
          pub.abstract?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply sorting based on sortBy
    processedPublications.sort((a, b) => {
      const valA = a[sortBy] || ""; // Handle potentially missing fields
      const valB = b[sortBy] || "";

      if (sortBy === "publishDate") {
        // Sort dates descending (newest first)
        const dateA = new Date(valA);
        const dateB = new Date(valB);
        // Handle invalid dates if necessary
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1; // Put invalid dates last
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      } else {
        // Default case-insensitive string comparison for title, author, etc.
        return String(valA).localeCompare(String(valB), undefined, {
          sensitivity: "base",
        });
      }
    });

    return processedPublications;
  }, [publications, searchTerm, sortBy]); // Recalculate when these change

  // --- Send Collaboration Request ---
  const sendCollaborationRequest = useCallback(
    async (publicationId) => {
      if (!currentUser?.id) {
        showNotification(
          "Cannot send request: User information is missing.",
          "error"
        );
        return false; // Indicate failure
      }
      if (!publicationId) {
        showNotification(
          "Cannot send request: Publication ID is missing.",
          "error"
        );
        return false;
      }

      setActionLoading(publicationId); // Set loading state for this specific publication
      try {
        // The backend should associate the request with the logged-in user via the token
        await makeRequest("post", "/requests", {
          publicationId /* , userId: currentUser.id - Ideally backend uses token */,
        });

        showNotification("Collaboration request sent successfully!", "success");
        return true; // Indicate success
      } catch (error) {
        // Handle specific errors, e.g., if a request already exists
        if (error.status === 409) {
          // Example: Conflict status for existing request
          showNotification(
            "You have already sent a request for this publication.",
            "warning"
          );
        } else {
          showNotification(`Failed to send request: ${error.message}`, "error");
        }
        return false; // Indicate failure
      } finally {
        setActionLoading(null); // Clear loading state regardless of outcome
      }
    },
    [currentUser, makeRequest, showNotification]
  ); // Dependencies

  // --- Return State and Actions ---
  return {
    publications: filteredAndSortedPublications, // The processed list
    isLoading,
    searchTerm,
    setSearchTerm, // Allow parent component to control search term
    sortBy,
    setSortBy, // Allow parent component to control sort criteria
    sendCollaborationRequest,
    actionLoading, // Let parent component know which publication action is loading
    fetchPublications, // Expose refetch function
  };
}

export default usePublications;
