import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Admin from "./Page/Admin";
import Home from "./Page/Home";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication"; // Ensure this import is correct
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Researchers from "./Page/Researchers";
import Announcements from "./Page/Announcements";
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
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
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
        <Route path="/explore" element={<Explore />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/my-projects" element={<MyProjects />} />
        <Route path="/publications" element={<Publication />} />{" "}
        {/* Ensure this route is correct */}
        {/* Protected Routes */}
        {isLoggedIn ? (
          <>
            <Route path="/messages" element={<Messages />} />
            <Route path="/researchers" element={<Researchers />} />
            <Route path="/publication" element={<Publication />} />
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/profile" element={<Profile />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
        {/* Admin Route */}
        <Route
          path="/admin"
          element={isAdmin ? <Admin /> : <Navigate to="/" />}
        />
        {/* Catch-All Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
