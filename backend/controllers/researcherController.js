const Researcher = require("../models/researcherModel");

exports.getResearchers = (req, res) => {
  Researcher.getAll((err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};

exports.addResearcher = (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: "Name and description are required" });
  }

  Researcher.create(name, description, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "Researcher added successfully",
      id: result.insertId,
    });
  });
};
