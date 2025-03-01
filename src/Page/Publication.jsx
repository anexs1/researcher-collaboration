import React, { useEffect, useState } from "react";
import axios from "axios";

function Publication() {
  const [publications, setPublications] = useState([]);
  const [newPublication, setNewPublication] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const userId = 1; // Replace with dynamic user ID from authentication
  const userRole = "user"; // Replace with dynamic role (user/admin)

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/publications"
      );
      setPublications(response.data);
      setLoading(false); // Stop loading after fetching
    } catch (error) {
      console.error("Error fetching publications:", error);
      setLoading(false); // Stop loading even on error
    }
  };

  const handleAddPublication = async () => {
    if (!newPublication.trim()) return;

    try {
      await axios.post("http://localhost:5000/api/publications", {
        userId,
        content: newPublication,
      });
      setNewPublication(""); // Clear input field
      fetchPublications(); // Refresh list after adding
    } catch (error) {
      console.error("Error adding publication:", error);
    }
  };

  const handleEdit = async (id, oldContent) => {
    const newContent = prompt("Edit your publication:", oldContent);
    if (!newContent) return;

    try {
      await axios.put(`http://localhost:5000/api/publications/${id}`, {
        content: newContent,
        userId,
        role: userRole,
      });
      fetchPublications(); // Refresh list after editing
    } catch (error) {
      console.error("Error updating publication:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/publications/${id}`, {
        data: { userId, role: userRole },
      });
      fetchPublications(); // Refresh list after deletion
    } catch (error) {
      console.error("Error deleting publication:", error);
    }
  };

  const handleShare = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/publications/share`, { id });
      alert("Publication shared successfully!");
    } catch (error) {
      console.error("Error sharing publication:", error);
    }
  };

  return (
    <div className="publication-container">
      <h3>Recent Publications</h3>

      {/* Publication Form */}
      <div className="publication-form">
        <input
          type="text"
          placeholder="Share your publication..."
          value={newPublication}
          onChange={(e) => setNewPublication(e.target.value)}
        />
        <button onClick={handleAddPublication}>Post</button>
      </div>

      <hr />

      {/* Loading State */}
      {loading ? (
        <p>Loading publications...</p>
      ) : publications.length === 0 ? (
        <p>No publications yet.</p>
      ) : (
        publications.map((pub) => (
          <div key={pub.id} className="publication-card">
            <div className="publication-author">
              <img src="https://via.placeholder.com/50" alt="User" />
              <div>
                <h5>{pub.author || "Anonymous"}</h5>
                <p className="publication-date">{pub.createdAt}</p>
              </div>
            </div>
            <p className="publication-content">{pub.content}</p>

            {/* Edit and Delete Buttons (Only for Author or Admin) */}
            {userId === pub.userId || userRole === "admin" ? (
              <div className="publication-actions">
                <button onClick={() => handleEdit(pub.id, pub.content)}>
                  Edit
                </button>
                <button onClick={() => handleDelete(pub.id)}>Delete</button>
              </div>
            ) : null}

            {/* Share Button */}
            <button onClick={() => handleShare(pub.id)}>Share</button>
          </div>
        ))
      )}
    </div>
  );
}

export default Publication;
