// src/App.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
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

// --- Slate.js Imports (for DocumentEditor) ---
import { createEditor } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import axios from "axios";

// --- Context Imports ---
import { useNotifications } from "./context/NotificationContext";

// --- Auth Hook (Using your provided structure) ---
const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage on init", e);
      localStorage.removeItem("user");
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
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      const currentToken = localStorage.getItem("authToken");
      const currentUserJson = localStorage.getItem("user");
      let currentUserData = null;
      try {
        currentUserData = currentUserJson ? JSON.parse(currentUserJson) : null;
      } catch (e) {
        console.error("Failed to parse user from localStorage during sync", e);
        localStorage.removeItem("user");
      }
      if (token !== currentToken) setToken(currentToken);
      if (JSON.stringify(user) !== JSON.stringify(currentUserData))
        setUser(currentUserData);
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChange", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, [token, user]);
  return { user, token, login, logout };
};
// --- END Auth Hook ---

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
import AdminSinglePublicationDetailPage from "./Page/Admin/AdminSinglePublicationDetailPage"; // <<<=== IMPORT THIS
import ProjectDetailPage from "./Page/ProjectDetailPage";

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

// --- Socket Manager ---
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification, fetchInitialNotifications } = useNotifications();
  const socketRef = useRef(null);
  const hasFetchedInitialRef = useRef(false);
  useEffect(() => {
    if (
      token &&
      !hasFetchedInitialRef.current &&
      typeof fetchInitialNotifications === "function"
    ) {
      fetchInitialNotifications();
      hasFetchedInitialRef.current = true;
    }
    if (!token) {
      hasFetchedInitialRef.current = false;
    }
    const cleanupSocket = () => {
      if (socketRef.current) {
        console.log(`🔌 Socket Disconnecting: ${socketRef.current.id}`);
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    if (!token) {
      cleanupSocket();
      return;
    }
    if (!socketRef.current || !socketRef.current.connected) {
      if (socketRef.current) {
        cleanupSocket();
      }
      console.log("Attempting to connect socket...");
      const newSocket = io(API_BASE, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
      });
      socketRef.current = newSocket;
      newSocket.on("connect", () =>
        console.log(`✅ Socket Connected: ${newSocket.id}`)
      );
      newSocket.on("disconnect", (reason) => {
        console.log(
          `🔌 Socket Disconnected: ${newSocket.id}, Reason: ${reason}`
        );
        if (socketRef.current?.id === newSocket.id) {
          socketRef.current = null;
        }
      });
      newSocket.on("connect_error", (error) =>
        console.error(
          `❌ Socket Connection Error (${newSocket.id || "attempting"}): ${
            error.message
          }`
        )
      );
      newSocket.on("notification", (data) => {
        console.log("Received notification event:", data);
        if (data?.notification && typeof addNewNotification === "function") {
          addNewNotification(data.notification);
        }
      });
    }
    return cleanupSocket;
  }, [token, API_BASE, addNewNotification, fetchInitialNotifications]);
  return null;
};

