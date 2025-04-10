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
import "./index.css";

// --- Page Imports ---
import Home from "./Page/Home";
import ExplorePage from "./Page/ExplorePage";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile"; // Handles own and other profiles
import Publication from "./Page/Publication";
import EditPublicationPage from "./Page/EditPublicationPage";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";
import PostPublicationPage from "./Page/PostPublicationPage";

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
import UserLayout from "./Layout/UserLayout";

// --- Helper Components ---
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium">
        Checking authentication...
      </div>
    );
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }
  return children;
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

  useEffect(() => {
    // --- Authentication Logic ---
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    let initialUser = null;
    if (storedUser) {
      try {
        initialUser = JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
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
          setIsLoggedIn(true);
          const isAdminUser = response.data.user.role === "admin";
          setIsAdmin(isAdminUser);
          setCurrentUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } else {
          console.warn("Token validation failed.");
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
      {/* Main content area - UserLayout now applies padding */}
      <div className={showNavbar ? "pt-16 md:pt-20" : ""}>
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          <Route
            path="/explore"
            element={<ExplorePage currentUser={currentUser} />}
          />

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

          {/* --- Protected User Routes (Wrapped in UserLayout) --- */}
          <Route
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <UserLayout
                  isLoggedIn={isLoggedIn}
                  handleLogout={handleLogout}
                />
              </ProtectedRoute>
            }
          >
            {/* UPDATED Profile Route: Handles optional :userId param */}
            <Route
              path="/profile/:userId?" // Optional userId
              element={<Profile currentUser={currentUser} />} // Pass logged-in user info
            />
            {/* Other User Routes */}
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
          </Route>

          {/* --- Protected Admin Routes (Wrapped in AdminLayout) --- */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
                <AdminLayout />
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
                  <h2 className="text-xl font-semibold mb-4 text-red-600">
                    Admin Page Not Found
                  </h2>
                  <p className="text-gray-700 mb-4">
                    The requested admin page does not exist.
                  </p>
                  <Link
                    to="/admin/dashboard"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Go to Admin Dashboard
                  </Link>
                </div>
              }
            />
          </Route>

          {/* --- General Catch-all / 404 --- */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center p-10">
                <h1 className="text-4xl font-bold text-gray-700 mb-4">
                  404 - Page Not Found
                </h1>
                <p className="text-lg text-gray-500 mb-6">
                  Sorry, the page you requested could not be found.
                </p>
                <Link
                  to="/"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Go to Homepage
                </Link>
              </div>
            }
          />
        </Routes>
      </div>{" "}
      {/* End main content wrapper */}
    </>
  );
};

export default App;
