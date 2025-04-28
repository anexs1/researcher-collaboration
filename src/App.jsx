// src/App.jsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import "./index.css"; // Main CSS import

// --- CONTEXT PROVIDER IMPORT ---
import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext"; // Adjust path

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
import Notification from "./Component/Common/Notification";
import LoadingSpinner from "./Component/Common/LoadingSpinner";

// --- Page Imports (User Facing) ---
import Home from "./Page/Home";
import ExplorePage from "./Page/ExplorePage";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile";
import PublicationPage from "./Page/Publication";
import PublicationDetailPage from "./Page/PublicationDetailPage";
import EditPublicationPage from "./Page/EditPublicationPage";
import Projects from "./Page/Projects";
import CreateProjectPage from "./Page/CreateProjectPage";
import EditProjectPage from "./Page/EditProjectPage";
import Messages from "./Page/Messages"; // Page listing project chats
import ChatPage from "./Page/ChatPage"; // Page for a specific project chat
import PostPublicationPage from "./Page/PostPublicationPage";
import AccountSettingsPage from "./Page/Settings/AccountSettingsPage";
import NotFoundPage from "./Page/NotFoundPage";

// --- Page Imports (Admin Facing) ---
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage";
import AdminChatPage from "./Page/Admin/AdminChatPage";
import AdminPublicationManagementPage from "./Page/Admin/AdminPublicationManagementPage";

// --- Centralized Auth Hook ---
// Manages user authentication state and local storage synchronization
const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("useAuth: Error parsing user from localStorage", e);
      localStorage.removeItem("user");
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken")); // Ensure this key matches where you store the token

  const login = useCallback((userData, authToken) => {
    try {
      if (!userData || !authToken) {
        console.error("useAuth login: Invalid user data or token provided.");
        return;
      }
      localStorage.setItem("authToken", authToken); // Store token
      localStorage.setItem("user", JSON.stringify(userData)); // Store user object
      setToken(authToken);
      setUser(userData);
      window.dispatchEvent(new Event("authChange")); // Notify other parts of app/tabs
    } catch (error) {
      console.error("Error saving auth data to localStorage:", error);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken"); // Clear token
    localStorage.removeItem("user"); // Clear user object
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  }, []);

  // Effect to sync auth state across tabs/windows using localStorage events
  useEffect(() => {
    const syncAuth = (event) => {
      if (event && event.key && !["authToken", "user"].includes(event.key)) {
        return; // Ignore storage events for unrelated keys
      }
      const currentToken = localStorage.getItem("authToken");
      const currentUserJson = localStorage.getItem("user");
      let currentUser = null;
      try {
        currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
      } catch (e) {
        localStorage.removeItem("user"); // Clear corrupted data
      }
      setToken((prevToken) =>
        prevToken !== currentToken ? currentToken : prevToken
      );
      setUser((prevUser) =>
        JSON.stringify(prevUser) !== JSON.stringify(currentUser)
          ? currentUser
          : prevUser
      );
    };

    syncAuth(); // Initial sync on load
    window.addEventListener("storage", syncAuth); // Listen for storage changes in other tabs
    window.addEventListener("authChange", syncAuth); // Listen for explicit login/logout

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, []); // Run only once

  return { user, token, login, logout };
};

// --- Helper Components ---

// Simple loading screen component
const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center h-screen text-lg font-medium text-gray-700 bg-gray-100">
    <LoadingSpinner size="lg" />
    <p className="mt-4">{message}</p>
  </div>
);

// Component to protect routes requiring standard login
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  if (isLoggedIn === null) {
    return <LoadingScreen message="Verifying session..." />; // Show loading while auth state is resolving
  }
  if (!isLoggedIn) {
    // Redirect unauthenticated users to login, preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children; // Render children if authenticated
};

// Component to protect routes requiring admin privileges
const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null) {
    return <LoadingScreen message="Verifying access level..." />; // Show loading while auth/admin state resolves
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />; // Must be logged in
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />; // Redirect non-admins away
  }
  return children; // Render children if authenticated and admin
};

