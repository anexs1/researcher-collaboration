const Publication = require("../models/publicationModel");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");

// Set up multer storage
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
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
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !author) {
      return res.status(400).json({ message: "Title and Author are required" });
    }

    const publication = await Publication.create({
      title,
      author,
      keywords,
      file_path,
    });

    res
      .status(201)
      .json({ message: "Publication added successfully", publication });
  } catch (error) {
    console.error("Error adding publication:", error);
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
// In your publicationController.js
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
    console.error("Error adding publication:", error); // Log the full error
    res.status(500).json({ message: "Error adding publication", error });
  }
};

module.exports.upload = upload;
// Compare this snippet from backend/routes/publicationRoutes.js:
