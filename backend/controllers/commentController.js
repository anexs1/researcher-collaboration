// backend/controllers/commentController.js

import db from "../models/index.js"; // Import the database object
const { Comment, User, Publication } = db; // Destructure necessary models
import asyncHandler from "express-async-handler";

/**
 * @desc    Get all comments for a specific publication
 * @route   GET /api/publications/:publicationId/comments
 * @access  Public (Anyone can view comments)
 */
export const getCommentsForPublication = asyncHandler(async (req, res) => {
  const publicationId = parseInt(req.params.publicationId, 10);

  // --- Validation ---
  if (isNaN(publicationId)) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  // --- Optional: Check if publication exists ---
  const publicationExists = await Publication.findByPk(publicationId, {
    attributes: ["id"],
  });
  if (!publicationExists) {
    res.status(404);
    throw new Error("Publication not found.");
  }

  // --- Fetch Comments ---
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15; // Adjust limit as needed
  const offset = (page - 1) * limit;

  const { count, rows: comments } = await Comment.findAndCountAll({
    where: { publicationId: publicationId },
    include: [
      {
        model: User,
        as: "author", // Use the alias defined in Comment model association
        attributes: ["id", "username", "profilePictureUrl"], // Select necessary author fields
      },
    ],
    order: [
      ["createdAt", "DESC"], // Show newest comments first (or ASC for oldest first)
    ],
    limit: limit,
    offset: offset,
    distinct: true, // Important with includes and count
  });

  res.status(200).json({
    success: true,
    data: comments,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit: limit,
    },
  });
});

// =====================================================
//        *** CREATE COMMENT FUNCTION ***
// =====================================================

/**
 * @desc    Create a new comment for a publication
 * @route   POST /api/publications/:publicationId/comments
 * @access  Private (Requires logged-in user via 'protect' middleware)
 */
export const createComment = asyncHandler(async (req, res) => {
  const publicationId = parseInt(req.params.publicationId, 10);
  const userId = req.user?.id; // Get user ID from auth middleware (req.user)
  const { content } = req.body; // Get comment content from request body

  // --- 1. Validation ---
  if (!userId) {
    // Should be caught by 'protect' middleware, but good to double-check
    res.status(401);
    throw new Error("Authentication required to post a comment.");
  }
  if (isNaN(publicationId)) {
    res.status(400);
    throw new Error("Invalid Publication ID provided in URL.");
  }
  // Validate content presence and type
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400);
    throw new Error("Comment content cannot be empty.");
  }
  // Optional: Validate content length
  if (content.trim().length > 2000) {
    // Adjust max length as needed
    res.status(400);
    throw new Error(
      "Comment content exceeds maximum length (2000 characters)."
    );
  }

  // --- 2. Check if Target Publication exists ---
  const publicationExists = await Publication.findByPk(publicationId, {
    attributes: ["id"], // Only need to check existence
  });
  if (!publicationExists) {
    res.status(404); // Not Found
    throw new Error("Cannot comment on a publication that does not exist.");
  }

  // --- 3. Create the Comment in the Database ---
  let newComment;
  try {
    newComment = await Comment.create({
      publicationId: publicationId,
      userId: userId,
      content: content.trim(), // Store trimmed content
    });
  } catch (dbError) {
    console.error("Database error creating comment:", dbError);
    res.status(500); // Internal Server Error for DB issues
    throw new Error("Failed to save comment due to a server error.");
  }

  // --- 4. Respond with the created comment (including author details) ---
  // Fetch the newly created comment again to include the associated author info
  const createdCommentWithAuthor = await Comment.findByPk(newComment.id, {
    include: [
      {
        model: User,
        as: "author", // Make sure 'as: author' matches your Comment model association
        attributes: ["id", "username", "profilePictureUrl"], // Send necessary author info
      },
    ],
  });

  if (!createdCommentWithAuthor) {
    // Should not happen if create succeeded, but handle defensively
    console.error(
      `Failed to fetch newly created comment ${newComment.id} with author.`
    );
    res.status(500);
    throw new Error("Failed to retrieve comment details after creation.");
  }

  // --- Success Response ---
  res.status(201).json({ success: true, data: createdCommentWithAuthor }); // 201 Created status
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:commentId  (Note: Recommend separate route)
 * @access  Private (Comment owner or Admin)
 */
// export const deleteComment = asyncHandler(async (req, res) => { ... }); // Keep implementation if needed
