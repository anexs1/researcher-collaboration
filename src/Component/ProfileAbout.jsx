// src/Component/ProfileAbout.jsx
import React from "react";
import { useOutletContext } from "react-router-dom";

function ProfileAbout() {
  const { formData, setFormData, editing, handleChange, handleClearField } =
    useOutletContext();
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">
        About Me
      </h2>
      {editing ? (
        <div className="space-y-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            About Me:
          </label>
          <textarea
            name="aboutMe"
            value={formData.aboutMe}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button onClick={() => handleClearField("aboutMe")}>Clear</button>
        </div>
      ) : (
        <p className="text-gray-700">
          {formData.aboutMe ||
            "Write an enticing performance summary that impresses the recruiter. Showcase your uniqueness through your skills and accomplishments."}
        </p>
      )}
    </div>
  );
}
export default ProfileAbout;
