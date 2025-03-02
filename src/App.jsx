import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import Admin from "./Page/Admin";
import Home from "./Page/Home";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import Researcher from "./Page/Researcher";
import Navbar from "./Component/Navbar";
import Register from "./Page/Register";
import Login from "./Page/Login";
import CollaborationRequests from "./Page/CollaborationRequests";
import CollaborationRequestForm from "./Page/CollaborationRequestForm";
import PublicationForm from "./Page/PublicationForm";

function App() {
  const [researchers, setResearchers] = useState([]);
  const [collaborationRequest, setCollaborationRequest] = useState("");
  const [status, setStatus] = useState("");
  const [collaborationRequests, setCollaborationRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false); // Admin state to control admin access
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Add login state here

  // Fetch researchers
  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/researchers"
        );
        setResearchers(response.data);
      } catch (error) {
        console.error("Error fetching researchers:", error);
      }
    };
    fetchResearchers();
  }, []);

  // Fetch collaboration requests
  useEffect(() => {
    const fetchCollaborationRequests = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/collaboration"
        );
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
      setCollaborationRequest("");
    } catch (error) {
      console.error("Error submitting request:", error);
      setStatus("Error sending request");
    }
  };

  // This effect triggers after login state changes to prevent infinite loops
  useEffect(() => {
    if (isLoggedIn) {
      // Redirect to Admin page if logged in
      window.location.href = "/admin";
    }
  }, [isLoggedIn]);

  return (
    <Router>
      <Navbar isAdmin={isAdmin} setIsLoggedIn={setIsLoggedIn} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/researcher" element={<Researcher />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/login"
          element={<Login setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="/publication-form" element={<PublicationForm />} />
        <Route path="/publication" element={<Publication />} />
        <Route
          path="/collaboration-requests"
          element={<CollaborationRequests requests={collaborationRequests} />}
        />
        {/* Admin Section */}
        {isAdmin ? (
          <Route path="/admin" element={<Admin />} />
        ) : (
          <Route path="/admin" element={<Navigate to="/" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
