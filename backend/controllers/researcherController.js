import db from "../config/db.js"; // Ensure correct path

export const getResearchers = (req, res) => {
  db.query("SELECT * FROM researchers", (err, results) => {
    if (err) {
      console.error("Error fetching researchers:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
};
