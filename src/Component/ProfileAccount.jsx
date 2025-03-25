// src/Component/ProfileAccount.jsx
import React from "react";
import { useOutletContext } from "react-router-dom";

function ProfileAccount() {
  const { formData, setFormData, editing, handleChange, handleClearField } =
    useOutletContext();
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Account Information
      </h2>
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Username:
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button onClick={() => handleClearField("username")}>Clear</button>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button onClick={() => handleClearField("email")}>Clear</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p>
            <strong>Username:</strong> {formData.username || "Not provided"}
          </p>
          <p>
            <strong>Email:</strong> {formData.email || "Not provided"}
          </p>
        </div>
      )}
    </div>
  );
}
export default ProfileAccount;
