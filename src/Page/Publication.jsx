import axios from "axios";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/publications";

const Publication = () => {
  const [publications, setPublications] = useState([]);
  const [newPublication, setNewPublication] = useState({
    userId: "",
    content: "",
  });
  const [editingPublication, setEditingPublication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Fetch Publications
  const fetchPublications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setPublications(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching publications:", error);
      setError("Failed to fetch publications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add a Publication
  const handleAddPublication = async () => {
    if (!newPublication.content) {
      setError("Content is required.");
      return;
    } else if (newPublication.content.length < 10) {
      setError("Content must be at least 10 characters long.");
      return;
    }

    try {
      await axios.post(API_URL, newPublication);
      setNewPublication({ userId: "", content: "" });
      fetchPublications();
      setError("");
    } catch (error) {
      console.error("Error adding publication:", error);
      setError("Failed to add publication. Please try again.");
    }
  };

  // Edit a Publication
  const handleEditPublication = async () => {
    if (!editingPublication.content) {
      setError("Content is required.");
      return;
    }

    try {
      await axios.put(`${API_URL}/${editingPublication.id}`, {
        content: editingPublication.content,
      });
      setEditingPublication(null);
      fetchPublications();
      setError("");
    } catch (error) {
      console.error("Error editing publication:", error);
      setError("Failed to edit publication. Please try again.");
    }
  };

  // Delete a Publication
  const handleDeletePublication = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchPublications();
      setError("");
    } catch (error) {
      console.error("Error deleting publication:", error);
      setError("Failed to delete publication. Please try again.");
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  return (
    <div>
      <h1>Publications</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Add Form */}
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={newPublication.userId}
          onChange={(e) =>
            setNewPublication({ ...newPublication, userId: e.target.value })
          }
        />
        <textarea
          placeholder="Content"
          value={newPublication.content}
          onChange={(e) =>
            setNewPublication({ ...newPublication, content: e.target.value })
          }
        />
        <button onClick={handleAddPublication}>Add Publication</button>
      </div>

      {/* Publication List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {publications.map((pub) => (
            <li key={pub.id}>
              <h3>User ID: {pub.userId}</h3>
              <p>{pub.content}</p>
              <small>
                Created at: {new Date(pub.createdAt).toLocaleString()}
              </small>
              <button onClick={() => setEditingPublication(pub)}>Edit</button>
              <button onClick={() => handleDeletePublication(pub.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Edit Form (if editing) */}
      {editingPublication && (
        <div>
          <h2>Edit Publication</h2>
          <textarea
            placeholder="Content"
            value={editingPublication.content}
            onChange={(e) =>
              setEditingPublication({
                ...editingPublication,
                content: e.target.value,
              })
            }
          />
          <button onClick={handleEditPublication}>Update Publication</button>
          <button onClick={() => setEditingPublication(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Publication;
