import React, { useState } from "react";
import { Link } from "react-router-dom";

function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [researchers, setResearchers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    field: "",
    bio: "",
    image: null,
  });

  // Handle admin login
  const handleAdminLogin = () => {
    const password = "admin123"; // Hardcoded for demo
    if (adminPassword === password) {
      setIsAdmin(true);
      setAdminPassword("");
      alert("Admin login successful!");
    } else {
      alert("Incorrect password. Access denied.");
    }
  };

  // Handle delete
  const handleDelete = (index) => {
    const updatedResearchers = researchers.filter((_, i) => i !== index);
    setResearchers(updatedResearchers);
  };

  // Handle edit
  const handleEdit = (index) => {
    const researcherToEdit = researchers[index];
    setFormData(researcherToEdit);
    const updatedResearchers = researchers.filter((_, i) => i !== index);
    setResearchers(updatedResearchers);
  };
  const handleshare = (index) => {
    const update = researchers[index].share;
    setResearchers(
      researchers.map((researcher, i) => {
        if (i === index) {
          return { ...researcher, share: !update };
        }
        return researcher;
      })
    );
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="list-group">
            <Link
              to="/admin"
              className="list-group-item list-group-item-action"
            >
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="list-group-item list-group-item-action"
            >
              Users
            </Link>
            <Link
              to="/admin/settings"
              className="list-group-item list-group-item-action"
            >
              Settings
            </Link>
            <Link
              to="/admin/publication"
              className="list-group-item list-group-item-action"
            >
              Publications
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <div className="card mb-4">
            <div className="card-header">
              <h4>Admin Dashboard</h4>
            </div>
            <div className="card-body">
              {!isAdmin ? (
                <div>
                  <h3>Admin Login</h3>
                  <input
                    type="password"
                    className="form-control mb-2"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <button
                    className="btn btn-warning"
                    onClick={handleAdminLogin}
                  >
                    Login as Admin
                  </button>
                </div>
              ) : (
                <div>
                  <h3>Admin Mode</h3>
                  <button
                    className="btn btn-danger"
                    onClick={handleAdminLogout}
                  >
                    Logout
                  </button>

                  {/* Researcher Management */}
                  <h3>Manage Researchers</h3>
                  <ul className="list-group">
                    {researchers.map((res, index) => (
                      <li key={index} className="list-group-item">
                        <h5>{res.name}</h5>
                        <p>
                          <strong>Field:</strong> {res.field}
                        </p>
                        <p>{res.bio}</p>
                        {res.image && (
                          <img
                            src={res.image}
                            alt={res.name}
                            style={{ width: "100px", height: "100px" }}
                          />
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(index)}
                        >
                          Delete
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEdit(index)}
                        >
                          Edit
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
