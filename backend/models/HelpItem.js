// backend/models/HelpItem.js
import sequelize from "../config/db.js"; // Assuming this exports your Sequelize instance
import { QueryTypes } from "sequelize"; // Import QueryTypes for SELECT queries

export const findAll = async ({ category_slug, search, type }) => {
  let baseQuery = `
    SELECT 
      hi.id, 
      hi.type, 
      hi.title, 
      hi.content, 
      hi.video_url, 
      hi.tags,
      hi.created_at,
      hi.updated_at, 
      c.name as category_name, 
      c.slug as category_slug
    FROM help_items hi
    LEFT JOIN categories c ON hi.category_id = c.id
  `;
  const replacements = {}; // Use an object for named replacements
  let conditions = [];

  console.log("--------------------------------------------------");
  console.log("[Model HelpItem.findAll RawSQL] Input Criteria:", {
    category_slug,
    search,
    type,
  });

  if (category_slug) {
    conditions.push("c.slug = :category_slug"); // Named placeholder
    replacements.category_slug = category_slug;
  }
  if (search) {
    const searchTerm = `%${search}%`;
    // For LIKE with named replacements, ensure the wildcard is part of the replacement value
    conditions.push(
      "(hi.title LIKE :search_term OR hi.content LIKE :search_term OR hi.tags LIKE :search_term)"
    );
    replacements.search_term = searchTerm;
  }
  if (type) {
    conditions.push("hi.type = :type"); // Named placeholder
    replacements.type = type;
  }

  if (conditions.length > 0) {
    baseQuery += " WHERE " + conditions.join(" AND ");
  }
  baseQuery += " ORDER BY c.name ASC, hi.title ASC";

  console.log("[Model HelpItem.findAll RawSQL] Executing SQL:", baseQuery);
  console.log(
    "[Model HelpItem.findAll RawSQL] With Replacements:",
    replacements
  );

  try {
    // Use sequelize.query with replacements and QueryTypes.SELECT
    const rows = await sequelize.query(baseQuery, {
      replacements: replacements,
      type: QueryTypes.SELECT,
    });
    console.log(
      "[Model HelpItem.findAll RawSQL] Rows Found:",
      rows ? rows.length : "null/undefined"
    );
    console.log("--------------------------------------------------");
    return rows;
  } catch (dbError) {
    console.error(
      "[Model HelpItem.findAll RawSQL] DB Query Error:",
      dbError.message
    );
    console.error(
      "[Model HelpItem.findAll RawSQL] DB Error Stack:",
      dbError.stack
    );
    console.error("[Model HelpItem.findAll RawSQL] Failing SQL:", baseQuery);
    console.error(
      "[Model HelpItem.findAll RawSQL] Failing Replacements:",
      replacements
    );
    console.log("--------------------------------------------------");
    throw dbError;
  }
};

export const findById = async (id) => {
  if (!id) return null;
  const query = `
    SELECT 
      hi.id, 
      hi.type, 
      hi.title, 
      hi.content, 
      hi.video_url, 
      hi.tags,
      hi.created_at,
      hi.updated_at, 
      c.name as category_name, 
      c.slug as category_slug
    FROM help_items hi
    LEFT JOIN categories c ON hi.category_id = c.id
    WHERE hi.id = :item_id  -- Use named placeholder
    LIMIT 1
  `;
  try {
    console.log("[Model HelpItem.findById RawSQL] Executing SQL:", query);
    console.log("[Model HelpItem.findById RawSQL] With Replacements:", {
      item_id: id,
    });
    const items = await sequelize.query(query, {
      replacements: { item_id: id },
      type: QueryTypes.SELECT,
    });
    return items[0] || null; // sequelize.query with SELECT returns an array
  } catch (dbError) {
    console.error("[Model HelpItem.findById RawSQL] DB Query Error:", dbError);
    throw dbError;
  }
};
