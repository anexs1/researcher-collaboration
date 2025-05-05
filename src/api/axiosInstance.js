// src/api/axiosInstance.js
import axios from "axios";

// Get the base URL from environment variables, default to your API server port
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Create a new Axios instance with the base URL configured
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// --- Request Interceptor ---
// This function runs BEFORE every request made using this axiosInstance
axiosInstance.interceptors.request.use(
  (config) => {
    // Add console logs for debugging
    console.log("--- Axios Request Interceptor ---");

    // --- MODIFICATION: Read the token directly from 'authToken' ---
    // Get the token stored by your useAuth hook
    const token = localStorage.getItem("authToken");
    console.log(
      'Interceptor: Reading token from localStorage("authToken"):',
      token ? "Token found (length " + token.length + ")" : "No token found"
    ); // Log if token exists

    // If a token exists, add it to the Authorization header
    if (token) {
      // Ensure the header format is correct: 'Bearer <token>'
      config.headers["Authorization"] = `Bearer ${token}`;
      // Log the header being set (avoid logging the full token in production ideally)
      console.log(
        "Interceptor: Setting Authorization header:",
        `Bearer ${token.substring(0, 10)}...`
      ); // Log prefix for confirmation
    } else {
      // Log if no token was found (helps diagnose login issues)
      console.log(
        'Interceptor: No token found in localStorage("authToken"), Authorization header NOT added.'
      );
    }
    // --- END MODIFICATION ---

    // Log the final headers object before the request is sent
    // Useful for seeing all headers (Content-Type, Authorization, etc.)
    console.log(
      "Interceptor: Final Headers being sent:",
      JSON.stringify(config.headers)
    );
    console.log("---------------------------------");

    // Return the modified config object for the request to proceed
    return config;
  },
  (error) => {
    // Handle errors that occur during request setup (less common)
    console.error("Axios request interceptor error:", error);
    // Reject the promise to prevent the request from being sent
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// This function runs AFTER a response is received (or an error occurs)
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx causes this function to trigger
    // Simply pass the successful response along
    return response;
  },
  (error) => {
    // Any status code outside the range of 2xx causes this function to trigger
    console.error(
      "Axios response error Interceptor:",
      error.response?.status,
      error.message
    ); // Log status and message

    // Check if the error has a response object (network errors might not)
    if (error.response) {
      // Specifically handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // This is where you might trigger a global logout action
        console.error(
          "Interceptor detected 401 Unauthorized! Potentially logging out..."
        );

        // Example: Clear local storage and redirect (uncomment if needed)
        // localStorage.removeItem('authToken');
        // localStorage.removeItem('user'); // Make sure to remove the user object too
        // // Trigger a custom event or use a state management action to update UI globally
        // window.dispatchEvent(new Event('authChange')); // Notify App.jsx
        // // Redirect to login page
        // window.location.href = '/login';
      }
      // You could add handling for other specific error codes here (e.g., 403 Forbidden, 500 Server Error)
    } else {
      // Handle errors without a response (e.g., network error, CORS issue intercepted by browser before request)
      console.error("Axios error without response:", error.message);
    }

    // It's important to reject the promise so the error propagates
    // to the .catch() block in your component's API call function.
    return Promise.reject(error);
  }
);

// Export the configured Axios instance for use in your components/API calls
export default axiosInstance;
