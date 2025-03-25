// src/Component/ProfileResearch.jsx
import React from "react";
import { useOutletContext } from "react-router-dom";

function ProfileResearch() {
  const { formData, setFormData, editing, handleChange, handleClearField } =
    useOutletContext();
  return (
    <div className="profile-research">
      {" "}
      {/* Added a wrapper div */}
      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">
        Research Interests
      </h2>
      {editing ? (
        <div className="space-y-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Research Interests:
          </label>
          <input
            type="text"
            name="researchInterests"
            value={formData.researchInterests}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button onClick={() => handleClearField("researchInterests")}>
            Clear
          </button>
        </div>
      ) : (
        <div className="profile-item">
          <strong>Research Interests:</strong>{" "}
          {formData.researchInterests || "Not provided"}
        </div>
      )}
      <p>This is the Research Interests section.</p> {/*Added this line*/}
    </div>
  );
}

export default ProfileResearch;
