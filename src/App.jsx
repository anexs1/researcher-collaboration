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
import Announcements from "./Page/Announcements"; // ✅ Import the new component

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
        <Route path="/researchers" element={<Researchers />} />
        <Route path="/publication" element={<Publication />} />
        <Route path="/register" element={<Register />} />
        <Route path="/announcements" element={<Announcements />} />{" "}
        {/* ✅ Add new route */}
        <Route
          path="/login"
          element={
            <LoginPage setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
          }
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
