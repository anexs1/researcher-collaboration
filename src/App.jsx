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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
        });
    }
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem("token");
  }, []);

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/publications" element={<Publication />} />

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

        {isLoggedIn && (
          <>
            <Route path="/messages" element={<Messages />} />
            <Route path="/researchers" element={<Researchers />} />
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/profile" element={<Profile />} />
          </>
        )}

        {isAdmin && <Route path="/admin" element={<Admin />} />}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
