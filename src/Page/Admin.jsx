// // src/Page/Admin.jsx
// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import axios from "axios"; // Assuming you use axios
// import {
//   FaUsers,
//   FaProjectDiagram,
//   FaChartBar,
//   FaCog,
//   FaUserPlus,
//   FaExclamationCircle,
// } from "react-icons/fa";
// // Assuming you have helper components
// // import LoadingSpinner from '../Component/LoadingSpinner';
// // import ErrorMessage from '../Component/ErrorMessage';
// // import InfoCard from '../Component/InfoCard'; // A reusable card component

// const Admin = () => {
//   const [stats, setStats] = useState({
//     userCount: 0,
//     projectCount: 0,
//     publicationCount: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchAdminStats = async () => {
//       setLoading(true);
//       setError(null);
//       const token = localStorage.getItem("authToken"); // Get token

//       if (!token) {
//         setError("Authentication token not found.");
//         setLoading(false);
//         return; // Exit if no token
//       }

//       try {
//         // --- Adjust API endpoint as needed ---
//         const response = await axios.get("/api/admin/stats", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setStats(response.data); // Assuming API returns { userCount, projectCount, publicationCount }
//       } catch (err) {
//         console.error("Error fetching admin stats:", err);
//         setError(
//           err.response?.data?.message ||
//             err.message ||
//             "Failed to load dashboard data."
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAdminStats();
//   }, []); // Empty dependency array means run once on mount

//   // --- Render Logic ---
//   if (loading) {
//     // return <LoadingSpinner />; // Use a loading component
//     return (
//       <div className="p-6 text-center">
//         Loading Dashboard... <FaSpinner className="animate-spin inline ml-2" />
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 md:p-6 space-y-6">
//       <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
//         Admin Dashboard
//       </h1>

//       {error && (
//         // <ErrorMessage message={error} /> // Use an error component
//         <div
//           className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
//           role="alert"
//         >
//           <FaExclamationCircle className="inline mr-2" />
//           <strong className="font-bold">Error: </strong>
//           <span className="block sm:inline">{error}</span>
//         </div>
//       )}

//       {/* --- Stats Section --- */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
//         {/* Example using a simple div, replace with InfoCard component if created */}
//         <div className="bg-blue-100 p-5 rounded-lg shadow hover:shadow-md transition-shadow">
//           <h2 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
//             <FaUsers className="mr-2" /> Total Users
//           </h2>
//           <p className="text-3xl font-bold text-blue-900">
//             {stats.userCount ?? "N/A"}
//           </p>
//           <Link
//             to="/admin/users"
//             className="text-sm text-blue-600 hover:underline mt-2 inline-block"
//           >
//             Manage Users
//           </Link>
//         </div>
//         <div className="bg-green-100 p-5 rounded-lg shadow hover:shadow-md transition-shadow">
//           <h2 className="text-lg font-semibold text-green-800 mb-2 flex items-center">
//             <FaProjectDiagram className="mr-2" /> Total Projects
//           </h2>
//           <p className="text-3xl font-bold text-green-900">
//             {stats.projectCount ?? "N/A"}
//           </p>
//           {/* Add link if project management exists */}
//         </div>
//         <div className="bg-purple-100 p-5 rounded-lg shadow hover:shadow-md transition-shadow">
//           <h2 className="text-lg font-semibold text-purple-800 mb-2 flex items-center">
//             <FaNewspaper className="mr-2" /> Publications
//           </h2>{" "}
//           {/* Assuming FaNewspaper exists */}
//           <p className="text-3xl font-bold text-purple-900">
//             {stats.publicationCount ?? "N/A"}
//           </p>
//           {/* Add link if publication management exists */}
//         </div>
//       </div>

//       {/* --- Navigation/Actions Section --- */}
//       <div className="mt-8 p-4 bg-white rounded-lg shadow">
//         <h2 className="text-xl font-semibold mb-4 text-gray-700">
//           Admin Tools
//         </h2>
//         <div className="flex flex-wrap gap-4">
//           <Link
//             to="/admin/users"
//             className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors"
//           >
//             <FaUsers className="mr-2" /> Manage Users
//           </Link>
//           <Link
//             to="/admin/reports"
//             className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors"
//           >
//             <FaChartBar className="mr-2" /> View Reports
//           </Link>
//           <Link
//             to="/admin/settings"
//             className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors"
//           >
//             <FaCog className="mr-2" /> System Settings
//           </Link>
//           {/* Add more links/buttons as needed */}
//         </div>
//       </div>

//       {/* Add sections for Recent Activity, Charts, etc. here */}
//     </div>
//   );
// };

// export default Admin;
