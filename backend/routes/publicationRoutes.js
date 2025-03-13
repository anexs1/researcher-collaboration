const express = require("express");
const {
  createPublication,
  getAllPublications,
  searchPublications,
  upload,
} = require("../controllers/publicationController");

const router = express.Router();

// Define the routes with the correct controller functions
router.post("/publications", upload.single("file"), createPublication);
router.get("/publications", getAllPublications); // This should be a valid function
router.get("/publications/search", searchPublications); // This should be a valid function

module.exports = router;
