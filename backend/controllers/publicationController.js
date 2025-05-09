// backend/controllers/publicationController.js

import db from "../models/index.js";
const { Publication, User, UserBookmark, Comment } = db;
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";

// =============================================
//        REGULAR USER CONTROLLERS
// =============================================

// --- Helper for common publication attributes ---
const COMMON_PUBLICATION_ATTRIBUTES = [
  "id",
  "title",
  "summary",
  "author",
  "ownerId",
  "document_link",
  "tags",
  "area",
  "publicationDate",
  "journal",
  "doi",
  "thumbnail",
  "views",
  "citations",
  "createdAt",
  "updatedAt",
  // 🆕 Add new fields
  "language",
  "version",
  "isPeerReviewed",
  "license",
  "lastReviewedAt",
  "rating",
  "downloadCount",
];

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
    journal,
    doi,
    thumbnail,
    citations,
    // 🆕 New fields from request body
    language,
    version,
    isPeerReviewed,
    license,
    // lastReviewedAt, // Typically not set on creation by user
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
    journal: journal || null,
    doi: doi || null,
    thumbnail: thumbnail || null,
    citations: parseInt(citations, 10) || 0,
    views: 0, // Default
    ownerId: ownerId,
    // 🆕 Assign new fields, relying on model defaults if not provided
    language: language, // Model default: "English"
    version: version, // Model default: "v1.0"
    isPeerReviewed:
      typeof isPeerReviewed === "boolean" ? isPeerReviewed : undefined, // Model default: false
    license: license || null,
    // lastReviewedAt: (model default: null)
    // rating: (model default: 0.0)
    // downloadCount: (model default: 0)
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
    attributes: COMMON_PUBLICATION_ATTRIBUTES,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "username", "profilePictureUrl"],
      },
    ],
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
  const loggedInUserId = req.user?.id;

  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  try {
    // Increment views before fetching, but don't let it block the main fetch
    Publication.increment("views", { where: { id: id } }).catch((viewError) => {
      console.error(
        `Non-critical: Failed to increment views for publication ${id}:`,
        viewError
      );
    });
  } catch (e) {
    /* Safety net, though increment().catch() should handle */
  }

  const publication = await Publication.findByPk(id, {
    attributes: [
      ...COMMON_PUBLICATION_ATTRIBUTES,
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
            )`),
            "isBookmarked",
          ]
        : db.sequelize.literal("false AS isBookmarked"),
      [
        db.sequelize.literal(`(
                SELECT COUNT(*)
                FROM comments AS c
                WHERE c.publicationId = Publication.id
            )`),
        "commentCount",
      ],
    ],
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "username", "profilePictureUrl"],
      },
    ],
  });

  if (publication) {
    const plainPublication = publication.toJSON();
    plainPublication.isBookmarked = !!plainPublication.isBookmarked;
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
    journal,
    doi,
    thumbnail,
    // 🆕 New fields from request body for update
    language,
    version,
    isPeerReviewed,
    license,
    lastReviewedAt,
  } = req.body;

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  const publication = await Publication.findByPk(id); // Fetches all fields by default

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
      : publication.tags;
  if (area !== undefined) updateData.area = area;
  if (publicationDate !== undefined)
    updateData.publicationDate = publicationDate || null;
  if (document_link !== undefined)
    updateData.document_link = document_link || null;
  if (journal !== undefined) updateData.journal = journal || null;
  if (doi !== undefined) updateData.doi = doi || null;
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail || null;

  // 🆕 Add new fields to updateData if provided
  if (language !== undefined) updateData.language = language;
  if (version !== undefined) updateData.version = version;
  if (isPeerReviewed !== undefined && typeof isPeerReviewed === "boolean") {
    updateData.isPeerReviewed = isPeerReviewed;
  }
  if (license !== undefined) updateData.license = license; // Allow setting to null
  if (lastReviewedAt !== undefined)
    updateData.lastReviewedAt = lastReviewedAt || null;

  if (Object.keys(updateData).length === 0) {
    return res.status(200).json({
      success: true,
      message: "No update data provided.",
      data: publication,
    });
  }

  await publication.update(updateData);
  const updatedPublication = await Publication.findByPk(id, {
    attributes: COMMON_PUBLICATION_ATTRIBUTES,
  }); // Re-fetch with all attributes

  res.status(200).json({
    success: true,
    message: "Publication updated successfully.",
    data: updatedPublication,
  });
});

/**
 * @desc    Delete a publication owned by the logged-in user
 * @route   DELETE /api/publications/:id
 * @access  Private
 */
export const deletePublication = asyncHandler(async (req, res) => {
  // ... (deletePublication - no changes needed for these new fields, it only needs id/ownerId)
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
    attributes: ["id", "ownerId"],
  });
  if (!publication) {
    res.status(404);
    throw new Error("Publication not found or you cannot delete it.");
  }

  await publication.destroy();
  console.log(`User ${ownerId} deleted publication ID ${id}`);
  res
    .status(200)
    .json({ success: true, message: "Publication deleted successfully." });
});

/**
 * @desc    Get publications for public exploration (search, filter, sort)
 * @route   GET /api/publications/explore
 * @access  Public
 */
export const getExplorePublications = asyncHandler(async (req, res) => {
  const {
    search,
    area: areaFilter,
    sortBy = "date_desc",
    page = 1,
    limit = 12,
  } = req.query;
  const loggedInUserId = req.user?.id;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (
    isNaN(pageNum) ||
    isNaN(limitNum) ||
    pageNum < 1 ||
    limitNum < 1 ||
    limitNum > 100
  ) {
    res.status(400);
    throw new Error("Invalid pagination parameters.");
  }

  const offset = (pageNum - 1) * limitNum;
  let whereClause = {};
  let orderClause = [];

  if (search) {
    const searchPattern = `%${search}%`;
    whereClause[Op.or] = [
      { title: { [Op.like]: searchPattern } },
      { summary: { [Op.like]: searchPattern } },
      { author: { [Op.like]: searchPattern } },
      { area: { [Op.like]: searchPattern } },
      { tags: { [Op.like]: searchPattern } },
      { language: { [Op.like]: searchPattern } },
      { license: { [Op.like]: searchPattern } },
    ];
  }
  if (areaFilter && areaFilter !== "All") {
    whereClause.area = areaFilter;
  }

  const allowedSortColumns = {
    date_desc: ["createdAt", "DESC"],
    date_asc: ["createdAt", "ASC"],
    title_asc: ["title", "ASC"],
    title_desc: ["title", "DESC"],
    views_desc: ["views", "DESC"],
    rating_desc: ["rating", "DESC"],
    rating_asc: ["rating", "ASC"],
    downloadCount_desc: ["downloadCount", "DESC"],
    downloadCount_asc: ["downloadCount", "ASC"],
    lastReviewedAt_desc: ["lastReviewedAt", "DESC"],
    lastReviewedAt_asc: ["lastReviewedAt", "ASC"],
  };
  orderClause = allowedSortColumns[sortBy] || allowedSortColumns["date_desc"];
  if (!["ASC", "DESC"].includes(orderClause[1])) {
    orderClause[1] = "DESC";
  }

  const attributesToSelect = [
    ...COMMON_PUBLICATION_ATTRIBUTES,
    loggedInUserId
      ? [
          db.sequelize.literal(
            `(EXISTS (SELECT 1 FROM user_bookmarks AS ub WHERE ub.publicationId = Publication.id AND ub.userId = ${loggedInUserId}))`
          ),
          "isBookmarked",
        ]
      : db.sequelize.literal("false AS isBookmarked"),
    [
      db.sequelize.literal(
        `(SELECT COUNT(*) FROM comments AS c WHERE c.publicationId = Publication.id)`
      ),
      "commentCount",
    ],
  ];

  const { count, rows } = await Publication.findAndCountAll({
    attributes: attributesToSelect,
    where: whereClause,
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "username", "profilePictureUrl"],
      },
    ],
    order: [orderClause],
    limit: limitNum,
    offset: offset,
    distinct: true,
  });

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
export const toggleBookmark = asyncHandler(async (req, res) => {
  // ... (toggleBookmark - no changes needed for these new fields)
  const publicationId = parseInt(req.params.id, 10);
  const userId = req.user?.id;
  const { bookmark } = req.body;
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
  const publicationExists = await Publication.findByPk(publicationId, {
    attributes: ["id"],
  });
  if (!publicationExists) {
    res.status(404);
    throw new Error("Publication not found.");
  }
  try {
    if (bookmark === true) {
      const [, created] = await UserBookmark.findOrCreate({
        where: { userId: userId, publicationId: publicationId },
      });
      if (created) {
        res
          .status(201)
          .json({ message: "Publication bookmarked successfully" });
      } else {
        res.status(200).json({ message: "Publication was already bookmarked" });
      }
    } else {
      const deletedCount = await UserBookmark.destroy({
        where: { userId: userId, publicationId: publicationId },
      });
      if (deletedCount > 0) {
        res.status(200).json({ message: "Bookmark removed successfully" });
      } else {
        res.status(200).json({ message: "Bookmark was not found to remove" });
      }
    }
  } catch (error) {
    console.error("Bookmark toggle database error:", error);
    res.status(500);
    throw new Error("Failed to update bookmark status due to a server error.");
  }
});

// 🆕 --- Additional Actions for New Fields ---

/**
 * @desc    Increment download count for a publication
 * @route   PATCH /api/publications/:id/download
 * @access  Public (or Private if tracking downloads per user is needed)
 */
export const incrementDownloadCount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }
  try {
    // The increment method returns an array [affectedRows, metadata] or [affectedRows]
    // We only care about affectedRows to confirm if the publication was found and updated.
    const result = await Publication.increment("downloadCount", {
      where: { id: id },
    });
    const affectedRows = Array.isArray(result)
      ? result[0]
      : typeof result === "number"
      ? result
      : 0;

    // For some databases/Sequelize versions, result might be [[Publication, boolean]]
    // A more robust check might be to see if result[0] is an array and then check its first element.
    let updatedCount = 0;
    if (
      Array.isArray(result) &&
      Array.isArray(result[0]) &&
      result[0].length > 0 &&
      result[0][0] instanceof Publication
    ) {
      updatedCount = result[0][0].downloadCount;
    } else if (
      affectedRows === 0 &&
      !(
        Array.isArray(result) &&
        Array.isArray(result[0]) &&
        result[0].length > 0
      )
    ) {
      // If no rows were affected and it wasn't the instance update case
      res.status(404);
      throw new Error(
        "Publication not found or download count could not be incremented."
      );
    }

    res.status(200).json({
      success: true,
      message: "Download count incremented.",
      downloadCount: updatedCount,
    }); // Optionally return new count
  } catch (error) {
    console.error(
      `Failed to increment download count for publication ${id}:`,
      error
    );
    if (!res.headersSent) {
      res.status(error.statusCode || 500);
    }
    // Re-throw for asyncHandler's global error handler
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error));
    }
  }
});

// Placeholder for ratePublication - complex, requires separate rating model usually
// export const ratePublication = asyncHandler(async (req, res) => { ... });
