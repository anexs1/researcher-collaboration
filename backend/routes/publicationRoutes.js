import express from "express";
import {
  uploadPublication,
  getAllPublications,
  searchPublications,
  getPublication,
} from "../controllers/publicationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, uploadPublication);
router.get("/", getAllPublications);
router.get("/search", searchPublications);
router.get("/:id", getPublication);

export default router;
