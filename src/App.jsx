// src/App.jsx

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext, // Keep useContext if useAuth uses it
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
  Link,
} from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import "./index.css";

// --- Context Imports ---
import { useNotifications } from "./context/NotificationContext"; // Keep for SocketManager
// Import your Auth Context hook
// import { useAuth } from './context/AuthContext';

// --- MOCK Auth Hook for demonstration ---
const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const login = useCallback((userData, authToken) => {
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    window.dispatchEvent(new Event("authChange"));
    console.log("[MockAuth] Login successful.");
  }, []);
  const logout = useCallback(() => {
    console.log("[MockAuth] Logging out.");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  }, []);
  useEffect(() => {
    const syncAuth = (event) => {
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
// --- END MOCK Auth Hook ---

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

// --- Page Imports ---
// ... (keep all your page imports) ...
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
import AboutUs from "./Page/AboutUs";
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";
import AdminPendingUsersPage from "./Page/Admin/AdminPendingUsersPage";
import AdminChatPage from "./Page/Admin/AdminChatPage";
import AdminPublicationManagementPage from "./Page/Admin/AdminPublicationManagementPage";
// +++ IMPORT ProjectDetailPage +++
import ProjectDetailPage from "./Page/ProjectDetailPage"; // Adjust path if necessary

// --- Helper Components ---
const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center h-screen text-lg font-medium text-gray-700 bg-gray-100">
    {" "}
    <LoadingSpinner size="lg" /> <p className="mt-4">{message}</p>{" "}
  </div>
);
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

// =========================================================================
// --- Socket Manager - Includes fetchInitialNotifications call ---
// =========================================================================
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification, fetchInitialNotifications } = useNotifications();
  const socketRef = useRef(null);
  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    console.log(`[SocketManager Effect] Running. Token present: ${!!token}`);
    if (token && !hasFetchedInitial.current) {
      console.log(
        "[SocketManager Effect] Token found and initial fetch needed. CALLING fetchInitialNotifications()."
      );
      fetchInitialNotifications();
      hasFetchedInitial.current = true;
    }
    if (!token) {
      console.log(
        "[SocketManager Effect] Token removed. Resetting initial fetch flag."
      );
      hasFetchedInitial.current = false;
    }

    const cleanupSocket = () => {
      if (socketRef.current) {
        const socketId = socketRef.current.id;
        console.log(
          `[SocketManager Cleanup] Cleaning up socket instance ${socketId}...`
        );
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("notification");
        socketRef.current.disconnect();
        console.log(
          `[SocketManager Cleanup] Disconnected socket ${socketId}. Clearing ref.`
        );
        socketRef.current = null;
      } else {
        console.log(
          "[SocketManager Cleanup] No active socket ref found. Cleanup unnecessary."
        );
      }
    };
    if (!token) {
      console.log(
        "[SocketManager Effect] No token. Ensuring disconnection and cleanup."
      );
      cleanupSocket();
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      if (socketRef.current) {
        console.warn(
          `[SocketManager Effect] Found stale/disconnected socket ref (ID: ${socketRef.current.id}). Cleaning up before reconnecting.`
        );
        cleanupSocket();
      }
      console.log(
        `[SocketManager Effect] Attempting NEW socket connection to ${API_BASE}. Token provided: ${
          token ? "Yes" : "No - ERROR"
        }`
      );
      const newSocket = io(API_BASE, {
        auth: { token: token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
      });
      socketRef.current = newSocket;
      const handleConnect = () => {
        console.log(
          `✅ [Socket Event - ${newSocket.id}] Connected successfully.`
        );
      };
      const handleDisconnect = (reason) => {
        console.log(
          `🔌 [Socket Event - ${newSocket.id}] Disconnected. Reason: ${reason}`
        );
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          console.log(
            `[SocketManager] Disconnect event for current socket ref (${newSocket.id}). Clearing ref.`
          );
          socketRef.current = null;
        } else {
          console.log(
            `[SocketManager] Disconnect event for a different/old socket instance (${newSocket.id}). Current ref: ${socketRef.current?.id}`
          );
        }
        if (reason === "io server disconnect") {
          console.warn("[SocketManager] Disconnected by server.");
        }
      };
      const handleConnectError = (err) => {
        console.error(
          `❌ [Socket Event - ${
            newSocket.id || "Attempt Failed"
          }] Connection Error. Message: ${err.message}`
        );
        console.error("[Socket Event] Full connection error object:", err);
        if (socketRef.current && socketRef.current.id === newSocket.id) {
          console.log(
            `[SocketManager] Clearing socketRef after connection error for attempt with ID ${newSocket.id}.`
          );
          socketRef.current = null;
        }
      };
      const handleNotification = (data) => {
        console.log(
          `📬 [Socket Event - ${newSocket.id}] Received 'notification' event. Data:`,
          JSON.stringify(data)
        );
        if (data && data.notification && data.type && addNewNotification) {
          console.log(
            `[SocketManager - ${newSocket.id}] Calling addNewNotification for type: ${data.type}`
          );
          addNewNotification(data.notification);
        } else {
          console.warn(
            `[SocketManager - ${newSocket.id}] Received 'notification' event but context/data invalid.`,
            { hasAddNew: !!addNewNotification, dataReceived: data }
          );
        }
      };
      console.log(
        `[SocketManager Effect] Attaching listeners for NEW Socket instance ${newSocket.id}`
      );
      newSocket.on("connect", handleConnect);
      newSocket.on("disconnect", handleDisconnect);
      newSocket.on("connect_error", handleConnectError);
      newSocket.on("notification", handleNotification);
    } else {
      console.log(
        `[SocketManager Effect] Socket already connected (ID: ${socketRef.current.id}). Maintaining existing connection.`
      );
    }
    return cleanupSocket;
  }, [token, API_BASE, addNewNotification, fetchInitialNotifications]);

  return null;
};
// ============================================
// --- End Socket Manager ---
// ============================================

