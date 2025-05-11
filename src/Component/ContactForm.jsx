import React, { useState } from "react";
import { submitContactForm } from "../services/apiService";

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    issueType: "General Inquiry",
    message: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setStatusMessage("");
    setIsError(false);
    setIsSubmitting(true);

    try {
      const response = await submitContactForm(formData);
      setStatusMessage(
        response.message ||
          "Your message has been sent successfully! We_ll be in touch soon."
      );
      setIsError(false);
      setFormData({
        name: "",
        email: "",
        issueType: "General Inquiry",
        message: "",
      });
    } catch (error) {
      setStatusMessage(
        error.response?.data?.message ||
          error.message ||
          "An error occurred. Please try sending your message again."
      );
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Still Need Help?
        </h2>
        <p className="text-slate-600 mt-2">
          If you couldn't find an answer, please fill out the form below, and
          our support team will get back to you.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
            placeholder="e.g., Jane Doe"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
            placeholder="e.g., jane.doe@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="issueType"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Type of Issue
          </label>
          <select
            name="issueType"
            id="issueType"
            value={formData.issueType}
            onChange={handleChange}
            disabled={isSubmitting}
            className="mt-1 block w-full pl-4 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            <option value="General Inquiry">General Inquiry</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Account Issue">Account Issue</option>
            <option value="Collaboration Question">
              Collaboration Question
            </option>
            <option value="Publication Question">Publication Question</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Your Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
            placeholder="Please describe your issue or question in detail..."
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center py-3 px-6 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform active:scale-95"
        >
          {isSubmitting ? (
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
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </button>
      </form>
      {statusMessage && (
        <div
          className={`mt-6 p-4 rounded-md text-sm text-center font-medium ${
            isError
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-green-100 text-green-800 border border-green-300"
          }`}
          role="alert"
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}

export default ContactForm;
