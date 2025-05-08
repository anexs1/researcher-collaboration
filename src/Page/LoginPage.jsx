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
  InformationCircleIcon, // For reminder
  ShieldCheckIcon, // For Admin Reminder
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
        setError(
          response.data?.message ||
            "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  // OPTIONAL: Floating particles (moved to style tag for brevity)
  useEffect(() => {
    const numParticles = isForAdmin ? 20 : 50; // Fewer particles for admin login for a cleaner look
    const particleContainer = document.getElementById("particle-bg");
    if (!particleContainer) return;

    const particles = Array.from({ length: numParticles }, () => {
      const span = document.createElement("span");
      span.className = "particle";
      span.style.left = `${Math.random() * 100}%`;
      span.style.top = `${Math.random() * 100}%`;
      span.style.animationDuration = `${8 + Math.random() * 12}s`;
      span.style.width = `${Math.random() * 3 + 4}px`; // Random size
      span.style.height = span.style.width;
      span.style.opacity = `${Math.random() * 0.5 + 0.2}`; // Random opacity
      particleContainer.appendChild(span);
      return span;
    });
    return () => particles.forEach((p) => p.remove());
  }, [isForAdmin]);

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  return (
    <motion.div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12
        ${
          isForAdmin
            ? "bg-gradient-to-br from-slate-700 via-gray-800 to-black" // Darker theme for admin
            : "bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600"
        }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div
        id="particle-bg"
        className="absolute inset-0 pointer-events-none"
      ></div>{" "}
      {/* Particle container */}
      {/* Main content: Login form and Reminder side-by-side on larger screens */}
      <div className="container mx-auto flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-10 lg:gap-16 z-10">
        {/* Login Form Card */}
        <motion.div
          className={`w-full max-w-md bg-white/85 p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl
            transform transition-all hover:shadow-blue-400/30 hover:scale-[1.02]
            ${isForAdmin ? "hover:shadow-cyan-400/30" : ""}`}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-center mb-10">
            <div
              className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-5 shadow-lg
              ${isForAdmin ? "bg-gray-700" : "bg-blue-100"}`}
            >
              <LockClosedIcon
                className={`h-7 w-7 ${
                  isForAdmin ? "text-cyan-400" : "text-blue-600"
                }`}
              />
            </div>
            <h1
              className={`text-3xl sm:text-4xl font-extrabold ${
                isForAdmin ? "text-white" : "text-gray-800"
              }`}
            >
              {isForAdmin ? "Admin Portal" : "Welcome Back!"}
            </h1>
            <p
              className={`text-sm mt-2 ${
                isForAdmin ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {isForAdmin
                ? "Secure access to system administration."
                : "Sign in to continue your journey."}
            </p>
          </div>

          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-100 border-l-4 border-red-600 text-red-800 rounded-lg shadow"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-semibold">Login Failed:</p>
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${
                  isForAdmin ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-3 pr-3 block w-full border-gray-300 rounded-lg bg-white/90 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder-gray-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${
                  isForAdmin ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-3 block w-full border-gray-300 rounded-lg bg-white/90 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 focus:outline-none p-1"
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

            {!isForAdmin && (
              <div className="text-right text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white text-sm font-semibold rounded-lg shadow-lg transition-all duration-300 ease-in-out
                ${
                  isForAdmin
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                }
                disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  {isForAdmin ? "Access Dashboard" : "Sign In"}
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          <div
            className={`mt-8 text-center text-sm ${
              isForAdmin ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {isForAdmin ? (
              <>
                Not an Administrator?{" "}
                <Link
                  to="/login"
                  className="font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  User Login
                </Link>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  Create one now
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Reminder Section - Styles vary based on isForAdmin */}
        <motion.div
          className="w-full lg:max-w-md flex items-center justify-center lg:mt-0 mt-8" // Wrapper for centering
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }} // Staggered animation
        >
          <div
            className={`rounded-xl shadow-2xl p-8 lg:p-10 w-full border-t-4 transform transition-all hover:scale-[1.02]
            ${
              isForAdmin
                ? "bg-gradient-to-br from-gray-700 via-slate-800 to-gray-900 border-cyan-500 hover:shadow-cyan-500/20 text-gray-200"
                : "bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border-sky-500 hover:shadow-blue-500/20 text-gray-700"
            }`}
          >
            <div className="flex items-center mb-5">
              <div
                className={`p-3 rounded-full shadow-lg mr-4
                ${
                  isForAdmin
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                    : "bg-gradient-to-br from-sky-400 to-blue-500"
                }`}
              >
                {isForAdmin ? (
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                ) : (
                  <InformationCircleIcon className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <h3
                  className={`text-2xl font-bold ${
                    isForAdmin ? "text-white" : "text-gray-800"
                  }`}
                >
                  {isForAdmin ? "Admin Access" : "Important Notice"}
                  {isForAdmin && (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 ml-1.5">
                      Portal
                    </span>
                  )}
                  {!isForAdmin && (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 ml-1.5">
                      Guidelines
                    </span>
                  )}
                </h3>
                <div
                  className={`w-20 h-1 mt-1 rounded-full
                  ${
                    isForAdmin
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                      : "bg-gradient-to-r from-sky-400 to-blue-500"
                  }`}
                ></div>
              </div>
            </div>
            <div className="space-y-4 text-sm leading-relaxed">
              {isForAdmin ? (
                <>
                  <p>
                    This portal is for authorized administrators only. All
                    activities are monitored.
                  </p>
                  <p>
                    Ensure you are using a secure connection and device. If you
                    suspect unauthorized access, report it immediately.
                  </p>
                  <p
                    className={`border-l-4 p-3 rounded-md
                    ${
                      isForAdmin
                        ? "bg-slate-700 border-cyan-400 text-cyan-200"
                        : "" // No specific callout for user, can be added if needed
                    }`}
                  >
                    <ShieldCheckIcon className="h-5 w-5 inline mr-1.5 -mt-0.5" />
                    Use strong, unique passwords and enable two-factor
                    authentication if available.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Welcome! If you've recently signed up, please note that some
                    accounts (Academic, Corporate, Medical) may require
                    administrative approval or verification before full access
                    is granted.
                  </p>
                  <p>
                    This approval process can take{" "}
                    <strong
                      className={
                        isForAdmin
                          ? "text-cyan-300"
                          : "font-semibold text-sky-600"
                      }
                    >
                      24-48 hours
                    </strong>
                    . You will typically be notified via email.
                  </p>
                  <p
                    className={`border-l-4 p-3 rounded-md
                    ${
                      isForAdmin ? "" : "bg-sky-100 border-sky-400 text-sky-800"
                    }`}
                  >
                    <InformationCircleIcon className="h-5 w-5 inline mr-1.5 -mt-0.5" />
                    If you encounter any issues or have questions about your
                    account status, please contact support or your designated
                    administrator.
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Animated particle background style */}
      <style>{`
        #particle-bg { width: 100%; height: 100%; overflow: hidden; }
        .particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.2); /* Slightly less opaque for admin dark bg */
          border-radius: 9999px;
          animation: float-particle 10s infinite ease-in-out;
          box-shadow: 0 0 5px rgba(255,255,255,0.3), 0 0 10px rgba(255,255,255,0.2);
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: var(--start-opacity, 0.2); }
          50% { transform: translateY(-30px) translateX(${
            Math.random() > 0.5 ? "" : "-"
          }15px) scale(1.2); opacity: var(--mid-opacity, 0.5); }
        }
      `}</style>
    </motion.div>
  );
};

export default LoginPage;
