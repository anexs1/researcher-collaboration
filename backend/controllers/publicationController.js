import Publication from "../models/publicationModel.js";
import multer from "multer";
import path from "path";

// Setup storage for uploaded files
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("file");

// Upload Research Paper
export const uploadPublication = (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(500).json({ message: "File upload failed" });

    const { title, abstract, author } = req.body;
    const filePath = req.file.filename;

    Publication.create({ title, abstract, author, filePath }, (error) => {
      if (error) return res.status(500).json({ message: "Error saving data" });

      res.status(201).json({ message: "Research paper uploaded successfully" });
    });
  });
};

// Get All Research Papers
export const getAllPublications = (req, res) => {
  Publication.findAll((err, results) => {
    if (err) return res.status(500).json({ message: "Error retrieving data" });
    res.json(results);
  });
};

// Search Research Papers
export const searchPublications = (req, res) => {
  const { keyword } = req.query;
  Publication.search(keyword, (err, results) => {
    if (err) return res.status(500).json({ message: "Search failed" });
    res.json(results);
  });
};

// Get a single paper
export const getPublication = (req, res) => {
  const { id } = req.params;
  Publication.findById(id, (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Paper not found" });
    }
    res.json(results[0]);
  });
};
