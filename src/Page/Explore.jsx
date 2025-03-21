import React, { useState, useEffect } from "react";
import "./Explore.css";

const Explore = () => {
  const [publications, setPublications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [requests, setRequests] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();
        setPublications(data);
      } catch (error) {
        console.error("Error fetching publications:", error);
      }
    };

    const fetchRequests = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/requests", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchPublications();
    fetchRequests();
  }, []);

  const sendRequest = async (publicationId) => {
    try {
      const response = await fetch("http://localhost:5000/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ publicationId, userId }),
      });
      if (response.ok) {
        alert("Request sent successfully");
        const updatedRequests = await response.json();
        setRequests([...requests, updatedRequests]);
      } else {
        alert("Failed to send request");
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/requests/${requestId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        alert("Request approved");
        setRequests(
          requests.map((req) =>
            req.id === requestId ? { ...req, status: "approved" } : req
          )
        );
      } else {
        alert("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

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
          <option value="date">Sort by Date</option>
          <option value="views">Sort by Views</option>
          <option value="downloads">Sort by Downloads</option>
          <option value="reviews">Sort by Reviews</option>
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
              <button onClick={() => sendRequest(publication.id)}>
                Request Collaboration
              </button>
            </div>
          ))
        ) : (
          <p>No publications available.</p>
        )}
      </div>

      <h2>Pending Requests</h2>
      <ul>
        {requests.map((request) => (
          <li key={request.id}>
            {request.Publication.title} - {request.status}
            {request.status === "pending" && (
              <button onClick={() => approveRequest(request.id)}>
                Approve
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Explore;
