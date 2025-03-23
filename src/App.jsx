import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
// Pages
import Admin from "./Page/Admin";
import Home from "./Page/Home";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Explore from "./Page/Explore";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";

// Components
import Navbar from "./Component/Navbar";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // On mount, check if the user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsLoggedIn(true);
            setIsAdmin(data.role === "admin");
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }
  }, []);

  // Logout function
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem("token");
  }, []);

  return (
    <>
      {/* Navbar with ProfileMenu component */}
      <Navbar
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/publications" element={<Publication />} />
        {/* <Route path="/research" element={<ResearchPage />} /> */}

        {/* Authentication Routes */}
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

        {/* Protected Routes - Only accessible if logged in */}
        {isLoggedIn && (
          <>
            <Route path="/messages" element={<Messages />} />
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/profile" element={<Profile />} />
            {/* <Route path="/research" element={<ResearchPage />} /> */}
          </>
        )}

        {/* Admin Routes */}
        {isAdmin && <Route path="/admin" element={<Admin />} />}

        {/* Redirect all other undefined routes to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
