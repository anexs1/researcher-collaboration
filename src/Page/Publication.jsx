import React, { useState, useEffect } from "react";

const Publication = () => {
  const [publications, setPublications] = useState([]);
  const [newPublication, setNewPublication] = useState({
    title: "",
    author: "",
    content: "",
  });

  useEffect(() => {
    fetchPublications();
  }, []);

  // Fetch publications from backend
  const fetchPublications = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/publications");
      const data = await response.json();
      setPublications(data);
    } catch (error) {
      console.error("Error fetching publications:", error);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    setNewPublication({ ...newPublication, [e.target.name]: e.target.value });
  };

  // Submit new publication
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/publications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: publicationTitle,
          content: publicationContent,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Publication submitted successfully:", data);
    } catch (error) {
      console.error("Error submitting publication:", error);
    }
  };

  return (
    <div>
      <h1>Publications</h1>

      {/* Add Publication Form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={newPublication.title}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="author"
          placeholder="Author"
          value={newPublication.author}
          onChange={handleChange}
          required
        />
        <textarea
          name="content"
          placeholder="Content"
          value={newPublication.content}
          onChange={handleChange}
          required
        ></textarea>
        <button type="submit">Add Publication</button>
      </form>

      {/* Display Publications */}
      <ul>
        {publications.map((pub) => (
          <li key={pub.id}>
            <h3>{pub.title}</h3>
            <p>By: {pub.author}</p>
            <p>{pub.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Publication;
