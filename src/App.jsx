// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import axios from "axios";
import "./index.css";

// --- Public & User Pages/Components ---
import Home from "./Page/Home";
import Explore from "./Page/Explore";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage"; // Ensure path is correct
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";
import AcademicSignupForm from "./Component/AcademicSignupForm";
import CorporateSignupForm from "./Component/CorporateSignupForm";
import MedicalSignupForm from "./Component/MedicalSignupForm";
import NotResearcherSignupForm from "./Component/NotResearcherSignupForm";
import ProfileAccount from "./Component/ProfileAccount";
import ProfileAbout from "./Component/ProfileAbout";
import ProfileEducation from "./Component/ProfileEducation";
import ProfileSkills from "./Component/ProfileSkills";
import ProfileResearch from "./Component/ProfileResearch";
import Navbar from "./Component/Navbar";

// --- NEW: Import Admin Page Components ---
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";
// import Admin from "./Page/Admin"; // REMOVED - Replaced by AdminDashboardPage

// --- AdminLayout (Keep as is - defined outside App function) ---
const AdminLayout = ({ isAdmin }) => {
  if (isAdmin === null) {
    // Consider a more visually appealing loader component
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Loading Admin Access...
      </div>
    );
  }
  // Optional: If using a sidebar layout for Admin section
  // return isAdmin ? <div className="flex h-screen"><AdminSidebar /><main className="flex-1 overflow-y-auto"><Outlet /></main></div> : <Navigate to="/" replace />;
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  // --- handleLogout (Keep as is) ---
  const handleLogout = useCallback(() => {
    console.log("Executing handleLogout");
    setIsLoggedIn(false);
    setIsAdmin(false); // Reset admin status on logout
    localStorage.removeItem("authToken");
    // Optionally navigate('/login'); // Redirect after logout if needed
  }, []);

  // --- Validate Token useEffect (Keep as is) ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log("Checking token on load:", token ? "Found" : "Not Found");
    if (!token) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      return;
    }

    axios
      .post(
        "http://localhost:5000/api/auth/validate", // Ensure this URL is correct
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log("Validation API Response:", response.data);
        if (response.data.success && response.data.user) {
          setIsLoggedIn(true);
          const isAdminUser = response.data.user.role === "admin";
          setIsAdmin(isAdminUser);
          console.log("Validation success: isAdmin set to", isAdminUser);
        } else {
          console.log("Validation failed or user data missing, logging out.");
          handleLogout();
        }
      })
      .catch((error) => {
        console.error("Validation API Error:", error);
        handleLogout(); // Logout on validation error
      });
  }, [handleLogout]);

  // --- Loading State (Keep as is) ---
  if (isLoggedIn === null) {
    console.log("App Render: Showing global loader");
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Loading Application...
      </div>
    );
  }

  console.log(`App Render: isLoggedIn=${isLoggedIn}, isAdmin=${isAdmin}`);

  return (
    <Router>
      {/* Navbar rendered outside Routes, visible on all pages */}
      <Navbar
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
      {/* Main content area where Routes are rendered */}
      <main className="pt-16 md:pt-20">
        {" "}
        {/* Add padding-top equal to or more than Navbar height */}
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          {/* --- Authentication Routes --- */}
          <Route
            path="/signup"
            element={
              isLoggedIn ? (
                <Navigate to="/profile/account" replace />
              ) : (
                <SignupPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/profile/account" replace />
                )
              ) : (
                <LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  isForAdmin={false}
                />
              )
            }
          />
          <Route
            path="/admin-login"
            element={
              isLoggedIn ? (
                isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/profile/account" replace />
                )
              ) : (
                <LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  isForAdmin={true}
                />
              )
            }
          />
          {/* --- Signup Form Specific Routes --- */}
          <Route path="/signup/academic" element={<AcademicSignupForm />} />
          <Route path="/signup/corporate" element={<CorporateSignupForm />} />
          <Route path="/signup/medical" element={<MedicalSignupForm />} />
          <Route
            path="/signup/not-researcher"
            element={<NotResearcherSignupForm />}
          />
          {/* --- Protected User Routes (Requires Login) --- */}
          <Route
            path="/profile"
            element={
              isLoggedIn ? <Profile /> : <Navigate to="/login" replace />
            }
          >
            {/* Nested Profile Routes */}
            <Route index element={<Navigate to="account" replace />} />{" "}
            {/* Default profile view */}
            <Route path="account" element={<ProfileAccount />} />
            <Route path="about" element={<ProfileAbout />} />
            <Route path="education" element={<ProfileEducation />} />
            <Route path="skills" element={<ProfileSkills />} />
            <Route path="research" element={<ProfileResearch />} />
          </Route>
          {/* Top-level protected routes (if not nested under profile) */}
          <Route
            path="/publications"
            element={
              isLoggedIn ? <Publication /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/my-projects"
            element={
              isLoggedIn ? (
                <MyProjects isLoggedIn={isLoggedIn} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/messages"
            element={
              isLoggedIn ? <Messages /> : <Navigate to="/login" replace />
            }
          />
          {/* --- NEW: Protected Admin Routes (Requires Admin Role) --- */}
          <Route path="/admin" element={<AdminLayout isAdmin={isAdmin} />}>
            {/* Index route for /admin (Dashboard) */}
            <Route index element={<AdminDashboardPage />} />
            {/* Nested admin routes */}
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            {/* Add other admin routes here as needed, e.g.: */}
            {/* <Route path="content-moderation" element={<AdminContentPage />} /> */}
          </Route>
          {/* --- Catch-all Route (Must be LAST) --- */}
          <Route path="*" element={<Navigate to="/" replace />} />{" "}
          {/* Or a dedicated 404 component */}
        </Routes>
      </main>
    </Router>
  );
}

export default App;
