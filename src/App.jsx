// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
  Outlet,
} from "react-router-dom";
import axios from "axios";
import "./index.css"; // Ensure your global styles are imported

// --- Page Imports ---
import Home from "./Page/Home";
import ExplorePage from "./Page/ExplorePage";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile"; // Handles own and other profiles + its own layout
import Publication from "./Page/Publication";
import EditPublicationPage from "./Page/EditPublicationPage";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";
import PostPublicationPage from "./Page/PostPublicationPage";
import AccountSettingsPage from "./Page/Settings/AccountSettingsPage"; // Assuming path is correct
import UserActivityPage from "./Component/Profile/UserActivityPage"; // Assuming path is correct
import CreateProjectPage from "./Page/CreateProjectPage"; // <-- IMPORTED

// --- Component Imports ---
import AcademicSignupForm from "./Component/AcademicSignupForm";
import CorporateSignupForm from "./Component/CorporateSignupForm";
import MedicalSignupForm from "./Component/MedicalSignupForm";
import NotResearcherSignupForm from "./Component/NotResearcherSignupForm";
import Navbar from "./Component/Navbar";

// --- Admin Page Imports ---
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage";
import AdminChatPage from "./Page/Admin/AdminChatPage";
import AdminPublicationManagementPage from "./Page/Admin/AdminPublicationManagementPage";

// --- Layout Imports ---
import AdminLayout from "./Layout/AdminLayout";
import UserLayout from "./Layout/UserLayout"; // Standard layout for non-profile pages

// --- Helper Components ---
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  if (isLoggedIn === null) {
    // Handle loading state during auth check
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium">
        Checking authentication...
      </div>
    );
  }
  if (!isLoggedIn) {
    // Redirect if not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children; // Render protected content
};

const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null) {
    // Handle loading state
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Verifying Admin Access...
      </div>
    );
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } // Redirect if not logged in
  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  } // Redirect non-admins
  return children; // Render protected admin content
};

// --- Main App Component ---
function App() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
  }, []);

  // --- Authentication Check Effect ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    let initialUser = null;
    if (storedUser) {
      try {
        initialUser = JSON.parse(storedUser);
      } catch (e) {
        console.error("Parse user error:", e);
        localStorage.removeItem("user");
      }
    }
    if (!token) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null);
      setLoadingAuth(false);
      if (localStorage.getItem("user")) localStorage.removeItem("user");
      return;
    }
    setCurrentUser(initialUser);
    setIsLoggedIn(true);
    setIsAdmin(initialUser?.role === "admin");
    setLoadingAuth(true);
    axios
      .post(
        `${API_BASE}/api/auth/validate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        if (response.data?.success && response.data?.user) {
          const fetchedUser = response.data.user;
          setIsLoggedIn(true);
          setIsAdmin(fetchedUser.role === "admin");
          setCurrentUser(fetchedUser);
          localStorage.setItem("user", JSON.stringify(fetchedUser));
        } else {
          handleLogout();
        }
      })
      .catch((error) => {
        console.error("Token validation error:", error);
        handleLogout();
      })
      .finally(() => {
        setLoadingAuth(false);
      });
  }, [handleLogout, API_BASE]);

  // Loading Screen
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold bg-gray-100">
        {" "}
        Loading Application...{" "}
      </div>
    );
  }

  // Render Router
  return (
    <Router>
      <AppRoutes
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        currentUser={currentUser}
        handleLogout={handleLogout}
        setIsLoggedIn={setIsLoggedIn}
        setIsAdmin={setIsAdmin}
        setCurrentUser={setCurrentUser}
      />
    </Router>
  );
}

// --- AppRoutes Component (Handles Navbar and Routing Structure) ---
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
      {/* Let layout components handle their own padding */}
      <div className={showNavbar ? "navbar-padding-active" : ""}>
        {" "}
        {/* Optional class */}
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          {/* Auth routes */}
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

          {/* --- Protected User Routes (Standard Layout) --- */}
          <Route
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                {/* Pass currentUser needed by Sidebar inside UserLayout */}
                <UserLayout
                  isLoggedIn={isLoggedIn}
                  handleLogout={handleLogout}
                  currentUser={currentUser}
                />
              </ProtectedRoute>
            }
          >
            {/* Routes using standard Left Sidebar + Content */}
            <Route
              path="/explore"
              element={<ExplorePage currentUser={currentUser} />}
            />
            <Route
              path="/publications"
              element={<Publication currentUser={currentUser} />}
            />
            <Route
              path="/publications/new"
              element={<PostPublicationPage currentUser={currentUser} />}
            />
            <Route
              path="/publications/edit/:id"
              element={<EditPublicationPage />}
            />
            <Route
              path="/my-projects"
              element={<MyProjects currentUser={currentUser} />}
            />
            <Route
              path="/messages"
              element={<Messages currentUser={currentUser} />}
            />
            <Route
              path="/settings/account"
              element={<AccountSettingsPage currentUser={currentUser} />}
            />
            <Route
              path="/profile/activity"
              element={<UserActivityPage currentUser={currentUser} />}
            />
            {/* === ADDED Create Project Route === */}
            <Route
              path="/projects/new"
              element={<CreateProjectPage currentUser={currentUser} />}
            />
            {/* ================================= */}
          </Route>

          {/* --- Protected Profile Route (Special Layout handled inside Profile.jsx) --- */}
          <Route
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                {" "}
                <Outlet />{" "}
              </ProtectedRoute>
            }
          >
            <Route
              path="/profile/:userId?" // Matches /profile and /profile/123
              // Pass all necessary props for Profile page's own layout (including Sidebar props)
              element={
                <Profile
                  currentUser={currentUser}
                  isLoggedIn={isLoggedIn}
                  handleLogout={handleLogout}
                />
              }
            />
          </Route>

          {/* --- Protected Admin Routes --- */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
                {" "}
                <AdminLayout />{" "}
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="pending-users" element={<AdminPendingUsersPage />} />
            <Route
              path="publications"
              element={<AdminPublicationManagementPage />}
            />
            <Route path="chat" element={<AdminChatPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route
              path="*"
              element={
                <div className="p-6 bg-white rounded shadow">
                  Admin Page Not Found...
                </div>
              }
            />
          </Route>

          {/* --- General Catch-all / 404 --- */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-10">
                {" "}
                <h1 className="text-4xl font-bold text-gray-700 mb-4">
                  404 - Page Not Found
                </h1>{" "}
                <p className="text-lg text-gray-500 mb-6">
                  Sorry, the page could not be found.
                </p>{" "}
                <Link
                  to="/"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Go Homepage
                </Link>{" "}
              </div>
            }
          />
        </Routes>
      </div>
    </>
  );
};

export default App;
