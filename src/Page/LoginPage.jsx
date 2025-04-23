// src/Component/LoginPage.jsx (or wherever it lives, e.g., src/Page/LoginPage.jsx)

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion"; // Import motion
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline"; // Assuming you have heroicons installed

// Default structure reflecting ONLY fields guaranteed by backend login response
const defaultUserDataForContext = {
  id: null,
  username: "",
  email: "",
  role: "",
  status: "",
  profilePictureUrl: null,
  // Add other fields ONLY if you are CERTAIN the login response includes them
};

const LoginPage = ({
  setIsLoggedIn, // Prop to update App state about login status
  setIsAdmin, // Prop to update App state about admin status
  setCurrentUser, // Prop to update App state with user object
  isForAdmin = false, // Flag to determine if it's the admin login form
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); // State for login errors
  const [loading, setLoading] = useState(false); // State for loading indicator
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(""); // Clear previous errors
    setLoading(true); // Show loading indicator

    const loginEndpoint = isForAdmin
      ? "/api/auth/admin-login"
      : "/api/auth/login"; // Use relative paths
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    try {
      const response = await axios.post(`${API_BASE}${loginEndpoint}`, {
        email,
        password,
      });
      setLoading(false); // Hide loading indicator

      // Check for successful response, token, and user object
      if (
        response.data?.success &&
        response.data?.token &&
        response.data?.user
      ) {
        // 1. Store Auth Token
        localStorage.setItem("authToken", response.data.token);

        // 2. Store User Data (exactly as received from backend)
        const userFromApi = response.data.user;
        localStorage.setItem("user", JSON.stringify(userFromApi));
        console.log("User data saved to localStorage:", userFromApi);

        // 3. Update App State
        const isAdminUser = userFromApi.role === "admin";
        setIsLoggedIn(true);
        setIsAdmin(isAdminUser);
        setCurrentUser(userFromApi); // Pass the exact user object from API

        // 4. Navigate to appropriate page
        navigate(isAdminUser ? "/admin" : "/profile", { replace: true }); // Navigate after successful login
      } else {
        // Handle cases where backend indicates failure but doesn't throw HTTP error
        setError(
          response.data?.message ||
            "Login failed. Invalid response from server."
        );
      }
    } catch (err) {
      setLoading(false); // Hide loading indicator on error
      // Set error message from backend response or provide a generic one
      setError(
        err.response?.data?.message ||
          "Login failed. Please check credentials or network."
      );
      console.error("Login API error:", err.response?.data || err.message); // Log the specific error
    }
  };

  // --- JSX for the Login Form ---
  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-xl shadow-xl space-y-6 border border-gray-100">
        {/* Header */}
        <div>
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {isForAdmin ? "🔐 Admin Portal Login" : "Sign in to your account"}
          </h2>
          {!isForAdmin && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Access your research dashboard
            </p>
          )}
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Error Display */}
          {error && (
            <motion.div
              className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md relative text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
              {/* Optional close button for error */}
              <span
                className="absolute top-0 bottom-0 right-0 px-3 py-3"
                onClick={() => setError("")}
              >
                <svg
                  className="fill-current h-5 w-5 text-red-500 hover:opacity-75 cursor-pointer"
                  role="button"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <title>Close</title>
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                </svg>
              </span>
            </motion.div>
          )}

          {/* Input Fields Group */}
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Email Input */}
            <div className="relative">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 pl-10 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50"
                placeholder="Email address"
              />
            </div>
            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password-input" className="sr-only">
                Password
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                id="password-input"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 pl-10 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute z-10 inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-indigo-600" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500 hover:text-indigo-600" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          {!isForAdmin && (
            <div className="flex items-center justify-end">
              {/* Example Remember Me Checkbox
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900"> Remember me </label>
              </div> */}
              <div className="text-sm">
                <Link
                  to="/forgot-password" // Make sure this route exists in App.jsx
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex w-full justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out`}
            >
              {/* Loading Spinner SVG */}
              {loading && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {loading ? "Signing In..." : "Sign in"}
            </button>
          </div>
        </form>

        {/* Link to Signup / Other Login */}
        <div className="text-sm text-center">
          {!isForAdmin ? (
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up here
              </Link>
            </p>
          ) : (
            <p className="text-gray-600">
              Not an admin?{" "}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                User Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
