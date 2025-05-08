import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Import motion
import InputField from "../Component/InputField";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BeakerIcon, // Represents medical specialty
  BuildingStorefrontIcon, // Represents hospital/clinic
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon, // For reminder
  InformationCircleIcon, // For reminder
  HeartIcon, // Alternative for medical theme
} from "@heroicons/react/24/outline";

const defaultUserDataForSignup = {
  _id: null,
  username: "",
  email: "",
  // password: "", // Should not be stored
  role: "medical",
  affiliation: "", // Will be hospitalName
  medicalSpecialty: "",
  hospitalName: "",
};

const MedicalSignupForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    medicalSpecialty: "",
    hospitalName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
          role: "medical",
          medicalSpecialty: formData.medicalSpecialty,
          hospitalName: formData.hospitalName,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Registration failed");

      const initialUserData = {
        ...defaultUserDataForSignup,
        _id: data.user?._id || null,
        username: formData.username,
        email: formData.email,
        role: data.user?.role || "medical",
        affiliation: formData.hospitalName,
        medicalSpecialty: formData.medicalSpecialty,
        hospitalName: formData.hospitalName,
      };
      // delete initialUserData.password; // Ensure password is not stored

      localStorage.setItem("user", JSON.stringify(initialUserData));

      navigate("/login", {
        state: {
          registrationSuccess: true,
          message:
            "Medical account created! Please await verification to log in.", // Updated message
          email: formData.email,
        },
      });
    } catch (error) {
      setErrorMessage(
        error.message || "Registration failed. Please try again."
      );
      console.error("Medical Signup Error:", error); // For debugging
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
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-fuchsia-100 px-4 py-12" // Changed gradient
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
            ⚕️ Medical Professional
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-rose-500 to-pink-500 mx-auto mb-8 rounded-full"></div>{" "}
          {/* Changed underline gradient */}
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
              placeholder="Full Name (e.g., Dr. Jane Doe)"
              icon={<UserIcon className="h-5 w-5 text-gray-400" />}
              value={formData.username}
              onChange={handleChange}
              required
            />
            <InputField
              name="email"
              type="email"
              placeholder="Professional Email Address"
              icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="relative">
              <InputField
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a Strong Password"
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-rose-600 focus:outline-none p-1"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-rose-600 focus:outline-none p-1"
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
              name="medicalSpecialty"
              placeholder="Your Medical Specialty (e.g., Cardiology)"
              icon={<BeakerIcon className="h-5 w-5 text-gray-400" />} // Or HeartIcon
              value={formData.medicalSpecialty}
              onChange={handleChange}
              required
            />
            <InputField
              name="hospitalName"
              placeholder="Hospital / Clinic Affiliation"
              icon={
                <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
              }
              value={formData.hospitalName}
              onChange={handleChange}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
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
                  Submitting Application...
                </>
              ) : (
                "Register Medical Account"
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-500">
            Already have a medical account?{" "}
            <a
              href="/login"
              className="font-medium text-rose-600 hover:text-rose-500 hover:underline"
            >
              Login
            </a>
          </p>
        </motion.div>

        {/* Important Reminder Section */}
        <motion.div
          className="w-full lg:max-w-md flex items-center justify-center lg:mt-0 mt-8" // Wrapper for centering
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 rounded-xl shadow-2xl p-8 lg:p-10 w-full border-t-4 border-red-500 transform transition-all hover:scale-[1.01]">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-red-400 to-rose-500 rounded-full shadow-lg mr-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Account{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">
                    Verification
                  </span>
                </h3>
                <div className="w-20 h-1 bg-gradient-to-r from-red-400 to-rose-500 mt-1 rounded-full"></div>
              </div>
            </div>
            <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
              <p>
                Your registration as a medical professional requires
                verification. Access to full platform features will be granted
                upon successful review.
              </p>
              <p>
                The verification process may take up to{" "}
                <strong className="font-semibold text-rose-600">
                  48 business hours
                </strong>
                . We appreciate your patience.
              </p>
              <p className="bg-rose-100 border-l-4 border-rose-400 text-rose-800 p-3 rounded-md">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 -mt-0.5" />
                Please ensure your specialty and affiliation details are
                accurate for a quicker verification. You may be contacted for
                additional information.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MedicalSignupForm;
