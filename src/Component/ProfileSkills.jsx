// src/Component/ProfileSkills.jsx
import React from "react";
import { useOutletContext } from "react-router-dom";

function ProfileSkills() {
  const { formData, setFormData, editing, handleChange, handleClearField } =
    useOutletContext();
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">
        Skills & Technologies
      </h2>
      {editing ? (
        <div className="space-y-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Skills:
          </label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button onClick={() => handleClearField("skills")}>Clear</button>
        </div>
      ) : (
        <div className="profile-item">
          <strong>Skills:</strong> {formData.skills || "Not provided"}
        </div>
      )}
    </div>
  );
}
export default ProfileSkills;
