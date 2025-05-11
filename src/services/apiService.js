// frontend/src/services/apiService.js
import axios from "axios";

// 1. Get the base URL for your main API from environment variables.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// 2. Construct the specific base URL for the Public Help Center API endpoints.
const HELP_CENTER_API_URL = `${API_BASE_URL}/help-center`;

// 3. Construct the specific base URL for the Admin Help Center management API endpoints.
const ADMIN_HELP_API_URL = `${API_BASE_URL}/help-center/admin`;

// --- Public Help Center Functions (Edited with Detailed Logging) ---

export const fetchCategories = async () => {
  try {
    console.log(
      "[apiService] PUBLIC Attempting to fetch categories from:",
      `${HELP_CENTER_API_URL}/categories`
    );
    const response = await axios.get(`${HELP_CENTER_API_URL}/categories`);
    console.log(
      "[apiService] PUBLIC Categories API response status:",
      response.status
    );
    // Log the actual data to see its structure and content
    console.log(
      "[apiService] PUBLIC Categories API response data:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data; // Should be an array of category objects
  } catch (error) {
    console.error(
      "[apiService] PUBLIC Error fetching categories. Status:",
      error.response?.status,
      "Data:",
      error.response?.data,
      "Message:",
      error.message
    );
    // It's important that the calling component handles this error (e.g., sets an error state)
    throw error;
  }
};

export const fetchHelpItems = async (
  categorySlug = "",
  searchTerm = "",
  type = ""
) => {
  try {
    console.log(
      `[apiService] PUBLIC Fetching help items. Slug: '${categorySlug}', Term: '${searchTerm}', Type: '${type}'`
    );
    let url = `${HELP_CENTER_API_URL}/items`; // Note: '/items' path in backend routes
    const params = new URLSearchParams();
    if (categorySlug) params.append("category_slug", categorySlug);
    if (searchTerm) params.append("search", searchTerm);
    if (type) params.append("type", type);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    console.log("[apiService] PUBLIC Fetching help items from URL:", url);

    const response = await axios.get(url);
    console.log(
      "[apiService] PUBLIC Help items API response status:",
      response.status
    );
    console.log(
      "[apiService] PUBLIC Help items API response data count:",
      Array.isArray(response.data)
        ? response.data.length
        : "Not an array or null/undefined"
    );
    // For more detail if needed:
    // console.log("[apiService] PUBLIC Help items API response data:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(
      "[apiService] PUBLIC Error fetching help items. Status:",
      error.response?.status,
      "Data:",
      error.response?.data,
      "Message:",
      error.message
    );
    throw error;
  }
};

export const submitContactForm = async (formData) => {
  try {
    console.log("[apiService] PUBLIC Submitting contact form:", formData);
    const response = await axios.post(
      `${HELP_CENTER_API_URL}/contact`,
      formData
    );
    console.log(
      "[apiService] PUBLIC Contact form submission response:",
      response.data
    );
    return response.data;
  } catch (error) {
    console.error(
      "[apiService] PUBLIC Error submitting contact form:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// --- Admin Contact Submission Functions (Unchanged from your last version) ---
export const adminFetchContactSubmissions = async (
  token,
  page = 1,
  limit = 10,
  resolved = null
) => {
  try {
    console.log(
      "[apiService] ADMIN adminFetchContactSubmissions: Using token:", // Added ADMIN prefix to log for clarity
      token ? "Exists" : "MISSING!"
    );
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (resolved !== null) {
      params.append("resolved", String(resolved));
    }
    const response = await axios.get(
      `${ADMIN_HELP_API_URL}/contact-submissions?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "[apiService] ADMIN Error fetching contact submissions:", // Added ADMIN prefix
      error.response?.data || error.message
    );
    throw error;
  }
};

export const adminGetContactSubmissionById = async (id, token) => {
  try {
    console.log(
      `[apiService] ADMIN adminGetContactSubmissionById ${id}: Using token:`, // Added ADMIN prefix
      token ? "Exists" : "MISSING!"
    );
    const response = await axios.get(
      `${ADMIN_HELP_API_URL}/contact-submissions/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `[apiService] ADMIN Error fetching submission ${id}:`, // Added ADMIN prefix
      error.response?.data || error.message
    );
    throw error;
  }
};

export const adminToggleResolveSubmission = async (id, resolved, token) => {
  try {
    console.log(
      `[apiService] ADMIN adminToggleResolveSubmission ${id}: Using token:`, // Added ADMIN prefix
      token ? "Exists" : "MISSING!",
      "New status:",
      resolved
    );
    const response = await axios.patch(
      `${ADMIN_HELP_API_URL}/contact-submissions/${id}/resolve`,
      { resolved },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `[apiService] ADMIN Error toggling resolve status for submission ${id}:`, // Added ADMIN prefix
      error.response?.data || error.message
    );
    throw error;
  }
};
