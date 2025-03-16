import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Explore.css";

const Explore = () => {
  const [publications, setPublications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/publications"
        );
        setPublications(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPublications();
  }, []);

  if (error) {
    return <p className="error-message">Error: {error}</p>;
  }

  return (
    <div className="explore-container">
      <h1>Explore Research Publications</h1>
      {publications.length > 0 ? (
        <div className="publication-list">
          {publications.map((pub, index) => (
            <div className="publication-card" key={index}>
              <h2>{pub.title}</h2>
              <p>
                <strong>Author:</strong> {pub.author}
              </p>
              <p>
                <strong>Keywords:</strong> {pub.keywords}
              </p>
              {pub.fileUrl && (
                <a href={pub.fileUrl} download>
                  📄 Download Publication
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No publications found.</p>
      )}
    </div>
  );
};

export default Explore;
