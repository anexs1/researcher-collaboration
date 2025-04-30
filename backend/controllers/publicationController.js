// backend/controllers/publicationController.js

import db from "../models/index.js"; // Import the database object
const { Publication, User, UserBookmark, Comment } = db; // Destructure ALL needed models
import { Op } from "sequelize";
import asyncHandler from "express-async-handler"; // Use if you prefer asyncHandler for error handling

// =============================================
//        REGULAR USER CONTROLLERS
// =============================================

/**
 * @desc    Create a new publication
 * @route   POST /api/publications
 * @access  Private (Requires logged-in user)
 */
export const createPublication = asyncHandler(async (req, res) => {
  const {
    title,
    summary,
    author,
    tags,
    area,
    publicationDate,
    document_link,
    collaborationStatus = "open", // Default if not provided
    journal,
    doi,
    thumbnail,
    citations, // Allow setting initial citations? Usually not.
  } = req.body;
  const ownerId = req.user?.id;

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!title || !summary || !author) {
    res.status(400);
    throw new Error("Missing required fields (title, summary, author).");
  }

  const newPublication = await Publication.create({
    title,
    summary,
    author,
    tags: Array.isArray(tags)
      ? tags
      : tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    area: area || null,
    publicationDate: publicationDate || null,
    document_link: document_link || null,
    collaborationStatus: ["open", "in_progress", "closed"].includes(
      collaborationStatus
    )
      ? collaborationStatus
      : "open", // Validate status
    journal: journal || null,
    doi: doi || null,
    thumbnail: thumbnail || null,
    citations: parseInt(citations, 10) || 0, // Ensure integer, default 0
    views: 0, // Views start at 0
    ownerId: ownerId,
  });

  res.status(201).json({ success: true, data: newPublication });
});

/**
 * @desc    Get publications owned by the logged-in user
 * @route   GET /api/publications/my-publications
 * @access  Private
 */
export const getMyPublications = asyncHandler(async (req, res) => {
  const ownerId = req.user?.id;
  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  const publications = await Publication.findAll({
    where: { ownerId: ownerId },
    order: [["createdAt", "DESC"]],
  });
  res.status(200).json({ success: true, data: publications });
});

/**
 * @desc    Get a single publication by its ID (Public)
 * @route   GET /api/publications/:id
 * @access  Public
 */
export const getPublicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const loggedInUserId = req.user?.id; // Get user ID if logged in (for bookmark status)

  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  // Increment views (can be refined to avoid counting owner, bots, etc.)
  try {
    await Publication.increment("views", { where: { id: id } });
  } catch (viewError) {
    console.error(
      `Failed to increment views for publication ${id}:`,
      viewError
    );
    // Continue even if view increment fails
  }

  const publication = await Publication.findByPk(id, {
    attributes: [
      // Specify all needed fields
      "id",
      "title",
      "summary",
      "author",
      "ownerId",
      "document_link",
      "tags",
      "area",
      "publicationDate",
      "collaborationStatus",
      "journal",
      "doi",
      "thumbnail",
      "views", // Include views
      "citations",
      "createdAt",
      "updatedAt",
      // --- Add bookmark status if user is logged in (MySQL/MariaDB compatible syntax) ---
      loggedInUserId
        ? [
            db.sequelize.literal(`(
                EXISTS (
                    SELECT 1
                    FROM user_bookmarks AS ub
                    WHERE
                        ub.publicationId = Publication.id AND
                        ub.userId = ${loggedInUserId}
                )
            )`), // <<< CORRECTED SYNTAX (No quotes/backticks needed for simple names)
            "isBookmarked", // Alias for the result
          ]
        : db.sequelize.literal("false AS isBookmarked"), // Default to false if not logged in
      // --- Add comment count (MySQL/MariaDB compatible syntax) ---
      [
        db.sequelize.literal(`(
                SELECT COUNT(*)
                FROM comments AS c
                WHERE c.publicationId = Publication.id
            )`), // <<< CORRECTED SYNTAX
        "commentCount", // Alias for the count
      ],
    ],
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "username", "profilePictureUrl"],
      },
      // Optionally include comments directly if needed on detail page load
      // {
      //   model: Comment,
      //   as: 'comments',
      //   limit: 5, // Example: limit initial comments
      //   order: [['createdAt', 'DESC']],
      //   include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]
      // }
    ],
  });

  if (publication) {
    // Convert to plain JSON, manually handle boolean conversion for isBookmarked if needed
    const plainPublication = publication.toJSON();
    plainPublication.isBookmarked = !!plainPublication.isBookmarked; // Ensure boolean true/false

    res.status(200).json({ success: true, data: plainPublication });
  } else {
    res.status(404);
    throw new Error("Publication not found");
  }
});

/**
 * @desc    Update a publication owned by the logged-in user
 * @route   PUT /api/publications/:id
 * @access  Private
 */
