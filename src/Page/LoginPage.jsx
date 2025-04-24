// src/Page/LoginPage.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

// Receive the 'login' function from useAuth (via App.jsx)
const LoginPage = ({ login, isForAdmin = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true);

    const loginEndpoint = isForAdmin
      ? "/api/auth/admin-login"
      : "/api/auth/login";
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    // --- ADDED CONSOLE LOG FOR DEBUGGING ---
    console.log(`Attempting login to ${loginEndpoint} with:`, {
      email: email,
      password: password,
    }); // Log credentials being sent
    // --- END ADDED CONSOLE LOG ---

    try {
      const response = await axios.post(`${API_BASE}${loginEndpoint}`, {
        email, // Send current email state
        password, // Send current password state
      });

      // NOTE: No need to setLoading(false) here if navigating away on success

      // Check for successful response structure from backend
      if (
        response.data?.success &&
        response.data?.token &&
        response.data?.user &&
        response.data?.user?.id
      ) {
        console.log("Login API call successful:", response.data); // Log successful response
        // Call the centralized login function (updates state & localStorage)
        login(response.data.user, response.data.token);

        // Navigate after login state is processed
        const isAdminUser = response.data.user.role === "admin";
        const destination = isAdminUser ? "/admin" : "/profile";
        console.log(`Login success. Navigating to ${destination}`);
        navigate(destination, { replace: true });
      } else {
        // Handle cases where API gives 2xx status but response format is wrong
        setLoading(false); // Stop loading indicator
        const errMsg =
          response.data?.message ||
          "Login successful but received unexpected data from server.";
        console.error(
          "Login success response missing data or success=false:",
          response.data
        );
        setError(errMsg);
      }
    } catch (err) {
      setLoading(false); // Stop loading indicator on error
      // Extract error message from backend response if available
      const errorMessage =
        err.response?.data?.message || // Use backend message first
        err.message || // Fallback to axios/network error message
        "Login failed. An unknown error occurred."; // Default fallback
      setError(errorMessage); // Display error to the user
      // --- IMPROVED ERROR LOGGING ---
      console.error("Login API Error:", {
        message: err.message, // General error (e.g., Network Error, Request failed...)
        statusCode: err.response?.status, // HTTP status (401, 400, 500 etc.)
        responseData: err.response?.data, // Actual JSON error body from backend
        requestData: { email: email }, // Log email sent (avoid logging password here ideally)
      });
      // --- END IMPROVED ERROR LOGGING ---
    }
  };

  // --- JSX (No structural changes needed) ---
  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-full max-w-md px-6 py-12">
        <motion.div
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isForAdmin ? "Admin Portal" : "Welcome back"}
            </h1>
            <p className="text-gray-500">
              {isForAdmin
                ? "Access the admin dashboard"
                : "Sign in to continue"}
            </p>
          </div>

          {/* Error Display Area */}
          {error && (
            <motion.div
              className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center justify-between text-sm" // Adjusted styling
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert" // Accessibility improvement
            >
              <span>{error}</span>
              <button
                onClick={() => setError("")} // Clear error on click
                className="ml-2 text-red-700 hover:text-red-900 font-semibold"
                aria-label="Close error message"
              >
                ✕ {/* Cross symbol */}
              </button>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm" // Adjusted styling
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm" // Adjusted styling
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-600" // Adjusted styling
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            {!isForAdmin && (
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password" // Ensure this route exists
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed" // Adjusted styling
            >
              {loading ? (
                <>
                  {/* Loading Spinner SVG */}
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {" "}
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>{" "}
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>{" "}
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Signup/Switch Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {" "}
            {/* Adjusted styling */}
            {!isForAdmin ? (
              <>
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Not an admin?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  User login
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
