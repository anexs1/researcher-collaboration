import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axios from "axios"; // Or your preferred HTTP client

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("authToken")); // Initialize token from localStorage
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial auth check

  // Function to set token in state and localStorage
  const handleSetToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem("authToken", newToken);
      setToken(newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`; // Set default header
    } else {
      localStorage.removeItem("authToken");
      setToken(null);
      delete axios.defaults.headers.common["Authorization"]; // Remove default header
    }
  }, []);

  // Function to fetch user profile based on token
  const fetchUserProfile = useCallback(
    async (currentToken) => {
      if (!currentToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Assume you have an endpoint like /api/auth/me to get user profile
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        setUser(response.data.user || response.data); // Adjust based on your API response structure
      } catch (error) {
        console.error(
          "AuthContext: Failed to fetch user profile",
          error.response?.data || error.message
        );
        handleSetToken(null); // Clear token if invalid or fetch fails
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [handleSetToken]
  );

  // Effect to check authentication status on initial load
  useEffect(() => {
    const currentToken = localStorage.getItem("authToken");
    if (currentToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${currentToken}`;
      fetchUserProfile(currentToken);
    } else {
      setIsLoading(false); // No token, not loading
    }
  }, [fetchUserProfile]); // Run only once on mount basically via fetchUserProfile dependency

  // Login function (example)
  const login = async (credentials) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        credentials
      );
      const { token: newToken, user: userData } = response.data; // Adjust based on your API response
      handleSetToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log("AuthContext: Logging out.");
    handleSetToken(null); // Clear token
    setUser(null);
    // Optionally: redirect user or clear other state
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    // You might need signup, etc.
  };

  // Don't render children until initial auth check is done
  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading Authentication...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
