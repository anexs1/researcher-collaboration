// src/hooks/useApiUtils.js
import { useState, useCallback } from "react";
import axios from "axios";

// --- Configuration ---
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api"; // Use environment variable or default

// --- Notification Hook ---

/**
 * Hook to manage and display simple notifications.
 * Can be replaced with a more robust library like react-toastify.
 */
export function useNotification() {
  // State holds the current notification message, type, and a key for re-triggering animations
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    key: 0,
  });

  /**
   * Shows a notification message.
   * @param {string} message The message content.
   * @param {'success' | 'error' | 'info' | 'warning'} type The type of notification (controls styling).
   * @param {number} duration Time in milliseconds before the notification auto-hides.
   */
  const showNotification = useCallback(
    (message, type = "error", duration = 4000) => {
      setNotification({ message, type, key: Date.now() }); // Use timestamp as key
      // Automatically clear the notification after the duration
      setTimeout(() => {
        // Clear only if the current notification is the one we set
        setNotification((prev) =>
          prev.message === message ? { ...prev, message: "" } : prev
        );
      }, duration);
    },
    []
  );

  /**
   * Manually clears the current notification.
   */
  const clearNotification = useCallback(() => {
    setNotification({ message: "", type: "", key: 0 });
  }, []);

  return { notification, showNotification, clearNotification };
}

// --- API Client Hook ---

/**
 * Hook to provide a configured function for making authenticated API requests.
 */
export function useApiClient() {
  /**
   * Makes an authenticated API request using Axios.
   * Handles adding the Authorization header and base URL.
   * Throws a structured error on failure.
   * @param {'get' | 'post' | 'put' | 'delete' | 'patch'} method The HTTP method.
   * @param {string} endpoint The API endpoint (e.g., '/users', '/publications/123').
   * @param {object|null} [data=null] The request payload data (for POST, PUT, PATCH).
   * @returns {Promise<any>} A promise that resolves with the response data on success.
   * @throws {Error} Throws an error with a user-friendly message and potentially a status code on failure.
   */
  const makeRequest = useCallback(async (method, endpoint, data = null) => {
    const token = localStorage.getItem("token"); // Or get token from context/state management

    // Optional: Check for token presence early
    // if (!token) {
    //     console.error("Authentication token not found.");
    //     // Redirect to login or show specific error
    //     const authError = new Error("Authentication required. Please log in.");
    //     authError.status = 401; // Unauthorized
    //     throw authError;
    // }

    const headers = {
      "Content-Type": "application/json", // Standard for JSON APIs
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`, // Prepend base URL
      headers,
      data, // Axios automatically handles placing data in body for POST/PUT/PATCH
    };

    try {
      const response = await axios(config);
      // Axios resolves promises for 2xx status codes
      return response.data; // Return the response body data
    } catch (error) {
      console.error(
        `API Error (${method.toUpperCase()} ${endpoint}):`,
        error.response || error.message || error
      );

      // Construct a more informative error message
      let errorMessage = `An unexpected error occurred during the request to ${endpoint}.`;
      let status = null;

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage =
          error.response.data?.message || // Use server-provided message if available
          `Request failed with status code ${error.response.status}.`;
        status = error.response.status;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = `No response received from server for ${endpoint}. Check network connection or server status.`;
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage =
          error.message || `Error setting up request to ${endpoint}.`;
      }

      // Create a new error object to throw, potentially adding the status code
      const customError = new Error(errorMessage);
      if (status) {
        customError.status = status;
      }
      throw customError; // Rethrow the processed error
    }
  }, []); // No dependencies, relies on localStorage directly (or context if changed)

  return { makeRequest };
}
