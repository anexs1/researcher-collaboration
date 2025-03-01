import React, { useState } from "react";

function Publication() {
  const [newPublication, setNewPublication] = useState("");

  const handleAddPublication = () => {
    console.log("New Publication Added:", newPublication);
    setNewPublication(""); // Reset the input field
  };

  return (
    <div className="container mt-4">
      <h3>Publications</h3>

      {/* Form to Add a New Publication */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Add new publication"
          value={newPublication}
          onChange={(e) => setNewPublication(e.target.value)}
        />
      </div>
      <button onClick={handleAddPublication} className="btn btn-primary">
        Add Publication
      </button>

      <hr />

      <p>Manage all publications here.</p>
      {/* Render the list of publications here */}
    </div>
  );
}

export default Publication;
