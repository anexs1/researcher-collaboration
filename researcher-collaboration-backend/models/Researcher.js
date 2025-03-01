const express = require("express");
const router = express.Router();
const Researcher = require("../models/Researcher");

// Create Researcher
router.post("/", async (req, res) => {
  try {
    const { name, field, bio, image } = req.body;
    const researcher = new Researcher({ name, field, bio, image });
    await researcher.save();
    res.status(201).json({ message: "Profile created successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error saving profile", error: error.message });
  }
});

// Get all Researchers
router.get("/", async (req, res) => {
  try {
    const researchers = await Researcher.find();
    res.json(researchers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching researchers", error: error.message });
  }
});

module.exports = router;
