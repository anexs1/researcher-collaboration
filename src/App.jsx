// src/App.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  BrowserRouter as Router, // Use BrowserRouter at the top level
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { io } from "socket.io-client"; // Import socket client
import { motion, AnimatePresence } from "framer-motion"; // For notification animation
import "./index.css"; // Ensure your main CSS is imported

// --- CONTEXT PROVIDER IMPORT ---
import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext"; // Adjust path as needed

// --- Layout Imports ---
import AdminLayout from "./Layout/AdminLayout"; // Adjust path as needed
import UserLayout from "./Layout/UserLayout"; // Adjust path as needed

// --- Component Imports ---
import Navbar from "./Component/Navbar"; // Adjust path as needed
import NormalizeURL from "./Component/NormalizeURL"; // Adjust path as needed
import AcademicSignupForm from "./Component/AcademicSignupForm"; // Adjust path as needed
import CorporateSignupForm from "./Component/CorporateSignupForm"; // Adjust path as needed
import MedicalSignupForm from "./Component/MedicalSignupForm"; // Adjust path as needed
import NotResearcherSignupForm from "./Component/NotResearcherSignupForm"; // Adjust path as needed
import UserActivityPage from "./Component/Profile/UserActivityPage"; // Adjust path as needed
import Notification from "./Component/Common/Notification"; // Adjust path as needed
import LoadingSpinner from "./Component/Common/LoadingSpinner"; // Adjust path as needed
// Import ErrorMessage if used directly in App.jsx
// import ErrorMessage from "./Component/Common/ErrorMessage";

// --- Page Imports (User Facing) ---
import Home from "./Page/Home"; // Adjust path as needed
import ExplorePage from "./Page/ExplorePage"; // Adjust path as needed
import SignupPage from "./Page/SignupPage"; // Adjust path as needed
import LoginPage from "./Page/LoginPage"; // Adjust path as needed
import Profile from "./Page/Profile"; // Adjust path as needed
import PublicationPage from "./Page/Publication"; // Your main public publication list page (verify name/path)
import PublicationDetailPage from "./Page/PublicationDetailPage"; // *** Detail Page Component ***
import EditPublicationPage from "./Page/EditPublicationPage"; // Adjust path as needed
import Projects from "./Page/Projects"; // Adjust path as needed
import CreateProjectPage from "./Page/CreateProjectPage"; // Adjust path as needed
import EditProjectPage from "./Page/EditProjectPage"; // Adjust path as needed
import Messages from "./Page/Messages"; // Adjust path as needed
import PostPublicationPage from "./Page/PostPublicationPage"; // Adjust path as needed
import AccountSettingsPage from "./Page/Settings/AccountSettingsPage"; // Adjust path as needed
// Keep ResearchDetails/ResearchForm if they are separate pages used elsewhere
// import ResearchDetails from "./Page/ResearchDetails";
// import ResearchForm from "./Page/ResearchForm";

// --- Page Imports (Admin Facing) ---
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage"; // Adjust path as needed
import AdminUsersPage from "./Page/Admin/AdminUsersPage"; // Adjust path as needed
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage"; // Adjust path as needed
import AdminReportsPage from "./Page/Admin/AdminReportsPage"; // Adjust path as needed
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage"; // Adjust path as needed
import AdminChatPage from "./Page/Admin/AdminChatPage"; // Adjust path as needed
import AdminPublicationManagementPage from "./Page/Admin/AdminPublicationManagementPage"; // Adjust path as needed

// --- Centralized Auth Hook ---
const useAuth = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("useAuth parse error:", e);
      localStorage.removeItem("user");
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));

  const login = useCallback((userData, authToken) => {
    try {
      if (!userData || !authToken) {
        console.error("useAuth login: Invalid data.");
        return;
      }
      const userString = JSON.stringify(userData);
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("user", userString);
      setToken(authToken);
      setUser(userData);
      console.log("useAuth: login successful.");
      window.dispatchEvent(new Event("authChange"));
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  }, []); // Dependencies are stable state setters

  const logout = useCallback(() => {
    console.log("useAuth: logging out.");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  }, []); // Dependencies are stable state setters

  useEffect(() => {
    const syncAuth = () => {
      const currentToken = localStorage.getItem("authToken");
      const currentUserJson = localStorage.getItem("user");
      let currentUser = null;
      try {
        currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
      } catch (e) {
        console.warn("syncAuth: Error parsing user data", e);
        localStorage.removeItem("user");
      }
      // Update state only if values actually changed
      setToken((prevToken) =>
        prevToken !== currentToken ? currentToken : prevToken
      );
      setUser((prevUser) =>
        JSON.stringify(prevUser) !== JSON.stringify(currentUser)
          ? currentUser
          : prevUser
      );
    };
    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChange", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, []); // Run only once on mount

  return { user, token, login, logout };
};

// --- Helper Components ---
const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center h-screen text-lg font-medium text-gray-700 bg-gray-100">
    <LoadingSpinner size="lg" />
    <p className="mt-4">{message}</p>
  </div>
);

// Protects routes requiring login
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  // Show loading while checking auth state
  if (isLoggedIn === null) {
    return <LoadingScreen message="Verifying session..." />;
  }
  // Redirect to login if not logged in
  if (!isLoggedIn) {
    console.log("ProtectedRoute: User not logged in, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Render children if logged in
  return children;
};

// Protects routes requiring admin role
const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();
  // Show loading while checking auth state
  if (isLoggedIn === null || isAdmin === null) {
    return <LoadingScreen message="Verifying access level..." />;
  }
  // Redirect to login if not logged in
  if (!isLoggedIn) {
    console.log(
      "AdminProtectedRoute: User not logged in, redirecting to login."
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Redirect to home if logged in but not admin
  if (!isAdmin) {
    console.warn(
      "AdminProtectedRoute: Non-admin user access blocked, redirecting home."
    );
    return <Navigate to="/" replace />;
  }
  // Render children if logged in and admin
  return children;
};

// --- Socket Manager Component ---
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification } = useNotifications();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Disconnect if token removed or invalid
    if (!token) {
      if (socket) {
        console.log("SocketManager: Token removed, disconnecting.");
        socket.disconnect();
        setSocket(null);
      }
      return; // Early exit if no token
    }

    // Connect if token exists and not already connected
    if (!socket) {
      console.log("SocketManager: Token found, attempting connection...");
      const newSocket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        setSocket(newSocket);
      });
      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setSocket(null);
      });
      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        setSocket(null);
      });

      // Register event listeners
      newSocket.on("new_collaboration_request", (data) => {
        if (data && typeof addNewNotification === "function")
          addNewNotification(data);
      });
      newSocket.on("request_response", (data) => {
        if (data && typeof addNewNotification === "function")
          addNewNotification(data);
      });
      // ... other listeners

      // Cleanup on unmount or dependency change
      return () => {
        console.log("SocketManager: Cleaning up socket instance", newSocket.id);
        newSocket.disconnect();
      };
    }
    // Re-run effect if token, API URL, or notification handler changes
  }, [token, API_BASE, addNewNotification]); // Ensure socket state itself is NOT a dependency

  return null; // Visual component is null
};

