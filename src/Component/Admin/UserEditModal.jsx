// src/Component/Admin/UserEditModal.jsx
import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const UserEditModal = ({ isOpen, user, onSave, onClose }) => {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize form data when user prop changes
    if (user) {
      setFormData({
        id: user.id,
        username: user.username || "",
        email: user.email || "",
        role: user.role || "user",
        // Add other editable fields as needed
      });
    }
  }, [user]); // Depend on user object

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData); // Call the onSave prop function passed from parent
    } catch (error) {
      console.error("Error in save handler:", error);
      // Error handling might be done in the parent via onSave rejection
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit User: {user.username}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username (Read-only or Editable?) */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 form-input w-full"
              disabled={saving}
            />
          </div>
          {/* Email (Read-only or Editable?) */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 form-input w-full"
              disabled={saving}
            />
          </div>
          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 form-input w-full"
              disabled={saving}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>{" "}
              {/* Add roles as defined in your model */}
              <option value="academic">Academic</option>
            </select>
          </div>
          {/* Add other fields */}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors ${
                saving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// Add helper class if not global:
export default UserEditModal;