// +++ DOCUMENT EDITOR COMPONENT (Copied from your provided structure) +++
const API_BASE_URL_DOCS =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
}
const DocumentEditorComponent = ({ documentId, currentUser }) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const initialSlateValue = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    []
  );
  const [currentDocContent, setCurrentDocContent] = useState(initialSlateValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [docTitle, setDocTitle] = useState("No Document Selected");
  const apiClient = useMemo(() => {
    const currentToken = localStorage.getItem("authToken");
    return axios.create({
      baseURL: API_BASE_URL_DOCS,
      headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
    });
  }, [localStorage.getItem("authToken")]);
  useEffect(() => {
    if (!documentId) {
      setDocTitle("No Document Selected");
      setCurrentDocContent(initialSlateValue);
      setError("");
      setLoading(false);
      return;
    }
    if (!currentUser?.id) {
      setError("User not authenticated.");
      setDocTitle("Authentication Required");
      setCurrentDocContent(initialSlateValue);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setDocTitle(`Loading ${documentId}...`);
    apiClient
      .get(`/api/documents/${documentId}`)
      .then((response) => {
        if (response.data.success && response.data.data) {
          const fetchedContent =
            Array.isArray(response.data.data.content) &&
            response.data.data.content.length > 0
              ? response.data.data.content
              : initialSlateValue;
          setCurrentDocContent(fetchedContent);
          setDocTitle(response.data.data.title || "Untitled Document");
        } else {
          setError(response.data.message || "Failed to load document content.");
          setCurrentDocContent(initialSlateValue);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Error loading document.");
        setCurrentDocContent(initialSlateValue);
      })
      .finally(() => setLoading(false));
  }, [documentId, apiClient, initialSlateValue, currentUser]);
  const debouncedSave = useCallback(
    debounce((newValueToSave) => {
      if (!documentId || !currentUser?.id) return;
      const currentToken = localStorage.getItem("authToken");
      axios
        .put(
          `${API_BASE_URL_DOCS}/api/documents/${documentId}`,
          { content: newValueToSave },
          {
            headers: currentToken
              ? { Authorization: `Bearer ${currentToken}` }
              : {},
          }
        )
        .then((res) =>
          console.log("[DocEditor] Save successful:", res.data?.data?.title)
        )
        .catch((err) => {
          console.error("[DocEditor] Save error:", err.response || err);
          setError(err.response?.data?.message || "Error saving document.");
        });
    }, 2000),
    [documentId, currentUser?.id]
  );
  const handleEditorChange = (newValue) => {
    const isAstChange = editor.operations.some(
      (op) => op.type !== "set_selection"
    );
    if (isAstChange) {
      debouncedSave(newValue);
    }
  };
  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      {" "}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        {docTitle}
      </h2>{" "}
      {error && (
        <p className="text-red-600 bg-red-100 p-3 rounded mb-4 border border-red-300">
          {error}
        </p>
      )}{" "}
      {loading && documentId && (
        <div className="flex items-center justify-center p-10">
          <LoadingSpinner size="md" />{" "}
          <span className="ml-3 text-gray-600">Loading document...</span>
        </div>
      )}{" "}
      {!loading && (
        <Slate
          editor={editor}
          initialValue={currentDocContent}
          key={documentId || "editor-no-doc"}
          onChange={handleEditorChange}
        >
          {" "}
          <Editable
            placeholder="Start typing..."
            className="prose max-w-none p-3 border border-gray-300 rounded-md min-h-[300px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            spellCheck
            autoFocus={!!documentId}
            readOnly={!documentId || loading || !currentUser?.id}
          />{" "}
        </Slate>
      )}{" "}
    </div>
  );
};

// +++ DOCUMENT PAGE COMPONENT (Copied from your provided structure, renamed to avoid conflict) +++
const DocumentPageWrapper = ({ currentUser }) => {
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [docsList, setDocsList] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState("");
  const getApiClient = useCallback(() => {
    const token = localStorage.getItem("authToken");
    return axios.create({
      baseURL: API_BASE_URL_DOCS,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, []);
  const fetchUserDocuments = useCallback(() => {
    if (!currentUser?.id) {
      setErrorDocs("Please log in.");
      setDocsList([]);
      setIsLoadingDocs(false);
      return;
    }
    setIsLoadingDocs(true);
    setErrorDocs("");
    getApiClient()
      .get("/api/documents")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setDocsList(res.data.data);
        } else {
          setErrorDocs(res.data.message || "Failed to fetch.");
          setDocsList([]);
        }
      })
      .catch((err) => {
        setErrorDocs(err.response?.data?.message || "Error fetching.");
        setDocsList([]);
      })
      .finally(() => setIsLoadingDocs(false));
  }, [currentUser, getApiClient]);
  useEffect(() => {
    fetchUserDocuments();
  }, [fetchUserDocuments]);
  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      alert("Enter title.");
      return;
    }
    if (!currentUser?.id) {
      alert("Log in.");
      return;
    }
    try {
      const response = await getApiClient().post("/api/documents", {
        title: newDocTitle,
      });
      if (response.data.success && response.data.data) {
        const newDoc = response.data.data;
        alert(`Doc "${newDoc.title}" created!`);
        fetchUserDocuments();
        setCurrentDocumentId(newDoc.id);
        setNewDocTitle("");
      } else {
        alert(`Failed: ${response.data.message || "Unknown error"}`);
      }
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };
  if (!currentUser) {
    return (
      <div className="container mx-auto p-8 text-center">
        {" "}
        <p className="text-xl text-gray-700">
          {" "}
          Please{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:underline font-semibold"
          >
            log in
          </Link>{" "}
          to access documents.{" "}
        </p>{" "}
      </div>
    );
  }
  return (
    <div className="container mx-auto p-4 md:p-8">
      {" "}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        {" "}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          My Documents
        </h1>{" "}
        <p className="text-gray-600">Create, manage, and collaborate.</p>{" "}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center">
          {" "}
          <input
            type="text"
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            placeholder="New document title..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />{" "}
          <button
            onClick={handleCreateDocument}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-md transition-colors duration-150 ease-in-out shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {" "}
            Create Document{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {" "}
        <div className="md:col-span-1 bg-white p-4 md:p-6 rounded-lg shadow">
          {" "}
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
            Document List
          </h3>{" "}
          {isLoadingDocs && (
            <div className="flex items-center text-gray-500 py-2">
              <LoadingSpinner size="sm" />{" "}
              <span className="ml-2">Loading...</span>
            </div>
          )}{" "}
          {errorDocs && (
            <p className="text-red-500 bg-red-50 p-2 rounded border border-red-200">
              {errorDocs}
            </p>
          )}{" "}
          {!isLoadingDocs && docsList.length === 0 && !errorDocs && (
            <p className="text-gray-500 italic py-2">No documents yet.</p>
          )}{" "}
          <ul className="space-y-1 max-h-96 overflow-y-auto">
            {" "}
            {docsList.map((doc) => (
              <li
                key={doc.id}
                className={`block w-full text-left p-3 rounded-md cursor-pointer transition-colors ${
                  currentDocumentId === doc.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
                onClick={() => setCurrentDocumentId(doc.id)}
              >
                {" "}
                <span className="font-medium block truncate">
                  {doc.title || "Untitled"}
                </span>{" "}
                <span
                  className={`text-xs block ${
                    currentDocumentId === doc.id
                      ? "text-indigo-200"
                      : "text-gray-400"
                  }`}
                >
                  ID: {doc.id} | Updated:{" "}
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </span>{" "}
              </li>
            ))}{" "}
          </ul>{" "}
        </div>{" "}
        <div className="md:col-span-2">
          {" "}
          {currentDocumentId ? (
            <DocumentEditorComponent
              documentId={currentDocumentId}
              currentUser={currentUser}
            />
          ) : (
            !isLoadingDocs &&
            !errorDocs &&
            docsList.length > 0 && (
              <div className="bg-white p-10 rounded-lg shadow text-center text-gray-600">
                {" "}
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {" "}
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />{" "}
                </svg>{" "}
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Select a document
                </h3>{" "}
                <p className="mt-1 text-sm text-gray-500">
                  Choose from the list to view or edit.
                </p>{" "}
              </div>
            )
          )}{" "}
          {!isLoadingDocs &&
            !errorDocs &&
            docsList.length === 0 &&
            !currentDocumentId && (
              <div className="bg-white p-10 rounded-lg shadow text-center text-gray-600">
                {" "}
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />{" "}
                </svg>{" "}
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No documents available
                </h3>{" "}
                <p className="mt-1 text-sm text-gray-500">
                  Create your first document.
                </p>{" "}
              </div>
            )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
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

  const showPopupNotification = useCallback((message, type = "info") => {
    setPopupNotification({ message, type, show: true });
    setTimeout(
      () => setPopupNotification((p) => ({ ...p, show: false })),
      5000
    );
  }, []);

  useEffect(() => {
    setLoadingAuth(true);
    const userIsPresent = !!token && !!currentUser?.id;
    const userIsAdminResult = userIsPresent && currentUser?.role === "admin"; // Store result
    setIsLoggedIn(userIsPresent);
    setIsAdmin(userIsAdminResult); // Use stored result
    setLoadingAuth(false);
    // console.log(`Auth state: isLoggedIn=${userIsPresent}, isAdmin=${userIsAdminResult}, User:`, currentUser?.username);
  }, [token, currentUser]);

  const handleLogout = () => {
    logout(); /* navigate('/login'); */
  };

  if (loadingAuth) {
    return <LoadingScreen message="Initializing Application..." />;
  }

  return (
    <Router>
      <NormalizeURL />
      {isLoggedIn && token && (
        <SocketManager token={token} API_BASE={API_BASE} />
      )}
      <ConditionalNavbar
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="pt-16 md:pt-20 bg-gray-100 min-h-screen">
        <AnimatePresence>
          {popupNotification.show && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
              className="fixed top-20 right-5 z-[100] w-full max-w-sm"
            >
              <Notification
                message={popupNotification.message}
                type={popupNotification.type}
                onClose={() =>
                  setPopupNotification((p) => ({ ...p, show: false }))
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Routes>
          {/* --- Public Routes --- */}
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
          <Route
            path="/projects/:projectId"
            element={<ProjectDetailPage currentUser={currentUser} />}
          />

          {/* --- Auth Routes --- */}
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate
                  to={
                    isAdmin
                      ? "/admin"
                      : currentUser?.id
                      ? `/profile/${currentUser.id}`
                      : "/profile"
                  }
                  replace
                />
              ) : (
                <LoginPage
                  login={login}
                  showNotification={showPopupNotification}
                />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isLoggedIn ? (
                <Navigate
                  to={
                    isAdmin
                      ? "/admin"
                      : currentUser?.id
                      ? `/profile/${currentUser.id}`
                      : "/profile"
                  }
                  replace
                />
              ) : (
                <SignupPage />
              )
            }
          />
          <Route
            path="/signup/academic"
            element={
              <AcademicSignupForm showNotification={showPopupNotification} />
            }
          />
          <Route
            path="/signup/corporate"
            element={
              <CorporateSignupForm showNotification={showPopupNotification} />
            }
          />
          <Route
            path="/signup/medical"
            element={
              <MedicalSignupForm showNotification={showPopupNotification} />
            }
          />
          <Route
            path="/signup/not-researcher"
            element={
              <NotResearcherSignupForm
                showNotification={showPopupNotification}
              />
            }
          />

          {/* --- Protected USER Routes --- */}
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
                element={
                  <AccountSettingsPage
                    currentUser={currentUser}
                    showNotification={showPopupNotification}
                  />
                }
              />
              <Route
                path="/projects/new"
                element={
                  <CreateProjectPage
                    currentUser={currentUser}
                    showNotification={showPopupNotification}
                  />
                }
              />
              <Route
                path="/projects/edit/:projectId"
                element={
                  <EditProjectPage
                    currentUser={currentUser}
                    showNotification={showPopupNotification}
                  />
                }
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
              <Route
                path="/documents"
                element={<DocumentPageWrapper currentUser={currentUser} />}
              />{" "}
              {/* Using the wrapper */}
            </Route>
          </Route>

          {/* --- Protected ADMIN Routes --- */}
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
              {/* ✅ THIS IS THE CORRECTED/ADDED ROUTE FOR ADMIN SINGLE PUBLICATION VIEW */}
              <Route
                path="/admin/publications/:id/view"
                element={<AdminSinglePublicationDetailPage />}
              />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* --- Not Found Route --- */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

// --- Conditional Navbar Component ---
const ConditionalNavbar = ({ isLoggedIn, currentUser, onLogout }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  if (isAdminPath && isLoggedIn && currentUser?.role === "admin") {
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
