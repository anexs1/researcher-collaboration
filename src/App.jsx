// src/App.js

import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link, // Import Link for error pages
} from "react-router-dom";
import axios from "axios";
import "./index.css"; // Ensure this path is correct

// --- Page Imports ---
import Home from "./Page/Home";
import Explore from "./Page/Explore";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile"; // Contains the publication form now
import Publication from "./Page/Publication"; // <-- CORRECTED IMPORT: Use this for display
// import MyPublications from "./Page/Publications"; // <-- REMOVED incorrect/unused import
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";

// --- Component Imports ---
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

// --- Admin Page Imports ---
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage";
import AdminChatPage from "./Page/Admin/AdminChatPage";

// --- Layout Imports ---
import AdminLayout from "./Layout/AdminLayout";

// --- Helper Components ---

// Standard protected route - requires login
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        Checking authentication...
      </div>
    );
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// Admin specific protected route - requires login AND admin role
const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Verifying Admin Access...
      </div>
    );
  }
  if (!isLoggedIn) {
    console.warn("Admin Route Guard: Not logged in. Redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    console.warn(
      "Admin Route Guard: Access Denied - User is not an admin. Redirecting."
    );
    return <Navigate to="/profile" replace />;
  }
  return children; // Render the child (which will be AdminLayout)
};

// --- Main App Component ---
function App() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const handleLogout = useCallback(() => {
    console.log("Logging out...");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("No auth token found.");
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null);
      setLoadingAuth(false);
      return;
    }
    console.log("Auth token found, validating...");
    setLoadingAuth(true);
    axios
      .post(
        "/api/auth/validate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        if (response.data?.success && response.data?.user) {
          console.log("Token validation successful:", response.data.user);
          setIsLoggedIn(true);
          const isAdminUser = response.data.user.role === "admin";
          setIsAdmin(isAdminUser);
          setCurrentUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } else {
          console.warn(
            "Token validation failed (API success false or no user data)."
          );
          handleLogout();
        }
      })
      .catch((error) => {
        if (error.response) {
          console.error(
            `Token validation failed: Server responded with status ${error.response.status}`,
            error.response.data
          );
        } else if (error.request) {
          console.error(
            "Token validation failed: No response received from server.",
            error.request
          );
        } else {
          console.error(
            "Token validation failed: Error setting up request.",
            error.message
          );
        }
        handleLogout();
      })
      .finally(() => {
        console.log("Auth validation complete.");
        setLoadingAuth(false);
      });
  }, [handleLogout]);

  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold bg-gray-100">
        Loading Application...
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        currentUser={currentUser}
        handleLogout={handleLogout}
        setIsLoggedIn={setIsLoggedIn}
        setIsAdmin={setIsAdmin}
        setCurrentUser={setCurrentUser} // Pass down setter if Login needs to update App state directly
      />
    </Router>
  );
}

// --- AppRoutes Component (Handles Routing and Conditional Navbar) ---
const AppRoutes = ({
  isLoggedIn,
  isAdmin,
  currentUser,
  handleLogout,
  setIsLoggedIn,
  setIsAdmin,
  setCurrentUser, // Receive setter if needed by children like LoginPage
}) => {
  const location = useLocation();
  const showNavbar = !location.pathname.toLowerCase().startsWith("/admin");

  return (
    <>
      {showNavbar && (
        <Navbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      <main className={showNavbar ? "pt-16 md:pt-20" : ""}>
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
          <Route path="/signup/academic" element={<AcademicSignupForm />} />
          <Route path="/signup/corporate" element={<CorporateSignupForm />} />
          <Route path="/signup/medical" element={<MedicalSignupForm />} />
          <Route
            path="/signup/not-researcher"
            element={<NotResearcherSignupForm />}
          />
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to={isAdmin ? "/admin" : "/profile"} replace />
              ) : (
                <LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  setCurrentUser={setCurrentUser}
                />
              )
            }
          />

          {/* --- Protected User Routes (Require Login) --- */}
          <Route
            path="/profile" // Profile page WITH the form
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <Profile currentUser={currentUser} />
              </ProtectedRoute>
            }
          >
            {/* Keep nested routes if Profile component renders an <Outlet /> */}
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<ProfileAccount />} />
            <Route path="about" element={<ProfileAbout />} />
            <Route path="education" element={<ProfileEducation />} />
            <Route path="skills" element={<ProfileSkills />} />
            <Route path="research" element={<ProfileResearch />} />
          </Route>

          {/* --- Route for displaying user's publications --- */}
          <Route
            path="/publications" // *** CORRECTED PATH (or use /my-publications if preferred) ***
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                {/* *** CORRECTED COMPONENT NAME *** */}
                <Publication currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          {/* --------------------------------------------------- */}

          <Route
            path="/my-projects" // Assuming this is separate
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <MyProjects currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages" // Assuming this is separate
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <Messages currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* --- Protected Admin Routes (Require Login + Admin Role) --- */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="pending-users" element={<AdminPendingUsersPage />} />
            <Route path="chat" element={<AdminChatPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route
              path="*"
              element={
                /* ... Admin Not Found ... */
                <div className="p-6 text-center bg-yellow-100 border border-yellow-300 rounded">
                  <h2 className="text-xl font-semibold text-yellow-800">
                    Admin Page Not Found
                  </h2>
                  <p className="text-yellow-700 mt-2">
                    The specific admin page you requested does not exist.
                  </p>
                  <Link
                    to="/admin"
                    className="text-blue-600 hover:underline mt-4 inline-block"
                  >
                    Go to Admin Dashboard
                  </Link>
                </div>
              }
            />
          </Route>

          {/* --- Catch-all / Not Found (Must be the last route) --- */}
          <Route
            path="*"
            element={
              /* ... General 404 ... */
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-10">
                <h1 className="text-4xl font-bold text-gray-700 mb-4">
                  404 - Page Not Found
                </h1>
                <p className="text-lg text-gray-500 mb-6">
                  Sorry, the page you are looking for could not be found.
                </p>
                <Link
                  to="/"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Go to Homepage
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </>
  );
};

export default App;
