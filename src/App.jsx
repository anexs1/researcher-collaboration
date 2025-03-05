import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Admin from "./Page/Admin";
import Home from "./Page/Home";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import Researcher from "./Page/Researcher";
import Navbar from "./Component/Navbar";
import Register from "./Page/Register";
import LoginPage from "./Page/LoginPage";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        isAdmin={isAdmin}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/researcher" element={<Researcher />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/login"
          element={
            <LoginPage setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
          }
        />
        <Route path="/publication" element={<Publication />} />
        <Route
          path="/admin"
          element={isAdmin ? <Admin /> : <Navigate to="/" />}
        />
      </Routes>
    </>
  );
}

export default App;