export const updatePublication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user?.id;
  const {
    title,
    summary,
    author,
    tags,
    area,
    publicationDate,
    document_link,
    collaborationStatus,
    journal,
    doi,
    thumbnail,
    // citations, // Usually not updated manually by user
  } = req.body;

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  const publication = await Publication.findByPk(id);
  if (!publication) {
    res.status(404);
    throw new Error("Publication not found");
  }
  if (publication.ownerId !== ownerId) {
    res.status(403);
    throw new Error("Forbidden: You cannot edit this publication.");
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (summary !== undefined) updateData.summary = summary;
  if (author !== undefined) updateData.author = author;
  if (tags !== undefined)
    updateData.tags = Array.isArray(tags)
      ? tags
      : tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : publication.tags; // Keep existing if undefined
  if (area !== undefined) updateData.area = area;
  if (publicationDate !== undefined)
    updateData.publicationDate = publicationDate || null;
  if (document_link !== undefined)
    updateData.document_link = document_link || null;
  if (journal !== undefined) updateData.journal = journal || null;
  if (doi !== undefined) updateData.doi = doi || null;
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null;
  if (
    collaborationStatus !== undefined &&
    ["open", "in_progress", "closed"].includes(collaborationStatus)
  ) {
    updateData.collaborationStatus = collaborationStatus;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(200).json({
      success: true,
      message: "No update data provided.",
      data: publication, // Return current data
    });
  }

  await publication.update(updateData); // Update the instance

  res.status(200).json({
    success: true,
    message: "Publication updated successfully.",
    data: publication, // Return updated instance
  });
});

/**
 * @desc    Delete a publication owned by the logged-in user
 * @route   DELETE /api/publications/:id
 * @access  Private
 */
export const deletePublication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user?.id;

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  const publication = await Publication.findOne({
    where: { id: id, ownerId: ownerId },
  });
  if (!publication) {
    res.status(404);
    throw new Error("Publication not found or you cannot delete it.");
  }

  await publication.destroy(); // Cascade should handle comments, bookmarks

  console.log(`User ${ownerId} deleted publication ID ${id}`);
  res
    .status(200)
    .json({ success: true, message: "Publication deleted successfully." });
});

/**
 * @desc    Get publications for public exploration (search, filter, sort)
 * @route   GET /api/publications/explore
 * @access  Public (but includes user-specific bookmark status if logged in)
 */
export const getExplorePublications = asyncHandler(async (req, res) => {
  // --- Destructure and Validate Query Params ---
  const {
    search,
    area,
    sortBy = "date_desc", // Updated default sort key
    page = 1,
    limit = 12,
  } = req.query;
  const loggedInUserId = req.user?.id; // Get ID if user is logged in
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortOrderParam = (req.query.sortOrder || "DESC").toUpperCase(); // Default sort order

  if (
    isNaN(pageNum) ||
    isNaN(limitNum) ||
    pageNum < 1 ||
    limitNum < 1 ||
    limitNum > 100 // Sensible limit
  ) {
    res.status(400);
    throw new Error("Invalid pagination parameters.");
  }
  // SortOrder validation happens when assigning orderClause

  const offset = (pageNum - 1) * limitNum;

  // --- Build Query ---
  let whereClause = {}; // Start with empty where, filter as needed
  let orderClause = [];
  let includeClause = [
    { model: User, as: "owner", attributes: ["id", "username"] }, // Include basic owner info
  ];

  // Filtering
  if (search) {
    const searchPattern = `%${search}%`;
    // Add FULLTEXT search if configured on DB, otherwise use LIKE
    whereClause[Op.or] = [
      { title: { [Op.like]: searchPattern } },
      { summary: { [Op.like]: searchPattern } },
      { author: { [Op.like]: searchPattern } },
      { area: { [Op.like]: searchPattern } },
      { tags: { [Op.like]: searchPattern } }, // Basic tag search (less efficient than JSON operators)
      // { '$owner.username$': { [Op.like]: searchPattern } } // Requires subQuery: false if used
    ];
  }
  if (area && area !== "All") {
    // Allow filtering by area
    whereClause.area = area;
  }

  // Add specific filters if needed, e.g., only 'open' status for explore?
  // whereClause.collaborationStatus = 'open';

  // Sorting
  // Define allowed sort columns to prevent arbitrary column sorting
  const allowedSortColumns = {
    date_desc: ["createdAt", "DESC"],
    date_asc: ["createdAt", "ASC"],
    title_asc: ["title", "ASC"],
    title_desc: ["title", "DESC"],
    views_desc: ["views", "DESC"], // Make sure 'views' is in attributes if sorting by it
    // Add more as needed: 'author_asc', 'area_asc', etc.
  };

  orderClause = allowedSortColumns[sortBy] || allowedSortColumns["date_desc"]; // Default to newest first
  // Validate the derived sort order direction (ASC/DESC)
  if (!["ASC", "DESC"].includes(orderClause[1])) {
    console.warn(
      `Invalid sort order detected for sortBy key '${sortBy}', defaulting direction to DESC.`
    );
    orderClause[1] = "DESC"; // Fallback direction
  }

  // --- Base Attributes to Select ---
  const attributes = [
    "id",
    "title",
    "summary",
    "author",
    "ownerId",
    "tags",
    "area",
    "publicationDate",
    "collaborationStatus",
    "thumbnail",
    "views",
    "citations",
    "doi",
    "createdAt",
    "updatedAt",
    // Add isBookmarked status dynamically (MySQL/MariaDB compatible syntax)
    loggedInUserId
      ? [
          db.sequelize.literal(`(
                EXISTS (
                    SELECT 1 FROM user_bookmarks AS ub
                    WHERE ub.publicationId = Publication.id AND ub.userId = ${loggedInUserId}
                )
            )`), // <<< CORRECTED SYNTAX
          "isBookmarked",
        ]
      : db.sequelize.literal("false AS isBookmarked"),
    // Add comment count dynamically (MySQL/MariaDB compatible syntax)
    [
      db.sequelize.literal(`(
              SELECT COUNT(*) FROM comments AS c
              WHERE c.publicationId = Publication.id
          )`), // <<< CORRECTED SYNTAX
      "commentCount",
    ],
  ];

  // --- Database Query ---
  const { count, rows } = await Publication.findAndCountAll({
    attributes: attributes,
    where: whereClause,
    include: includeClause,
    order: [orderClause], // Order expects an array of arrays e.g., [['createdAt', 'DESC']]
    limit: limitNum,
    offset: offset,
    distinct: true, // Important when using includes
    // subQuery: false, // Only set true if filtering/ordering by included model fields like '$owner.username$'
  });

  // --- Format Response ---
  // Ensure isBookmarked is boolean
  const formattedPublications = rows.map((pub) => {
    const plainPub = pub.toJSON();
    plainPub.isBookmarked = !!plainPub.isBookmarked;
    return plainPub;
  });

  res.status(200).json({
    success: true,
    data: formattedPublications,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      limit: limitNum,
    },
  });
});

