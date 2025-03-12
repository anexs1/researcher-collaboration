// backend/controllers/publicationController.js
const Publication = require("../models/publicationModel");
const multer = require("multer");

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Create a new publication
exports.createPublication = async (req, res) => {
  try {
    const { title, author, keywords } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const publication = await Publication.create({
      title,
      author,
      keywords,
      fileUrl,
    });
    res
      .status(201)
      .json({ message: "Publication added successfully", publication });
  } catch (error) {
    res.status(500).json({ message: "Error adding publication", error });
  }
};

// Get all publications
exports.getAllPublications = async (req, res) => {
  try {
    const publications = await Publication.findAll();
    res.status(200).json(publications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching publications", error });
  }
};

// Search publications by keyword
exports.searchPublications = async (req, res) => {
  try {
    const { keyword } = req.query;
    const publications = await Publication.findAll({
      where: {
        keywords: { [Op.like]: `%${keyword}%` },
      },
    });
    res.status(200).json(publications);
  } catch (error) {
    res.status(500).json({ message: "Error searching publications", error });
  }
};

module.exports.upload = upload;
