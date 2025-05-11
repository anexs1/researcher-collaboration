// backend/controllers/categoryController.js
import * as CategoryModel from "../models/Category.js"; // Importing all named exports from Category.js

export const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.getAll();
    if (!categories || categories.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(categories);
  } catch (error) {
    console.error(
      "Error in categoryController.getAllCategories:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Server error: Could not fetch categories." });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ message: "Category slug is required." });
    }
    const category = await CategoryModel.findBySlug(slug);
    if (!category) {
      return res
        .status(404)
        .json({ message: `Category with slug '${slug}' not found.` });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error(
      "Error in categoryController.getCategoryBySlug:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Server error: Could not fetch the category." });
  }
};
