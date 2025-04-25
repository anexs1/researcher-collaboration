// backend/routes/collaborationRequestRoutes.js
import express from "express";
import {
  sendRequest,
  getReceivedRequests, // Assuming you have this controller
  getSentRequests, // Assuming you have this controller
  respondToRequest,
  cancelRequest, // Assuming you have this controller
} from "../controllers/collaborationRequestController.js"; // Verify path
import { protect } from "../middleware/authMiddleware.js"; // Verify path & middleware name

const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(protect);

// POST /api/collaboration-requests - User sends a request to join a project
router.post("/", sendRequest);

// GET /api/collaboration-requests/received - Get requests for projects owned by the user
router.get("/received", getReceivedRequests); // Needs implementation in controller

// GET /api/collaboration-requests/sent - Get requests sent by the user
router.get("/sent", getSentRequests); // Needs implementation in controller

// PATCH /api/collaboration-requests/:requestId/respond - Owner approves/rejects a request
router.patch("/:requestId/respond", respondToRequest);

// DELETE /api/collaboration-requests/:requestId/cancel - Requester cancels their own pending request
router.delete("/:requestId/cancel", cancelRequest); // Needs implementation in controller

export default router;
