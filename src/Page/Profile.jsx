import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = ({ setIsLoggedIn, setIsAdmin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === "admin" && password === "admin123") {
      setIsAdmin(true);
      setIsLoggedIn(true);
      navigate("/admin"); // Redirect to Admin Page
    } else if (username === "user" && password === "user123") {
      setIsAdmin(false);
      setIsLoggedIn(true);
      navigate("/"); // Redirect to Home Page
    } else {
      setError("Invalid username or password!");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginPage;
