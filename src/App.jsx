// src/App.jsx

import React, { useEffect, useState, useCallback, useRef } from "react"; // Added useRef
import {
  BrowserRouter as Router, // Use BrowserRouter once at the top level
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
import PublicationDetailPage from "./Page/PublicationDetailPage"; // Detail Page Component
import EditPublicationPage from "./Page/EditPublicationPage"; // Adjust path as needed
import Projects from "./Page/Projects"; // Adjust path as needed
import CreateProjectPage from "./Page/CreateProjectPage"; // Adjust path as needed
import EditProjectPage from "./Page/EditProjectPage"; // Adjust path as needed
import Messages from "./Page/Messages"; // Adjust path as needed
import ChatPage from "./Page/ChatPage"; // <<< Ensure this placeholder exists
import PostPublicationPage from "./Page/PostPublicationPage"; // Adjust path as needed
import AccountSettingsPage from "./Page/Settings/AccountSettingsPage"; // Adjust path as needed
import NotFoundPage from "./Page/NotFoundPage"; // <<< Ensure this placeholder exists

// --- Page Imports (Admin Facing) ---
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage"; // Adjust path as needed
import AdminUsersPage from "./Page/Admin/AdminUsersPage"; // <<< Ensure this placeholder exists
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage"; // Adjust path as needed
import AdminReportsPage from "./Page/Admin/AdminReportsPage"; // Adjust path as needed
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage"; // Adjust path as needed
import AdminChatPage from "./Page/Admin/AdminChatPage"; // Adjust path as needed
import AdminPublicationManagementPage from "./Page/Admin/AdminPublicationManagementPage"; // Adjust path as needed

// --- Centralized Auth Hook ---
const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("useAuth: Error parsing user from localStorage", e);
      localStorage.removeItem("user"); // Clear corrupted data
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken")); // <<< VERIFY THIS KEY

  // Login function - stores token and user data
  const login = useCallback((userData, authToken) => {
    try {
      if (!userData || !authToken) {
        console.error("useAuth login: Invalid user data or token provided.");
        return;
      }
      console.log("useAuth: Storing auth data...");
      localStorage.setItem("authToken", authToken); // <<< CONSISTENT KEY
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      window.dispatchEvent(new Event("authChange")); // Notify other parts of app/tabs
      console.log("useAuth: Login state updated.");
    } catch (error) {
      console.error("Error saving auth data to localStorage:", error);
    }
  }, []); // No dependencies needed as setters are stable

  // Logout function - clears token and user data
  const logout = useCallback(() => {
    console.log("useAuth: Logging out and clearing storage.");
    localStorage.removeItem("authToken"); // <<< CONSISTENT KEY
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  }, []); // No dependencies needed

  // Effect to sync auth state with localStorage (e.g., for other tabs)
  useEffect(() => {
    const syncAuth = (event) => {
      // Only react to changes in relevant keys or manual dispatch
      if (event && event.key && !["authToken", "user"].includes(event.key)) {
        return;
      }
      console.log("Auth sync triggered by:", event?.type || "initial/manual");
      const currentToken = localStorage.getItem("authToken"); // <<< CONSISTENT KEY
      const currentUserJson = localStorage.getItem("user");
      let currentUser = null;
      try {
        currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
      } catch (e) {
        console.warn(
          "syncAuth: Clearing corrupted user data from localStorage",
          e
        );
        localStorage.removeItem("user");
      }
      // Update state only if the value has actually changed
      setToken((prevToken) =>
        prevToken !== currentToken ? currentToken : prevToken
      );
      setUser((prevUser) =>
        JSON.stringify(prevUser) !== JSON.stringify(currentUser)
          ? currentUser
          : prevUser
      );
    };

    syncAuth(); // Initial sync on component mount

    window.addEventListener("storage", syncAuth); // Listen for changes in other tabs
    window.addEventListener("authChange", syncAuth); // Listen for manual login/logout events

    return () => {
      // Cleanup listeners on unmount
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

// Protected Route for standard logged-in users
const ProtectedRoute = ({ isLoggedIn, children }) => {
  const location = useLocation();
  if (isLoggedIn === null) {
    // Check if auth state is determined yet
    return <LoadingScreen message="Verifying session..." />;
  }
  if (!isLoggedIn) {
    // If auth check complete and not logged in
    console.log("ProtectedRoute: User not logged in, redirecting to login.");
    // Redirect to login, saving the page they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children; // Render the intended component if logged in
};

// Protected Route for Admin users
const AdminProtectedRoute = ({ isLoggedIn, isAdmin, children }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null) {
    // Check if auth/admin state is determined
    return <LoadingScreen message="Verifying access level..." />;
  }
  if (!isLoggedIn) {
    // Must be logged in first
    console.log(
      "AdminProtectedRoute: User not logged in, redirecting to login."
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    // Must have admin role
    console.warn(
      "AdminProtectedRoute: Non-admin access blocked, redirecting home."
    );
    // Redirect non-admins away from admin routes (e.g., to home or profile)
    return <Navigate to="/" replace />;
  }
  return children; // Render the intended admin component
};

// --- Socket Manager Component (Corrected) ---
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification } = useNotifications(); // Get handler from context
  const socketRef = useRef(null); // Use ref to manage the socket instance

  useEffect(() => {
    // 1. Disconnect if no token
    if (!token) {
      if (socketRef.current) {
        console.log(
          "SocketManager: No token, disconnecting.",
          socketRef.current.id
        );
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // 2. Connect only if token exists AND not already connected via ref
    if (!socketRef.current) {
      console.log("SocketManager: Token found, attempting connection...");
      const newSocket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"], // Prioritize WebSocket
        reconnectionAttempts: 5, // Example: Limit retries
      });

      socketRef.current = newSocket; // Store ref immediately

      // --- Event Listeners ---
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
      });
      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", newSocket.id, "Reason:", reason);
        socketRef.current = null;
      });
      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        socketRef.current = null;
      });

      // --- Custom Event Handlers ---
      const handleNewRequest = (data) => {
        if (data && addNewNotification) addNewNotification(data);
      };
      const handleRequestResponse = (data) => {
        if (data && addNewNotification) addNewNotification(data);
      };
      // Add more specific handlers...
      // const handleNewMessage = (data) => { if (data && addNewNotification) addNewNotification(data, 'message'); }; // Example

      newSocket.on("new_collaboration_request", handleNewRequest);
      newSocket.on("request_response", handleRequestResponse);
      // newSocket.on("new_message", handleNewMessage); // Example
      // ... other event listeners ...

      // --- Cleanup Function ---
      return () => {
        console.log("SocketManager: Cleaning up socket instance", newSocket.id);
        // Remove specific listeners
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("connect_error");
        newSocket.off("new_collaboration_request", handleNewRequest);
        newSocket.off("request_response", handleRequestResponse);
        // newSocket.off("new_message", handleNewMessage); // Example
        // ... remove others ...

        newSocket.disconnect();
        // Clear ref only if this specific instance is being cleaned up
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      };
    }
    // Effect depends ONLY on token, API_BASE, and the stable addNewNotification function reference
  }, [token, API_BASE, addNewNotification]);

  return null; // This component renders no UI
};