// =============================================
//        BOOKMARK CONTROLLER
// =============================================

/**
 * @desc    Toggle bookmark status for a publication for the logged-in user
 * @route   PATCH /api/publications/:id/bookmark
 * @access  Private (Requires login)
 */
export const toggleBookmark = asyncHandler(async (req, res) => {
  const publicationId = parseInt(req.params.id, 10); // Get publication ID from URL
  const userId = req.user?.id; // Get user ID from authentication middleware
  const { bookmark } = req.body; // Get desired state (true/false) from request body

  // --- Validations ---
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required to bookmark.");
  }
  if (isNaN(publicationId)) {
    res.status(400);
    throw new Error("Invalid Publication ID provided.");
  }
  if (typeof bookmark !== "boolean") {
    res.status(400);
    throw new Error(
      "Invalid 'bookmark' value provided. Must be true or false."
    );
  }

  // Check if the publication actually exists
  const publicationExists = await Publication.findByPk(publicationId, {
    attributes: ["id"],
  }); // Lightweight check
  if (!publicationExists) {
    res.status(404);
    throw new Error("Publication not found.");
  }

  // --- Perform Action ---
  try {
    if (bookmark === true) {
      // Add bookmark: Use findOrCreate to handle potential duplicates gracefully
      const [userBookmark, created] = await UserBookmark.findOrCreate({
        where: { userId: userId, publicationId: publicationId },
        // No defaults needed if table only has FKs and timestamps
      });
      if (created) {
        console.log(
          `Bookmark CREATED for userId: ${userId}, publicationId: ${publicationId}`
        );
        res
          .status(201)
          .json({ message: "Publication bookmarked successfully" }); // 201 Created
      } else {
        console.log(
          `Bookmark already exists for userId: ${userId}, publicationId: ${publicationId}`
        );
        res.status(200).json({ message: "Publication was already bookmarked" }); // 200 OK
      }
    } else {
      // Remove bookmark
      const deletedCount = await UserBookmark.destroy({
        where: { userId: userId, publicationId: publicationId },
      });

      if (deletedCount > 0) {
        console.log(
          `Bookmark DELETED for userId: ${userId}, publicationId: ${publicationId}`
        );
        res.status(200).json({ message: "Bookmark removed successfully" });
      } else {
        console.log(
          `Attempted to delete non-existent bookmark for userId: ${userId}, publicationId: ${publicationId}`
        );
        // It's okay if it didn't exist, the desired state is achieved
        res.status(200).json({ message: "Bookmark was not found to remove" });
      }
    }
  } catch (error) {
    console.error("Bookmark toggle database error:", error);
    res.status(500); // Internal Server Error
    throw new Error("Failed to update bookmark status due to a server error.");
  }
});

// =============================================
//        ADMIN PUBLICATION CONTROLLERS (Example Stubs - Move if needed)
// =============================================

/**
 * @desc    Get ALL publications with filtering/sorting (Admin only)
 * @route   GET /api/admin/publications (Example route - define in adminRoutes.js)
 * @access  Private/Admin
 */
// export const adminGetAllPublications = asyncHandler(async (req, res) => { ... });

/**
 * @desc    Delete ANY publication by ID (Admin only)
 * @route   DELETE /api/admin/publications/:id (Example route - define in adminRoutes.js)
 * @access  Private/Admin
 */
// export const adminDeletePublication = asyncHandler(async (req, res) => { ... });
