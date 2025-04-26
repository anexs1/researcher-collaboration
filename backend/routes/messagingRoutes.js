// backend/routes/messagingRoutes.js
import express from "express";
// Import ONLY the controller function you are using
import { getGroupedContacts } from "../controllers/messagingController.js"; // Adjust path
import { protect } from "../middleware/authMiddleware.js"; // Adjust path

const router = express.Router();

// Apply authentication to all messaging routes
router.use(protect);

// REMOVED route for /contacts as the controller wasn't exported
// router.get("/contacts", getMessagingContacts);

// *** Route for grouped contacts ***
router.get("/grouped-contacts", getGroupedContacts);

// Add other routes later...

export default router;
