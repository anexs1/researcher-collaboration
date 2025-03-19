import React, { useEffect, useState } from "react";
import axios from "axios";

const ResearchList = () => {
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/publications")
      .then((response) => setPapers(response.data))
      .catch((error) => console.error("Error fetching papers", error));
  }, []);

  return (
    <div>
      <h2>Research Papers</h2>
      <ul>
        {papers.map((paper) => (
          <li key={paper.id}>
            <h3>{paper.title}</h3>
            <p>
              <strong>Author:</strong> {paper.author}
            </p>
            <p>{paper.abstract}</p>
            <a
              href={`http://localhost:5000/uploads/${paper.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResearchList;
