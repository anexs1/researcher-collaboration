import React, { useState } from "react";
import axios from "axios";

function PublicationForm({ fetchPublications }) {
  const [newPublication, setNewPublication] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Track if submission is in progress
  const [error, setError] = useState(""); // Track form errors
  const userId = 1; // Replace with dynamic user ID from authentication
  const userRole = "user"; // or "admin", should come from authentication

  const handleAddPublication = async (e) => {
    e.preventDefault(); // Prevent page reload on form submission

    if (!newPublication.trim()) {
      setError("Please enter some content for your publication.");
      return;
    }

    setIsSubmitting(true);
    setError(""); // Clear previous errors

    try {
      // Add the publication to the database
      const response = await axios.post(
        "http://localhost:5000/api/publications",
        {
          content: newPublication,
          userId,
        }
      );

      setNewPublication(""); // Clear input field
      fetchPublications(); // Refresh the list of publications

      // Optionally, share the publication after posting
      await handleShare(response.data.id); // Share right after posting
    } catch (error) {
      console.error("Error adding publication:", error);
      setError("Failed to post publication. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async (publicationId) => {
    try {
      await axios.post("http://localhost:5000/api/publications/share", {
        id: publicationId,
      });
      alert("Publication shared successfully!");
    } catch (error) {
      console.error("Error sharing publication:", error);
      alert("Failed to share publication.");
    }
  };

  return (
    <div className="publication-form-container">
      <h2>Share Your Publication</h2>
      <form onSubmit={handleAddPublication} className="publication-form">
        <div className="form-group">
          <label htmlFor="publicationContent">Publication Content:</label>
          <textarea
            id="publicationContent"
            placeholder="Share your publication..."
            value={newPublication}
            onChange={(e) => setNewPublication(e.target.value)}
            rows="5"
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Posting..." : "Post & Share"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PublicationForm;
