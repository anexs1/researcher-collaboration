// backend/routes/collaborationRequestRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // Verify path
import {
  sendRequest,
  respondToRequest,
  getReceivedRequests, // Controller to handle GET /
  getSentRequests,
  cancelRequest,
} from "../controllers/collaborationRequestController.js"; // Verify path & ensure all are exported

const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(protect);

// POST /api/collaboration-requests - User sends a join request
router.post("/", sendRequest);

// --- CORRECTED ROUTE ---
// GET /api/collaboration-requests - Get requests received OR sent, filtered by query params
// The controller (getReceivedRequests) MUST handle filtering by query params
// like ?projectId=X&status=pending or ?requesterId=Y
router.get("/", getReceivedRequests); // <<< CHANGED PATH from /received to /
// -----------------------

// GET /api/collaboration-requests/sent - User gets requests they sent (Still useful route)
router.get("/sent", getSentRequests);

// PATCH /api/collaboration-requests/:requestId/respond - Owner responds (approve/reject)
router.patch("/:requestId/respond", respondToRequest);

// DELETE /api/collaboration-requests/:requestId/cancel - Requester cancels own pending request
router.delete("/:requestId/cancel", cancelRequest);

export default router;
