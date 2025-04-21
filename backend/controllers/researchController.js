import pool from "../config/db.js"; // Correct import path

// GET all research
const getAllResearch = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Research ORDER BY created_at DESC"
    );
    res.status(200).json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch research entries", error });
  }
};

// GET single research by ID
const getResearchById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Research WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Research not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch research", error });
  }
};

// Search and filter research
const searchAndFilterResearch = async (req, res) => {
  try {
    const { field, keyword } = req.query;
    let query = "SELECT * FROM Research WHERE 1=1";
    const values = [];

    if (field) {
      query += " AND field = ?";
      values.push(field);
    }

    if (keyword) {
      query += ` AND (title LIKE ? OR abstract LIKE ? OR keywords LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      values.push(keywordPattern, keywordPattern, keywordPattern);
    }

    const [rows] = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to search research", error });
  }
};

// Export the controller functions
const researchController = {
  getAllResearch,
  getResearchById,
  searchAndFilterResearch,
};

export default researchController;