// Component to manage the global WebSocket connection
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification } = useNotifications(); // Use context for notifications
  const socketRef = useRef(null); // Ref to hold the socket instance

  useEffect(() => {
    if (!token) {
      // Disconnect if token is removed (logout)
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!socketRef.current) {
      // Connect only if not already connected
      const newSocket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 3,
      });

      socketRef.current = newSocket;

      // --- Standard Event Listeners ---
      newSocket.on("connect", () =>
        console.log("Socket connected:", newSocket.id)
      );
      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", newSocket.id, "Reason:", reason);
        // Nullify ref only if this specific socket instance disconnected
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      });
      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        // Nullify ref on connection error too
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      });

      // --- Custom Application Event Listeners ---
      // Example: Listen for notifications from the backend
      const handleNotification = (data) => {
        if (data && addNewNotification) {
          console.log("Received notification via socket:", data);
          addNewNotification(data); // Add to notification context
        }
      };
      newSocket.on("notification", handleNotification); // Assuming backend emits 'notification'

      // Example: Specific event for collaboration requests
      newSocket.on("new_collaboration_request", handleNotification); // Can reuse handler or make specific ones
      newSocket.on("request_response", handleNotification);

      // **Important**: Do NOT listen for 'newMessage' here globally.
      // The ChatPage component will handle its own 'newMessage' listeners specific to the room it's in.
      // Listening globally would cause duplicate message handling.

      // --- Cleanup Function ---
      return () => {
        console.log("SocketManager: Cleaning up socket instance", newSocket.id);
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("connect_error");
        newSocket.off("notification", handleNotification); // Remove specific listener
        newSocket.off("new_collaboration_request", handleNotification);
        newSocket.off("request_response", handleNotification);
        // ... remove any other global listeners ...

        newSocket.disconnect();
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null; // Clear ref on cleanup
        }
      };
    }
  }, [token, API_BASE, addNewNotification]); // Dependencies for the effect

  return null; // This component doesn't render any UI
};

