import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Import motion
import InputField from "../Component/InputField";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  LightBulbIcon, // Represents interests
  LinkIcon, // Represents links/portfolio
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon, // For reminder
  InformationCircleIcon, // For reminder
  UsersIcon, // Alternative for general user
} from "@heroicons/react/24/outline";

// Define default user data structure
const defaultUserDataForSignup = {
  _id: null, // Added for consistency
  username: "",
  email: "",
  // password: "", // Should not be stored
  role: "non-researcher",
  affiliation: "", // Could be 'General User' or derived from interests
  researchInterests: "", // Retained as 'interests'
  publicationLinks: "", // Retained as 'profileLinks' or similar
};

const NotResearcherSignupForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    researchInterests: "", // Field for primary interest
    publicationLinks: "", // Field for website/portfolio
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: "non-researcher",
          researchInterests: formData.researchInterests,
          publicationLinks: formData.publicationLinks, // This might be better named as 'profileLink' or 'website'
          // Affiliation could be set to a default like "General User" or derived if needed
          affiliation: formData.researchInterests || "General User",
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Registration failed");

      const initialUserData = {
        ...defaultUserDataForSignup,
        _id: data.user?._id || null,
        username: formData.username,
        email: formData.email,
        role: data.user?.role || "non-researcher",
        affiliation: formData.researchInterests || "General User", // Set affiliation
        researchInterests: formData.researchInterests,
        publicationLinks: formData.publicationLinks,
      };
      // delete initialUserData.password; // Ensure password is not stored

      localStorage.setItem("user", JSON.stringify(initialUserData));
      console.log("Non-Researcher signup successful:", initialUserData);

      navigate("/login", {
        state: {
          registrationSuccess: true,
          message: "Account created successfully! You can now log in.", // Standard message
          email: formData.email,
        },
      });
    } catch (error) {
      setErrorMessage(
        error.message || "Registration failed. Please try again."
      );
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div // Added motion to the main div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-50 to-stone-100 px-4 py-12" // Neutral gradient
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-10 lg:gap-16">
        {/* Form Section */}
        <motion.div
          className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-8 lg:p-10 transform transition-all hover:scale-[1.01]"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            👤 Create General Account
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-slate-500 to-gray-500 mx-auto mb-8 rounded-full"></div>{" "}
          {/* Neutral underline gradient */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md"
              role="alert"
            >
              <p className="font-medium">Error</p>
              <p>{errorMessage}</p>
            </motion.div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              name="username"
              placeholder="Choose a Username"
              value={formData.username}
              onChange={handleChange}
              icon={<UserIcon className="h-5 w-5 text-gray-400" />}
              required
            />
            <InputField
              name="email"
              type="email"
              placeholder="Your Email Address"
              value={formData.email}
              onChange={handleChange}
              icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              required
            />

            <div className="relative">
              <InputField
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a Secure Password"
                value={formData.password}
                onChange={handleChange}
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-slate-600 focus:outline-none p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <InputField
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Your Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-slate-600 focus:outline-none p-1"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <InputField
              name="researchInterests" // Renamed from researchInterests for clarity
              placeholder="Your Primary Interest (e.g., Technology, Art)"
              value={formData.researchInterests}
              onChange={handleChange}
              icon={<LightBulbIcon className="h-5 w-5 text-gray-400" />}
            />

            <InputField
              name="publicationLinks" // Renamed for clarity
              placeholder="Website or Profile Link (Optional)"
              value={formData.publicationLinks}
              onChange={handleChange}
              icon={<LinkIcon className="h-5 w-5 text-gray-400" />}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Creating Your Account...
                </>
              ) : (
                "Complete Registration"
              )}
            </button>
          </form>
          <div className="text-sm text-center mt-8 text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-medium text-slate-600 hover:text-slate-500 hover:underline"
            >
              Log In
            </button>
          </div>
        </motion.div>

        {/* Important Reminder Section (General User Context) */}
        <motion.div
          className="w-full lg:max-w-md flex items-center justify-center lg:mt-0 mt-8" // Wrapper for centering
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-xl shadow-2xl p-8 lg:p-10 w-full border-t-4 border-sky-500 transform transition-all hover:scale-[1.01]">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full shadow-lg mr-4">
                <InformationCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Welcome{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
                    Aboard!
                  </span>
                </h3>
                <div className="w-20 h-1 bg-gradient-to-r from-sky-400 to-blue-500 mt-1 rounded-full"></div>
              </div>
            </div>
            <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
              <p>
                You're creating a general user account. This gives you access to
                explore public content and connect with our community.
              </p>
              <p>
                While this account doesn't require specific approval for login,
                some platform features might be tailored to specialized user
                roles (like Academic or Corporate).
              </p>
              <p className="bg-sky-100 border-l-4 border-sky-400 text-sky-800 p-3 rounded-md">
                <LightBulbIcon className="h-5 w-5 inline mr-1.5 -mt-0.5" />
                Feel free to explore! You can update your profile or inquire
                about different roles through your account settings later if
                your needs change.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotResearcherSignupForm;
