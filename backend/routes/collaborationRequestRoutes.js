// backend/routes/collaborationRequestRoutes.js
import express from "express";
// Use named imports for clarity
import {
  sendRequest,
  getReceivedRequests,
  getSentRequests,
  respondToRequest, // Single function handles accept/reject based on body
  cancelRequest,
} from "../controllers/collaborationRequestController.js";
import { protect } from "../middleware/authMiddleware.js";
// Remove unused imports if validation/rate limiting not implemented yet
// import { validateRequest } from "../middleware/validationMiddleware.js";
// import rateLimiter from "../middleware/rateLimiter.js";

const router = express.Router();

// Apply auth middleware to all request routes
router.use(protect);

// Apply rate limiting (optional) - ensure middleware exists
// router.use(rateLimiter);

// POST /api/collaboration-requests - Create a new request to join
router.post(
  "/",
  // Add validation middleware if implemented:
  // validateRequest({ projectId: { isRequired: true, isNumeric: true }, message: { maxLength: 500 } }),
  sendRequest // Use the correct controller function name
);

// GET /api/collaboration-requests/received - Get pending requests received by logged-in user
router.get("/received", getReceivedRequests);

// GET /api/collaboration-requests/sent - Get requests sent by the logged-in user
router.get("/sent", getSentRequests);

// PATCH /api/collaboration-requests/:requestId/respond - Respond (approve/reject)
router.patch(
  "/:requestId/respond",
  // Add validation middleware if implemented:
  // validateRequest({ requestId: { isRequired: true, isNumeric: true }, status: { isRequired: true, isIn: ['approved', 'rejected']} }),
  respondToRequest // Use the single respond function
);

// DELETE /api/collaboration-requests/:requestId/cancel - Cancel a SENT request (by requester)
// Using DELETE might be more semantically correct than PATCH for cancellation
router.delete(
  "/:requestId/cancel",
  // Add validation middleware if implemented:
  // validateRequest({ requestId: { isRequired: true, isNumeric: true } }),
  cancelRequest
);

export default router;
