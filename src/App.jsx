// src/App.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios"; // Keep axios if used elsewhere, not directly needed for auth check here
import { io } from "socket.io-client"; // Import socket client
import { motion, AnimatePresence } from "framer-motion"; // For notification animation
import "./index.css"; // Ensure your main CSS is imported

// --- Layout Imports ---
import AdminLayout from "./Layout/AdminLayout"; // Adjust path
import UserLayout from "./Layout/UserLayout"; // Adjust path

// --- Component Imports ---
import Navbar from "./Component/Navbar"; // Adjust path
import NormalizeURL from "./Component/NormalizeURL"; // Adjust path
import AcademicSignupForm from "./Component/AcademicSignupForm"; // Adjust path
import CorporateSignupForm from "./Component/CorporateSignupForm"; // Adjust path
import MedicalSignupForm from "./Component/MedicalSignupForm"; // Adjust path
import NotResearcherSignupForm from "./Component/NotResearcherSignupForm"; // Adjust path
import UserActivityPage from "./Component/Profile/UserActivityPage"; // Adjust path
import Notification from "./Component/Common/Notification"; // Adjust path

// --- Page Imports (User Facing) ---
import Home from "./Page/Home"; // Adjust path
import ExplorePage from "./Page/ExplorePage"; // Adjust path
import SignupPage from "./Page/SignupPage"; // Adjust path
import LoginPage from "./Page/LoginPage"; // Adjust path
import Profile from "./Page/Profile"; // Adjust path
import Publication from "./Page/Publication"; // Adjust path
import EditPublicationPage from "./Page/EditPublicationPage"; // Adjust path
import Projects from "./Page/Projects"; // Adjust path
import CreateProjectPage from "./Page/CreateProjectPage"; // Adjust path
import EditProjectPage from "./Page/EditProjectPage"; // Adjust path
import Messages from "./Page/Messages"; // Adjust path
import PostPublicationPage from "./Page/PostPublicationPage"; // Adjust path
import AccountSettingsPage from "./Page/Settings/AccountSettingsPage"; // Adjust path
import ResearchDetails from "./Page/ResearchDetails"; // Adjust path
import ResearchForm from "./Page/ResearchForm"; // Adjust path

// --- Page Imports (Admin Facing) ---
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage"; // Adjust path
import AdminUsersPage from "./Page/Admin/AdminUsersPage"; // Adjust path
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage"; // Adjust path
import AdminReportsPage from "./Page/Admin/AdminReportsPage"; // Adjust path
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage"; // Adjust path
import AdminChatPage from "./Page/Admin/AdminChatPage"; // Adjust path
import AdminPublicationManagementPage from "./Page/Admin/AdminPublicationManagementPage"; // Adjust path

// --- Auth Hook (Example - Replace with your actual implementation) ---
// You MUST have a way to get the current user and token
const useAuth = () => {
  // Replace this with your actual auth context or state management logic
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));

  // Example: Listen for custom event dispatched by LoginPage/Logout
  useEffect(() => {
    const handleAuthChange = () => {
      console.log("Auth state change detected, updating hook state.");
      setToken(localStorage.getItem("authToken"));
      const storedUser = localStorage.getItem("user");
      try {
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch (e) {
        localStorage.removeItem("user");
        setUser(null);
      }
    };
    // You might use a more robust method like Context API dispatch
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  return { user, token, setUser, setToken };
};

// --- Helper Components ---

const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex justify-center items-center h-screen text-lg font-medium text-gray-700">
    {/* Consider adding a visual spinner */}
    {message}
  </div>
);

// Protected Route for Regular Users
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  if (isLoggedIn === null)
    return <LoadingScreen message="Verifying session..." />;
  if (!isLoggedIn)
    return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

// Protected Route for Admin Users
const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null)
    return <LoadingScreen message="Verifying access level..." />;
  if (!isLoggedIn)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />; // Redirect non-admins to home perhaps
  return children;
};

