// src/Component/ProfileEducation.jsx
import React from "react";
import { useOutletContext } from "react-router-dom";

function ProfileEducation() {
  const { formData, setFormData, editing, handleChange, handleClearField } =
    useOutletContext();
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">
        Education
      </h2>
      {editing ? (
        <div className="space-y-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Education:
          </label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button onClick={() => handleClearField("education")}>Clear</button>
        </div>
      ) : (
        <div className="profile-item">
          <strong>Education:</strong> {formData.education || "Not provided"}
        </div>
      )}
    </div>
  );
}
export default ProfileEducation;
