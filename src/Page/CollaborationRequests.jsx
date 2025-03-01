import React, { useState, useEffect } from "react";
import axios from "axios";

function CollaborationRequests() {
  const [requests, setRequests] = useState([]);

  // Fetch collaboration requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/collaboration"
        );
        setRequests(response.data);
      } catch (error) {
        console.error("Error fetching collaboration requests:", error);
      }
    };
    fetchRequests();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/collaboration/${requestId}`,
        {
          status: "approved",
        }
      );
      setRequests((prevRequests) =>
        prevRequests.map((request) =>
          request._id === requestId
            ? { ...request, status: "approved" }
            : request
        )
      );
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/collaboration/${requestId}`,
        {
          status: "rejected",
        }
      );
      setRequests((prevRequests) =>
        prevRequests.map((request) =>
          request._id === requestId
            ? { ...request, status: "rejected" }
            : request
        )
      );
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  return (
    <div className="container">
      <h3>Collaboration Requests</h3>
      <ul>
        {requests.map((request) => (
          <li key={request._id}>
            <div>
              <strong>Researcher: </strong>
              {request.researcherId.name}
            </div>
            <div>
              <strong>Details: </strong>
              {request.details}
            </div>
            <div>
              <strong>Status: </strong>
              {request.status}
            </div>
            <button onClick={() => handleApprove(request._id)}>Approve</button>
            <button onClick={() => handleReject(request._id)}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CollaborationRequests;
