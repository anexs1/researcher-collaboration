import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import "./index.css"; // Assuming this exists

// Page Imports
import Home from "./Page/Home";
import Explore from "./Page/Explore";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";

// Component Imports (Signup Forms, Profile Sections, Navbar)
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

// Admin Page Imports
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage"; // <--- IMPORT ADDED HERE

// Admin Layout Component (Placeholder/Example)
const AdminLayout = ({ isAdmin }) => {
  // Add a proper loading state check
  if (isAdmin === null) {
    // Check explicitly for null (initial state)
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Verifying Admin Access... {/* Changed loading message */}
      </div>
    );
  }
  // Redirect if not admin or access not determined yet
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />; // Redirect non-admins to login
};

function App() {
  const [isAdmin, setIsAdmin] = useState(null); // null = checking, false = not admin, true = is admin
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = checking, false = not logged in, true = is logged in
  const [currentUser, setCurrentUser] = useState(null);

  // Memoized logout function
  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken"); // Clear token
    localStorage.removeItem("user"); // Clear stored user data
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
    // Optional: navigate to home or login after logout
    // window.location.href = '/login'; // Force reload if needed
  }, []);

  // Effect to validate token on initial load or refresh
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      // No token found, definitely not logged in
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null);
      return; // Stop processing
    }

    // If token exists, validate it with the backend
    // *** NOTE: Ensure you have a `/api/auth/validate` endpoint ***
    // This endpoint should verify the token and return the user object if valid
    axios
      .post(
        // Using POST for validate, adjust if your endpoint is GET
        "http://localhost:5000/api/auth/validate", // Replace with your actual validation endpoint
        {}, // Empty body for validation if needed
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        if (response.data.success && response.data.user) {
          // Token is valid, user data received
          setIsLoggedIn(true);
          const isAdminUser = response.data.user.role === "admin";
          setIsAdmin(isAdminUser);
          setCurrentUser(response.data.user);
          // Also store user data in localStorage for profile page consistency?
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } else {
          // Token invalid or backend indicates failure
          handleLogout();
        }
      })
      .catch((error) => {
        // Network error or backend error (e.g., 401 Unauthorized)
        console.error("Token validation failed:", error);
        handleLogout(); // Log out user if token validation fails
      });
  }, [handleLogout]); // Rerun only if handleLogout changes (which it shouldn't)

  // Show a global loading state while checking authentication
  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Loading Application...
      </div>
    );
  }

  return (
    <Router>
      {/* Pass all necessary state and handlers down to the Routes component */}
      <AppRoutes
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        currentUser={currentUser}
        handleLogout={handleLogout}
        setIsLoggedIn={setIsLoggedIn} // Pass setters for login component
        setIsAdmin={setIsAdmin}
        setCurrentUser={setCurrentUser}
      />
    </Router>
  );
}

// Component to handle actual routing logic
const AppRoutes = ({
  isLoggedIn,
  isAdmin,
  currentUser,
  handleLogout,
  setIsLoggedIn,
  setIsAdmin,
  setCurrentUser,
}) => {
  const location = useLocation();
  // Determine if the current route is within the /admin path
  const isAdminRoute = location.pathname.toLowerCase().startsWith("/admin");

  return (
    <>
      {/* Conditionally render Navbar only if not an admin route */}
      {!isAdminRoute && (
        <Navbar
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      {/* Adjust main padding based on whether Navbar is present */}
      <main className={!isAdminRoute ? "pt-16 md:pt-20" : ""}>
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />

          {/* --- Authentication Routes --- */}
          <Route
            path="/signup"
            element={
              isLoggedIn ? <Navigate to="/profile" replace /> : <SignupPage />
            }
          />
          {/* Specific Signup Forms */}
          <Route path="/signup/academic" element={<AcademicSignupForm />} />
          <Route path="/signup/corporate" element={<CorporateSignupForm />} />
          <Route path="/signup/medical" element={<MedicalSignupForm />} />
          <Route
            path="/signup/not-researcher"
            element={<NotResearcherSignupForm />}
          />

          {/* Login Routes */}
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/profile" replace />
                )
              ) : (
                <LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  setCurrentUser={setCurrentUser}
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
                  <Navigate to="/profile" replace />
                )
              ) : (
                <LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  setCurrentUser={setCurrentUser}
                  isForAdmin={true}
                />
              ) // *** isForAdmin is TRUE here ***
            }
          />

          {/* --- Protected User Routes --- */}
          {/* Profile route with nested sections */}
          <Route
            path="/profile"
            element={
              isLoggedIn ? (
                <Profile currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            {/* Default to account or dashboard within profile */}
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<ProfileAccount />} />
            <Route path="about" element={<ProfileAbout />} />
            <Route path="education" element={<ProfileEducation />} />
            <Route path="skills" element={<ProfileSkills />} />
            <Route path="research" element={<ProfileResearch />} />
            {/* Add other profile sub-routes */}
          </Route>

          {/* Other protected routes */}
          <Route
            path="/publications"
            element={
              isLoggedIn ? (
                <Publication currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/my-projects"
            element={
              isLoggedIn ? (
                <MyProjects currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/messages"
            element={
              isLoggedIn ? (
                <Messages currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Removed duplicate /Explore, it's public */}

          {/* --- Protected Admin Routes --- */}
          <Route path="/admin" element={<AdminLayout isAdmin={isAdmin} />}>
            {/* Admin Dashboard is the index route */}
            <Route index element={<AdminDashboardPage />} />
            {/* Specific Admin Sections */}
            <Route path="users" element={<AdminUsersPage />} />{" "}
            {/* Manage all users */}
            <Route
              path="pending-users"
              element={<AdminPendingUsersPage />}
            />{" "}
            {/* <--- ROUTE ADDED HERE */}
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            {/* Add routes for user profile view/edit within admin? */}
            {/* Example: <Route path="users/:userId/edit" element={<AdminUserEditPage />} /> */}
          </Route>

          {/* Catch-all / Not Found */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
