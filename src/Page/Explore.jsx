import React, { useState, useEffect } from "react";
import "../index.css";

const Explore = () => {
  const [publications, setPublications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [requests, setRequests] = useState([]);
  const [userId, setUserId] = useState(null); // Potentially needed, but confirm
  const [loadingPublications, setLoadingPublications] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublications = async () => {
      setLoadingPublications(true);
      try {
        const response = await fetch("http://localhost:5000/api/publications", {
          // Corrected endpoint
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Keep authorization if you have it
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPublications(data);
      } catch (error) {
        console.error("Error fetching publications:", error);
        setError(error.message || "Failed to fetch publications."); // Capture error
      } finally {
        setLoadingPublications(false);
      }
    };

    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await fetch("http://localhost:5000/api/requests", {
          // Corrected endpoint
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
        setError(error.message || "Failed to fetch requests."); // Capture error
      } finally {
        setLoadingRequests(false);
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
        // Fetch updated requests instead of manually updating the state
        const response = await fetch("http://localhost:5000/api/requests", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        setRequests(data); // Update requests from the server
      } else {
        alert("Failed to send request");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      setError(error.message || "Failed to send the collaboration request."); // Capture error
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
        // Fetch updated requests instead of manually updating the state
        const response = await fetch("http://localhost:5000/api/requests", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        setRequests(data); // Update requests from the server
      } else {
        alert("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      setError(error.message || "Failed to approve the request."); // Capture error
    }
  };

  const filteredPublications = publications
    .filter(
      (publication) =>
        publication.title?.toLowerCase().includes(searchTerm.toLowerCase()) || // Use optional chaining
        publication.author?.toLowerCase().includes(searchTerm.toLowerCase()) || // Use optional chaining
        publication.keywords?.toLowerCase().includes(searchTerm.toLowerCase()) // Use optional chaining
    )
    .sort((a, b) => (a[sortBy] || "").localeCompare(b[sortBy] || "")); // Use optional chaining

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-6">Explore Publications</h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

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
      <h2 className="text-2xl font-semibold mt-4 mb-2">Publications</h2>
      {loadingPublications ? (
        <p className="text-gray-500">Loading publications...</p>
      ) : (
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
      )}

      {/* Pending Requests Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4">Pending Requests</h2>
      {loadingRequests ? (
        <p className="text-gray-500">Loading requests...</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex items-center justify-between py-2 border-b"
            >
              <div>
                {request.Publication?.title || "N/A"} - {request.status}
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
      )}
    </div>
  );
};

export default Explore;
