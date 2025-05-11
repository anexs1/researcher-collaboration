import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";

export const create = async ({ name, email, issueType, message }) => {
  const query =
    "INSERT INTO contact_submissions (name, email, issue_type, message) VALUES (:name, :email, :issueType, :message)";
  try {
    const [result, metadata] = await sequelize.query(query, {
      replacements: { name, email, issueType: issueType || null, message },
    });
    const insertId = metadata && metadata.insertId ? metadata.insertId : null;
    return { id: insertId, name, email, issueType, message };
  } catch (error) {
    console.error("Error in ContactSubmission.create:", error);
    throw error;
  }
};

export const findById = async (id) => {
  if (!id) return null;
  const query = "SELECT * FROM contact_submissions WHERE id = :id LIMIT 1";
  try {
    const submissions = await sequelize.query(query, {
      replacements: { id: parseInt(id, 10) }, // Ensure ID is an integer
      type: QueryTypes.SELECT,
    });
    return submissions[0] || null;
  } catch (error) {
    console.error(`Error in ContactSubmission.findById for ID ${id}:`, error);
    throw error;
  }
};

export const getAll = async (page = 1, limit = 10, resolved = null) => {
  const offset = (page - 1) * limit;
  let baseQuery =
    "SELECT id, name, email, issue_type, LEFT(message, 100) as message_preview, submitted_at, is_resolved, resolved_at FROM contact_submissions";
  const replacements = {
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  };
  let conditions = [];

  if (resolved !== null) {
    conditions.push("is_resolved = :resolved");
    replacements.resolved = resolved;
  }

  if (conditions.length > 0) {
    baseQuery += " WHERE " + conditions.join(" AND ");
  }
  baseQuery += " ORDER BY submitted_at DESC LIMIT :limit OFFSET :offset";

  try {
    const rows = await sequelize.query(baseQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    let countQuery = "SELECT COUNT(*) as total FROM contact_submissions";
    const countReplacements = {};
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
      if (resolved !== null) countReplacements.resolved = resolved;
    }

    const countResult = await sequelize.query(countQuery, {
      replacements: countReplacements,
      type: QueryTypes.SELECT,
    });
    const total = countResult[0] ? parseInt(countResult[0].total, 10) : 0;

    return {
      submissions: rows,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error in ContactSubmission.getAll:", error);
    throw error;
  }
};

export const markAsResolved = async (id, resolvedStatus = true) => {
  console.log(
    `[Model ContactSubmission.markAsResolved] Called for ID: ${id}, Status: ${resolvedStatus}`
  );
  if (!id) {
    console.error(
      "[Model ContactSubmission.markAsResolved] ID is undefined or null."
    );
    return false;
  }
  const query =
    "UPDATE contact_submissions SET is_resolved = :resolvedStatus, resolved_at = :resolved_at WHERE id = :id";
  const resolved_at = resolvedStatus ? new Date() : null;
  try {
    const [results, metadata] = await sequelize.query(query, {
      replacements: {
        resolvedStatus: Boolean(resolvedStatus), // Ensure boolean
        resolved_at: resolved_at,
        id: parseInt(id, 10), // Ensure ID is an integer
      },
      type: QueryTypes.UPDATE,
    });
    console.log(
      `[Model ContactSubmission.markAsResolved] Metadata after update for ID ${id}:`,
      metadata
    );
    return metadata > 0; // For UPDATE, metadata is usually the number of affected rows
  } catch (error) {
    console.error("[Model ContactSubmission.markAsResolved] Error:", error);
    throw error;
  }
};
