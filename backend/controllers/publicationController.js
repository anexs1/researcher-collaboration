// controllers/publicationController.js
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Publication = require("../models/publicationModel");
const { Op } = require("sequelize");

// Set up multer storage for file uploads
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
const createPublication = async (req, res) => {
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
const getAllPublications = async (req, res) => {
  try {
    const publications = await Publication.findAll();
    res.status(200).json(publications);
  } catch (error) {
    console.error("Error fetching publications:", error);
    res.status(500).json({ message: "Error fetching publications", error });
  }
};

// Search publications by keyword
const searchPublications = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res
        .status(400)
        .json({ message: "Keyword query parameter is required" });
    }

    const publications = await Publication.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${keyword}%` } },
          { author: { [Op.like]: `%${keyword}%` } },
          { keywords: { [Op.like]: `%${keyword}%` } },
        ],
      },
    });

    res.status(200).json(publications);
  } catch (error) {
    console.error("Error searching publications:", error);
    res.status(500).json({ message: "Error searching publications", error });
  }
};

module.exports = {
  createPublication,
  getAllPublications,
  searchPublications,
  upload,
};
