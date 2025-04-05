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

// --- Component Imports (assuming paths are correct) ---
import Home from "./Page/Home";
import Explore from "./Page/Explore";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile"; // Will likely need currentUser prop too
import Publication from "./Page/Publication"; // Needs currentUser prop
import MyProjects from "./Page/MyProjects"; // Will likely need currentUser prop too
import Messages from "./Page/Messages"; // Will likely need currentUser prop too
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
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";

// --- AdminLayout (Keep as is) ---
const AdminLayout = ({ isAdmin }) => {
  // ... (AdminLayout code remains the same)
  if (isAdmin === null) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Loading Admin Access...
      </div>
    );
  }
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null); // Tracks login status (null=pending, false=out, true=in)
  const [currentUser, setCurrentUser] = useState(null); // *** NEW: Stores the logged-in user object ***

  // --- handleLogout ---
  const handleLogout = useCallback(() => {
    console.log("Executing handleLogout");
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null); // *** NEW: Clear user data on logout ***
    // Note: Navigation happens implicitly via route protection usually,
    // or you can add navigate('/login') if needed here.
  }, []);

  // --- Validate Token useEffect ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log("Checking token on load:", token ? "Found" : "Not Found");
    if (!token) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null); // Ensure user is cleared if no token
      return;
    }

    axios
      .post(
        "http://localhost:5000/api/auth/validate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log("Validation API Response:", response.data);
        if (response.data.success && response.data.user) {
          setIsLoggedIn(true);
          const isAdminUser = response.data.user.role === "admin";
          setIsAdmin(isAdminUser);
          setCurrentUser(response.data.user); // *** NEW: Store the user object ***
          console.log(
            "Validation success: User data set, isAdmin set to",
            isAdminUser
          );
        } else {
          console.log("Validation failed or user data missing, logging out.");
          handleLogout(); // Clears token, sets states to false/null
        }
      })
      .catch((error) => {
        console.error("Validation API Error:", error);
        handleLogout(); // Clears token, sets states to false/null
      });
  }, [handleLogout]); // handleLogout is stable due to useCallback

  if (isLoggedIn === null) {
    console.log("App Render: Showing global loader (validation pending)");
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Loading Application...
      </div>
    );
  }

  console.log(
    `App Render: isLoggedIn=${isLoggedIn}, isAdmin=${isAdmin}, currentUser=${
      currentUser ? currentUser.id : null // Log user ID or null
    }`
  );

  return (
    <Router>
      {/* Pass necessary props to Navbar */}
      <Navbar
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        currentUser={currentUser} // *** NEW: Pass currentUser (optional for Navbar, but good practice) ***
        onLogout={handleLogout}
      />
      <main className="pt-16 md:pt-20">
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />

          <Route
            path="/signup"
            element={
              currentUser ? ( // Use currentUser for redirection check
                <Navigate to="/profile/account" replace />
              ) : (
                <SignupPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              currentUser ? ( // Use currentUser for redirection check
                isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/profile/account" replace />
                )
              ) : (
                <LoginPage
                  // Pass setters needed by LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  setCurrentUser={setCurrentUser} // *** NEW: Pass setCurrentUser ***
                  isForAdmin={false}
                />
              )
            }
          />
          <Route
            path="/admin-login"
            element={
              currentUser ? ( // Use currentUser for redirection check
                isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/profile/account" replace />
                )
              ) : (
                <LoginPage
                  // Pass setters needed by LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  setCurrentUser={setCurrentUser} // *** NEW: Pass setCurrentUser ***
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
          {/* Use currentUser for protection and pass it as prop */}
          <Route
            path="/profile"
            element={
              currentUser ? (
                <Profile currentUser={currentUser} /> // *** Pass currentUser ***
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            {/* Nested Profile Routes */}
            {/* These children will likely get currentUser via Outlet context or props from Profile */}
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<ProfileAccount />} />
            <Route path="about" element={<ProfileAbout />} />
            <Route path="education" element={<ProfileEducation />} />
            <Route path="skills" element={<ProfileSkills />} />
            <Route path="research" element={<ProfileResearch />} />
          </Route>

          <Route
            path="/publications"
            element={
              currentUser ? (
                <Publication currentUser={currentUser} /> // *** Pass currentUser ***
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/my-projects"
            element={
              currentUser ? (
                <MyProjects currentUser={currentUser} /> // *** Pass currentUser ***
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/messages"
            element={
              currentUser ? (
                <Messages currentUser={currentUser} /> // *** Pass currentUser ***
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* --- Protected Admin Routes (Requires Admin Role) --- */}
          {/* AdminLayout handles the isAdmin check */}
          <Route path="/admin" element={<AdminLayout isAdmin={isAdmin} />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            {/* Add other admin routes here */}
          </Route>

          {/* --- Catch-all Route --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
