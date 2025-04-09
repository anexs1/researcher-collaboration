// File: backend/controllers/publicationController.js

import db from "../models/index.js"; // Import the default export (the 'db' object)
const { Publication, User } = db; // Destructure the models from the 'db' object
import { Op } from "sequelize";

// =============================================
//        REGULAR USER CONTROLLERS
// =============================================

export const createPublication = async (req, res) => {
  try {
    const {
      title,
      summary,
      author,
      tags,
      area,
      publicationDate,
      document_link,
    } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }
    if (!title || !summary || !author) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (title, summary, author).",
      });
    }

    const newPublication = await Publication.create({
      title,
      summary,
      author,
      tags: tags || [],
      area: area || null,
      publicationDate: publicationDate || new Date(),
      document_link: document_link || null,
      ownerId: ownerId,
      collaborationStatus: "open",
    });
    res.status(201).json({ success: true, data: newPublication });
  } catch (error) {
    console.error("Error creating publication:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create publication",
      error: error.message,
    });
  }
};

export const getAllPublications = async (req, res) => {
  // Consider if this is still needed or if '/explore' covers public view
  try {
    const publications = await Publication.findAll({
      order: [["createdAt", "DESC"]],
      include: [{ model: User, as: "owner", attributes: ["id", "username"] }], // Only include necessary public fields
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

export const getMyPublications = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });

    const publications = await Publication.findAll({
      where: { ownerId: ownerId },
      order: [["createdAt", "DESC"]],
      // No need to include owner details here usually, as it's known
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

export const getPublicationById = async (req, res) => {
  const { id } = req.params;
  try {
    const publication = await Publication.findByPk(id, {
      include: [{ model: User, as: "owner", attributes: ["id", "username"] }], // Public view, limited owner details
    });
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

export const updatePublication = async (req, res) => {
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

  if (!ownerId)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });

  try {
    // Find the publication first to check ownership
    const publication = await Publication.findByPk(id);
    if (!publication)
      return res
        .status(404)
        .json({ success: false, message: "Publication not found" });
    if (publication.ownerId !== ownerId)
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot edit this publication.",
      });

    // Proceed with update since ownership is confirmed
    const [updatedCount] = await Publication.update(
      {
        title,
        summary,
        author,
        tags,
        area,
        publicationDate,
        document_link,
        collaborationStatus,
      },
      { where: { id: id } } // Can remove ownerId here as it was checked
    );

    if (updatedCount > 0) {
      // Fetch the updated record to return it
      const updatedPublication = await Publication.findByPk(id);
      res.status(200).json({ success: true, data: updatedPublication });
    } else {
      // Should not happen often if findByPk succeeded, maybe no fields changed
      res.status(304).json({
        // 304 Not Modified might be appropriate
        success: false,
        message: "Publication update failed (no changes detected).",
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

export const deletePublication = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user?.id;

  if (!ownerId)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });

  try {
    // Check ownership before deleting
    const publication = await Publication.findOne({
      where: { id: id, ownerId: ownerId },
    });
    if (!publication)
      return res.status(404).json({
        success: false,
        message: "Publication not found or you do not own it.",
      });

    const deletedCount = await Publication.destroy({
      where: { id: id, ownerId: ownerId }, // Ensure atomicity
    });

    if (deletedCount > 0) {
      res
        .status(200)
        .json({ success: true, message: "Publication deleted successfully." });
    } else {
      // Should be caught above, but safety net
      res.status(404).json({
        success: false,
        message: "Publication not found or delete failed.",
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

export const getExplorePublications = async (req, res) => {
  try {
    const { search, area, sortBy, page = 1, limit = 10 } = req.query;
    const loggedInUserId = req.user?.id;

    let whereClause = { collaborationStatus: "open" };
    let orderClause = [];

    if (search) {
      const searchPattern = `%${search}%`;
      whereClause[Op.or] = [
        { title: { [Op.like]: searchPattern } },
        { summary: { [Op.like]: searchPattern } },
        { author: { [Op.like]: searchPattern } },
        { area: { [Op.like]: searchPattern } },
      ];
    }
    if (area && area !== "All") whereClause.area = area;
    if (loggedInUserId) whereClause.ownerId = { [Op.ne]: loggedInUserId };

    switch (sortBy) {
      case "title_asc":
        orderClause.push(["title", "ASC"]);
        break;
      case "date_asc":
        orderClause.push(["publicationDate", "ASC"]);
        orderClause.push(["createdAt", "ASC"]);
        break;
      case "date_desc":
      default:
        orderClause.push(["publicationDate", "DESC"]);
        orderClause.push(["createdAt", "DESC"]);
        break;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters." });
    }
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Publication.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: "owner", attributes: ["id", "username"] }],
      order: orderClause,
      limit: limitNum,
      offset: offset,
      distinct: true,
    });

    const formattedPublications = rows.map((pub) => {
      const pubJson = pub.toJSON();
      // Use author field if owner is not present (shouldn't happen with include but safety)
      return {
        ...pubJson,
        authors: pubJson.owner ? [pubJson.owner.username] : [pubJson.author],
      };
    });

    res.status(200).json({
      success: true,
      count: formattedPublications.length, // Items on current page
      totalItems: count, // Total matching items
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      data: formattedPublications,
    });
  } catch (error) {
    console.error("Error fetching explore publications:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching publications",
      error: error.message,
    });
  }
};

// =============================================
//        ADMIN PUBLICATION CONTROLLERS
// =============================================

// --- Controller for Admin GET /api/admin/publications ---
// ----- CORRECTED VERSION (Assuming 'name' column does NOT exist on User) -----
export const adminGetAllPublications = async (req, res) => {
  try {
    const {
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 15,
    } = req.query;

    let whereClause = {};
    let orderClause = [];
    // ----- Correction 1: Removed 'name' from attributes -----
    let includeClause = [
      {
        model: User,
        as: "owner", // <<< VERIFY this alias matches your model association
        attributes: ["id", "username", "email"], // Only include existing fields
      },
    ];

    if (status) whereClause.collaborationStatus = status;
    if (search) {
      const searchPattern = `%${search}%`;
      // ----- Correction 2: Removed '$owner.name$' from search -----
      whereClause[Op.or] = [
        { title: { [Op.like]: searchPattern } },
        { summary: { [Op.like]: searchPattern } },
        { author: { [Op.like]: searchPattern } }, // Still search the publication's author string field
        { area: { [Op.like]: searchPattern } },
        { "$owner.username$": { [Op.like]: searchPattern } }, // Search existing fields
        { "$owner.email$": { [Op.like]: searchPattern } }, // Search existing fields
      ];
    }

    // ----- Correction 3: Adjusted sorting logic -----
    // Allow sorting only by fields that exist on Publication or included User fields that exist
    // Add '$owner.username$' or '$owner.email$' here if you want to allow sorting by them
    const validSortColumns = [
      "title",
      "publicationDate",
      "createdAt",
      "collaborationStatus",
      "author",
      "area",
      "$owner.username$",
      "$owner.email$", // Example allowed included sorts
    ];

    if (validSortColumns.includes(sortBy)) {
      // Special handling if sorting by included model field using '$...$' syntax
      if (sortBy.startsWith("$owner.")) {
        // Extract actual field name (e.g., 'username')
        const ownerFieldName = sortBy.split(".")[1];
        // Ensure the included model (index 0) and the field name are correct
        orderClause.push([
          includeClause[0],
          ownerFieldName,
          sortOrder === "asc" ? "ASC" : "DESC",
        ]);
      } else {
        // Sort by Publication field directly
        orderClause.push([sortBy, sortOrder === "asc" ? "ASC" : "DESC"]);
      }
    } else {
      // Default sort if provided sortBy is invalid
      orderClause.push(["createdAt", "DESC"]);
    }
    // Add consistent secondary sort
    if (sortBy !== "createdAt") {
      // Avoid duplicating if primary sort is createdAt
      orderClause.push(["createdAt", "DESC"]);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters." });
    }
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Publication.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: orderClause,
      limit: limitNum,
      offset: offset,
      distinct: true, // Necessary for accurate counts with includes/limits
      subQuery: false, // Often needed for '$field$.field$' searches/sorts
    });

    const pagination = {
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    };

    // Rename owner -> user for frontend consistency
    const publicationsWithUser = rows.map((pub) => {
      const plainPub = pub.toJSON();
      return { ...plainPub, user: plainPub.owner }; // Assign owner object to user key
    });

    res.status(200).json({
      success: true,
      data: { publications: publicationsWithUser, pagination: pagination },
    });
  } catch (error) {
    console.error("Error fetching publications for admin:", error);
    // Log the specific SQL error if available
    if (error.original) {
      console.error("SQL Error:", error.original.sqlMessage);
      console.error("SQL Query:", error.sql); // Log the generated SQL
    }
    res.status(500).json({
      success: false,
      message: "Server Error fetching publications for admin",
      error: error.message,
    });
  }
};

// --- Controller for Admin DELETE /api/admin/publications/:id ---
export const adminDeletePublication = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id, 10))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid publication ID." });
  }
  try {
    // Admin deletes directly without checking ownership
    const deletedCount = await Publication.destroy({ where: { id: id } });
    if (deletedCount > 0) {
      res.status(200).json({
        success: true,
        message: "Publication deleted successfully by admin.",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Publication not found or already deleted.",
      });
    }
  } catch (error) {
    console.error("Error deleting publication by admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete publication",
      error: error.message,
    });
  }
};
