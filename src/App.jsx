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
import { createEditor, Node as SlateNode } from "slate"; // Corrected SlateNode import
import { Slate, Editable, withReact } from "slate-react";
import axios from "axios";

// --- Context Imports ---
import { useNotifications } from "./context/NotificationContext";

// --- MOCK Auth Hook (keep your actual useAuth if you have one) ---
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
import ProjectDetailPage from "./Page/ProjectDetailPage";

// --- Helper Components ---
const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center h-screen text-lg font-medium text-gray-700 bg-gray-100">
    <LoadingSpinner size="lg" /> <p className="mt-4">{message}</p>
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
// --- Socket Manager (Keep As Is) ---
// =========================================================================
const SocketManager = ({ token, API_BASE }) => {
  const { addNewNotification, fetchInitialNotifications } = useNotifications();
  const socketRef = useRef(null);
  const hasFetchedInitial = useRef(false);
  useEffect(() => {
    if (token && !hasFetchedInitial.current) {
      fetchInitialNotifications();
      hasFetchedInitial.current = true;
    }
    if (!token) {
      hasFetchedInitial.current = false;
    }
    const cleanupSocket = () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error");
        socketRef.current.off("notification");
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
      const newSocket = io(API_BASE, {
        auth: { token: token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
      });
      socketRef.current = newSocket;
      newSocket.on("connect", () =>
        console.log(`✅ [Socket Event - ${newSocket.id}] Connected.`)
      );
      newSocket.on("disconnect", (reason) => {
        if (socketRef.current?.id === newSocket.id) socketRef.current = null;
      });
      newSocket.on("connect_error", (err) =>
        console.error(
          `❌ [Socket Event - ${newSocket.id || "_attempt_"}] Err: ${
            err.message
          }`
        )
      );
      newSocket.on("notification", (data) => {
        if (data?.notification && data?.type && addNewNotification)
          addNewNotification(data.notification);
      });
    }
    return cleanupSocket;
  }, [token, API_BASE, addNewNotification, fetchInitialNotifications]);
  return null;
};
// ============================================
// --- End Socket Manager ---
// ============================================

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++ START: DOCUMENT EDITOR COMPONENT +++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const API_BASE_URL_DOCS =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