// --- Main App Component ---
function App() {
  // Authentication State from Hook
  const {
    user: currentUser,
    token,
    setUser: setCurrentUserInternal,
    setToken: setAuthTokenInternal,
  } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null); // Derived state based on currentUser
  const [isLoggedIn, setIsLoggedIn] = useState(null); // Derived state based on token/currentUser
  const [loadingAuth, setLoadingAuth] = useState(true); // Initial auth check loading

  // Socket.IO State
  const [socket, setSocket] = useState(null);
  const [appNotification, setAppNotification] = useState({
    message: "",
    type: "",
    show: false,
    data: null,
  });

  // Other App State (Example)
  const [researchData, setResearchData] = useState([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // --- Notification Handler ---
  const showAppNotification = useCallback(
    (message, type = "info", data = null) => {
      // Optional: Prevent duplicate notifications in quick succession
      // if (appNotification.show && appNotification.message === message) return;
      setAppNotification({ message, type, show: true, data });
      setTimeout(
        () => setAppNotification((prev) => ({ ...prev, show: false })),
        7000
      );
    },
    []
  ); // Empty dependency array - this function doesn't depend on changing state

  // --- Socket Connection Effect ---
  useEffect(() => {
    let newSocket = null;
    if (token && currentUser?.id && !socket) {
      // Connect only if logged in (token & user ID exist) and not already connected
      console.log(
        `Socket Effect: User ${currentUser.id} logged in with token. Attempting connection...`
      );
      newSocket = io(API_BASE, {
        auth: { token }, // Send token for backend authentication
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        setSocket(newSocket);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        // Only nullify socket state if it's the one we are tracking
        setSocket((currentSocket) =>
          currentSocket?.id === newSocket?.id ? null : currentSocket
        );
        if (reason === "io server disconnect") {
          // The server explicitly disconnected the socket (e.g., invalid token during connection)
          showAppNotification(
            "Real-time connection lost. Please refresh or log in again.",
            "error"
          );
        }
        // Optional: Implement reconnection logic here if needed
      });

      newSocket.on("connect_error", (err) => {
        console.error(
          `Socket connection error for user ${currentUser.id}:`,
          err.message
        );
        // Avoid flooding notifications for connection errors
        // showAppNotification(`Cannot connect to real-time service: ${err.message}`, 'error');
      });

      // --- Listen for Server-Sent Events ---
      newSocket.on("new_collaboration_request", (data) => {
        console.log("Received new_collaboration_request:", data);
        if (data && data.message) {
          showAppNotification(data.message, "info", data);
        }
        // TODO: Update request counts or trigger refetches if needed
      });

      newSocket.on("request_response", (data) => {
        console.log("Received request_response:", data);
        if (data && data.message) {
          showAppNotification(
            data.message,
            data.status === "approved" ? "success" : "warning",
            data
          );
        }
        // TODO: Update request lists/status if needed
      });
      // Add more event listeners here...
      // ---------------------------------
    } else if (!token && socket) {
      // If token removed (logout) or currentUser lost, disconnect existing socket
      console.log(
        "Socket Effect: Token or User removed, disconnecting active socket..."
      );
      socket.disconnect();
      setSocket(null);
    }

    // Cleanup function: Disconnect socket when effect dependencies change or component unmounts
    return () => {
      if (newSocket) {
        console.log(
          "Socket Effect Cleanup: Disconnecting socket",
          newSocket.id
        );
        newSocket.disconnect();
        setSocket(null); // Ensure state is cleared on cleanup
      }
    };
    // Re-run this effect if the user's token changes (login/logout) or if the currentUser object reference changes
  }, [token, currentUser?.id, API_BASE, showAppNotification]); // Added currentUser.id

  // --- Auth State Derivation Effect ---
  useEffect(() => {
    setLoadingAuth(true);
    // Derive loggedIn and admin status directly from the auth hook state
    const userIsLoggedIn = !!token && !!currentUser?.id;
    const userIsAdmin = currentUser?.role === "admin";

    if (isLoggedIn !== userIsLoggedIn) setIsLoggedIn(userIsLoggedIn);
    if (isAdmin !== userIsAdmin) setIsAdmin(userIsAdmin);

    console.log(
      `Auth State Derived: LoggedIn=${userIsLoggedIn}, Admin=${userIsAdmin}`
    );
    setLoadingAuth(false);
  }, [token, currentUser]); // Re-derive if token or user changes

  // --- Logout Handler ---
  const handleLogout = useCallback(() => {
    console.log("Executing handleLogout...");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setAuthTokenInternal(null); // Update auth hook state -> triggers useEffect
    setCurrentUserInternal(null); // Update auth hook state -> triggers useEffect
    if (socket) {
      console.log("Disconnecting socket due to logout.");
      socket.disconnect(); // Disconnect socket explicitly on logout
    }
    // Navigation is handled by ProtectedRoute checks after state updates
  }, [socket, setAuthTokenInternal, setCurrentUserInternal]);

  // --- Other State Handlers (Placeholder) ---
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
  if (loadingAuth) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <Router>
      <NormalizeURL />
      {/* Render Navbar conditionally based on route */}
      <ConditionalNavbar
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="pt-16 md:pt-20 bg-gray-50 min-h-screen">
        {/* Global Notification Area */}
        <AnimatePresence>
          {appNotification.show && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-20 md:top-24 right-5 z-[200] w-full max-w-md" // Adjusted top position
            >
              <Notification
                message={appNotification.message}
                type={appNotification.type}
                onClose={() =>
                  setAppNotification((prev) => ({ ...prev, show: false }))
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Application Routes */}
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
                  setCurrentUser={setCurrentUserInternal}
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
            <Route
              path="/profile"
              element={<Profile currentUser={currentUser} />}
            />
            <Route
              path="/profile/:userId"
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
            <Route
              path="/projects"
              element={<Projects currentUser={currentUser} />}
            />{" "}
            {/* Render Projects at /projects */}
            <Route path="/projects/new" element={<CreateProjectPage />} />
            <Route
              path="/projects/edit/:projectId"
              element={<EditProjectPage currentUser={currentUser} />}
            />
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
            {/* Add other nested user routes here */}
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
            {/* Add other nested admin routes here */}
          </Route>

          {/* --- 404 Not Found --- */}
          {/* Consider a dedicated 404 component */}
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
  // Hide navbar on admin routes
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
