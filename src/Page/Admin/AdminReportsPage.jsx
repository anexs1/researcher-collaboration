// src/Page/Admin/AdminReportsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import AdminPageHeader from "../../Component/Admin/AdminPageHeader"; // Verify path
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
  PieChart,
  Pie,
  Cell, // Added PieChart
} from "recharts"; // Import Recharts components
import LoadingSpinner from "../../Component/Common/LoadingSpinner";
import ErrorMessage from "../../Component/Common/ErrorMessage";
import axios from "axios"; // For fetching data
import DatePicker from "react-datepicker"; // Import date picker
import "react-datepicker/dist/react-datepicker.css"; // Import date picker CSS
import { subMonths, format } from "date-fns"; // For date manipulation
import {
  FaCalendarAlt,
  FaFilter,
  FaUsers,
  FaProjectDiagram,
  FaNewspaper,
} from "react-icons/fa"; // Icons
import { motion } from "framer-motion"; // For animations

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Define colors for charts
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const AdminReportsPage = () => {
  // --- State ---
  const [reportData, setReportData] = useState({
    summary: { users: 0, projects: 0, publications: 0 }, // For quick summary stats
    userGrowth: [], // For the line chart { name: 'Mon', Users: 10 }
    contentDistribution: [], // For pie or bar chart { name: 'Projects', value: 150 }
    // Add more states for other reports
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Date Range State
  const [startDate, setStartDate] = useState(subMonths(new Date(), 1)); // Default to 1 month ago
  const [endDate, setEndDate] = useState(new Date()); // Default to today

  // --- Fetch Report Data ---
  const fetchReportData = useCallback(async (start, end) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required.");
      setLoading(false);
      return;
    }

    // Format dates for API query parameters (e.g., 'yyyy-MM-dd')
    const formattedStartDate = format(start, "yyyy-MM-dd");
    const formattedEndDate = format(end, "yyyy-MM-dd");
    console.log(
      `Fetching reports for range: ${formattedStartDate} to ${formattedEndDate}`
    );

    try {
      // *** Replace with your ACTUAL API endpoint calls ***
      // Use Promise.all for concurrent fetching
      const [summaryRes, userGrowthRes, contentRes] = await Promise.all([
        axios
          .get(`${API_BASE_URL}/api/admin/reports/summary`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            },
          })
          .catch((e) => {
            console.error("Summary fetch failed:", e);
            return {
              data: { data: { users: 0, projects: 0, publications: 0 } },
            };
          }), // Provide default on fail
        axios
          .get(`${API_BASE_URL}/api/admin/reports/user-growth`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            },
          })
          .catch((e) => {
            console.error("User growth fetch failed:", e);
            return { data: { data: [] } };
          }), // Default empty array
        axios
          .get(`${API_BASE_URL}/api/admin/reports/content-overview`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            },
          })
          .catch((e) => {
            console.error("Content overview fetch failed:", e);
            return { data: { data: [] } };
          }), // Default empty array
      ]);

      // Basic check if responses look okay - adapt based on your API structure
      const summaryData = summaryRes.data?.data || {
        users: 0,
        projects: 0,
        publications: 0,
      };
      const userGrowthData = userGrowthRes.data?.data || [];
      const contentDistributionData = contentRes.data?.data || [];

      setReportData({
        summary: summaryData,
        userGrowth: Array.isArray(userGrowthData) ? userGrowthData : [], // Ensure array
        contentDistribution: Array.isArray(contentDistributionData)
          ? contentDistributionData
          : [], // Ensure array
      });
    } catch (err) {
      // Catch errors not handled by individual catches (e.g., network error)
      console.error("Overall fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load some report data."
      );
      // Reset data on overall failure? Or keep partial data? Let's reset.
      setReportData({ summary: {}, userGrowth: [], contentDistribution: [] });
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed if fetching is triggered manually or by date change

  // Initial fetch and fetch on date change
  useEffect(() => {
    fetchReportData(startDate, endDate);
  }, [fetchReportData, startDate, endDate]); // Re-fetch when dates change

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    // Fetching is handled by the useEffect above watching startDate/endDate
  };

  const breadcrumbs = [{ label: "Reports", link: "/admin/reports" }];

  // --- Render Components ---

  const renderReportSection = ({ title, children, isLoading }) => (
    <motion.div
      className="bg-white p-5 md:p-6 rounded-xl shadow-lg border border-gray-100 min-h-[380px] flex flex-col"
      variants={itemVariants}
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
        {title}
      </h2>
      <div className="flex-grow flex items-center justify-center">
        {" "}
        {/* Vertical centering */}
        {isLoading ? <LoadingSpinner /> : children}
      </div>
    </motion.div>
  );

  const renderEmptyState = (message = "No data available for this period.") => (
    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
      {message}
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 bg-gray-100 min-h-screen">
      <AdminPageHeader title="Reports & Analytics" breadcrumbs={breadcrumbs} />
      {/* Date Range Filter Section */}
      <motion.div
        className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-wrap items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FaCalendarAlt className="w-4 h-4 text-gray-500" />
          <span>Date Range:</span>
        </div>
        <div className="flex-grow sm:flex-grow-0">
          <DatePicker
            selected={startDate}
            onChange={handleDateChange}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            isClearable={false}
            dateFormat="MM/dd/yyyy"
            className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            wrapperClassName="w-full sm:w-auto"
          />
        </div>
        {/* Optional: Quick select buttons (Last 7 days, Last 30 days) */}
        <div className="flex gap-2">
          <button
            onClick={() =>
              handleDateChange([subMonths(new Date(), 1), new Date()])
            }
            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
          >
            Last Month
          </button>
          <button
            onClick={() =>
              handleDateChange([subMonths(new Date(), 3), new Date()])
            }
            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
          >
            Last 3 Months
          </button>
        </div>
        <button
          onClick={() => fetchReportData(startDate, endDate)}
          disabled={loading}
          className="ml-auto px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? (
            <LoadingSpinner size="sm" color="text-white" />
          ) : (
            <FaFilter className="w-3 h-3" />
          )}
          Apply
        </button>
      </motion.div>
      {/* Display General Fetch Error */}
      {error && (
        <ErrorMessage
          message={error}
          onClose={() => setError(null)}
          isDismissible={true}
        />
      )}
      {/* Main Reports Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* User Growth Chart */}
        {renderReportSection({
          title: "User Growth",
          isLoading: loading,
          children:
            reportData.userGrowth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={reportData.userGrowth}
                  margin={{ top: 5, right: 25, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={11}
                    tickMargin={5}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    tickMargin={5}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "0.5rem",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      border: "none",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Users"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    activeDot={{ r: 7, strokeWidth: 2, fill: "#fff" }}
                    dot={{ r: 3, strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              renderEmptyState("No user growth data for this period.")
            ),
        })}

        {/* Content Overview Chart (Bar) */}
        {renderReportSection({
          title: "Content Overview",
          isLoading: loading,
          children:
            reportData.contentDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={reportData.contentDistribution}
                  margin={{ top: 5, right: 25, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={11}
                    tickMargin={5}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    tickMargin={5}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "0.5rem",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      border: "none",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                  {/* Use a single Bar component if dataKey is consistent, or map Cells if colors needed */}
                  <Bar dataKey="value" name="Count">
                    {reportData.contentDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              renderEmptyState("No content overview data.")
            ),
        })}

        {/* Example: Pie Chart for User Roles (using summary data for demo) */}
        {renderReportSection({
          title: "User Role Distribution",
          isLoading: loading,
          children:
            reportData.summary?.users > 0 ? ( // Check if total users > 0
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  {/* Prepare data for Pie Chart - THIS IS MOCK - replace with real data */}
                  <Pie
                    data={[
                      { name: "Admin", value: reportData.summary?.admins ?? 0 }, // Use fetched admin count if available
                      {
                        name: "Approved",
                        value:
                          (reportData.summary?.active ?? 0) -
                          (reportData.summary?.admins ?? 0),
                      }, // Approximate non-admin active users
                      {
                        name: "Pending",
                        value: reportData.summary?.pending ?? 0,
                      }, // Use fetched pending count
                    ].filter((item) => item.value > 0)} // Filter out zero values
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                      index,
                      name,
                    }) => {
                      const radius =
                        innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x =
                        cx +
                        (radius + 15) * Math.cos((-midAngle * Math.PI) / 180);
                      const y =
                        cy +
                        (radius + 15) * Math.sin((-midAngle * Math.PI) / 180);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#6b7280"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          fontSize={11}
                        >{`${name} (${(percent * 100).toFixed(0)}%)`}</text>
                      );
                    }}
                  >
                    {[
                      { name: "Admin", value: reportData.summary?.admins ?? 0 },
                      {
                        name: "Approved",
                        value:
                          (reportData.summary?.active ?? 0) -
                          (reportData.summary?.admins ?? 0),
                      },
                      {
                        name: "Pending",
                        value: reportData.summary?.pending ?? 0,
                      },
                    ]
                      .filter((item) => item.value > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "0.5rem" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              renderEmptyState("No user role data.")
            ),
        })}

        {/* Placeholder for another report */}
        {renderReportSection({
          title: "Another Report Area",
          isLoading: loading,
          children: renderEmptyState("Report data source not configured."),
        })}
      </motion.div>
    </div>
  );
};

export default AdminReportsPage;
