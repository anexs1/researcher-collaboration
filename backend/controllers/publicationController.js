// backend/controllers/publicationController.js

import db from "../models/index.js"; // Import the database object
const { Publication, User } = db; // Destructure the models
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
  const { title, summary, author, tags, area, publicationDate, document_link } =
    req.body;
  const ownerId = req.user?.id;

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!title || !summary || !author) {
    res.status(400);
    throw new Error("Missing required fields (title, summary, author).");
  }

  // No try/catch needed here if using asyncHandler and have global error handling middleware
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
      : [], // Process tags more robustly
    area: area || null,
    publicationDate: publicationDate || null,
    document_link: document_link || null,
    ownerId: ownerId,
    collaborationStatus: "open",
  });

  res.status(201).json({ success: true, data: newPublication });
});

/**
 * @desc    Get all publications (Example - Public Listing)
 * @route   GET /api/publications (If you create this route)
 * @access  Public (potentially)
 */
export const getAllPublications = asyncHandler(async (req, res) => {
  // Add pagination, basic filtering/sorting for a usable public endpoint
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { count, rows } = await Publication.findAndCountAll({
    // Select specific attributes suitable for public listing
    attributes: [
      "id",
      "title",
      "summary",
      "author",
      "ownerId",
      "area",
      "publicationDate",
      "collaborationStatus",
      "createdAt",
    ],
    where: { collaborationStatus: "open" }, // Example: Only show open ones publicly
    order: [["createdAt", "DESC"]],
    include: [{ model: User, as: "owner", attributes: ["id", "username"] }], // Limited owner details
    limit: limit,
    offset: offset,
    distinct: true,
  });

  res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit: limit,
    },
  });
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

  // Fetch publications where ownerId matches the logged-in user's ID
  const publications = await Publication.findAll({
    where: { ownerId: ownerId },
    order: [["createdAt", "DESC"]],
    // Include all relevant fields for the owner's view
    // attributes: [...] // Optional: List specific fields if needed
  });
  res.status(200).json({ success: true, data: publications });
});

/**
 * @desc    Get a single publication by its ID
 * @route   GET /api/publications/:id
 * @access  Public
 */
export const getPublicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  const publication = await Publication.findByPk(id, {
    // Explicitly list attributes to prevent accidentally selecting sensitive data
    // if defaultScope isn't perfectly configured or if it changes.
    attributes: [
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
      "createdAt",
      "updatedAt",
      // Add 'views', 'citations', 'thumbnail' if they exist and are public
    ],
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "username", "profilePictureUrl"], // Public owner info
      },
    ],
  });

  if (publication) {
    res.status(200).json({ success: true, data: publication });
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
  } = req.body;

  if (!ownerId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  // Find the publication first to check ownership
  const publication = await Publication.findByPk(id);
  if (!publication) {
    res.status(404);
    throw new Error("Publication not found");
  }
  if (publication.ownerId !== ownerId) {
    res.status(403);
    throw new Error(
      "Forbidden: You do not have permission to edit this publication."
    );
  }

  // Prepare update payload - only include fields that were actually sent in the request
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
      : [];
  if (area !== undefined) updateData.area = area;
  if (publicationDate !== undefined)
    updateData.publicationDate = publicationDate || null;
  if (document_link !== undefined)
    updateData.document_link = document_link || null;
  // Only allow certain statuses to be set by user? Or handle via separate endpoint?
  if (
    collaborationStatus !== undefined &&
    ["open", "in_progress", "closed"].includes(collaborationStatus)
  ) {
    updateData.collaborationStatus = collaborationStatus;
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400);
    throw new Error("No update data provided.");
  }

  // Perform the update
  const [updatedCount] = await Publication.update(updateData, {
    where: { id: id, ownerId: ownerId },
  }); // Re-check ownerId for safety

  if (updatedCount > 0) {
    const updatedPublication = await Publication.findByPk(id); // Fetch updated data
    res.status(200).json({
      success: true,
      message: "Publication updated successfully.",
      data: updatedPublication,
    });
  } else {
    console.warn(`Update for publication ID ${id} resulted in 0 updated rows.`);
    const currentPublication = await Publication.findByPk(id); // Fetch current data
    res.status(200).json({
      success: true,
      message: "No changes detected or update failed silently.",
      data: currentPublication,
    });
  }
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

  // Find first to check ownership (provides better error message)
  const publication = await Publication.findOne({
    where: { id: id, ownerId: ownerId },
  });
  if (!publication) {
    res.status(404);
    throw new Error(
      "Publication not found or you do not have permission to delete it."
    );
  }

  // Perform the delete
  const deletedCount = await Publication.destroy({
    where: { id: id, ownerId: ownerId },
  });

  if (deletedCount > 0) {
    console.log(`User ${ownerId} deleted publication ID ${id}`);
    res
      .status(200)
      .json({ success: true, message: "Publication deleted successfully." });
  } else {
    // Should be caught by the findOne check, but as a safeguard
    res.status(404);
    throw new Error("Publication not found or delete failed unexpectedly.");
  }
});

