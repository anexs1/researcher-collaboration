// AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    isAdmin: false,
    user: null,
    isLoading: true,
  });

  // Simulate checking auth status (replace with your actual auth check)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Replace with your actual auth check logic
        const token = localStorage.getItem("token");
        if (token) {
          // Verify token and get user data
          setAuthState({
            isLoggedIn: true,
            isAdmin: false, // Set based on actual user role
            user: {}, // User data
            isLoading: false,
          });
        } else {
          setAuthState({
            isLoggedIn: false,
            isAdmin: false,
            user: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthState({
          isLoggedIn: false,
          isAdmin: false,
          user: null,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    // Your login logic
  };

  const logout = () => {
    // Your logout logic
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
