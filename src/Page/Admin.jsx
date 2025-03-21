import { useState } from "react";
import "./Admin.css";

function Admin() {
  const [researchers, setResearchers] = useState([
    { id: 1, name: "Dr. Amanuel Teshome", field: "AI & ML", approved: true },
    {
      id: 2,
      name: "Prof. Bethel Mekonnen",
      field: "Cybersecurity",
      approved: false,
    },
  ]);

  const approveResearcher = (id) => {
    setResearchers((prev) =>
      prev.map((res) => (res.id === id ? { ...res, approved: true } : res))
    );
  };
  const deleteResearcher = (id) => {
    setResearchers((prev) => prev.filter((res) => res.id !== id));
  };
  // Add new researcher
  const addResearcher = () => {
    setResearchers((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: "New Researcher",
        field: "Field",
        approved: false,
      },
    ]);
  };

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>

      <main>
        {/* Manage Researchers */}
        <section className="task">
          <h3>Manage Researchers</h3>
          <ul className="researcher-list">
            {researchers.map((researcher) => (
              <li key={researcher.id} className="researcher-item">
                <p>
                  {researcher.name} ({researcher.field}) -{" "}
                  {researcher.approved ? "✅ Approved" : "⏳ Pending"}
                </p>
                {!researcher.approved && (
                  <button onClick={() => approveResearcher(researcher.id)}>
                    Approve
                  </button>
                )}
                <button onClick={() => deleteResearcher(researcher.id)}>
                  Delete
                </button>
              </li>
            ))}
            <button onClick={addResearcher}>Add New Researcher</button>
          </ul>
        </section>

        {/* System Settings */}
        <section className="task">
          <h3>System Settings</h3>
          <button className="submit-btn">Update System Settings</button>
        </section>

        {/* Additional Admin Features */}
        <section className="task">
          <h3>Admin Features</h3>
          <ul>
            <li>
              <a href="/stats">View Stats</a>
            </li>
            <li>
              <a href="/chat">Manage Chat</a>
            </li>
            <li>
              <a href="/settings">System Configurations</a>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default Admin;