/**
 * @desc    Get publications for public exploration (e.g., search page)
 * @route   GET /api/publications/explore
 * @access  Public
 */
export const getExplorePublications = asyncHandler(async (req, res) => {
  // --- Destructure and Validate Query Params ---
  const {
    search,
    area,
    sortBy = "createdAt",
    page = 1,
    limit = 12,
  } = req.query;
  const loggedInUserId = req.user?.id;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortOrder = (req.query.sortOrder || "desc").toUpperCase();

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

  // --- Build Query ---
  let whereClause = { collaborationStatus: "open" }; // Default filter
  let orderClause = [];
  let includeClause = [
    { model: User, as: "owner", attributes: ["id", "username"] },
  ];

  // Filtering
  if (search) {
    const searchPattern = `%${search}%`;
    whereClause[Op.or] = [
      { title: { [Op.like]: searchPattern } },
      { summary: { [Op.like]: searchPattern } },
      { author: { [Op.like]: searchPattern } },
      { area: { [Op.like]: searchPattern } },
      // { '$owner.username$': { [Op.like]: searchPattern } } // Optional owner search
    ];
  }
  if (area && area !== "All") {
    whereClause.area = area;
  }
  // if (loggedInUserId) { whereClause.ownerId = { [Op.ne]: loggedInUserId }; } // Optional exclude own

  // Sorting
  const allowedSortColumns = [
    "title",
    "publicationDate",
    "createdAt",
    "author",
    "area",
  ];
  const effectiveSortBy = allowedSortColumns.includes(sortBy)
    ? sortBy
    : "createdAt";
  if (!["ASC", "DESC"].includes(sortOrder)) {
    res.status(400);
    throw new Error("Invalid sortOrder parameter.");
  }
  orderClause.push([effectiveSortBy, sortOrder]);
  if (effectiveSortBy !== "createdAt") orderClause.push(["createdAt", "DESC"]);

  // --- Database Query ---
  const { count, rows } = await Publication.findAndCountAll({
    attributes: [
      // Explicitly list attributes
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
      "createdAt",
      "updatedAt",
    ],
    where: whereClause,
    include: includeClause,
    order: orderClause,
    limit: limitNum,
    offset: offset,
    distinct: true,
    // subQuery: false, // Add if needed for included model search/sort
  });

  // --- Format Response ---
  const formattedPublications = rows.map((pub) => pub.toJSON()); // Simple toJSON for public view

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
//        ADMIN PUBLICATION CONTROLLERS
// =============================================
// These functions are intended for Admin users and should ideally be
// in adminController.js and routed via adminRoutes.js, protected by admin middleware.

/**
 * @desc    Get ALL publications with filtering/sorting (Admin only)
 * @route   GET /api/admin/publications (Example route - define in adminRoutes.js)
 * @access  Private/Admin
 */
export const adminGetAllPublications = asyncHandler(async (req, res) => {
  // --- Destructure and Validate Query Params ---
  const {
    search,
    status,
    sortBy = "createdAt",
    page = 1,
    limit = 15,
  } = req.query;
  const sortOrder = (req.query.sortOrder || "desc").toUpperCase();

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  if (
    isNaN(pageNum) ||
    isNaN(limitNum) ||
    pageNum < 1 ||
    limitNum < 1 ||
    limitNum > 200
  ) {
    res.status(400);
    throw new Error("Invalid pagination parameters.");
  }
  const offset = (pageNum - 1) * limitNum;

  // --- Build Query ---
  let whereClause = {};
  let orderClause = [];
  let includeClause = [
    { model: User, as: "owner", attributes: ["id", "username", "email"] },
  ];

  // Filtering
  if (status && status !== "all") {
    whereClause.collaborationStatus = status;
  }
  if (search) {
    const searchPattern = `%${search}%`;
    whereClause[Op.or] = [
      { title: { [Op.like]: searchPattern } },
      { summary: { [Op.like]: searchPattern } },
      { author: { [Op.like]: searchPattern } },
      { area: { [Op.like]: searchPattern } },
      { "$owner.username$": { [Op.like]: searchPattern } },
      { "$owner.email$": { [Op.like]: searchPattern } },
    ];
  }

  // Sorting
  const validSortColumns = [
    "id",
    "title",
    "publicationDate",
    "createdAt",
    "updatedAt",
    "collaborationStatus",
    "author",
    "area",
    "$owner.username$",
    "$owner.email$",
  ];
  const effectiveSortBy = validSortColumns.includes(sortBy)
    ? sortBy
    : "createdAt";
  if (!["ASC", "DESC"].includes(sortOrder)) {
    throw new Error("Invalid sortOrder parameter.");
  }

  if (effectiveSortBy.startsWith("$owner.")) {
    const ownerFieldName = effectiveSortBy.split(".")[1];
    if (User.getAttributes()[ownerFieldName]) {
      // Check attribute exists
      orderClause.push([includeClause[0], ownerFieldName, sortOrder]);
    } else {
      console.warn(
        `Admin sort attempt on non-existent User field: ${ownerFieldName}`
      );
      orderClause.push(["createdAt", "DESC"]); // Fallback
    }
  } else {
    orderClause.push([effectiveSortBy, sortOrder]);
  }
  if (effectiveSortBy !== "createdAt") orderClause.push(["createdAt", "DESC"]);

  // --- Database Query ---
  const { count, rows } = await Publication.findAndCountAll({
    attributes: [
      // Explicitly list attributes
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
      "createdAt",
      "updatedAt",
    ],
    where: whereClause,
    include: includeClause,
    order: orderClause,
    limit: limitNum,
    offset: offset,
    distinct: true,
    subQuery: false, // Needed for $owner.field$ search/sort
  });

  // --- Format Response ---
  // Rename owner -> user for consistency if needed by admin frontend
  const publicationsWithUser = rows.map((pub) => {
    const plainPub = pub.toJSON();
    // return { ...plainPub, user: plainPub.owner, owner: undefined }; // Rename
    return plainPub; // Or just return with 'owner' alias
  });

  res.status(200).json({
    success: true,
    data: publicationsWithUser, // Use appropriately named data
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      limit: limitNum,
    },
  });
});

/**
 * @desc    Delete ANY publication by ID (Admin only)
 * @route   DELETE /api/admin/publications/:id (Example route - define in adminRoutes.js)
 * @access  Private/Admin
 */
export const adminDeletePublication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id, 10))) {
    res.status(400);
    throw new Error("Invalid publication ID.");
  }

  // Find first to ensure it exists before attempting delete
  const publication = await Publication.findByPk(id);
  if (!publication) {
    res.status(404);
    throw new Error("Publication not found.");
  }

  // Perform the delete
  await publication.destroy(); // Use instance destroy

  console.log(`Admin ${req.user?.email || "N/A"} deleted publication ID ${id}`);
  res.status(200).json({
    success: true,
    message: "Publication deleted successfully by admin.",
  });
  // Or res.status(204).send();
});

// Add other admin-specific controllers like adminUpdatePublication if needed
