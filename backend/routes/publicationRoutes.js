// routes/publicationRoutes.js (Corrected - ES Module)
import express from "express";
import * as publicationController from "../controllers/publicationController.js"; // Use * as to import the values

const router = express.Router();

router.post("/", publicationController.createPublication);
router.get("/", publicationController.getAllPublications);
router.get("/:id", publicationController.getPublicationById);
router.put("/:id", publicationController.updatePublication);
router.delete("/:id", publicationController.deletePublication);

export default router;
