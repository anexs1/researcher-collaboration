import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import axios from "axios";
import Admin from "./Page/Admin";
import AboutUs from "./Page/AboutUs";
import Home from "./Page/Home";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import Researcher from "./Page/Researcher";
import Navbar from "./Component/Navbar";
import Register from "./Page/Register";
import Login from "./Page/Login";
import CollaborationRequests from "./Page/CollaborationRequests"; // Page to display collaboration requests
import CollaborationRequestForm from "./Page/CollaborationRequestForm"; // Form to create collaboration request

function App() {
  const [researchers, setResearchers] = useState([]);
  const [collaborationRequest, setCollaborationRequest] = useState("");
  const [status, setStatus] = useState(""); // For displaying request status
  const [collaborationRequests, setCollaborationRequests] = useState([]);

  // Fetching researchers
  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/researchers"
        ); // Update the API endpoint as needed
        setResearchers(response.data);
      } catch (error) {
        console.error("Error fetching researchers:", error);
      }
    };
    fetchResearchers();
  }, []);

  // Fetching collaboration requests
  useEffect(() => {
    const fetchCollaborationRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/collaboration"
        ); // API to fetch collaboration requests
        setCollaborationRequests(response.data);
      } catch (error) {
        console.error("Error fetching collaboration requests:", error);
      }
    };
    fetchCollaborationRequests();
  }, []);

  // Handle collaboration request submission
  const handleRequestSubmit = async (researcherId) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/collaboration/create",
        {
          researcherId: researcherId,
          details: collaborationRequest,
        }
      );
      setStatus("Request sent successfully!");
      setCollaborationRequest(""); // Clear the input field
    } catch (error) {
      console.error("Error submitting request:", error);
      setStatus("Error sending request");
    }
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/researcher" element={<Researcher />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Collaboration Requests Page */}
        <Route
          path="/collaboration-requests"
          element={<CollaborationRequests requests={collaborationRequests} />}
        />

        {/* Collaboration Request Form */}
        <Route
          path="/collaboration-request-form"
          element={
            <CollaborationRequestForm
              researchers={researchers}
              collaborationRequest={collaborationRequest}
              setCollaborationRequest={setCollaborationRequest}
              handleRequestSubmit={handleRequestSubmit}
            />
          }
        />

        {/* Admin Section with Nested Routes */}
        <Route path="/admin" element={<Admin />}>
          <Route path="publication" element={<Publication />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;