// --- Main App Component ---
function App() {
  const { user: currentUser, token, login, logout } = useAuth();
  // No longer call useNotifications() here
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [popupNotification, setPopupNotification] = useState({
    message: "",
    type: "",
    show: false,
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  console.log(`[App Main] Using API_BASE URL: ${API_BASE}`);

  const showPopupNotification = useCallback((message, type = "info") => {
    setPopupNotification({ message, type, show: true });
    setTimeout(
      () => setPopupNotification((prev) => ({ ...prev, show: false })),
      5000
    );
  }, []);

  useEffect(() => {
    console.log(
      "[App Main Effect - Auth Check] Running. Token:",
      token ? "Exists" : "None",
      "CurrentUser:",
      currentUser ? `ID: ${currentUser.id}` : "None"
    );
    setLoadingAuth(true);
    const userIsLoggedIn = !!token && !!currentUser?.id;
    const userIsAdmin = userIsLoggedIn && currentUser?.role === "admin";
    setIsLoggedIn(userIsLoggedIn);
    setIsAdmin(userIsAdmin);
    setLoadingAuth(false);
    console.log(
      `[App Main Effect - Auth Check] Auth state update complete: isLoggedIn=${userIsLoggedIn}, isAdmin=${userIsAdmin}`
    );
    // fetchInitialNotifications is now called inside SocketManager
  }, [token, currentUser]);

  const handleLogout = logout;

  if (loadingAuth && isLoggedIn === null) {
    return <LoadingScreen message="Initializing Application..." />;
  }

  return (
    // NotificationProvider MUST wrap App in main.jsx/index.js
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
          {" "}
          {popupNotification.show && (
            <motion.div /* ... */>
              {" "}
              <Notification /* ... */ />{" "}
            </motion.div>
          )}{" "}
        </AnimatePresence>

        {/* --- ROUTES --- */}
        <Routes>
          {/* Public Routes */}
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
          <Route
            path="/projects"
            element={<Projects currentUser={currentUser} />}
          />
          {/* +++ ADDED PROJECT DETAIL ROUTE +++ */}
          <Route
            path="/projects/:projectId"
            element={<ProjectDetailPage currentUser={currentUser} />}
          />
          {/* +++ END +++ */}

          {/* Auth Routes */}
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

          {/* Protected USER Routes */}
          <Route
            element={
              <ProtectedUserRoutes isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
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
              {/* Note: Project detail route is currently public, move here if needed */}
            </Route>
          </Route>

          {/* Protected ADMIN Routes */}
          <Route
            element={
              <ProtectedAdminRoutes isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
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

          {/* Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
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
