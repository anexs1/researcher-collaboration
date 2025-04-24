// backend/controllers/adminController.js

import db from "../models/index.js";
const { User, Publication, Project, sequelize } = db; // Ensure Publication and Project are included
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";

// Helper function for safe counting
async function safeCount(model, options = {}) {
  try {
    // Add a check to ensure the model exists before counting
    if (!model || typeof model.count !== "function") {
      console.error(`Error: Attempted to count non-model or undefined model.`);
      return 0;
    }
    const count = await model.count(options);
    return Number.isInteger(count) ? count : 0;
  } catch (error) {
    // Use optional chaining for safer access to model name
    console.error(`Error counting ${model?.name || "Unknown Model"}:`, error);
    return 0; // Return 0 on error
  }
}

// Helper function for safe querying
async function safeFindAll(model, options = {}) {
  try {
    // Add a check to ensure the model exists before querying
    if (!model || typeof model.findAll !== "function") {
      console.error(
        `Error: Attempted to findAll on non-model or undefined model.`
      );
      return [];
    }
    const results = await model.findAll(options);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    // Use optional chaining for safer access to model name
    console.error(`Error finding ${model?.name || "Unknown Model"}:`, error);
    return []; // Return empty array on error
  }
}

// --- Dashboard Stats Controller ---
export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // 1. Validate models exist
    if (!User || !Publication || !Project) {
      console.error("Dashboard Error: Models not initialized correctly.");
      throw new Error("Required models are not available");
    }

    // 3. Get counts
    // Adjust indices based on which counts are actually performed
    const countPromises = [
      safeCount(User), // 0: Total users
      safeCount(User, { where: { status: "approved" } }), // 1: Approved users
      safeCount(User, { where: { status: "pending" } }), // 2: Pending users
      safeCount(Publication), // 3: Total publications
      // safeCount(Publication, { where: { status: "published" } }), // 4: Published Pubs (If status exists)
      safeCount(Project), // 4 (or 5 if pub status): Total projects
      safeCount(Project, { where: { status: "active" } }), // 5 (or 6): Active projects
      safeCount(User, { where: { role: "admin" } }), // 6 (or 7): Admin users
    ];
    // Make sure to await all promises
    const counts = await Promise.all(countPromises);

    // 4. Get recent activities
    const [recentUsers, recentPublications] = await Promise.all([
      safeFindAll(User, {
        attributes: ["id", "username", "email", "role", "status", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
      safeFindAll(Publication, {
        // Select specific attributes needed for the dashboard display
        attributes: [
          "id",
          "title",
          /* 'status', */ "createdAt",
          "author",
          "collaborationStatus",
        ],
        include: [
          {
            model: User,
            as: "owner", // Correct alias based on Publication model association
            attributes: ["id", "username"], // Select only necessary user fields
            required: false, // Use LEFT JOIN
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    // 5. Construct response - Use correct indices based on countPromises array
    const responseData = {
      counts: {
        users: {
          total: counts[0] || 0,
          active: counts[1] || 0,
          pending: counts[2] || 0,
          admins: counts[6] || 0,
        }, // Index 6 for admins
        publications: {
          total: counts[3] || 0 /* , published: counts[?] || 0 */,
        }, // Index 3 for total pubs
        projects: { total: counts[4] || 0, active: counts[5] || 0 }, // Index 4 for total projects, 5 for active
      },
      recentActivities: {
        users: recentUsers || [],
        publications: recentPublications || [],
      },
    };

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Dashboard controller error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// --- Admin Publications Controller ---
/**
 * @desc    Get all publications (for Admin panel with pagination/sorting)
 * @route   GET /api/admin/publications
 * @access  Private/Admin
 */
export const getAdminPublications = asyncHandler(async (req, res) => {
  // --- Pagination and Sorting ---
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = req.query.sortOrder || "desc";
  const offset = (page - 1) * limit;

  // Validate sort parameters
  const allowedSortBy = [
    "id",
    "title",
    "author",
    "ownerId",
    "area",
    "publicationDate",
    "collaborationStatus",
    "createdAt",
    "updatedAt",
  ];
  if (!allowedSortBy.includes(sortBy)) {
    res.status(400).json({
      success: false,
      message: `Invalid sortBy parameter. Allowed: ${allowedSortBy.join(", ")}`,
    });
    return;
  }
  if (!["asc", "desc"].includes(sortOrder.toLowerCase())) {
    res.status(400).json({
      success: false,
      message: "Invalid sortOrder parameter. Use 'asc' or 'desc'.",
    });
    return;
  }

  // Validate models are loaded
  if (
    !Publication ||
    typeof Publication.findAndCountAll !== "function" ||
    !User
  ) {
    console.error(
      "Admin Publications Error: Models not initialized correctly."
    );
    // Throwing error here will be caught by asyncHandler and result in 500
    throw new Error(
      "Required models (Publication, User) are not available or not initialized."
    );
  }

  try {
    const { count, rows } = await Publication.findAndCountAll({
      // --- EXPLICITLY LIST Publication ATTRIBUTES ---
      // List all columns from your Publication model/table that you want to return
      attributes: [
        "id",
        "title",
        "summary",
        "author", // The string author field from the Publication table
        "ownerId", // The foreign key field
        "document_link",
        "tags",
        "area",
        "publicationDate",
        "collaborationStatus",
        "createdAt",
        "updatedAt",
        // DO NOT list 'authorId' here as it doesn't exist in the table/model
      ],
      // --- END EXPLICIT ATTRIBUTES ---
      limit: limit,
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]], // Apply sorting
      include: [
        {
          model: User,
          as: "owner", // MUST match the alias defined in Publication.associate
          attributes: ["id", "username", "email"], // Select only needed owner fields
        },
      ],
      distinct: true, // Important for correct count when using include
    });

    // Construct pagination object
    const paginationData = {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit: limit,
    };

    res.status(200).json({
      success: true,
      data: rows,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Admin: Error fetching publications:", error);
    // Log the generated SQL in development for debugging database errors
    if (process.env.NODE_ENV === "development" && error.sql) {
      console.error("Offending SQL:", error.sql);
    }
    res
      .status(500)
      .json({ success: false, message: "Server error fetching publications." });
  }
});

// --- Add other admin-specific controllers here if needed ---
// e.g., getAdminProjects, updateAdminSettings, etc.
