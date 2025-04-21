import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResearchForm = ({ onAddResearch }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    field: "",
    researcher: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Ongoing",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const researchFields = [
    "Machine Learning",
    "Energy Systems",
    "Environmental Science",
    "Biotechnology",
    "Public Health",
    "Data Science",
    "Artificial Intelligence",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.field) newErrors.field = "Field is required";
    if (!formData.researcher.trim())
      newErrors.researcher = "Researcher name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";

    // Validate date range
    if (
      formData.endDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      newErrors.endDate = "End date cannot be before start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newResearch = {
        id: Date.now(), // Temporary ID
        ...formData,
        bookmarked: false,
        createdAt: new Date().toISOString(),
      };

      onAddResearch(newResearch);
      setIsSubmitting(false);
      navigate("/explore"); // Redirect to explore page after submission
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-700">
        Create New Research
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="title"
          >
            Research Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.title
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-purple-200"
            }`}
            placeholder="Enter research title"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="field"
          >
            Research Field *
          </label>
          <select
            id="field"
            name="field"
            value={formData.field}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.field
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-purple-200"
            }`}
          >
            <option value="">Select a field</option>
            {researchFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
          {errors.field && (
            <p className="text-red-500 text-sm mt-1">{errors.field}</p>
          )}
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="researcher"
          >
            Lead Researcher *
          </label>
          <input
            type="text"
            id="researcher"
            name="researcher"
            value={formData.researcher}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.researcher
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-purple-200"
            }`}
            placeholder="Researcher's name"
          />
          {errors.researcher && (
            <p className="text-red-500 text-sm mt-1">{errors.researcher}</p>
          )}
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="description"
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.description
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-purple-200"
            }`}
            placeholder="Describe your research project"
          ></textarea>
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              className="block text-gray-700 font-medium mb-2"
              htmlFor="startDate"
            >
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.startDate
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-purple-200"
              }`}
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label
              className="block text-gray-700 font-medium mb-2"
              htmlFor="endDate"
            >
              End Date (Optional)
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.endDate
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-purple-200"
              }`}
            />
            {errors.endDate && (
              <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="status"
          >
            Research Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Paused">Paused</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Create Research"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResearchForm;