// --- Main App Component ---
function App() {
  const { user: currentUser, token, login, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null); // Derived admin status
  const [isLoggedIn, setIsLoggedIn] = useState(null); // Derived login status
  const [loadingAuth, setLoadingAuth] = useState(true); // Tracks initial auth check
  const [popupNotification, setPopupNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Memoized function to show global popup notifications
  const showPopupNotification = useCallback((message, type = "info") => {
    setPopupNotification({ message, type, show: true });
    const timerId = setTimeout(
      () => setPopupNotification((prev) => ({ ...prev, show: false })),
      5000
    );
    // Optional: Return cleanup function if needed elsewhere: return () => clearTimeout(timerId);
  }, []);

  // Effect to update derived login/admin status when auth state changes
  useEffect(() => {
    const userIsLoggedIn = !!token && !!currentUser?.id;
    const userIsAdmin = userIsLoggedIn && currentUser?.role === "admin";
    setIsLoggedIn(userIsLoggedIn);
    setIsAdmin(userIsAdmin);
    setLoadingAuth(false); // Mark initial auth check as complete
  }, [token, currentUser]);

  const handleLogout = logout; // Use the logout function from the auth hook

  // Display loading screen while determining initial auth state
  if (loadingAuth) {
    return <LoadingScreen message="Initializing Application..." />;
  }

  return (
    // Wrap the entire app with the Notification Context Provider
    <NotificationProvider>
      <Router>
        <NormalizeURL /> {/* Optional: Component for URL cleanup */}
        {/* Render SocketManager only when logged in to establish global connection */}
        {isLoggedIn && <SocketManager token={token} API_BASE={API_BASE} />}
        {/* Render Navbar conditionally based on the current route */}
        <ConditionalNavbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        {/* Main content area with padding for fixed navbar */}
        <div className="pt-16 md:pt-20 bg-gray-100 min-h-screen">
          {" "}
          {/* Adjusted padding & background */}
          {/* Global Notification Popup Area */}
          <AnimatePresence>
            {popupNotification.show && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="fixed top-20 md:top-24 right-4 md:right-6 z-[200] w-full max-w-sm pointer-events-none" // Positioned top-right
              >
                {/* Notification component renders the actual popup */}
                <Notification
                  message={popupNotification.message}
                  type={popupNotification.type}
                  onClose={() =>
                    setPopupNotification((prev) => ({ ...prev, show: false }))
                  }
                  className="pointer-events-auto shadow-lg rounded-md" // Make notification clickable/hoverable
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* --- Application Routes Definition --- */}
          <Routes>
            {/* --- Publicly Accessible Routes --- */}
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route
              path="/publications"
              element={<PublicationPage currentUser={currentUser} />}
            />
            <Route
              path="/publications/:id"
              element={<PublicationDetailPage currentUser={currentUser} />}
            />
            {/* --- Authentication Routes --- */}
            <Route
              path="/login"
              // Redirect logged-in users away from login page
              element={
                isLoggedIn ? (
                  <Navigate to={isAdmin ? "/admin" : "/profile"} replace />
                ) : (
                  <LoginPage login={login} />
                )
              }
            />
            <Route
              path="/signup"
              // Redirect logged-in users away from signup page
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
            {/* --- Protected User Routes (Rendered within UserLayout) --- */}
            {/* These routes require the user to be logged in */}
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
              {/* Profile related */}
              <Route
                path="/profile"
                element={<Profile currentUser={currentUser} />}
              />
              <Route
                path="/profile/:userId"
                element={<Profile currentUser={currentUser} />}
              />{" "}
              {/* Public profile view? */}
              <Route
                path="/profile/activity"
                element={<UserActivityPage currentUser={currentUser} />}
              />
              {/* Settings */}
              <Route
                path="/settings/account"
                element={<AccountSettingsPage currentUser={currentUser} />}
              />
              {/* Projects */}
              <Route
                path="/projects"
                element={<Projects currentUser={currentUser} />}
              />
              <Route path="/projects/new" element={<CreateProjectPage />} />
              <Route
                path="/projects/edit/:projectId"
                element={<EditProjectPage currentUser={currentUser} />}
              />
              {/* Publications */}
              <Route
                path="/publications/new"
                element={<PostPublicationPage currentUser={currentUser} />}
              />
              <Route
                path="/publications/edit/:id"
                element={<EditPublicationPage />}
              />
              {/* --- CORRECTED Messaging Routes --- */}
              <Route
                path="/messages" // Lists available project chats
                element={<Messages currentUser={currentUser} />}
              />
              {/* --- CORRECTED: Path for viewing a specific project chat --- */}
              <Route
                path="/chat/project/:projectId" // <<< THIS PATH NOW CORRECTLY MATCHES NAVIGATION
                element={<ChatPage currentUser={currentUser} />}
              />
              {/* Removed the old /messages/:userId route as it's replaced by project chat */}
            </Route>{" "}
            {/* End of UserLayout Protected Routes */}
            {/* --- Protected Admin Routes (Rendered within AdminLayout) --- */}
            {/* These routes require the user to be logged in AND have the 'admin' role */}
            <Route
              element={
                <AdminProtectedRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
                  <AdminLayout /> {/* AdminLayout contains sidebar, etc. */}
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
              <Route path="/admin/chat" element={<AdminChatPage />} />{" "}
              {/* Optional: Admin specific chat interface? */}
              <Route
                path="/admin/publications"
                element={<AdminPublicationManagementPage />}
              />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              {/* Add other admin-specific routes here */}
            </Route>{" "}
            {/* End of AdminLayout Protected Routes */}
            {/* --- Catch-all Route for 404 Not Found pages --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>{" "}
        {/* End main content area */}
      </Router>
    </NotificationProvider>
  );
}

// --- Helper Component to conditionally render the Navbar ---
// Avoids showing the main user navbar on admin panel pages
const ConditionalNavbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const location = useLocation();
  // Check if the current path starts with /admin
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Don't render the main Navbar on admin routes
  if (isAdminRoute) {
    return null;
  }

  // Render the main Navbar on all other routes
  return (
    <Navbar
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
};

export default App;
