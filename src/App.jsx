import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Admin from "./Page/Admin";
import Home from "./Page/Home";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import Researcher from "./Page/Researcher";
import Navbar from "./Component/Navbar";
import Register from "./Page/Register";
import LoginPage from "./Page/LoginPage";

function App() {
  const [isAdmin, setIsAdmin] = useState(false); // Admin state to control admin access
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Add login state here

  return (
    <Router>
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        setIsAdmin={setIsAdmin}
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

        {/* Admin Section */}
        <Route
          path="/admin"
          element={isAdmin ? <Admin /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
