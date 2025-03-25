import React, { useState, useEffect } from "react";
import axios from "axios"; // Install with: npm install axios
import "./Admin.css";

function Admin() {
  const [researchers, setResearchers] = useState([]);

  useEffect(() => {
    // Fetch researchers from the backend on component mount
    const fetchResearchers = async () => {
      try {
        const token = localStorage.getItem("authToken"); //Get token from localStorage
        const response = await axios.get("/api/admin/researchers", {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in header
          },
        }); //  Updated URL
        setResearchers(response.data);
      } catch (error) {
        console.error("Error fetching researchers:", error);
        //Handle error
      }
    };

    fetchResearchers();
  }, []); // Empty dependency array means this runs only once on mount

  const approveResearcher = async (id) => {
    try {
      const token = localStorage.getItem("authToken"); // Get token from localStorage
      await axios.put(
        `/api/admin/researchers/${id}`,
        { approved: true },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token in header
          },
        }
      ); // Updated URL
      // Update the local state to reflect the change
      setResearchers((prev) =>
        prev.map((res) => (res.id === id ? { ...res, approved: true } : res))
      );
    } catch (error) {
      console.error("Error approving researcher:", error);
      //Handle error
    }
  };

  const deleteResearcher = async (id) => {
    try {
      const token = localStorage.getItem("authToken"); //Get token from localStorage
      await axios.delete(`/api/admin/researchers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`, //Include token in header
        },
      }); // Updated URL
      // Update local state to remove the deleted researcher
      setResearchers((prev) => prev.filter((res) => res.id !== id));
    } catch (error) {
      console.error("Error deleting researcher:", error);
      //Handle Error
    }
  };

  const addResearcher = async () => {
    try {
      const token = localStorage.getItem("authToken"); //Get token from localStorage
      const response = await axios.post(
        "/api/admin/researchers",
        {
          // Updated URL
          name: "New Researcher",
          field: "Field",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, //Include token in header
          },
        }
      );
      // Update local state with the new researcher
      setResearchers((prev) => [...prev, response.data]);
    } catch (error) {
      console.error("Error adding researcher:", error);
      //Handle error
    }
  };

  // if (!isAdmin) {
  //   return (
  //     <div className="admin-container">
  //       <h1>Access Denied</h1>
  //       <p>You do not have permission to view this page.</p>
  //     </div>
  //   );
  // }

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
