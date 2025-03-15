import express from "express";
import {
  createPublication,
  getAllPublications,
  searchPublications,
  upload,
} from "../controllers/publicationController.js";

const router = express.Router();

router.post("/create", upload.single("file"), createPublication);
router.get("/", getAllPublications);
router.get("/search", searchPublications);

export default router;
