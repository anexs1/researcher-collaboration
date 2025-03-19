import React, { useState, useEffect } from "react";
import "./Explore.css";

const Explore = () => {
  const [publications, setPublications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/publications"); // Replace with actual API endpoint
        const data = await response.json();
        setPublications(data);
      } catch (error) {
        console.error("Error fetching publications:", error);
      }
    };
    fetchPublications();
  }, []);

  const filteredPublications = publications
    .filter(
      (publication) =>
        publication.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        publication.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        publication.keywords.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));

  return (
    <div className="explore-container">
      <h1>Explore Publications</h1>

      <div className="filter-section">
        <input
          type="text"
          placeholder="Search by title, author, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select onChange={(e) => setSortBy(e.target.value)}>
          <option value="title">Sort by Title</option>
          <option value="author">Sort by Author</option>
        </select>
      </div>

      <div className="publication-list">
        {filteredPublications.length > 0 ? (
          filteredPublications.map((publication, index) => (
            <div className="publication-card" key={index}>
              <h2>{publication.title}</h2>
              <p>
                <strong>Author:</strong> {publication.author}
              </p>
              <p>
                <strong>Keywords:</strong> {publication.keywords}
              </p>
              {publication.file && (
                <a
                  href={publication.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-btn"
                >
                  Download Publication
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

export default Explore;
// //import React, { useEffect, useState } from "react";

// const ExplorerPage = () => {
//   const [publications, setPublications] = useState([]);

//   useEffect(() => {
//     fetch("http://localhost:5000/api/publications")
//       .then((res) => res.json())
//       .then((data) => setPublications(data))
//       .catch((error) => console.error("Error fetching publications:", error));
//   }, []);

//   return (
//     <div>
//       <h1>Explorer Page</h1>
//       {publications.map((pub) => (
//         <div key={pub.id}>
//           <h3>{pub.title}</h3>
//           <p>{pub.description}</p>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default ExplorerPage;
