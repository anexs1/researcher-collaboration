import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InputField from "../Component/InputField";
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

const defaultUserDataForSignup = {
  username: "",
  email: "",
  password: "",
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
          role: "academic",
          university: formData.university,
          department: formData.department,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Registration failed");

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
      console.log(
        "Academic signup successful, initial data saved:",
        initialUserData
      );

      navigate("/login", {
        state: {
          registrationSuccess: true,
          message: "Academic account created successfully! Please log in.",
          email: formData.email,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "Registration failed. Try again.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 to-purple-200 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-700 text-center mb-4">
          🎓 Academic Signup
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
              icon={<EyeIcon className="h-5 w-5 text-gray-400" />}
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
              icon={<EyeIcon className="h-5 w-5 text-gray-400" />}
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
            name="university"
            value={formData.university}
            onChange={handleChange}
            placeholder="University"
            icon={<BuildingLibraryIcon className="h-5 w-5 text-gray-400" />}
          />
          <InputField
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Department"
            icon={<AcademicCapIcon className="h-5 w-5 text-gray-400" />}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition duration-200"
          >
            {isLoading ? "Registering..." : "Sign Up as Academic"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </motion.div>
  );
};

export default AcademicSignupForm;
