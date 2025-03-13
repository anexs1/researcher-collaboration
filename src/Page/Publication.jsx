// Publication.js (React Component)
import React, { useState } from "react";

const Publication = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [keywords, setKeywords] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !author) {
      alert("Title and Author are required!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("keywords", keywords);
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/publications", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit publication");
      }

      const data = await response.json();
      setMessage("Publication submitted successfully!");

      setTitle("");
      setAuthor("");
      setKeywords("");
      setFile(null);
    } catch (error) {
      console.error("Error submitting publication:", error);
      setMessage("Error submitting publication");
    }
  };

  return (
    <div>
      <h2>Upload Publication</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default Publication;
