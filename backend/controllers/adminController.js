import db from "../models/index.js";
const { User, Publication, Project, sequelize } = db;
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";

export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalPublications,
      publishedPublications,
      totalProjects,
      activeProjects,
      totalAdmins,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: "approved" } }),
      User.count({ where: { status: "pending" } }),
      Publication.count(),
      Publication.count({ where: { status: "published" } }),
      Project.count(),
      Project.count({ where: { status: "active" } }),
      User.count({ where: { role: "admin" } }),
    ]);

    const [recentUsers, recentPublications] = await Promise.all([
      User.findAll({
        attributes: ["id", "username", "email", "role", "status", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
      Publication.findAll({
        attributes: ["id", "title", "status", "createdAt"],
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "username"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          users: {
            total: totalUsers,
            active: activeUsers,
            pending: pendingUsers,
            admins: totalAdmins,
          },
          publications: {
            total: totalPublications,
            published: publishedPublications,
          },
          projects: { total: totalProjects, active: activeProjects },
        },
        recentActivities: {
          users: recentUsers,
          publications: recentPublications,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
});

// Export other controller functions as needed
