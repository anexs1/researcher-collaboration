const express = require("express");
const {
  createPublication,
  getAllPublications,
  searchPublications,
  upload,
} = require("../controllers/publicationController");

const router = express.Router();

// Define routes for publications
router.post("/publications", upload.single("file"), createPublication); // To create a publication
router.get("/publications", getAllPublications); // To get all publications
router.get("/publications/search", searchPublications); // To search for publications

module.exports = router; // Export the router once
