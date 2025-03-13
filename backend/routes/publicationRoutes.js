// routes/publicationRoutes.js
const express = require("express");
const {
  createPublication,
  getAllPublications,
  searchPublications,
  upload,
} = require("../controllers/publicationController");

const router = express.Router();

// Route to create a publication (with file upload)
router.post("/publications", upload.single("file"), createPublication);

// Route to get all publications
router.get("/publications", getAllPublications);

// Route to search publications by keyword
router.get("/publications/search", searchPublications);

module.exports = router;
