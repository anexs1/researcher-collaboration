// Researcher.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

function Researcher() {
  const [researchers, setResearchers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    field: "",
    bio: "",
    image: null,
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [status, setStatus] = useState(""); // For status messages like success or error

  // Fetch all researchers
  const fetchResearchers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/researchers");
      setResearchers(response.data);
    } catch (error) {
      console.error("Error fetching researchers:", error);
    }
  };

  useEffect(() => {
    fetchResearchers();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      alert("File size must be less than 1MB.");
    }
  };

  // Handle form submission (add or update profile)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name && formData.field && formData.bio) {
      try {
        if (editingIndex !== null) {
          // Update the existing profile
          const updatedResearcher = { ...formData };
          await axios.put(
            `http://localhost:5000/api/researchers/${researchers[editingIndex]._id}`,
            updatedResearcher
          );
          setStatus("Profile updated successfully!");
        } else {
          // Create a new profile
          await axios.post("http://localhost:5000/api/researchers", formData);
          setStatus("Profile created successfully!");
        }
        setFormData({ name: "", field: "", bio: "", image: null });
        setEditingIndex(null);
        fetchResearchers(); // Refresh the list after adding/updating
      } catch (error) {
        console.error("Error saving profile:", error);
        setStatus("Error saving profile");
      }
    }
  };

  // Handle edit profile
  const handleEdit = (index) => {
    setFormData(researchers[index]);
    setEditingIndex(index);
  };

  // Handle delete profile
  const handleDelete = async (index) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/researchers/${researchers[index]._id}`
      );
      setStatus("Profile deleted successfully!");
      fetchResearchers(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting profile:", error);
      setStatus("Error deleting profile");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Researcher Profiles</h2>
      {status && <p>{status}</p>}

      {/* Form to create or edit a researcher profile */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Field of Research:</label>
          <input
            type="text"
            className="form-control"
            name="field"
            value={formData.field}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Upload Image:</label>
          <input
            type="file"
            className="form-control-file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-muted">Max file size: 1MB</p>
        </div>

        <div className="mb-3">
          <label className="form-label">Bio:</label>
          <textarea
            className="form-control"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary">
          {editingIndex !== null ? "Save Changes" : "Create Profile"}
        </button>
      </form>

      {/* Display created researcher profiles */}
      <div className="mt-4">
        <h3>Researcher List</h3>
        {researchers.length > 0 ? (
          <div className="list-group">
            {researchers.map((researcher, index) => (
              <div
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                {researcher.image && (
                  <img
                    src={researcher.image}
                    alt={researcher.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      marginRight: "10px",
                    }}
                  />
                )}
                <div>
                  <h5>{researcher.name}</h5>
                  <p>
                    <strong>Field of Research:</strong> {researcher.field}
                  </p>
                  <p>{researcher.bio}</p>
                </div>
                <div>
                  <button
                    className="btn btn-info btn-sm me-2"
                    onClick={() => handleEdit(index)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm me-2"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No profiles created yet.</p>
        )}
      </div>
    </div>
  );
}

export default Researcher;