const DocumentEditorComponent = ({ documentId, currentUser }) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const initialSlateValue = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    []
  );
  const [editorValue, setEditorValue] = useState(initialSlateValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [docTitle, setDocTitle] = useState("No Document Selected");

  // +++ DEBUG LOG: What props are received by the editor? +++
  useEffect(() => {
    console.log(
      `%c[DocumentEditor] Props received - documentId: ${documentId}, currentUser: ${!!currentUser}`,
      "color: blue; font-weight: bold;"
    );
  }, [documentId, currentUser]);

  const apiClient = useMemo(() => {
    const token = localStorage.getItem("authToken");
    return axios.create({
      baseURL: API_BASE_URL_DOCS,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, []);

  useEffect(() => {
    // +++ DEBUG LOG: Inside the data fetching useEffect +++
    console.log(
      `%c[DocumentEditor] Fetch useEffect triggered. documentId: ${documentId}`,
      "color: green;"
    );

    if (!documentId) {
      console.log("[DocumentEditor] No documentId, resetting editor state.");
      setDocTitle("No Document Selected");
      setEditorValue(initialSlateValue); // Reset to initial empty state
      setError("");
      setLoading(false);
      return;
    }

    if (!currentUser || !currentUser.id) {
      console.log(
        "[DocumentEditor] No currentUser, cannot fetch. Resetting editor state."
      );
      setError("User not authenticated. Cannot load document.");
      setDocTitle("Authentication Required");
      setEditorValue(initialSlateValue);
      setLoading(false);
      return;
    }

    console.log(
      `%c[DocumentEditor] Attempting to fetch document /api/documents/${documentId}`,
      "color: orange; font-weight: bold;"
    );
    setLoading(true);
    setError("");
    setDocTitle(`Loading document ${documentId}...`);

    apiClient
      .get(`/api/documents/${documentId}`)
      .then((response) => {
        console.log(
          `[DocumentEditor] API response for doc ${documentId}:`,
          response.data
        );
        if (response.data.success) {
          // Ensure content is an array, otherwise use initialSlateValue
          const fetchedContent =
            Array.isArray(response.data.data.content) &&
            response.data.data.content.length > 0
              ? response.data.data.content
              : initialSlateValue;
          setEditorValue(fetchedContent);
          setDocTitle(response.data.data.title || "Untitled Document");
        } else {
          setError(response.data.message || "Failed to load document");
          setEditorValue(initialSlateValue);
        }
      })
      .catch((err) => {
        console.error(
          `[DocumentEditor] Error fetching document ${documentId}:`,
          err.response || err.message || err
        );
        setError(
          err.response?.data?.message || "Error loading document content."
        );
        setEditorValue(initialSlateValue);
      })
      .finally(() => setLoading(false));
  }, [documentId, apiClient, initialSlateValue, currentUser]);

  const debouncedSave = useCallback(
    debounce((newValue) => {
      if (!documentId || !currentUser || !currentUser.id) {
        console.warn(
          "[DocumentEditor] Save skipped: No document ID or user not authenticated."
        );
        return;
      }
      console.log(`[DocumentEditor] Debounced save for doc ID: ${documentId}`);
      apiClient
        .put(`/api/documents/${documentId}`, { content: newValue })
        .then((response) => {
          console.log(
            "[DocumentEditor] Document saved successfully:",
            response.data.data.title
          );
        })
        .catch((err) => {
          console.error("[DocumentEditor] Error saving document:", err);
          setError(err.response?.data?.message || "Error saving document.");
        });
    }, 2000),
    [documentId, apiClient, currentUser]
  );

  const handleEditorChange = (newValue) => {
    setEditorValue(newValue);
    const isAstChange = editor.operations.some(
      (op) => op.type !== "set_selection"
    );
    if (isAstChange) {
      debouncedSave(newValue);
    }
  };

  if (loading && documentId) {
    return (
      <div className="flex items-center justify-center p-10 bg-white rounded-lg shadow">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Loading document...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">{docTitle}</h2>
      {error && (
        <p className="text-red-600 bg-red-100 p-3 rounded mb-4 border border-red-300">
          {error}
        </p>
      )}

      {!loading && (
        <Slate
          editor={editor}
          initialValue={editorValue}
          key={documentId || "editor-no-doc-selected"} // Key to re-initialize Slate
          onChange={handleEditorChange}
        >
          <Editable
            placeholder="Start typing your document here..."
            className="prose max-w-none p-3 border border-gray-300 rounded-md min-h-[300px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            spellCheck
            autoFocus={!!documentId}
            readOnly={!documentId || loading}
          />
        </Slate>
      )}
    </div>
  );
};
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++ END: DOCUMENT EDITOR COMPONENT +++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++ START: DOCUMENT PAGE COMPONENT +++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const DocumentPageComponent = ({ currentUser }) => {
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [docsList, setDocsList] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState("");

  // +++ DEBUG LOG: Check the value of currentDocumentId whenever the component re-renders +++
  console.log(
    "%c[DocumentPage] currentDocumentId STATE:",
    "color: purple;",
    currentDocumentId
  );

  const apiClient = useMemo(() => {
    const token = localStorage.getItem("authToken");
    return axios.create({
      baseURL: API_BASE_URL_DOCS,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, []);

  const fetchUserDocuments = useCallback(() => {
    console.log(
      "[DocumentPage] fetchUserDocuments called. CurrentUser:",
      !!currentUser
    );
    if (!currentUser || !currentUser.id) {
      setErrorDocs("Please log in to see your documents.");
      setDocsList([]);
      setIsLoadingDocs(false);
      return;
    }
    setIsLoadingDocs(true);
    setErrorDocs("");
    apiClient
      .get("/api/documents")
      .then((res) => {
        console.log("[DocumentPage] Fetched documents list:", res.data);
        if (res.data.success) setDocsList(res.data.data);
        else setErrorDocs(res.data.message || "Failed to fetch documents.");
      })
      .catch((err) => {
        console.error("[DocumentPage] Error fetching documents list:", err);
        setErrorDocs(
          err.response?.data?.message || "Could not load your documents."
        );
      })
      .finally(() => setIsLoadingDocs(false));
  }, [apiClient, currentUser]);

  useEffect(() => {
    fetchUserDocuments();
  }, [fetchUserDocuments]);

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      alert("Please enter a title for the new document.");
      return;
    }
    if (!currentUser || !currentUser.id) {
      alert("You must be logged in to create a document.");
      return;
    }
    console.log(
      "[DocumentPage] handleCreateDocument called with title:",
      newDocTitle
    );
    try {
      const response = await apiClient.post("/api/documents", {
        title: newDocTitle,
      });
      console.log("[DocumentPage] Create document response:", response.data);
      if (response.data.success) {
        const newDoc = response.data.data;
        alert(`Document "${newDoc.title}" created!`);
        fetchUserDocuments();
        setCurrentDocumentId(newDoc.id);
        setNewDocTitle("");
      } else {
        alert(`Failed to create document: ${response.data.message}`);
      }
    } catch (error) {
      console.error("[DocumentPage] Error creating document:", error);
      alert(
        `Error creating document: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p className="text-xl text-gray-700">
          Please{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:underline font-semibold"
          >
            log in
          </Link>{" "}
          to access and manage your documents.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Documents</h1>
        <p className="text-gray-600">
          Create, manage, and collaborate on your research documents.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            placeholder="Enter new document title..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button
            onClick={handleCreateDocument}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-md transition-colors duration-150 ease-in-out shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-4 md:p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
            Document List
          </h3>
          {isLoadingDocs && (
            <div className="flex items-center text-gray-500 py-2">
              {" "}
              <LoadingSpinner size="sm" />{" "}
              <span className="ml-2">Loading documents...</span>
            </div>
          )}
          {errorDocs && (
            <p className="text-red-500 bg-red-50 p-2 rounded border border-red-200">
              {errorDocs}
            </p>
          )}
          {!isLoadingDocs && docsList.length === 0 && !errorDocs && (
            <p className="text-gray-500 italic py-2">
              No documents found. Create one to get started!
            </p>
          )}
          <ul className="space-y-1 max-h-96 overflow-y-auto">
            {docsList.map((doc) => (
              <li
                key={doc.id}
                className={`block w-full text-left p-3 rounded-md cursor-pointer transition-colors duration-150 ease-in-out
                                 ${
                                   currentDocumentId === doc.id
                                     ? "bg-indigo-600 text-white shadow-md"
                                     : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                                 }`}
                onClick={() => {
                  console.log(
                    `%c[DocumentPage] "Open" clicked for doc ID: ${doc.id}. Previous currentDocumentId: ${currentDocumentId}`,
                    "color: magenta; font-weight: bold;"
                  );
                  setCurrentDocumentId(doc.id);
                }}
              >
                <span className="font-medium block truncate">
                  {doc.title || "Untitled Document"}
                </span>
                <span
                  className={`text-xs block ${
                    currentDocumentId === doc.id
                      ? "text-indigo-200"
                      : "text-gray-400"
                  }`}
                >
                  ID: {doc.id} | Updated:{" "}
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          {/* +++ DEBUG LOG: What ID is being passed to DocumentEditorComponent? +++ */}
          {console.log(
            "%c[DocumentPage] Rendering DocumentEditorComponent with documentId PROPS:",
            "color: purple;",
            currentDocumentId
          )}

          {currentDocumentId ? (
            <DocumentEditorComponent
              documentId={currentDocumentId}
              currentUser={currentUser}
            />
          ) : (
            !isLoadingDocs &&
            !errorDocs && (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500 h-full flex flex-col justify-center items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-xl">Select a document to begin.</p>
                <p className="text-sm">
                  Choose a document from the list on the left, or create a new
                  one.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++ END: DOCUMENT PAGE COMPONENT +++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

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
  }, [token, currentUser]);

  const handleLogout = logout;

  if (loadingAuth && isLoggedIn === null) {
    return <LoadingScreen message="Initializing Application..." />;
  }

  return (
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
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
              className="fixed top-20 right-5 z-[100] w-full max-w-sm"
            >
              <Notification
                message={popupNotification.message}
                type={popupNotification.type}
                onClose={() =>
                  setPopupNotification((prev) => ({ ...prev, show: false }))
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

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
          <Route
            path="/projects/:projectId"
            element={<ProjectDetailPage currentUser={currentUser} />}
          />

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
              <Route
                path="/documents"
                element={<DocumentPageComponent currentUser={currentUser} />}
              />
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
