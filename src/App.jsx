// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import "./index.css";

// URL normalization
import NormalizeURL from "./Component/NormalizeURL";

// Page Imports
import Home from "./Page/Home";
import ExplorePage from "./Page/ExplorePage";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import EditPublicationPage from "./Page/EditPublicationPage";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";
import PostPublicationPage from "./Page/PostPublicationPage";
import AccountSettingsPage from "./Page/Settings/AccountSettingsPage";
import EditProjectPage from "./Page/EditProjectPage";
import ResearchDetails from "./Page/ResearchDetails";
import ResearchForm from "./Page/ResearchForm";

// Component Imports
import Navbar from "./Component/Navbar";
import AcademicSignupForm from "./Component/AcademicSignupForm";
import CorporateSignupForm from "./Component/CorporateSignupForm";
import MedicalSignupForm from "./Component/MedicalSignupForm";
import NotResearcherSignupForm from "./Component/NotResearcherSignupForm";
import UserActivityPage from "./Component/Profile/UserActivityPage";

// Admin Page Imports
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage";
import AdminChatPage from "./Page/Admin/AdminChatPage";
import AdminPublicationManagementPage from "./Page/Admin/AdminPublicationManagementPage";

// Layout Imports
import AdminLayout from "./Layout/AdminLayout";
import UserLayout from "./Layout/UserLayout";

// Helper Components
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();

  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return isLoggedIn ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();

  if (isLoggedIn === null || isAdmin === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        Verifying access...
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

function App() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [researchData, setResearchData] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const savedResearch =
      JSON.parse(localStorage.getItem("researchData")) || [];
    setResearchData(savedResearch);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
  }, []);

  useEffect(() => {
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
        console.error(
          "Token validation error:",
          error.response?.data || error.message
        );
        handleLogout();
      })
      .finally(() => {
        setLoadingAuth(false);
      });
  }, [handleLogout, API_BASE]);

  const handleAddResearch = (newResearch) => {
    const updatedResearch = [...researchData, newResearch];
    setResearchData(updatedResearch);
    localStorage.setItem("researchData", JSON.stringify(updatedResearch));
  };

  const handleUpdateResearch = (updatedResearch) => {
    const updatedData = researchData.map((item) =>
      item.id === updatedResearch.id ? updatedResearch : item
    );
    setResearchData(updatedData);
    localStorage.setItem("researchData", JSON.stringify(updatedData));
  };

  const handleDeleteResearch = (id) => {
    const updatedData = researchData.filter((item) => item.id !== id);
    setResearchData(updatedData);
    localStorage.setItem("researchData", JSON.stringify(updatedData));
  };

  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium text-gray-700">
        Loading Application...
      </div>
    );
  }

  return (
    <Router>
      <NormalizeURL />
      <ConditionalNavbar
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className={`pt-16 md:pt-20`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route
            path="/explore"
            element={
              <ExplorePage
                researchData={researchData}
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
              />
            }
          />
          <Route path="/publications" element={<Publication />} />
          <Route
            path="/research/:id"
            element={
              <ResearchDetails
                researchData={researchData}
                currentUser={currentUser}
                isLoggedIn={isLoggedIn}
              />
            }
          />

          {/* Auth Routes */}
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

          {/* Protected User Routes */}
          <Route
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <UserLayout
                  isLoggedIn={isLoggedIn}
                  handleLogout={handleLogout}
                  currentUser={currentUser}
                />
              </ProtectedRoute>
            }
          >
            <Route
              path="/profile"
              element={<Profile currentUser={currentUser} />}
            />
            <Route
              path="/profile/activity"
              element={<UserActivityPage currentUser={currentUser} />}
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
              path="/messages"
              element={<Messages currentUser={currentUser} />}
            />
            <Route
              path="/settings/account"
              element={<AccountSettingsPage currentUser={currentUser} />}
            />

            {/* Updated Project Routes */}
            <Route path="/projects">
              <Route index element={<MyProjects currentUser={currentUser} />} />

              <Route
                path="edit/:projectId"
                element={<EditProjectPage currentUser={currentUser} />}
              />
            </Route>

            {/* Research Routes */}
            <Route
              path="/research/create"
              element={
                <ResearchForm
                  onAddResearch={handleAddResearch}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/research/edit/:id"
              element={
                <ResearchForm
                  researchData={researchData}
                  onUpdateResearch={handleUpdateResearch}
                  currentUser={currentUser}
                />
              }
            />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <AdminProtectedRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route
              path="/admin/pending-users"
              element={<AdminPendingUsersPage />}
            />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/chat" element={<AdminChatPage />} />
            <Route
              path="/admin/publications"
              element={<AdminPublicationManagementPage />}
            />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>

          {/* 404 Not Found Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

const ConditionalNavbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return null;
  }

  return (
    <Navbar
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
};

export default App;
