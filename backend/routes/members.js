import express from "express";
import MemberController from "../controllers/memberController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", MemberController.getProjectMembers);
router.post("/", protect, MemberController.addProjectMember);
router.put("/:memberId", protect, MemberController.updateMemberStatus);

export default router;
