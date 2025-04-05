import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUsers, FaProjectDiagram, FaNewspaper } from "react-icons/fa";

import StatCard from "../../Component/Admin/StatCard";
import LoadingSkeleton from "../../Component/Common/LoadingSkeleton";
import ErrorMessage from "../../Component/Common/ErrorMessage";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("You are not authenticated. Please log in.");
        setLoading(false);
        // Optional: Redirect to login
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        const { data } = await axios.get("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats(data?.data || {}); // Fallback to empty object
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, [navigate]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <LoadingSkeleton lines={3} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-100 min-h-screen">
      {error && <ErrorMessage message={error} />}

      {stats && Object.keys(stats).length > 0 ? (
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
        !error && (
          <p className="text-center text-gray-500 text-sm">
            No statistics available at the moment.
          </p>
        )
      )}

      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Quick Links
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/users"
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded inline-flex items-center transition"
          >
            <FaUsers className="mr-2" />
            Manage Users
          </Link>
          {/* Add more Quick Links below */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
