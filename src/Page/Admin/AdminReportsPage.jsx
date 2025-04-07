// src/Page/Admin/AdminReportsPage.jsx
import React, { useEffect, useState } from "react";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"; // Import Recharts components
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import axios from "axios"; // For fetching data

// Mock data for charts - Replace with API fetched data
const mockUserGrowthData = [
  { name: "Jan", Users: 40 },
  { name: "Feb", Users: 30 },
  { name: "Mar", Users: 50 },
  { name: "Apr", Users: 45 },
  { name: "May", Users: 60 },
  { name: "Jun", Users: 70 },
];
const mockContentData = [
  { name: "Projects", count: 150 },
  { name: "Publications", count: 320 },
  { name: "Comments", count: 800 },
];

const AdminReportsPage = () => {
  const [reportData, setReportData] = useState({ userGrowth: [], content: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Authentication required.");
        setLoading(false);
        return;
      }

      try {
        // *** Replace with your ACTUAL API endpoint(s) for report data ***
        // Example: Fetch multiple reports potentially
        // const userGrowthRes = await axios.get("/api/admin/reports/user-growth", { headers: { Authorization: `Bearer ${token}` } });
        // const contentRes = await axios.get("/api/admin/reports/content-overview", { headers: { Authorization: `Bearer ${token}` } });

        // Using mock data for now:
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading
        setReportData({
          userGrowth: mockUserGrowthData, // Replace with userGrowthRes.data.data
          content: mockContentData, // Replace with contentRes.data.data
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const breadcrumbs = [{ label: "Reports", link: "/admin/reports" }];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gray-50 min-h-screen">
      <AdminPageHeader title="Reports & Analytics" breadcrumbs={breadcrumbs} />

      {loading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      )}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* User Growth Chart */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              User Growth (Monthly)
            </h2>
            {reportData.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={reportData.userGrowth}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="Users"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                No user growth data available.
              </div>
            )}
          </div>

          {/* Content Overview Chart */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Content Overview
            </h2>
            {reportData.content.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={reportData.content}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                No content data available.
              </div>
            )}
          </div>

          {/* Add more report sections/charts here */}
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
