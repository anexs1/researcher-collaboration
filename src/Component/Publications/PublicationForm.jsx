import React from "react";
import {
  FaPaperPlane,
  FaSpinner,
  FaTag,
  FaCalendarAlt,
  FaFlask,
} from "react-icons/fa";
import ErrorMessage from "../Common/ErrorMessage"; // Adjust path if necessary (looks correct for this structure)

// Research Areas - Can be defined here or passed as prop
const researchAreas = [
  "",
  "Computer Science",
  "Physics",
  "Engineering",
  "Biology",
  "Health",
  "Ethics",
  "Other",
];

export default function PublicationForm({
  formData,
  formErrors,
  isSubmitting,
  apiError,
  onInputChange,
  onSubmit,
}) {
  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mt-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center">
        <FaPaperPlane className="mr-2" /> Post New Publication
      </h2>

      {/* Display API errors specific to publication submission */}
      {apiError && (
        <>
          <ErrorMessage message={apiError} isPublicationError={true} />
          {/* Added isPublicationError prop to maybe style differently or help parent clear correct error */}
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {/* Title Field */}
        <div>
          <label
            htmlFor="pub-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            type="text"
            id="pub-title"
            name="title"
            value={formData.title}
            onChange={onInputChange}
            placeholder="Publication title"
            required
            className={`mt-1 block w-full input-style ${
              formErrors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {formErrors.title && (
            <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
          )}
        </div>

        {/* Summary Field */}
        <div>
          <label
            htmlFor="pub-summary"
            className="block text-sm font-medium text-gray-700"
          >
            Summary
          </label>
          <textarea
            id="pub-summary"
            name="summary"
            rows="4"
            value={formData.summary}
            onChange={onInputChange}
            placeholder="Brief summary of the publication"
            required
            className={`mt-1 block w-full input-style ${
              formErrors.summary ? "border-red-500" : "border-gray-300"
            }`}
          />
          {formErrors.summary && (
            <p className="mt-1 text-xs text-red-600">{formErrors.summary}</p>
          )}
        </div>

        {/* Author Field */}
        <div>
          <label
            htmlFor="pub-author"
            className="block text-sm font-medium text-gray-700"
          >
            Author(s)
          </label>
          <input
            type="text"
            id="pub-author"
            name="author"
            value={formData.author}
            onChange={onInputChange}
            placeholder="Defaults to your name, add others if needed (comma-separated)"
            required
            className={`mt-1 block w-full input-style ${
              formErrors.author ? "border-red-500" : "border-gray-300"
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate multiple authors with commas.
          </p>
          {formErrors.author && (
            <p className="mt-1 text-xs text-red-600">{formErrors.author}</p>
          )}
        </div>

        {/* Tags Field */}
        <div>
          <label
            htmlFor="pub-tags"
            className="block text-sm font-medium text-gray-700"
          >
            Tags (comma-separated)
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaTag className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="pub-tags"
              name="tags"
              value={formData.tags}
              onChange={onInputChange}
              placeholder="e.g., AI, Machine Learning, NLP"
              className={`pl-10 block w-full input-style ${
                formErrors.tags ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>
          {formErrors.tags && (
            <p className="mt-1 text-xs text-red-600">{formErrors.tags}</p>
          )}
        </div>

        {/* Area Field */}
        <div>
          <label
            htmlFor="pub-area"
            className="block text-sm font-medium text-gray-700"
          >
            Research Area
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFlask className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="pub-area"
              name="area"
              value={formData.area}
              onChange={onInputChange}
              required
              className={`pl-10 block w-full select-style ${
                formErrors.area ? "border-red-500" : "border-gray-300"
              }`}
            >
              {researchAreas.map((areaOption) => (
                <option
                  key={areaOption}
                  value={areaOption}
                  disabled={areaOption === ""}
                >
                  {areaOption === "" ? "Select an area..." : areaOption}
                </option>
              ))}
            </select>
          </div>
          {formErrors.area && (
            <p className="mt-1 text-xs text-red-600">{formErrors.area}</p>
          )}
        </div>

        {/* Publication Date Field */}
        <div>
          <label
            htmlFor="pub-date"
            className="block text-sm font-medium text-gray-700"
          >
            Publication Date
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="pub-date"
              name="publicationDate"
              value={formData.publicationDate}
              onChange={onInputChange}
              required
              max={new Date().toISOString().split("T")[0]}
              className={`pl-10 block w-full input-style ${
                formErrors.publicationDate
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
          </div>
          {formErrors.publicationDate && (
            <p className="mt-1 text-xs text-red-600">
              {formErrors.publicationDate}
            </p>
          )}
        </div>

        {/* Document Link Field */}
        <div>
          <label
            htmlFor="pub-link"
            className="block text-sm font-medium text-gray-700"
          >
            Document Link (URL)
          </label>
          <input
            type="url"
            id="pub-link"
            name="document_link"
            value={formData.document_link}
            onChange={onInputChange}
            placeholder="https://example.com/paper.pdf or DOI link"
            required
            className={`mt-1 block w-full input-style ${
              formErrors.document_link ? "border-red-500" : "border-gray-300"
            }`}
          />
          {formErrors.document_link && (
            <p className="mt-1 text-xs text-red-600">
              {formErrors.document_link}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" />
            ) : (
              <FaPaperPlane className="-ml-1 mr-2 h-5 w-5" />
            )}
            {isSubmitting ? "Submitting..." : "Post Publication"}
          </button>
        </div>
      </form>

      {/* Shared CSS classes */}
      <style jsx>{`
        .input-style {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          background-color: white;
          border-width: 1px;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          outline: none;
        }
        .input-style:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
        .select-style {
          padding-left: 2.5rem;
          padding-right: 2rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          background-color: white;
          border-width: 1px;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          outline: none;
          appearance: none;
          background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="%236b7280" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 8 4 4 4-4"/></svg>');
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
        }
        .select-style:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
