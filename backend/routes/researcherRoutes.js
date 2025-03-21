import express from "express";
import { getResearchers } from "../controllers/researcherController.js"; // Add `.js` extension

const router = express.Router();

router.get("/", getResearchers);

export default router;
