import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../Component/InputField";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  LightBulbIcon,
  LinkIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

// Define default user data structure
const defaultUserDataForSignup = {
  username: "",
  email: "",
  role: "non-researcher",
  affiliation: "",
  researchInterests: "",
  publicationLinks: "",
};

const NotResearcherSignupForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    researchInterests: "",
    publicationLinks: "",
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
          publicationLinks: formData.publicationLinks,
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
        researchInterests: formData.researchInterests,
        publicationLinks: formData.publicationLinks,
      };

      localStorage.setItem("user", JSON.stringify(initialUserData));
      console.log("Non-Researcher signup successful:", initialUserData);

      navigate("/login", {
        state: {
          registrationSuccess: true,
          message: "Account created successfully! Please log in.",
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-yellow-100 to-gray-200 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
          👤 General Signup
        </h2>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            icon={<UserIcon className="h-5 w-5 text-gray-400" />}
          />
          <InputField
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
          />

          <div className="relative">
            <InputField
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
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
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            name="researchInterests"
            placeholder="Primary Interest (Optional)"
            value={formData.researchInterests}
            onChange={handleChange}
            icon={<LightBulbIcon className="h-5 w-5 text-gray-400" />}
          />

          <InputField
            name="publicationLinks"
            placeholder="Website, Portfolio, or Link (Optional)"
            value={formData.publicationLinks}
            onChange={handleChange}
            icon={<LinkIcon className="h-5 w-5 text-gray-400" />}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded shadow"
          >
            {isLoading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <div className="text-sm text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:underline font-medium"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotResearcherSignupForm;
