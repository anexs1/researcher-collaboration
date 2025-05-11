import { useState, useCallback, useEffect } from "react";

const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage on init", e);
      localStorage.removeItem("user");
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("authChange"));
  }, []);

  const login = useCallback((userData, authToken) => {
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    window.dispatchEvent(new Event("authChange"));
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      const currentTokenFromStorage = localStorage.getItem("authToken");
      const currentUserJsonFromStorage = localStorage.getItem("user");
      let currentUserDataFromStorage = null;

      if (currentUserJsonFromStorage) {
        try {
          currentUserDataFromStorage = JSON.parse(currentUserJsonFromStorage);
        } catch (e) {
          console.error("Auth Sync: Failed to parse user from localStorage", e);
          localStorage.removeItem("user");
        }
      }

      if (token !== currentTokenFromStorage) {
        setToken(currentTokenFromStorage);
      }

      const userStateString = user ? JSON.stringify(user) : "null";
      const userStorageString = currentUserDataFromStorage
        ? JSON.stringify(currentUserDataFromStorage)
        : "null";

      if (userStateString !== userStorageString) {
        setUser(currentUserDataFromStorage);
      }

      if (currentTokenFromStorage && !currentUserDataFromStorage) {
        console.warn(
          "Auth Sync: Token exists but no valid user data from storage. Forcing logout."
        );
        logout();
      } else if (!currentTokenFromStorage && currentUserDataFromStorage) {
        console.warn(
          "Auth Sync: User data exists but no token from storage. Forcing logout."
        );
        logout();
      }
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChange", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, [token, user, login, logout]);

  return { user, token, login, logout };
};

export default useAuth; // Export as default (common for hooks)
// OR export const useAuth = () => { ... }; // If you prefer named export
