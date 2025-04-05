import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const LoginPage = ({
  setIsLoggedIn,
  setIsAdmin,
  setCurrentUser,
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
      : "http://localhost:5000/api/auth/login";

    try {
      const response = await axios.post(loginEndpoint, { email, password });
      setLoading(false);

      if (
        response.data &&
        response.data.success &&
        response.data.token &&
        response.data.user
      ) {
        localStorage.setItem("authToken", response.data.token);
        const isAdminUser = response.data.user.role === "admin";

        setIsLoggedIn(true);
        setIsAdmin(isAdminUser);
        setCurrentUser(response.data.user);

        navigate(isAdminUser ? "/admin" : "/profile/account", {
          replace: true,
        });
      } else {
        setError(response.data?.message || "Login failed. Try again.");
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
          "Login failed. Check credentials or server."
      );
    }
  };

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
          {isForAdmin && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Only authorized admins can log in here.
            </p>
          )}
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
              />
            </div>

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
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {!isForAdmin && (
            <div className="flex justify-end">
              <a
                href="#"
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Forgot your password?
              </a>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-2 px-4 text-sm font-medium text-white rounded-md transition duration-150 ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
            >
              {loading && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                  />
                </svg>
              )}
              {loading ? "Signing In..." : "Sign in"}
            </button>
          </div>
        </form>

        {!isForAdmin ? (
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Sign up here
            </Link>
          </p>
        ) : (
          <p className="text-center text-sm text-gray-600">
            Not an admin?{" "}
            <Link
              to="/login"
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
