// src/App.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react"; // Added useMemo
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import "./index.css";

// --- CONTEXT PROVIDER IMPORT ---
// Assuming NotificationProvider defines addNewNotification with useCallback as recommended
import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext"; // Adjust path

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
import LoadingSpinner from "./Component/Common/LoadingSpinner"; // Import LoadingSpinner

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

// --- Centralized Auth Hook ---
const useAuth = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    console.log("useAuth initial read user (raw):", storedUser);
    try {
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      console.log("useAuth initial read user (parsed):", parsed);
      return parsed;
    } catch (e) {
      console.error("useAuth failed to parse user from localStorage:", e);
      localStorage.removeItem("user");
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("authToken");
    console.log("useAuth initial read token:", storedToken);
    return storedToken;
  });

  const login = useCallback((userData, authToken) => {
    try {
      if (!userData || !authToken) {
        console.error("useAuth login: Invalid userData or authToken provided.");
        return;
      }
      const userString = JSON.stringify(userData);
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("user", userString);
      setToken(authToken);
      setUser(userData);
      console.log(
        "useAuth: login successful, state and localStorage updated.",
        { user: userData, token: authToken }
      );
      window.dispatchEvent(new Event("authChange"));
    } catch (error) {
      console.error("Error saving auth data during login:", error);
    }
  }, []);

  const logout = useCallback(() => {
    console.log("useAuth: logging out.");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    console.log("useAuth: state and localStorage cleared.");
    window.dispatchEvent(new Event("authChange"));
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      console.log("SyncAuth event triggered (storage or authChange)");
      const currentToken = localStorage.getItem("authToken");
      const currentUserJson = localStorage.getItem("user");
      let currentUser = null;
      try {
        currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
      } catch (e) {
        console.error("syncAuth: Error parsing user data from storage", e);
        localStorage.removeItem("user");
      }
      setToken((prevToken) =>
        prevToken !== currentToken ? currentToken : prevToken
      );
      setUser((prevUser) =>
        JSON.stringify(prevUser) !== JSON.stringify(currentUser)
          ? currentUser
          : prevUser
      );
      console.log("Auth state synced from external change:", {
        user: currentUser,
        token: currentToken,
      });
    };
    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChange", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, []);

  return { user, token, login, logout };
};

// --- Helper Components ---
const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center h-screen text-lg font-medium text-gray-700 bg-gray-100">
    <LoadingSpinner size="lg" />
    <p className="mt-4">{message}</p>
  </div>
);

const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  if (isLoggedIn === null) {
    return <LoadingScreen message="Verifying session..." />;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null) {
    return <LoadingScreen message="Verifying access level..." />;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    console.warn(
      "Non-admin user attempted to access admin route. Redirecting home."
    );
    return <Navigate to="/" replace />;
  }
  return children;
};

// --- Socket Manager Component (FIXED) ---
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification } = useNotifications(); // Get from context
  const [socket, setSocket] = useState(null); // Local state for the socket instance

  // ** CORRECTED useEffect Hook **
  useEffect(() => {
    // 1. Handle case where there's no token (logout or initial state)
    if (!token) {
      if (socket) {
        // If a socket instance exists, disconnect it
        console.log(
          "SocketManager Effect: Token removed or invalid, disconnecting existing socket."
        );
        socket.disconnect();
        setSocket(null); // Clear the socket state
      }
      return; // Stop the effect here if no token
    }

    // 2. Handle case where token exists, but we aren't connected yet
    if (token && !socket) {
      console.log(
        "SocketManager Effect: Token found, attempting connection..."
      );
      const newSocket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"], // Prefer WebSocket
      });

      // Setup listeners on the new socket instance
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        setSocket(newSocket); // <-- Set the state ONLY on successful connection
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        // Important: Update state if the server or network causes disconnection
        setSocket(null);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message, err.data);
        // Clear socket state on connection error
        setSocket(null);
      });

      // --- Your Custom Event Listeners ---
      newSocket.on("new_collaboration_request", (data) => {
        console.log("SocketManager: Received new_collaboration_request:", data);
        // Check if addNewNotification is a function before calling
        if (data && typeof addNewNotification === "function") {
          addNewNotification(data);
        }
      });
      newSocket.on("request_response", (data) => {
        console.log("SocketManager: Received request_response:", data);
        if (data && typeof addNewNotification === "function") {
          addNewNotification(data);
        }
      });
      // Add other listeners here...

      // 3. Return the cleanup function for this effect run
      return () => {
        console.log(
          "SocketManager Cleanup: Disconnecting socket instance",
          newSocket.id
        );
        newSocket.disconnect();
      };
    }

    // 4. Dependencies: Re-run ONLY if token, API endpoint, or notification handler changes.
    // DO NOT include 'socket' state variable here.
  }, [token, API_BASE, addNewNotification]); // <--- CORRECTED Dependency Array

  return null; // This component doesn't render anything visible
};

// --- Main App Component ---
function App() {
  const { user: currentUser, token, login, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [popupNotification, setPopupNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const [researchData, setResearchData] = useState([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const showPopupNotification = useCallback((message, type = "info") => {
    setPopupNotification({ message, type, show: true });
    setTimeout(
      () => setPopupNotification((prev) => ({ ...prev, show: false })),
      5000
    );
  }, []);

  useEffect(() => {
    console.log("Auth Derivation Effect: Running...");
    console.log("Auth Derivation Effect: Current token =", token);
    console.log("Auth Derivation Effect: Current user =", currentUser);

    const userIsLoggedIn = !!token && !!currentUser?.id;
    const userIsAdmin = userIsLoggedIn && currentUser?.role === "admin";

    setIsLoggedIn(userIsLoggedIn);
    setIsAdmin(userIsAdmin);
    setLoadingAuth(false);

    console.log(
      `Auth State Derived: LoggedIn=${userIsLoggedIn}, Admin=${userIsAdmin}`
    );
  }, [token, currentUser]);

  const handleLogout = logout; // Use logout function from useAuth

  const handleAddResearch = (newResearch) => {
    /* ... */
  };
  const handleUpdateResearch = (updatedResearch) => {
    /* ... */
  };
  const handleDeleteResearch = (id) => {
    /* ... */
  };

  if (loadingAuth) {
    return <LoadingScreen message="Initializing application..." />;
  }

  return (
    <NotificationProvider>
      {" "}
      {/* Ensure SocketManager is INSIDE the provider */}
      <Router>
        <NormalizeURL />

        {/* Conditionally render SocketManager: It needs token and Notification context */}
        {/* Place it here so it has access to NotificationProvider's context */}
        {isLoggedIn && <SocketManager token={token} API_BASE={API_BASE} />}

        <ConditionalNavbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <div className="pt-16 md:pt-20 bg-gray-100 min-h-screen">
          <AnimatePresence>
            {popupNotification.show && (
              <motion.div
                initial={{ opacity: 0, y: -40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed top-20 md:top-24 right-5 z-[200] w-full max-w-md pointer-events-none"
              >
                <Notification
                  message={popupNotification.message}
                  type={popupNotification.type}
                  onClose={() =>
                    setPopupNotification((prev) => ({ ...prev, show: false }))
                  }
                  className="pointer-events-auto shadow-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- Application Routes --- */}
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
                  <LoginPage login={login} /> // Pass the login function
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
              />
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
            </Route>

            {/* Protected Admin Routes */}
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

            {/* 404 Not Found - Redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider> /* Close NotificationProvider */
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
