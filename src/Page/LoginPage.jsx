// src/components/LoginPage.js (or wherever it lives)
import React, { useState } from "react"; // Make sure React is imported if not already
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

// Assuming defaultUserData structure is available or defined similarly
// You might want to import it or define a basic structure if needed elsewhere
const defaultUserDataForContext = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  affiliation: "",
  role: "",
  aboutMe: "",
  skills: "",
  researchInterests: "",
  achievements: "",
  socialLinks: { github: "", linkedin: "", twitter: "" },
  contactInfo: { phone: "" },
  profileImage: "https://via.placeholder.com/150",
};

const LoginPage = ({
  setIsLoggedIn, // Prop to update App state about login status
  setIsAdmin, // Prop to update App state about admin status
  setCurrentUser, // Prop to potentially update App state with user object (optional redundancy if using localStorage primarily)
  isForAdmin = false,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const loginEndpoint = isForAdmin
      ? "http://localhost:5000/api/auth/admin-login"
      : "http://localhost:5000/api/auth/login"; // Assuming this is your user login endpoint

    try {
      const response = await axios.post(loginEndpoint, { email, password });
      setLoading(false);

      if (
        response.data &&
        response.data.success &&
        response.data.token &&
        response.data.user // Ensure user object is part of the response
      ) {
        // 1. Store Auth Token (already doing this)
        localStorage.setItem("authToken", response.data.token);

        // 2. *** Store User Data for Profile Component ***
        // Ensure the received user data aligns somewhat with what Profile expects.
        // If the backend sends different field names, you might need to map them here.
        // We merge with defaults *just in case* the backend response is missing fields Profile expects.
        const userToStore = {
          ...defaultUserDataForContext, // Start with defaults
          ...response.data.user, // Override with data from backend
          // Explicitly handle nested objects if backend structure differs significantly
          socialLinks: {
            ...defaultUserDataForContext.socialLinks,
            ...(response.data.user.socialLinks || {}),
          },
          contactInfo: {
            ...defaultUserDataForContext.contactInfo,
            ...(response.data.user.contactInfo || {}),
          },
          // Make sure core identifiers are present
          email: response.data.user.email || email, // Use response email, fallback to input email
          // username might come from response.data.user.username
        };
        localStorage.setItem("user", JSON.stringify(userToStore));
        console.log("User data saved to localStorage:", userToStore);

        // 3. Update App State (already doing this)
        const isAdminUser = response.data.user.role === "admin";
        setIsLoggedIn(true);
        setIsAdmin(isAdminUser);
        setCurrentUser(userToStore); // Update App state with the potentially merged user object

        // 4. Navigate (adjust target route if needed)
        // Make sure '/profile/account' is where your <Profile /> component is rendered in your routing setup
        navigate(isAdminUser ? "/admin" : "/profile", { replace: true }); // Changed target to '/profile' for simplicity, adjust if needed
      } else {
        setError(
          response.data?.message ||
            "Login failed. Invalid response from server."
        );
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials or network connection."
      );
      console.error("Login API error:", err); // Log the actual error
    }
  };

  // --- JSX remains the same ---
  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-xl space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isForAdmin ? "🔐 Admin Portal Login" : "Sign in to your account"}
          </h2>
          {/* ... rest of the header ... */}
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <motion.div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <EnvelopeIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-500"
                placeholder="Email address"
                autoComplete="email"
              />
            </div>
            {/* Password Input */}
            <div className="relative">
              <LockClosedIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-500"
                placeholder="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1} // Prevent tabbing to this button
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          {!isForAdmin && (
            <div className="flex justify-end">
              <Link // Use Link for internal navigation
                to="/forgot-password" // Example route
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-2 px-4 text-sm font-medium text-white rounded-md shadow-sm transition duration-150 ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
            >
              {/* Loading Spinner */}
              {loading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" // Adjusted margin/padding
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />{" "}
                  {/* Simpler spinner path */}
                </svg>
              )}
              {loading ? "Signing In..." : "Sign in"}
            </button>
          </div>
        </form>

        {/* Link to Signup / User Login */}
        {!isForAdmin ? (
          <p className="mt-6 text-center text-sm text-gray-600">
            {" "}
            {/* Added margin-top */}
            Don't have an account?{" "}
            <Link
              to="/signup" // Link to your initial signup type selection page
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Sign up here
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-center text-sm text-gray-600">
            Not an admin?{" "}
            <Link
              to="/login" // Link to the regular user login page
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              User Login
            </Link>
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default LoginPage;
