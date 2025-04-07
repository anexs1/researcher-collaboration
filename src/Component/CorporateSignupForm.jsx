import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../Component/InputField"; // Assuming this path is correct
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

const defaultUserDataForSignup = {
  username: "",
  email: "",
  password: "",
  role: "corporate",
  affiliation: "",
  companyName: "",
  jobTitle: "",
};

const CorporateSignupForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    jobTitle: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
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
          role: "corporate",
          companyName: formData.companyName,
          jobTitle: formData.jobTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Registration failed");

      const initialUserData = {
        ...defaultUserDataForSignup,
        _id: data.user?._id || null,
        username: formData.username,
        email: formData.email,
        role: data.user?.role || "corporate",
        affiliation: formData.companyName,
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
      };

      localStorage.setItem("user", JSON.stringify(initialUserData));
      console.log(
        "Corporate signup successful, initial data saved:",
        initialUserData
      );

      navigate("/login", {
        state: {
          registrationSuccess: true,
          message: "Corporate account created successfully! Please log in.",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-green-100 to-blue-200 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🏢 Corporate Signup
        </h2>

        {errorMessage && (
          <div className="text-red-600 text-sm text-center mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            icon={<UserIcon className="h-5 w-5 text-gray-400" />}
          />
          <InputField
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
          />
          <div className="relative">
            <InputField
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600 cursor-pointer"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </span>
          </div>
          <div className="relative">
            <InputField
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-indigo-600 cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </span>
          </div>
          <InputField
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Company Name"
            icon={<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />}
          />
          <InputField
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            placeholder="Job Title"
            icon={<BriefcaseIcon className="h-5 w-5 text-gray-400" />}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition duration-200"
          >
            {isLoading ? "Registering..." : "Sign Up as Corporate"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default CorporateSignupForm;
