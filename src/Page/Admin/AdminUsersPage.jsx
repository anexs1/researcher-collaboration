// src/Page/Admin/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import AdminDataTable from "../../Component/Admin/AdminDataTable";
import SearchBar from "../../Component/Common/SearchBar";
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import ConfirmationModal from "../../Component/Common/ConfirmationModal"; // Re-use existing one
import UserEditModal from "../../Component/Admin/UserEditModal"; // Specific edit modal
import { FaUserEdit, FaTrashAlt, FaPlus } from "react-icons/fa";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null); // User object for modal
  const [deletingUser, setDeletingUser] = useState(null); // User object for confirmation
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Fetch Users Function (using useCallback for stability)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token not found.");
      setLoading(false);
      return;
    }

    try {
      // *** Replace with your ACTUAL API endpoint - Add search query param ***
      const response = await axios.get(
        `/api/admin/users?search=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data.data || []); // Adjust based on API response
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }, [searchTerm]); // Re-fetch when searchTerm changes

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Handlers ---
  const handleSearch = (term) => {
    setSearchTerm(term);
    // Fetch is triggered by useEffect dependency on searchTerm
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleSaveUser = async (updatedUserData) => {
    console.log("Saving user:", updatedUserData);
    const token = localStorage.getItem("authToken");
    try {
      await axios.put(
        `/api/admin/users/${updatedUserData.id}`,
        updatedUserData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      handleCloseEditModal();
      fetchUsers(); // Refresh list
      // Add success notification
    } catch (err) {
      console.error("Error updating user:", err);
      // Add error notification
      setError(err.response?.data?.message || "Failed to update user.");
    }
  };

  const handleOpenDeleteConfirm = (user) => {
    setDeletingUser(user);
    setIsConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeletingUser(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    console.log("Deleting user:", deletingUser.id);
    const token = localStorage.getItem("authToken");
    try {
      // *** Replace with your ACTUAL API endpoint ***
      await axios.delete(`/api/admin/users/${deletingUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseDeleteConfirm();
      fetchUsers(); // Refresh list
      // Add success notification
    } catch (err) {
      console.error("Error deleting user:", err);
      handleCloseDeleteConfirm(); // Close modal even on error
      // Add error notification
      setError(err.response?.data?.message || "Failed to delete user.");
    }
  };

  // --- Table Column Definition ---
  const columns = React.useMemo(
    () => [
      { Header: "ID", accessor: "id" },
      { Header: "Username", accessor: "username" },
      { Header: "Email", accessor: "email" },
      { Header: "Role", accessor: "role" },
      {
        Header: "Joined",
        accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
      },
      {
        Header: "Actions",
        accessor: "actions",
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleOpenEditModal(row.original)}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Edit User"
            >
              <FaUserEdit />
            </button>
            <button
              onClick={() => handleOpenDeleteConfirm(row.original)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Delete User"
            >
              <FaTrashAlt />
            </button>
          </div>
        ),
      },
    ],
    []
  ); // Empty dependency array - columns don't change

  // --- Render ---
  return (
    <div className="p-4 md:p-6 space-y-4">
      <AdminPageHeader title="Manage Users" /* Optional: Add button maybe */>
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center">
          <FaPlus className="mr-2" /> Add User
        </button>
      </AdminPageHeader>

      <SearchBar
        placeholder="Search users by name, email..."
        onSearch={handleSearch}
      />

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <AdminDataTable columns={columns} data={users} />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <UserEditModal
          isOpen={isEditModalOpen}
          user={editingUser}
          onSave={handleSaveUser}
          onClose={handleCloseEditModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to delete user "${deletingUser?.username}" (${deletingUser?.email})? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteConfirm}
        confirmText="Delete User"
        confirmButtonClass="bg-red-600 hover:bg-red-700" // Destructive action style
      />
    </div>
  );
};

export default AdminUsersPage;
