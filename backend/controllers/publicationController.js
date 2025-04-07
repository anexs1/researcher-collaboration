// controllers/publicationController.js
import Publication from "../models/publication.js";
// Potentially import User model if needed for specific checks/includes
// import User from '../models/user.js';

// Create a new publication (associates with logged-in user)
export const createPublication = async (req, res) => {
  try {
    const { title, abstract, author, document_link } = req.body;
    const userId = req.user?.id; // Get userId from auth middleware

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    // Basic validation (can be expanded or moved to middleware/service)
    if (!title || !abstract || !author || !document_link) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const newPublication = await Publication.create({
      title,
      abstract,
      author, // Keep author field as provided, but link via userId
      document_link,
      userId: userId, // Associate with the logged-in user
    });

    // Fetch the newly created publication maybe including owner info if needed later
    const createdPublication = await Publication.findByPk(newPublication.id);

    res.status(201).json({ success: true, data: createdPublication });
  } catch (error) {
    console.error("Error creating publication:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create publication",
      error: error.message,
    });
  }
};

// Get ALL publications (public feed)
export const getAllPublications = async (req, res) => {
  try {
    // Optionally include owner info if needed for display
    const publications = await Publication.findAll({
      order: [["createdAt", "DESC"]], // Example ordering
      // include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'profileImage'] }] // Example include
    });
    res.status(200).json({ success: true, data: publications });
  } catch (error) {
    console.error("Error fetching all publications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch publications",
      error: error.message,
    });
  }
};

// *** NEW: Get publications for the currently logged-in user ***
export const getMyPublications = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    const publications = await Publication.findAll({
      where: { userId: userId }, // Filter by the logged-in user's ID
      order: [["createdAt", "DESC"]], // Order by creation date, newest first
    });

    res.status(200).json({ success: true, data: publications });
  } catch (error) {
    console.error("Error fetching user's publications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your publications",
      error: error.message,
    });
  }
};

// Get a single publication by ID (public)
export const getPublicationById = async (req, res) => {
  const { id } = req.params;
  try {
    const publication = await Publication.findByPk(id);
    if (publication) {
      res.status(200).json({ success: true, data: publication });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Publication not found" });
    }
  } catch (error) {
    console.error("Error fetching publication by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch publication",
      error: error.message,
    });
  }
};

// Update a publication by ID (checks ownership)
export const updatePublication = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { title, abstract, author, document_link } = req.body; // Get fields to update

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }

  try {
    const publication = await Publication.findByPk(id);

    if (!publication) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found" });
    }

    // --- Ownership Check ---
    if (publication.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot edit this publication.",
      });
    }

    // Proceed with update
    const [updatedCount] = await Publication.update(
      { title, abstract, author, document_link }, // Only update allowed fields
      { where: { id: id } }
    );

    if (updatedCount > 0) {
      const updatedPublication = await Publication.findByPk(id); // Fetch updated record
      res.status(200).json({ success: true, data: updatedPublication });
    } else {
      // Should not happen if findByPk succeeded, but handle defensively
      res.status(404).json({
        success: false,
        message: "Publication found but update failed.",
      });
    }
  } catch (error) {
    console.error("Error updating publication:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update publication",
      error: error.message,
    });
  }
};

// Delete a publication by ID (checks ownership)
export const deletePublication = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }

  try {
    const publication = await Publication.findByPk(id);

    if (!publication) {
      return res
        .status(404)
        .json({ success: false, message: "Publication not found" });
    }

    // --- Ownership Check ---
    if (publication.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot delete this publication.",
      });
    }

    // Proceed with deletion
    const deletedCount = await Publication.destroy({
      where: { id: id },
    });

    if (deletedCount > 0) {
      // Send 200 OK with success message instead of 204 No Content for clarity
      res
        .status(200)
        .json({ success: true, message: "Publication deleted successfully." });
    } else {
      // Should not happen if findByPk succeeded, but handle defensively
      res.status(404).json({
        success: false,
        message: "Publication found but delete failed.",
      });
    }
  } catch (error) {
    console.error("Error deleting publication:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete publication",
      error: error.message,
    });
  }
};
