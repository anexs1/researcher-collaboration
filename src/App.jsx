import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Admin from "./Page/Admin";
import Home from "./Page/Home";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import Navbar from "./Component/Navbar";
import Register from "./Page/Register";
import LoginPage from "./Page/LoginPage";
import Researchers from "./Page/Researchers";
import Announcements from "./Page/Announcements";
import Explore from "./Page/Explore";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";

function App() {
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem("isAdmin") === "true"
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true"
  );

  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
    localStorage.setItem("isAdmin", isAdmin);
  }, [isLoggedIn, isAdmin]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
  };

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <LoginPage setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
          }
        />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/explore"
          element={isLoggedIn ? <Explore /> : <Navigate to="/login" />}
        />
        <Route
          path="/messages"
          element={isLoggedIn ? <Messages /> : <Navigate to="/login" />}
        />
        <Route
          path="/researchers"
          element={isLoggedIn ? <Researchers /> : <Navigate to="/login" />}
        />
        <Route
          path="/publication"
          element={isLoggedIn ? <Publication /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-projects"
          element={isLoggedIn ? <MyProjects /> : <Navigate to="/login" />}
        />
        <Route
          path="/announcements"
          element={isLoggedIn ? <Announcements /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isLoggedIn ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={isAdmin ? <Admin /> : <Navigate to="/" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
