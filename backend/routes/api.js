const express = require("express");
const router = express.Router();

// Import controllers
const categoryController = require("../controllers/categoryController");
const helpItemController = require("../controllers/helpItemController");
const contactController = require("../controllers/contactController");

// --- Public Help Center Routes ---
router.get("/categories", categoryController.getAllCategories);
router.get("/categories/:slug", categoryController.getCategoryBySlug);

router.get("/help-items", helpItemController.getAllHelpItems);
router.get("/help-items/:id", helpItemController.getHelpItemById);

router.post("/contact", contactController.submitContactForm);

// --- Admin Routes for Contact Submissions (Example - protect these with auth middleware in a real app) ---
// This is just an example structure. You would need to implement auth.
// const authMiddleware = (req, res, next) => { /* Your auth logic here */ next(); };
// router.get('/admin/contact-submissions', authMiddleware, contactController.getAllSubmissions);
// router.get('/admin/contact-submissions/:id', authMiddleware, contactController.getSubmissionById);
// router.patch('/admin/contact-submissions/:id/resolve', authMiddleware, contactController.toggleResolveSubmission);

module.exports = router;
