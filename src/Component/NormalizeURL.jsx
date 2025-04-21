// src/Component/NormalizeURL.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NormalizeURL = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/{2,}/g, "/");
    if (location.pathname !== normalizedPath) {
      navigate(normalizedPath + location.search, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default NormalizeURL;
