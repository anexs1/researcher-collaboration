import React, { useState } from "react";
import axios from "axios";

function CollaborationRequestForm() {
  const [details, setDetails] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestData = { details };
    try {
      await axios.post("/api/collaboration-request", requestData);
      alert("Collaboration request submitted!");
    } catch (error) {
      alert("Error submitting request!");
    }
  };

  return (
    <div>
      <h3>Request Collaboration</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe your collaboration request..."
        ></textarea>
        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}

export default CollaborationRequestForm;
