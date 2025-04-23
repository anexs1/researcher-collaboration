/// src/App.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import "./index.css"; // Ensure your main CSS is imported

// --- Layout Imports ---
import AdminLayout from "./Layout/AdminLayout";
import UserLayout from "./Layout/UserLayout";

// --- Component Imports ---
import Navbar from "./Component/Navbar";
import NormalizeURL from "./Component/NormalizeURL";
import AcademicSignupForm from "./Component/AcademicSignupForm";
import CorporateSignupForm from "./Component/CorporateSignupForm";
import MedicalSignupForm from "./Component/MedicalSignupForm";
import NotResearcherSignupForm from "./Component/NotResearcherSignupForm";
import UserActivityPage from "./Component/Profile/UserActivityPage";

// --- Page Imports (User Facing) ---
import Home from "./Page/Home";
import ExplorePage from "./Page/ExplorePage";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import EditPublicationPage from "./Page/EditPublicationPage";
import Projects from "./Page/Projects"; // Main projects list page
import CreateProjectPage from "./Page/CreateProjectPage"; // **** Import the Create Project page ****
import EditProjectPage from "./Page/EditProjectPage"; // Project edit page
import Messages from "./Page/Messages";
import PostPublicationPage from "./Page/PostPublicationPage";
import AccountSettingsPage from "./Page/Settings/AccountSettingsPage";
import ResearchDetails from "./Page/ResearchDetails";
import ResearchForm from "./Page/ResearchForm";

// --- Page Imports (Admin Facing) ---
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage";
import AdminChatPage from "./Page/Admin/AdminChatPage";
import AdminPublicationManagementPage from "./Page/Admin/AdminPublicationManagementPage";

// --- Helper Components ---

// Simple Loading Screen
const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex justify-center items-center h-screen text-lg font-medium text-gray-700">
    {message}
  </div>
);

// Protected Route for Regular Logged-in Users (WITH DEBUG LOGGING)
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  console.log(
    `DEBUG: ProtectedRoute Check for path "${location.pathname}": isLoggedIn is [${isLoggedIn}]`
  );
  if (isLoggedIn === null) {
    console.log(
      `DEBUG: ProtectedRoute for path "${location.pathname}": Rendering LoadingScreen because isLoggedIn is null.`
    );
    return <LoadingScreen message="Verifying session..." />;
  }
  if (!isLoggedIn) {
    console.log(
      `DEBUG: ProtectedRoute for path "${location.pathname}": Redirecting to /login because isLoggedIn is [${isLoggedIn}].`
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  console.log(
    `DEBUG: ProtectedRoute for path "${location.pathname}": Allowing access because isLoggedIn is [${isLoggedIn}]. Rendering children.`
  );
  return children;
};

// Protected Route for Admin Users
const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null)
    return <LoadingScreen message="Verifying access level..." />;
  if (!isLoggedIn)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) {
    console.warn("Non-admin access attempt to:", location.pathname);
    return <Navigate to="/profile" replace />;
  }
  return children;
};

// --- Main App Component ---
function App() {
  // Authentication State
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Other App State
  const [researchData, setResearchData] = useState([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Optional: Load research data
  useEffect(() => {
    try {
      /* ... load research data ... */
    } catch (error) {
      /* ... */
    }
  }, []);

  // Logout Handler
  const handleLogout = useCallback(() => {
    console.log(
      "Executing handleLogout: Clearing auth state and localStorage."
    );
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
  }, []);

  // Auth Validation Effect
  useEffect(() => {
    console.log("Auth Validation Effect running...");
    const token = localStorage.getItem("authToken");
    const storedUserJson = localStorage.getItem("user");
    let initialUser = null;
    if (storedUserJson) {
      try {
        initialUser = JSON.parse(storedUserJson);
      } catch (e) {
        console.error("Auth Effect: Failed to parse stored user, clearing:", e);
        localStorage.removeItem("user");
      }
    }

    if (!token) {
      console.log("Auth Effect: No token found. Setting logged out state.");
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null);
      setLoadingAuth(false);
      return;
    }

    console.log("Auth Effect: Token found. Initiating validation...");
    setLoadingAuth(true);
    setCurrentUser(initialUser);
    setIsLoggedIn(true);
    setIsAdmin(initialUser?.role === "admin"); // Optimistic set

    axios
      .post(
        `${API_BASE}/api/auth/validate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log(
          "Auth Effect: Validation API call successful. Response data:",
          response.data
        );
        if (response.data?.success && response.data?.user) {
          const fetchedUser = response.data.user;
          console.log(
            "Auth Effect: Token validation PASSED for user:",
            fetchedUser.id
          );
          setIsLoggedIn(true);
          setIsAdmin(fetchedUser.role === "admin");
          setCurrentUser(fetchedUser);
          localStorage.setItem("user", JSON.stringify(fetchedUser));
        } else {
          console.warn(
            "Auth Effect: Token validation FAILED (in .then):",
            response.data?.message || "Response invalid. Logging out."
          );
          handleLogout();
        }
      })
      .catch((error) => {
        console.error(
          "Auth Effect: Token validation API call FAILED (in .catch):",
          error.response?.data || error.message
        );
        handleLogout();
      })
      .finally(() => {
        setLoadingAuth(false);
        console.log("Auth Effect: Validation process finished.");
      });
  }, [handleLogout, API_BASE]);

  // --- Other State Handlers ---
  const handleAddResearch = (newResearch) => {
    /* ... */
  };
  const handleUpdateResearch = (updatedResearch) => {
    /* ... */
  };
  const handleDeleteResearch = (id) => {
    /* ... */
  };

  // --- Render Logic ---
  console.log("DEBUG: App Component Render State:", {
    isLoggedIn,
    isAdmin,
    loadingAuth,
    currentUserExists: !!currentUser,
  });
  if (loadingAuth) {
    return <LoadingScreen message="Initializing Application..." />;
  }

  return (
    <Router>
      <NormalizeURL />
      <ConditionalNavbar
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="pt-16 md:pt-20">
        <Routes>
          {/* --- Public Routes --- */}
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

          {/* --- Auth Routes --- */}
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

          {/* --- Protected User Routes --- */}
          <Route
            element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                {" "}
                <UserLayout
                  isLoggedIn={isLoggedIn}
                  handleLogout={handleLogout}
                  currentUser={currentUser}
                />{" "}
              </ProtectedRoute>
            }
          >
            {/* Standard User Pages */}
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

            {/* Project Related Routes */}
            <Route path="/projects">
              {" "}
              {/* Parent route */}
              <Route
                index
                element={<Projects currentUser={currentUser} />}
              />{" "}
              {/* List projects at /projects */}
              {/* **** ADDED ROUTE FOR CREATE PROJECT **** */}
              <Route path="new" element={<CreateProjectPage />} />{" "}
              {/* Create form at /projects/new */}
              <Route
                path="edit/:projectId"
                element={<EditProjectPage currentUser={currentUser} />}
              />{" "}
              {/* Edit form at /projects/edit/:id */}
              {/* Optional: Route for viewing a single project detail page */}
              {/* <Route path=":projectId" element={<ProjectDetailPage />} /> */}
            </Route>

            {/* Research Related Routes */}
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

          {/* --- Protected Admin Routes --- */}
          <Route
            element={
              <AdminProtectedRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
                {" "}
                <AdminLayout />{" "}
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

          {/* --- 404 Not Found --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// --- Conditional Navbar Rendering Component ---
const ConditionalNavbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (isAdminRoute) return null;
  return (
    <Navbar
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
};

export default App;
