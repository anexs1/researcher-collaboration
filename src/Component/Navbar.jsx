import { Link } from "react-router-dom";

const Navbar = ({ isLoggedIn, setIsLoggedIn, isAdmin }) => {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/profile">Profile</Link>
        </li>
        <li>
          <Link to="/researcher">Researchers</Link>
        </li>
        <li>
          <Link to="/publication">Publications</Link>
        </li>

        {isAdmin && (
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        )}

        {isLoggedIn ? (
          <li>
            <button onClick={() => setIsLoggedIn(false)}>Logout</button>
          </li>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
