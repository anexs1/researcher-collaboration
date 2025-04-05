import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaUsers, FaProjectDiagram, FaNewspaper } from "react-icons/fa";
import StatCard from "../../Component/Admin/StatCard"; // Reusable Card
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data.data); // Adjust based on your API response structure
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading)
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-100 min-h-screen">
      {error && <ErrorMessage message={error} />}

      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <StatCard
            title="Total Users"
            value={stats.userCount ?? "N/A"}
            icon={<FaUsers className="text-blue-500" />}
            linkTo="/admin/users"
            linkText="Manage Users"
          />
          <StatCard
            title="Total Projects"
            value={stats.projectCount ?? "N/A"}
            icon={<FaProjectDiagram className="text-green-500" />}
          />
          <StatCard
            title="Total Publications"
            value={stats.publicationCount ?? "N/A"}
            icon={<FaNewspaper className="text-purple-500" />}
          />
        </div>
      ) : (
        !error && <p>No statistics available.</p>
      )}

      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Quick Links
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/users"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors"
          >
            <FaUsers className="mr-2" /> Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
