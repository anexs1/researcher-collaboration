import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Adjust path
import {
  sendRequest,
  respondToRequest,
  getReceivedRequests,
  getSentRequests,
  cancelRequest,
} from "../controllers/collaborationRequestController.js"; // Adjust path

const router = express.Router();

// All collaboration request routes require authentication
router.use(protect);

// Send a new request to join a project
router.post("/", sendRequest); // POST /api/collaboration-requests (body: { projectId, message? })

// Get requests received by the logged-in user (owner of projects)
router.get("/received", getReceivedRequests); // GET /api/collaboration-requests/received?projectId=X&status=pending

// Get requests sent by the logged-in user
router.get("/sent", getSentRequests); // GET /api/collaboration-requests/sent

// Respond to a received request (by project owner)
router.patch("/:requestId/respond", respondToRequest); // PATCH /api/collaboration-requests/123/respond (body: { status: 'approved'|'rejected', responseMessage? })

// Cancel a sent request (by requester)
router.delete("/:requestId/cancel", cancelRequest); // DELETE /api/collaboration-requests/123/cancel

export default router;
