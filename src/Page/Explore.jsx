import React, { useState, useEffect } from "react";
import "../index.css";

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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-6">Explore Publications</h1>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search by title, author, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-auto p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full md:w-auto p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="title">Sort by Title</option>
          <option value="author">Sort by Author</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      {/* Publication List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPublications.length > 0 ? (
          filteredPublications.map((publication, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {publication.title}
                </h2>
                <p>
                  <strong>Author:</strong> {publication.author}
                </p>
                <p>
                  <strong>Keywords:</strong> {publication.keywords}
                </p>
              </div>
              <div className="mt-4">
                {publication.file && (
                  <a
                    href={publication.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                  >
                    Download Publication
                  </a>
                )}
                <button
                  onClick={() => sendRequest(publication.id)}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Request Collaboration
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No publications available.</p>
        )}
      </div>

      {/* Pending Requests Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4">Pending Requests</h2>
      <ul>
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex items-center justify-between py-2 border-b"
          >
            <div>
              {request.Publication.title} - {request.status}
            </div>
            {request.status === "pending" && (
              <button
                onClick={() => approveRequest(request.id)}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
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
