// src/App.jsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet, // Import Outlet for protection components
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
import Messages from "./Page/Messages";
import ChatPage from "./Page/ChatPage";
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
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const login = useCallback((userData, authToken) => {
    try {
      if (!userData || !authToken) {
        console.error("useAuth login: Invalid user data or token provided.");
        return;
      }
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      window.dispatchEvent(new Event("authChange"));
    } catch (error) {
      console.error("Error saving auth data to localStorage:", error);
    }
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  }, []);
  useEffect(() => {
    const syncAuth = (event) => {
      if (event && event.key && !["authToken", "user"].includes(event.key))
        return;
      const currentToken = localStorage.getItem("authToken");
      const currentUserJson = localStorage.getItem("user");
      let currentUser = null;
      try {
        currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
      } catch (e) {
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
    };
    syncAuth();
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

// --- Protection Components using Outlet ---

// Protects standard user routes: redirects unauthenticated users AND admin users.
const ProtectedUserRoutes = ({ isLoggedIn, isAdmin }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null)
    return <LoadingScreen message="Verifying session..." />;
  if (!isLoggedIn)
    return <Navigate to="/login" state={{ from: location }} replace />;
  // Redirect Admins away from standard user routes
  if (isAdmin) {
    console.log(
      `ProtectedUserRoutes: Admin detected accessing user route ${location.pathname}. Redirecting to /admin.`
    );
    return <Navigate to="/admin" replace />;
  }
  // Allow access for logged-in, non-admin users to the nested Outlet routes
  return <Outlet />;
};

// Protects admin routes: redirects unauthenticated users AND non-admin users.
const ProtectedAdminRoutes = ({ isLoggedIn, isAdmin }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null)
    return <LoadingScreen message="Verifying access level..." />;
  if (!isLoggedIn)
    return <Navigate to="/login" state={{ from: location }} replace />;
  // Redirect Non-Admins away from admin routes
  if (!isAdmin) {
    console.log(
      `ProtectedAdminRoutes: Non-admin detected accessing admin route ${location.pathname}. Redirecting to /.`
    );
    return <Navigate to="/" replace />; // Redirect to home page
  }
  // Allow access for logged-in admin users to the nested Outlet routes
  return <Outlet />;
};

// SocketManager (Keep as is)
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification } = useNotifications();
  const socketRef = useRef(null);
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    if (!socketRef.current) {
      const newSocket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 3,
      });
      socketRef.current = newSocket;
      newSocket.on("connect", () =>
        console.log("Socket connected:", newSocket.id)
      );
      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", newSocket.id, "Reason:", reason);
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      });
      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      });
      const handleNotification = (data) => {
        if (data && addNewNotification) {
          console.log("Received notification via socket:", data);
          addNewNotification(data);
        }
      };
      newSocket.on("notification", handleNotification);
      newSocket.on("new_collaboration_request", handleNotification);
      newSocket.on("request_response", handleNotification);
      return () => {
        console.log("SocketManager: Cleaning up socket instance", newSocket.id);
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("connect_error");
        newSocket.off("notification", handleNotification);
        newSocket.off("new_collaboration_request", handleNotification);
        newSocket.off("request_response", handleNotification);
        newSocket.disconnect();
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      };
    }
  }, [token, API_BASE, addNewNotification]);
  return null;
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
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Notification handler
  const showPopupNotification = useCallback((message, type = "info") => {
    setPopupNotification({ message, type, show: true });
    setTimeout(
      () => setPopupNotification((prev) => ({ ...prev, show: false })),
      5000
    );
  }, []);

  // Effect to derive login/admin status
  useEffect(() => {
    const userIsLoggedIn = !!token && !!currentUser?.id;
    const userIsAdmin = userIsLoggedIn && currentUser?.role === "admin";
    setIsLoggedIn(userIsLoggedIn);
    setIsAdmin(userIsAdmin);
    setLoadingAuth(false);
  }, [token, currentUser]);

  const handleLogout = logout;

  if (loadingAuth) {
    return <LoadingScreen message="Initializing Application..." />;
  }

  return (
    <NotificationProvider>
      <Router>
        <NormalizeURL />
        {isLoggedIn && <SocketManager token={token} API_BASE={API_BASE} />}
        <ConditionalNavbar
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <div className="pt-16 md:pt-20 bg-gray-100 min-h-screen">
          {/* Global Notification Popup */}
          <AnimatePresence>
            {popupNotification.show && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="fixed top-20 md:top-24 right-4 md:right-6 z-[200] w-full max-w-sm pointer-events-none"
              >
                <Notification
                  message={popupNotification.message}
                  type={popupNotification.type}
                  onClose={() =>
                    setPopupNotification((prev) => ({ ...prev, show: false }))
                  }
                  className="pointer-events-auto shadow-lg rounded-md"
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
                isLoggedIn ? (
                  <Navigate to={isAdmin ? "/admin" : "/profile"} replace />
                ) : (
                  <SignupPage />
                )
              }
            />
            <Route path="/signup/academic" element={<AcademicSignupForm />} />
            <Route path="/signup/corporate" element={<CorporateSignupForm />} />
            <Route path="/signup/medical" element={<MedicalSignupForm />} />
            <Route
              path="/signup/not-researcher"
              element={<NotResearcherSignupForm />}
            />

            {/* --- Protected USER Routes --- */}
            <Route
              element={
                <ProtectedUserRoutes
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                />
              }
            >
              {/* UserLayout Wraps all nested user routes */}
              <Route
                element={
                  <UserLayout
                    isLoggedIn={isLoggedIn}
                    handleLogout={handleLogout}
                    currentUser={currentUser}
                  />
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
                <Route
                  path="/messages"
                  element={<Messages currentUser={currentUser} />}
                />
                <Route
                  path="/chat/project/:projectId"
                  element={<ChatPage currentUser={currentUser} />}
                />
                {/* Add other user routes here */}
              </Route>
            </Route>

            {/* --- Protected ADMIN Routes --- */}
            <Route
              element={
                <ProtectedAdminRoutes
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                />
              }
            >
              {/* AdminLayout Wraps all nested admin routes */}
              <Route element={<AdminLayout currentUser={currentUser} />}>
                {" "}
                {/* Pass props if AdminLayout needs them */}
                <Route path="/admin" element={<AdminDashboardPage />} />
                {/* Use index route for dashboard if preferred: <Route index element={<AdminDashboardPage />} /> */}
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
                {/* Add other admin routes here */}
              </Route>
            </Route>

            {/* --- Catch-all --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

// ConditionalNavbar (Keep as is)
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
