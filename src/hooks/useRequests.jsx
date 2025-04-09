// src/hooks/useRequests.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { useApiClient } from "./useApiUtils"; // Corrected import path

/**
 * Hook to manage fetching, categorizing, and acting upon collaboration requests.
 * @param {object|null} currentUser The current logged-in user object (needs at least `id`).
 * @param {function} showNotification Function to display notifications.
 * @returns {object} State and functions related to requests.
 */
function useRequests(currentUser, showNotification) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Tracks ID of request being acted upon

  const { makeRequest } = useApiClient(); // Get the API request function

  // --- Fetch Requests ---
  const fetchRequests = useCallback(async () => {
    // Don't attempt fetch if user is not available
    if (!currentUser?.id) {
      setRequests([]); // Ensure requests are cleared if user logs out
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Endpoint should return requests relevant to the current user
      // (where user is requester OR author of the publication)
      const data = await makeRequest("get", "/requests"); // Adjust if endpoint needs user ID etc.
      setRequests(Array.isArray(data) ? data : []); // Ensure it's an array
    } catch (error) {
      showNotification(
        `Failed to load your requests: ${error.message}`,
        "error"
      );
      setRequests([]); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, makeRequest, showNotification]); // Dependencies

  // Initial fetch and refetch if user changes
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]); // The dependency array includes currentUser implicitly via fetchRequests

  // --- Categorize and Process Requests ---
  const { receivedRequests, sentRequests, pendingSentRequestIds } =
    useMemo(() => {
      const received = [];
      const sent = [];
      const pendingSentIds = new Set(); // Tracks publications with pending/approved requests sent BY the user
      const userId = currentUser?.id;

      if (!userId)
        return {
          receivedRequests: [],
          sentRequests: [],
          pendingSentRequestIds: new Set(),
        };

      requests.forEach((req) => {
        if (!req || !req.Publication) return; // Basic validation for malformed request data

        // Received: Current user is the author of the publication, AND not the requester
        if (req.Publication.authorId === userId && req.requesterId !== userId) {
          received.push(req);
        }
        // Sent: Current user is the requester
        else if (req.requesterId === userId) {
          sent.push(req);
          // If a request sent by the user is still pending or already approved,
          // mark the publication so they can't send another request.
          if (req.status === "pending" || req.status === "approved") {
            pendingSentIds.add(req.publicationId);
          }
        }
      });

      // Sort requests by creation date, newest first
      const sortByDateDesc = (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt);
      received.sort(sortByDateDesc);
      sent.sort(sortByDateDesc);

      return {
        receivedRequests: received,
        sentRequests: sent,
        pendingSentRequestIds: pendingSentIds,
      };
    }, [requests, currentUser?.id]); // Recalculate when requests or user change

  // --- Handle Request Actions (Approve, Deny, Cancel) ---
  const handleRequestAction = useCallback(
    async (actionType, requestId) => {
      if (!requestId) {
        showNotification("Action failed: Request ID is missing.", "error");
        return;
      }

      setActionLoading(requestId); // Set loading state for this specific request

      let endpoint = "";
      let method = "put"; // Default for approve/deny
      let successMessage = "";

      try {
        switch (actionType) {
          case "approve":
            endpoint = `/requests/${requestId}/approve`;
            method = "put";
            successMessage = "Request approved successfully!";
            break;
          case "deny":
            endpoint = `/requests/${requestId}/deny`;
            method = "put";
            successMessage = "Request denied successfully!";
            break;
          case "cancel":
            endpoint = `/requests/${requestId}`; // Assuming DELETE method for cancel
            method = "delete";
            successMessage = "Request cancelled successfully!";
            break;
          default:
            // Should not happen if UI calls are correct
            throw new Error(`Invalid action type requested: ${actionType}`);
        }

        await makeRequest(method, endpoint, {}); // Empty payload for PUT/DELETE often okay

        showNotification(successMessage, "success");

        // **Crucial:** Refetch the requests list to update the UI accurately
        // This avoids complex optimistic update logic and ensures consistency.
        await fetchRequests();
      } catch (error) {
        showNotification(
          `Failed to ${actionType} request: ${error.message}`,
          "error"
        );
        // Optional: Refetch even on failure if the state might be inconsistent
        // await fetchRequests();
      } finally {
        setActionLoading(null); // Clear loading state
      }
    },
    [makeRequest, showNotification, fetchRequests]
  ); // Dependencies

  // --- Return State and Actions ---
  return {
    receivedRequests,
    sentRequests,
    pendingSentRequestIds, // Set of publication IDs the user has pending/approved requests for
    isLoading,
    handleRequestAction,
    actionLoading, // Let parent component know which request action is loading
    fetchRequests, // Expose refetch function
  };
}

export default useRequests;
