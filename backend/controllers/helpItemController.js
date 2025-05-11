// backend/controllers/helpItemController.js
import * as HelpItemModel from "../models/HelpItem.js";

export const getAllHelpItems = async (req, res) => {
  // ... (your existing code for getAllHelpItems)
  const { category_slug, search, type } = req.query;

  if (type && !["faq", "tutorial"].includes(type.toLowerCase())) {
    return res.status(400).json({
      message: "Invalid 'type' parameter. Must be 'faq' or 'tutorial'.",
    });
  }
  try {
    // console.log("[Controller] getAllHelpItems called with:", { category_slug, search, type });
    const items = await HelpItemModel.findAll({
      category_slug: category_slug || undefined,
      search: search || undefined,
      type: type ? type.toLowerCase() : undefined,
    });
    // console.log("[Controller] Items received from model:", items ? items.length : 'null/undefined');
    res.status(200).json(items || []);
  } catch (error) {
    console.error(
      "Error in helpItemController.getAllHelpItems:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Server error: Could not fetch help items." });
  }
};

// VVVV --- ENSURE THIS FUNCTION IS CORRECTLY DEFINED AND EXPORTED --- VVVV
export const getHelpItemById = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId) || itemId <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid help item ID provided." });
    }
    // console.log(`[Controller] getHelpItemById called with ID: ${itemId}`);
    const item = await HelpItemModel.findById(itemId); // Assumes findById is exported from HelpItem.js model
    // console.log("[Controller] Item received from model:", item);

    if (!item) {
      return res
        .status(404)
        .json({ message: `Help item with ID '${itemId}' not found.` });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error(
      "Error in helpItemController.getHelpItemById:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Server error: Could not fetch the help item." });
  }
};
// ^^^^ --- ENSURE THIS FUNCTION IS CORRECTLY DEFINED AND EXPORTED --- ^^^^
