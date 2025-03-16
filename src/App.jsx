import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Admin from "./Page/Admin";
import Home from "./Page/Home";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Researchers from "./Page/Researchers";
import Explore from "./Page/Explore";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";

// Components
import Navbar from "./Component/Navbar";

function App() {
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem("isAdmin") === "true"
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true"
  );

  // Sync localStorage with state
  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
    localStorage.setItem("isAdmin", isAdmin);
  }, [isLoggedIn, isAdmin]);

  // Logout handler
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
  }, []);

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <Routes>
        {/* Public Routes (Accessible without login) */}
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/publications" element={<Publication />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/my-projects" element={<MyProjects />} />

        {/* Login and Signup Routes */}
        <Route path="/admin/login" element={<LoginPage admin={true} />} />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/profile" />
            ) : (
              <LoginPage
                setIsLoggedIn={setIsLoggedIn}
                setIsAdmin={setIsAdmin}
              />
            )
          }
        />
        <Route
          path="/signup"
          element={isLoggedIn ? <Navigate to="/profile" /> : <SignupPage />}
        />

        {/* Protected Routes (Require login) */}
        {isLoggedIn && (
          <>
            <Route path="/messages" element={<Messages />} />
            <Route path="/researchers" element={<Researchers />} />
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/profile" element={<Profile />} />
          </>
        )}

        {/* Admin Route */}
        <Route
          path="/admin"
          element={isAdmin ? <Admin /> : <Navigate to="/admin" />}
        />

        {/* Catch-All Redirect (For Unauthenticated Users) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
