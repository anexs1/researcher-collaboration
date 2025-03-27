// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";

// Pages
import Admin from "./Page/Admin";
import Home from "./Page/Home";
import Profile from "./Page/Profile"; // Ensure this is correct
import Publication from "./Page/Publication";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Explore from "./Page/Explore";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";

// Components
import Navbar from "./Component/Navbar";
import ProfileAccount from "./Component/ProfileAccount"; //Imported for the sidebar
import ProfileAbout from "./Component/ProfileAbout";
import ProfileEducation from "./Component/ProfileEducation";
import ProfileSkills from "./Component/ProfileSkills";
import ProfileResearch from "./Component/ProfileResearch";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // On mount, check if the user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsLoggedIn(true);
            setIsAdmin(data.user.role === "admin"); // Access data user then role
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }
  }, []);

  // Logout function
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem("token");
  }, []);

  return (
    <Router>
      {/* Navbar with ProfileMenu component */}
      <Navbar
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/publications" element={<Publication />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/messages" element={<Messages />} />

        {/* Authentication Routes */}
        <Route path="/admin/login" element={<LoginPage admin={true} />} />

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/profile/account" /> // Redirect to profile base route
            ) : (
              <LoginPage
                setIsLoggedIn={setIsLoggedIn}
                setIsAdmin={setIsAdmin}
              />
            )
          }
        />

        <Route
          path="/signup"
          element={
            isLoggedIn ? <Navigate to="/profile/account" /> : <SignupPage />
          }
        />

        {/* Protected Routes - Only accessible if logged in */}
        <Route
          path="/profile"
          element={
            isLoggedIn ? (
              <Profile /> // Render Profile Component
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          {/* Nested Routes for Profile Sections - These will render within <Outlet> */}
          <Route path="account" element={<ProfileAccount />} />
          <Route path="about" element={<ProfileAbout />} />
          <Route path="education" element={<ProfileEducation />} />
          <Route path="skills" element={<ProfileSkills />} />
          <Route path="research" element={<ProfileResearch />} />
          <Route path="publications" element={<Publication />} /> {/*moved */}
          <Route path="my-projects" element={<MyProjects />} />
          <Route path="messages" element={<Messages />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <Admin isAdmin={true} />
            ) : (
              <Navigate to="/" /> // Redirect to home
            )
          }
        />

        {/* Redirect all other undefined routes to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
