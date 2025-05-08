import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InputField from "../Component/InputField"; // Assuming this path is correct
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon, // Alternative icon for a more "info" feel
} from "@heroicons/react/24/outline";

const defaultUserDataForSignup = {
  _id: null,
  username: "",
  email: "",
  role: "academic",
  affiliation: "",
  university: "",
  department: "",
};

const AcademicSignupForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    department: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      setErrorMessage("Password must be at least 6 characters long.");
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
          role: "academic",
          university: formData.university,
          department: formData.department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      const initialUserData = {
        ...defaultUserDataForSignup,
        _id: data.user?._id || null,
        username: formData.username,
        email: formData.email,
        role: data.user?.role || "academic",
        affiliation: formData.university,
        university: formData.university,
        department: formData.department,
      };

      localStorage.setItem("user", JSON.stringify(initialUserData));

      navigate("/login", {
        state: {
          registrationSuccess: true,
          message: "Academic account created! Please await approval to log in.",
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
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-10 lg:gap-16">
        {" "}
        {/* items-stretch for equal height cards if desired */}
        {/* Form Section */}
        <motion.div
          className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-8 lg:p-10 transform transition-all hover:scale-[1.01]"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Create Your Account
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mb-8 rounded-full"></div>

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
              placeholder="Full Name or Username"
              icon={<UserIcon className="h-5 w-5 text-gray-400" />}
              value={formData.username}
              onChange={handleChange}
              required
            />

            <InputField
              name="email"
              type="email"
              placeholder="Institutional Email"
              icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div className="relative">
              <InputField
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Choose a Secure Password"
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 focus:outline-none p-1"
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
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 focus:outline-none p-1"
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
              name="university"
              placeholder="University / Institution"
              icon={<BuildingLibraryIcon className="h-5 w-5 text-gray-400" />}
              value={formData.university}
              onChange={handleChange}
              required
            />

            <InputField
              name="department"
              placeholder="Department / Field of Study"
              icon={<AcademicCapIcon className="h-5 w-5 text-gray-400" />}
              value={formData.department}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
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
                  Creating Account...
                </>
              ) : (
                "Register Account"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already registered?{" "}
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Proceed to Login
            </a>
          </p>
        </motion.div>
        {/* Important Reminder Section - Enhanced Styling */}
        <motion.div
          className="w-full lg:max-w-md flex items-center justify-center lg:mt-0 mt-8" // Wrapper for centering
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }} // Slight delay for staggered effect
        >
          <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-xl shadow-2xl p-8 lg:p-10 w-full border-t-4 border-orange-500 transform transition-all hover:scale-[1.01]">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg mr-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Important{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                    Reminder
                  </span>
                </h3>
                <div className="w-20 h-1 bg-gradient-to-r from-orange-400 to-red-500 mt-1 rounded-full"></div>
              </div>
            </div>
            <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
              <p>
                You are registering as a temporary user. Login access requires
                approval from the super administrator (e.g.,Admin).
              </p>
              <p>
                Account review and approval may take up to{" "}
                <strong className="font-semibold text-orange-600">
                  24 hours
                </strong>{" "}
                post-registration. Please attempt to log in after this period.
              </p>
              <p className="bg-orange-100 border-l-4 border-orange-400 text-orange-800 p-3 rounded-md">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 -mt-0.5" />
                To expedite approval, ensure all provided information is
                accurate and complete.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AcademicSignupForm;
