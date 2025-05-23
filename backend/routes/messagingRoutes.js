import express from "express";
import {
  getProjectChatList,
  getProjectChatHistory,
  uploadProjectFile,
} from "../controllers/messagingController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  handleProjectFileUpload,
  handleMulterError,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/projects", getProjectChatList);
router.get("/history/project/:projectId", getProjectChatHistory);

router.post(
  "/upload/project/:projectId",
  handleProjectFileUpload,
  handleMulterError,
  uploadProjectFile
);

export default router;
