// File: backend/controllers/adminController.js

import db from "../models/index.js";
const { User, Publication, Project } = db; // Import models you need counts for

// GET /api/admin/dashboard-stats - Get counts for the dashboard
export const getDashboardStats = async (req, res) => {
  try {
    // Perform counts in parallel for efficiency
    const [userCount, pendingUserCount, publicationCount, projectCount] =
      await Promise.all([
        User.count(),
        User.count({ where: { status: "pending" } }), // Assumes 'status' field exists
        Publication.count(),
        Project?.count() || Promise.resolve(0), // Check if Project model exists before counting
      ]);

    const stats = {
      userCount: userCount,
      pendingUserCount: pendingUserCount, // Count of users needing approval
      publicationCount: publicationCount,
      projectCount: projectCount, // Include if you have a Project model
      // Add other counts as needed
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching dashboard stats",
      error: error.message,
    });
  }
};

// Add other general admin controllers here (e.g., for settings, reports) if needed
// export const getAdminSettings = async (req, res) => { ... };