// --- Main App Component ---
function App() {
  const { user: currentUser, token, login, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // Start as true
  const [popupNotification, setPopupNotification] = useState({
    message: "",
    type: "",
    show: false,
  });
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Memoized notification handler
  const showPopupNotification = useCallback((message, type = "info") => {
    setPopupNotification({ message, type, show: true });
    const timerId = setTimeout(
      () => setPopupNotification((prev) => ({ ...prev, show: false })),
      5000
    );
    // Optional: return () => clearTimeout(timerId);
  }, []);

  // Effect to derive login/admin status from auth state
  useEffect(() => {
    console.log("Auth state changed, deriving status:", {
      token: !!token,
      user: !!currentUser?.id,
      role: currentUser?.role,
    });
    const userIsLoggedIn = !!token && !!currentUser?.id;
    const userIsAdmin = userIsLoggedIn && currentUser?.role === "admin";
    setIsLoggedIn(userIsLoggedIn);
    setIsAdmin(userIsAdmin);
    setLoadingAuth(false); // Auth check is complete
  }, [token, currentUser]);

  const handleLogout = logout; // Alias for clarity

  // Show loading screen during initial auth check
  if (loadingAuth) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <NotificationProvider>
      {" "}
      {/* Wrap Router with Provider */}
      <Router>
        <NormalizeURL /> {/* Component to handle URL normalization if needed */}
        {/* Conditionally render SocketManager only if logged in */}
        {isLoggedIn && <SocketManager token={token} API_BASE={API_BASE} />}
        {/* Conditionally render Navbar based on route */}
        <ConditionalNavbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        {/* Main content area with padding for fixed navbar */}
        <div className="pt-16 md:pt-20 bg-gray-50 min-h-screen">
          {/* Global Notification Popup */}
          <AnimatePresence>
            {popupNotification.show && (
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
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
                  className="pointer-events-auto shadow-lg" // Make notification itself clickable
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- Application Routes --- */}
          <Routes>
            {/* --- Public Routes --- */}
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

            {/* --- Protected User Routes (Inside UserLayout) --- */}
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
                path="/publications/new"
                element={<PostPublicationPage currentUser={currentUser} />}
              />
              <Route
                path="/publications/edit/:id"
                element={<EditPublicationPage />}
              />
              {/* Messaging Routes */}
              <Route
                path="/messages"
                element={<Messages currentUser={currentUser} />}
              />
              <Route
                path="/messages/:userId"
                element={<ChatPage currentUser={currentUser} />}
              />
            </Route>

            {/* --- Protected Admin Routes (Inside AdminLayout) --- */}
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

            {/* --- Catch-all / Not Found Route --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

// --- Conditional Navbar Rendering Component ---
// Renders Navbar except on admin routes
const ConditionalNavbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (isAdminRoute) {
    return null; // Don't render Navbar on admin routes
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
