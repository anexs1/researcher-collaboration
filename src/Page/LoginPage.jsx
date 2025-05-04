import React, { useState, useEffect } from "react";
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

const LoginPage = ({ login, isForAdmin = false }) => {
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
      ? "/api/auth/admin-login"
      : "/api/auth/login";
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    try {
      const response = await axios.post(`${API_BASE}${loginEndpoint}`, {
        email,
        password,
      });

      if (
        response.data?.success &&
        response.data?.token &&
        response.data?.user?.id
      ) {
        login(response.data.user, response.data.token);
        const destination =
          response.data.user.role === "admin" ? "/admin" : "/profile";
        navigate(destination, { replace: true });
      } else {
        setLoading(false);
        setError(response.data?.message || "Unexpected server response.");
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  // OPTIONAL: Add floating particles for background creativity
  useEffect(() => {
    const numParticles = 50;
    const particles = Array.from({ length: numParticles }, (_, i) => {
      const span = document.createElement("span");
      span.className = "particle";
      span.style.left = `${Math.random() * 100}%`;
      span.style.top = `${Math.random() * 100}%`;
      span.style.animationDuration = `${5 + Math.random() * 10}s`;
      document.body.appendChild(span);
      return span;
    });

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md px-6 py-12 z-10">
        <motion.div
          className="bg-white/80 p-10 rounded-3xl shadow-xl border border-white/20 backdrop-blur-lg"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
        >
          <div className="text-center mb-10">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4 shadow">
              <LockClosedIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800">
              {isForAdmin ? "Admin Portal" : "Welcome back"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isForAdmin
                ? "Login to manage the system"
                : "Login to your account"}
            </p>
          </div>

          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="font-semibold">Error:</span> {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-3 pr-3 block w-full border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-3 block w-full border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500"
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
              <div className="text-right text-sm">
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md transition"
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-700">
            {isForAdmin ? (
              <>
                Not an admin?{" "}
                <Link to="/login" className="text-indigo-600 hover:underline">
                  Switch to user login
                </Link>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <Link to="/signup" className="text-indigo-600 hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Animated particle background (optional) */}
      <style>{`
        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 9999px;
          animation: float 10s infinite ease-in-out;
        }

        @keyframes float {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-40px) scale(1.3);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default LoginPage;
