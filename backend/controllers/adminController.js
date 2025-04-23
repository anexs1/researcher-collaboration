import db from "../models/index.js";
const { User, Publication, Project, sequelize } = db;
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";

export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // 1. Verify database connection
    try {
      await sequelize.authenticate();
      console.log("Database connection has been established successfully.");
    } catch (dbError) {
      console.error("Unable to connect to the database:", dbError);
      throw new Error("Database connection failed");
    }

    // 2. Validate models exist
    if (!User || !Publication || !Project) {
      throw new Error("Required models are not properly initialized");
    }

    // 3. Get counts with individual error handling
    const countPromises = [
      safeCount(User),
      safeCount(User, { where: { status: "approved" } }),
      safeCount(User, { where: { status: "pending" } }),
      safeCount(Publication),
      safeCount(Publication, { where: { status: "published" } }),
      safeCount(Project),
      safeCount(Project, { where: { status: "active" } }),
      safeCount(User, { where: { role: "admin" } }),
    ];

    const counts = await Promise.all(countPromises);

    // 4. Get recent activities with robust error handling
    const [recentUsers, recentPublications] = await Promise.all([
      safeFindAll(User, {
        attributes: ["id", "username", "email", "role", "status", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
      safeFindAll(Publication, {
        attributes: ["id", "title", "status", "createdAt"],
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    // 5. Construct response with fallback values
    const responseData = {
      counts: {
        users: {
          total: counts[0] || 0,
          active: counts[1] || 0,
          pending: counts[2] || 0,
          admins: counts[7] || 0,
        },
        publications: {
          total: counts[3] || 0,
          published: counts[4] || 0,
        },
        projects: {
          total: counts[5] || 0,
          active: counts[6] || 0,
        },
      },
      recentActivities: {
        users: recentUsers || [],
        publications: recentPublications || [],
      },
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Dashboard controller error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
    });
  }
});

// Helper function for safe counting
async function safeCount(model, options = {}) {
  try {
    const count = await model.count(options);
    return Number.isInteger(count) ? count : 0;
  } catch (error) {
    console.error(`Error counting ${model.name}:`, error);
    return 0;
  }
}

// Helper function for safe querying
async function safeFindAll(model, options = {}) {
  try {
    const results = await model.findAll(options);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error(`Error finding ${model.name}:`, error);
    return [];
  }
}
