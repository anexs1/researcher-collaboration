// backend/controllers/commentController.js
import db from "../models/index.js";
const { Comment, User, Publication } = db; // Include Publication to check existence
import asyncHandler from "express-async-handler";

/**
 * @desc    Get comments for a specific publication
 * @route   GET /api/publications/:publicationId/comments
 * @access  Public
 */
export const getCommentsForPublication = asyncHandler(async (req, res) => {
  const { publicationId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20; // Comments per page
  const offset = (page - 1) * limit;

  if (!publicationId || isNaN(parseInt(publicationId))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }

  // Optionally check if publication exists first (good practice)
  const publicationExists = await Publication.count({
    where: { id: publicationId },
  });
  if (publicationExists === 0) {
    res.status(404);
    throw new Error("Publication not found.");
  }

  const { count, rows } = await Comment.findAndCountAll({
    where: { publicationId: publicationId },
    include: [
      {
        model: User,
        as: "author", // Use the alias defined in Comment.associate
        attributes: ["id", "username", "profilePictureUrl"], // Select author details needed
      },
    ],
    order: [["createdAt", "DESC"]], // Show newest comments first
    limit: limit,
    offset: offset,
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
 * @desc    Create a new comment for a publication
 * @route   POST /api/publications/:publicationId/comments
 * @access  Private (Requires login via 'protect' middleware)
 */
export const createComment = asyncHandler(async (req, res) => {
  const { publicationId } = req.params;
  const { content } = req.body;
  const userId = req.user?.id; // From 'protect' middleware

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!publicationId || isNaN(parseInt(publicationId))) {
    res.status(400);
    throw new Error("Invalid Publication ID.");
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400);
    throw new Error("Comment content cannot be empty.");
  }
  if (content.trim().length > 1000) {
    // Match model validation
    res.status(400);
    throw new Error("Comment exceeds maximum length (1000 characters).");
  }

  // Check if publication exists
  const publication = await Publication.findByPk(publicationId);
  if (!publication) {
    res.status(404);
    throw new Error("Cannot comment on a non-existent publication.");
  }

  // Create the comment
  const newComment = await Comment.create({
    content: content.trim(),
    userId: userId,
    publicationId: parseInt(publicationId), // Ensure it's an integer
  });

  // Refetch the comment with author details to return in response
  const commentWithAuthor = await Comment.findByPk(newComment.id, {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "username", "profilePictureUrl"],
      },
    ],
  });

  res.status(201).json({ success: true, data: commentWithAuthor });
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:commentId
 * @access  Private (Owner or Admin)
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?.id; // Logged in user ID
  const userRole = req.user?.role; // Logged in user role

  if (!userId) {
    res.status(401);
    throw new Error("Authentication required.");
  }
  if (!commentId || isNaN(parseInt(commentId))) {
    res.status(400);
    throw new Error("Invalid Comment ID.");
  }

  const comment = await Comment.findByPk(commentId);

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found.");
  }

  // Authorization Check: Allow deletion if user is the comment author OR an admin
  if (comment.userId !== userId && userRole !== "admin") {
    res.status(403);
    throw new Error("Forbidden: You cannot delete this comment.");
  }

  await comment.destroy();

  res
    .status(200)
    .json({ success: true, message: "Comment deleted successfully." });
});

// Optional: Add updateComment controller if needed
