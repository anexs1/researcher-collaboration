import React, { useEffect, useState, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import "./index.css";

import Home from "./Page/Home";
import Explore from "./Page/Explore";
import SignupPage from "./Page/SignupPage";
import LoginPage from "./Page/LoginPage";
import Profile from "./Page/Profile";
import Publication from "./Page/Publication";
import MyProjects from "./Page/MyProjects";
import Messages from "./Page/Messages";
import AcademicSignupForm from "./Component/AcademicSignupForm";
import CorporateSignupForm from "./Component/CorporateSignupForm";
import MedicalSignupForm from "./Component/MedicalSignupForm";
import NotResearcherSignupForm from "./Component/NotResearcherSignupForm";
import ProfileAccount from "./Component/ProfileAccount";
import ProfileAbout from "./Component/ProfileAbout";
import ProfileEducation from "./Component/ProfileEducation";
import ProfileSkills from "./Component/ProfileSkills";
import ProfileResearch from "./Component/ProfileResearch";
import Navbar from "./Component/Navbar";
import AdminDashboardPage from "./Page/Admin/AdminDashboardPage";
import AdminUsersPage from "./Page/Admin/AdminUsersPage";
import AdminSettingsPage from "./Page/Admin/AdminSettingsPage";
import AdminReportsPage from "./Page/Admin/AdminReportsPage";

const AdminLayout = ({ isAdmin }) => {
  if (isAdmin === null) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Loading Admin Access...
      </div>
    );
  }
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

// --- App Entry Point ---
function App() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null);
      return;
    }

    axios
      .post(
        "http://localhost:5000/api/auth/validate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        if (response.data.success && response.data.user) {
          setIsLoggedIn(true);
          const isAdminUser = response.data.user.role === "admin";
          setIsAdmin(isAdminUser);
          setCurrentUser(response.data.user);
        } else {
          handleLogout();
        }
      })
      .catch(() => {
        handleLogout();
      });
  }, [handleLogout]);

  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        Loading Application...
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        currentUser={currentUser}
        handleLogout={handleLogout}
        setIsLoggedIn={setIsLoggedIn}
        setIsAdmin={setIsAdmin}
        setCurrentUser={setCurrentUser}
      />
    </Router>
  );
}

// --- Internal App Routes (safe useLocation here) ---
const AppRoutes = ({
  isLoggedIn,
  isAdmin,
  currentUser,
  handleLogout,
  setIsLoggedIn,
  setIsAdmin,
  setCurrentUser,
}) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && (
        <Navbar
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      <main className="pt-16 md:pt-20">
        <Routes>
          {/* --- Public --- */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />

          {/* --- Auth --- */}
          <Route
            path="/signup"
            element={
              currentUser ? (
                <Navigate to="/profile/account" replace />
              ) : (
                <SignupPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              currentUser ? (
                isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/profile/account" replace />
                )
              ) : (
                <LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  setCurrentUser={setCurrentUser}
                  isForAdmin={false}
                />
              )
            }
          />
          <Route
            path="/admin-login"
            element={
              currentUser ? (
                isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/profile/account" replace />
                )
              ) : (
                <LoginPage
                  setIsLoggedIn={setIsLoggedIn}
                  setIsAdmin={setIsAdmin}
                  setCurrentUser={setCurrentUser}
                  isForAdmin={true}
                />
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

          {/* --- Protected User Routes --- */}
          <Route
            path="/profile"
            element={
              currentUser ? (
                <Profile currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<ProfileAccount />} />
            <Route path="about" element={<ProfileAbout />} />
            <Route path="education" element={<ProfileEducation />} />
            <Route path="skills" element={<ProfileSkills />} />
            <Route path="research" element={<ProfileResearch />} />
          </Route>

          <Route
            path="/publications"
            element={
              currentUser ? (
                <Publication currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/my-projects"
            element={
              currentUser ? (
                <MyProjects currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/messages"
            element={
              currentUser ? (
                <Messages currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/Explore"
            element={
              currentUser ? (
                <Explore currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* --- Protected Admin Routes --- */}
          <Route path="/admin" element={<AdminLayout isAdmin={isAdmin} />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>

          {/* --- Catch-all --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
