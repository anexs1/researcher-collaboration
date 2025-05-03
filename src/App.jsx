// frontend/src/App.jsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
  Link, // Ensure Link is imported if used in nav like the example
} from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import "./index.css";

// --- CONTEXT PROVIDER IMPORT ---
import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext"; // Adjust path if needed

// --- Layout Imports ---
import AdminLayout from "./Layout/AdminLayout"; // Adjust path if needed
import UserLayout from "./Layout/UserLayout"; // Adjust path if needed

// --- Component Imports ---
// Using singular 'Component' folder name as requested
import Navbar from "./Component/Navbar";
import NormalizeURL from "./Component/NormalizeURL";
import AcademicSignupForm from "./Component/AcademicSignupForm";
import CorporateSignupForm from "./Component/CorporateSignupForm";
import MedicalSignupForm from "./Component/MedicalSignupForm";
import NotResearcherSignupForm from "./Component/NotResearcherSignupForm";
import UserActivityPage from "./Component/Profile/UserActivityPage"; // Adjust path if needed
import Notification from "./Component/Common/Notification";
import LoadingSpinner from "./Component/Common/LoadingSpinner";

// --- Page Imports (User Facing) ---
// Using singular 'Page' folder name
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
import AccountSettingsPage from "./Page/Settings/AccountSettingsPage"; // Adjust path
import NotFoundPage from "./Page/NotFoundPage";
import AboutUs from "./Page/AboutUs";

// --- Page Imports (Admin Facing) ---
// Using singular 'Page' folder name
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
      if (
        event &&
        event.type === "storage" &&
        !["authToken", "user"].includes(event.key)
      )
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
const ProtectedUserRoutes = ({ isLoggedIn, isAdmin }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null)
    return <LoadingScreen message="Verifying session..." />;
  if (!isLoggedIn)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
};

const ProtectedAdminRoutes = ({ isLoggedIn, isAdmin }) => {
  const location = useLocation();
  if (isLoggedIn === null || isAdmin === null)
    return <LoadingScreen message="Verifying access level..." />;
  if (!isLoggedIn)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
};

// --- Socket Manager ---
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification } = useNotifications();
  const socketRef = useRef(null);

  useEffect(() => {
    let cleanupSocket = () => {};
    if (!token) {
      if (socketRef.current) {
        console.log("SocketManager: Disconnecting socket due to no token");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!socketRef.current) {
      console.log("SocketManager: Attempting to connect socket with token...");
      const newSocket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 3,
      });
      socketRef.current = newSocket;

      const handleConnect = () =>
        console.log("Socket connected:", newSocket.id);
      const handleDisconnect = (reason) => {
        console.log("Socket disconnected:", newSocket.id, "Reason:", reason);
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      };
      const handleConnectError = (err) => {
        console.error("Socket connection error:", err.message);
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      };
      const handleNotification = (data) => {
        if (data && addNewNotification) {
          console.log("Received notification via socket:", data);
          addNewNotification(data);
        } else {
          console.warn("Received notification but context/data invalid.", data);
        }
      };

      newSocket.on("connect", handleConnect);
      newSocket.on("disconnect", handleDisconnect);
      newSocket.on("connect_error", handleConnectError);
      newSocket.on("notification", handleNotification);
      newSocket.on("new_collaboration_request", handleNotification);
      newSocket.on("request_response", handleNotification);

      cleanupSocket = () => {
        console.log("SocketManager: Cleaning up socket instance", newSocket.id);
        newSocket.off("connect", handleConnect);
        newSocket.off("disconnect", handleDisconnect);
        newSocket.off("connect_error", handleConnectError);
        newSocket.off("notification", handleNotification);
        newSocket.off("new_collaboration_request", handleNotification);
        newSocket.off("request_response", handleNotification);
        newSocket.disconnect();
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          socketRef.current = null;
        }
      };
    }
    return cleanupSocket;
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

  // Use ONLY the Vite method (import.meta.env)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"; // Backend default port

  const showPopupNotification = useCallback((message, type = "info") => {
    setPopupNotification({ message, type, show: true });
    setTimeout(
      () => setPopupNotification((prev) => ({ ...prev, show: false })),
      5000
    );
  }, []);

  useEffect(() => {
    setLoadingAuth(true);
    const userIsLoggedIn = !!token && !!currentUser?.id;
    const userIsAdmin = userIsLoggedIn && currentUser?.role === "admin";
    setIsLoggedIn(userIsLoggedIn);
    setIsAdmin(userIsAdmin);
    setLoadingAuth(false);
    console.log(
      `Auth state updated: isLoggedIn=${userIsLoggedIn}, isAdmin=${userIsAdmin}`
    );
  }, [token, currentUser]);

  const handleLogout = logout;

  if (loadingAuth && isLoggedIn === null) {
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

          <Routes>
            {/* ================================================== */}
            {/* --- Public Routes --- */}
            {/* ================================================== */}
            {/* Pass currentUser so components can adapt UI if user is logged in */}
            <Route path="/" element={<Home currentUser={currentUser} />} />
            <Route
              path="/explore"
              element={<ExplorePage currentUser={currentUser} />}
            />
            <Route path="/aboutus" element={<AboutUs />} />
            <Route
              path="/publications"
              element={<PublicationPage currentUser={currentUser} />}
            />
            <Route
              path="/publications/:id"
              element={<PublicationDetailPage currentUser={currentUser} />}
            />
            {/* --- CORRECTED: Pass currentUser to Projects --- */}
            <Route
              path="/projects"
              element={<Projects currentUser={currentUser} />}
            />
            {/* Pass currentUser to DocumentPage */}

            {/* ================================================== */}
            {/* --- Auth Routes --- */}
            {/* ================================================== */}
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

            {/* ========================================================== */}
            {/* --- Protected USER Routes --- */}
            {/* ========================================================== */}
            <Route
              element={
                <ProtectedUserRoutes
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                />
              }
            >
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
                  path="/projects/new"
                  element={<CreateProjectPage currentUser={currentUser} />}
                />
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
                  element={<EditPublicationPage currentUser={currentUser} />}
                />
                <Route
                  path="/messages"
                  element={<Messages currentUser={currentUser} />}
                />
                <Route
                  path="/chat/project/:projectId"
                  element={<ChatPage currentUser={currentUser} />}
                />
                {/* <Route path="/my-documents" element={<MyDocumentsPage currentUser={currentUser} />} /> */}
              </Route>
            </Route>

            {/* =========================================================== */}
            {/* --- Protected ADMIN Routes --- */}
            {/* =========================================================== */}
            <Route
              element={
                <ProtectedAdminRoutes
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                />
              }
            >
              <Route element={<AdminLayout currentUser={currentUser} />}>
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
            </Route>

            {/* --- Catch-all Not Found Route --- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

// --- Conditional Navbar Component ---
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
