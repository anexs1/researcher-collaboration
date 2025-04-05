import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputField from "../Component/InputField";

const MedicalSignupForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    medicalSpecialty: "",
    hospitalName: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setErrorMessage("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      console.log("Registration successful:", data);
      navigate("/login", {
        state: {
          registrationSuccess: true,
          message: "Medical account created successfully!",
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Medical Signup
        </h2>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded-md">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            type="text"
            id="username"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            minLength="3"
          />
          <InputField
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <InputField
            type="password"
            id="password"
            name="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />
          <InputField
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <InputField
            type="text"
            id="medicalSpecialty"
            name="medicalSpecialty"
            placeholder="Medical Specialty"
            value={formData.medicalSpecialty}
            onChange={handleChange}
          />
          <InputField
            type="text"
            id="hospitalName"
            name="hospitalName"
            placeholder="Hospital Name"
            value={formData.hospitalName}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 font-medium rounded-lg text-white transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Registering..." : "Sign Up as Medical"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:underline focus:outline-none"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default MedicalSignupForm;
