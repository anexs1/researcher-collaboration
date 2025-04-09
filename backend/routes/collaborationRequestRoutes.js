// routes/collaborationRequestRoutes.js
import express from "express";
import * as requestController from "../controllers/collaborationRequestController.js";
import { protect } from "../middleware/authMiddleware.js"; // Your auth middleware

const router = express.Router();

// Apply auth middleware to all request-related routes
router.use(protect);

// POST /api/collaboration-requests -> Send a new request
router.post("/", requestController.sendRequest);

// GET /api/collaboration-requests/received -> Get requests received by current user
router.get("/received", requestController.getReceivedRequests);

// GET /api/collaboration-requests/sent -> Get requests sent by current user
router.get("/sent", requestController.getSentRequests);

// PATCH /api/collaboration-requests/:requestId/accept -> Receiver accepts
router.patch("/:requestId/accept", requestController.acceptRequest);

// PATCH /api/collaboration-requests/:requestId/reject -> Receiver rejects
router.patch("/:requestId/reject", requestController.rejectRequest);

// PATCH /api/collaboration-requests/:requestId/cancel -> Sender cancels
router.patch("/:requestId/cancel", requestController.cancelRequest);

export default router;
