const express = require("express");
const router = express.Router();
const researcherController = require("../controllers/researcherController");

router.get("/", researcherController.getResearchers);
router.post("/add", researcherController.addResearcher);

module.exports = router;
