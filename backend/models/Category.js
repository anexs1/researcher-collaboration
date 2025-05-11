// backend/models/Category.js
import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";

export const getAll = async () => {
  const query = "SELECT id, name, slug FROM categories ORDER BY name ASC";
  try {
    const rows = await sequelize.query(query, { type: QueryTypes.SELECT });
    return rows;
  } catch (error) {
    console.error("Error in Category.getAll (RawSQL):", error);
    throw error;
  }
};

export const findBySlug = async (slug) => {
  if (!slug) return null;
  const query =
    "SELECT id, name, slug FROM categories WHERE slug = :slug LIMIT 1";
  try {
    const categories = await sequelize.query(query, {
      replacements: { slug: slug },
      type: QueryTypes.SELECT,
    });
    return categories[0] || null;
  } catch (error) {
    console.error("Error in Category.findBySlug (RawSQL):", error);
    throw error;
  }
};