// --- Main App Component ---
function App() {
  const { user: currentUser, token, login, logout } = useAuth(); // Get auth state and methods
  const [isAdmin, setIsAdmin] = useState(null); // Derived admin state
  const [isLoggedIn, setIsLoggedIn] = useState(null); // Derived login state
  const [loadingAuth, setLoadingAuth] = useState(true); // Initial auth check loading
  const [popupNotification, setPopupNotification] = useState({
    message: "",
    type: "",
    show: false,
  }); // For global popups
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Function to show temporary notifications
  const showPopupNotification = useCallback((message, type = "info") => {
    setPopupNotification({ message, type, show: true });
    setTimeout(
      () => setPopupNotification((prev) => ({ ...prev, show: false })),
      5000
    );
  }, []);

  // Effect to derive login/admin status whenever token or user object changes
  useEffect(() => {
    const userIsLoggedIn = !!token && !!currentUser?.id;
    const userIsAdmin = userIsLoggedIn && currentUser?.role === "admin";
    setIsLoggedIn(userIsLoggedIn);
    setIsAdmin(userIsAdmin);
    setLoadingAuth(false); // Mark auth check as complete
  }, [token, currentUser]); // Dependencies

  const handleLogout = logout; // Use the logout function from the hook

  // Show loading screen during initial auth check
  if (loadingAuth) {
    return <LoadingScreen message="Initializing..." />;
  }

  // --- Render App Structure ---
  return (
    <NotificationProvider>
      <Router>
        {" "}
        {/* Use Router once at the top */}
        <NormalizeURL />
        {isLoggedIn && <SocketManager token={token} API_BASE={API_BASE} />}
        <ConditionalNavbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <div className="pt-16 md:pt-20 bg-gray-50 min-h-screen">
          {" "}
          {/* Changed background */}
          {/* Global Notification Popup */}
          <AnimatePresence>
            {" "}
            {popupNotification.show && (
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed top-20 md:top-24 right-5 z-[200] w-full max-w-md pointer-events-none"
              >
                {" "}
                <Notification
                  message={popupNotification.message}
                  type={popupNotification.type}
                  onClose={() =>
                    setPopupNotification((prev) => ({ ...prev, show: false }))
                  }
                  className="pointer-events-auto shadow-lg"
                />{" "}
              </motion.div>
            )}{" "}
          </AnimatePresence>
          {/* --- Application Routes Definition --- */}
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<ExplorePage />} />{" "}
            {/* Pass props if needed */}
            {/* --- Publication Routes --- */}
            <Route
              path="/publications"
              element={<PublicationPage currentUser={currentUser} />}
            />
            {/* *** Detail Page Route *** */}
            <Route
              path="/publications/:id"
              element={<PublicationDetailPage currentUser={currentUser} />}
            />
            {/* --- Auth Routes --- */}
            <Route
              path="/login"
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
            {/* --- Protected User Routes (Requires Login) --- */}
            {/* Wrap protected routes with the UserLayout */}
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
              {/* Protected Publication Actions */}
              <Route
                path="/publications/new"
                element={<PostPublicationPage currentUser={currentUser} />}
              />
              <Route
                path="/publications/edit/:id"
                element={<EditPublicationPage />}
              />
              {/* Other protected routes like specific research forms could go here */}
            </Route>
            {/* --- Protected Admin Routes (Requires Login and Admin Role) --- */}
            {/* Wrap admin routes with the AdminLayout */}
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
              {/* Add other admin-specific routes here */}
            </Route>
            {/* --- Catch-all / Not Found Route --- */}
            {/* This should be the LAST route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

// --- Conditional Navbar Rendering Component ---
const ConditionalNavbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  // Don't render Navbar on admin routes
  if (isAdminRoute) return null;
  return (
    <Navbar
      isLoggedIn={isLoggedIn}
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
};

export default App; // Export the main App component
