import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Publication.css";

const Publication = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [keywords, setKeywords] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [publications, setPublications] = useState([]);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/publications"
      );
      setPublications(response.data);
    } catch (error) {
      console.error("Error fetching publications:", error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !author || !file) {
      alert("Title, Author, and File are required!");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("keywords", keywords);
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/publications",
        formData
      );
      if (response.status === 201) {
        setMessage("Publication submitted successfully!");
        fetchPublications(); // Refresh list
        setTitle("");
        setAuthor("");
        setKeywords("");
        setFile(null);
        document.querySelector('input[type="file"]').value = ""; // Reset file input
      }
    } catch (error) {
      console.error("Error submitting publication:", error);
      setMessage("Error submitting publication");
    }
    setLoading(false);
  };

  return (
    <div className="publication-container">
      <h2>Upload Publication</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit} className="publication-form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <input type="file" onChange={handleFileChange} required />
        {file && <p className="file-preview">File: {file.name}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Submit"}
        </button>
      </form>
      <hr />
      <h2>Recent Publications</h2>
      <div className="publication-list">
        {publications.length > 0 ? (
          publications.map((pub) => (
            <div className="publication-card" key={pub.id}>
              <h3>{pub.title}</h3>
              <p>
                <strong>Author:</strong> {pub.author}
              </p>
              <p>
                <strong>Keywords:</strong> {pub.keywords}
              </p>
              {pub.fileUrl && (
                <a href={pub.fileUrl} target="_blank" rel="noopener noreferrer">
                  View Publication
                </a>
              )}
            </div>
          ))
        ) : (
          <p>No publications available.</p>
        )}
      </div>
    </div>
  );
};

export default Publication;
