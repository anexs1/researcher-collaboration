import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../Component/InputField";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

const defaultUserDataForSignup = {
  _id: null,
  username: "",
  email: "",
  role: "medical",
  affiliation: "",
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

      localStorage.setItem("user", JSON.stringify(initialUserData));

      navigate("/login", {
        state: {
          registrationSuccess: true,
          message: "Medical account created successfully! Please log in.",
          email: formData.email,
        },
      });
    } catch (error) {
      setErrorMessage(
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-red-100 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          ⚕️ Medical Signup
        </h2>

        {errorMessage && (
          <div className="text-red-500 text-sm text-center mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            name="username"
            placeholder="Username"
            icon={<UserIcon className="h-5 w-5 text-gray-400" />}
            value={formData.username}
            onChange={handleChange}
          />
          <InputField
            name="email"
            type="email"
            placeholder="Email"
            icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
            value={formData.email}
            onChange={handleChange}
          />
          <div className="relative">
            <InputField
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
              value={formData.password}
              onChange={handleChange}
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
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
              value={formData.confirmPassword}
              onChange={handleChange}
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
            name="medicalSpecialty"
            placeholder="Medical Specialty"
            icon={<BeakerIcon className="h-5 w-5 text-gray-400" />}
            value={formData.medicalSpecialty}
            onChange={handleChange}
          />
          <InputField
            name="hospitalName"
            placeholder="Hospital/Clinic Name"
            icon={<BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />}
            value={formData.hospitalName}
            onChange={handleChange}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
          >
            {isLoading ? "Registering..." : "Sign Up as Medical"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MedicalSignupForm;
