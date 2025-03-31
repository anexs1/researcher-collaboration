// src/Page/LoginPage.jsx (or Component/LoginPage.jsx - adjust path as needed)

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
// Assuming you have a Notification component
// import Notification from './Notification';

// Accept setIsLoggedIn, setIsAdmin, and the new isForAdmin prop
const LoginPage = ({ setIsLoggedIn, setIsAdmin, isForAdmin = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Error state for login attempts
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      setLoading(false);

      if (response.data.success && response.data.token && response.data.user) {
        console.log("Login successful:", response.data.user); // Log user data
        localStorage.setItem("authToken", response.data.token);
        setIsLoggedIn(true);
        const isAdminUser = response.data.user.role === "admin";
        setIsAdmin(isAdminUser);
        console.log("Setting isAdmin based on login:", isAdminUser); // Log admin status setting

        // Redirect based on role AFTER successful login
        if (isAdminUser) {
          navigate("/admin", { replace: true }); // Redirect admin to admin dashboard
        } else {
          navigate("/profile/account", { replace: true }); // Redirect regular user to profile
        }
      } else {
        // Handle cases where success might be true but token/user missing (though backend should prevent this)
        setError(response.data.message || "Login failed. Invalid response.");
      }
    } catch (err) {
      setLoading(false);
      console.error("Login API Error:", err);
      // Handle specific error messages from backend if available
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials or server status."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {/* Change Title based on the prop */}
            {isForAdmin ? "Admin Portal Login" : "Sign in to your account"}
          </h2>
          {/* Optionally add a subtitle for admin login */}
          {isForAdmin && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Please enter your administrator credentials.
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {/* Display login error */}
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
            // Or use your Notification component:
            // <Notification message={error} type="error" onClose={() => setError('')} />
          )}
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Conditionally hide Forgot Password for admin? Or keep it? Depends on requirements */}
          {!isForAdmin && (
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
            >
              {loading ? "Signing In..." : "Sign in"}
            </button>
          </div>
        </form>

        {/* --- Conditionally Render Signup Link --- */}
        {!isForAdmin && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up here
            </Link>
          </p>
        )}
        {/* --- Optionally Render Go Back Link for Admin --- */}
        {isForAdmin && (
          <p className="mt-4 text-center text-sm text-gray-600">
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
  );
};

export default LoginPage;
